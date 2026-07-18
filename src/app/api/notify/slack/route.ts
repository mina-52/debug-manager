import { createClient } from '@supabase/supabase-js'
import type { NotificationEvent, NotificationType } from '@/types'

// Supabase Database Webhook のペイロード
interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  record: NotificationEvent | null
}

const HEADINGS: Record<NotificationType, string> = {
  comment_added: '💬 コメントが追加されました',
  status_changed: '🔄 ステータスが変更されました',
  bug_created: '🐛 新しい要望・バグが登録されました',
}

const STATUS_LABELS: Record<string, string> = {
  open: '未対応',
  in_progress: '対応中',
  resolved: '解決済み',
  closed: 'クローズ',
}

const PRIORITY_LABELS: Record<string, string> = {
  low: '低',
  medium: '中',
  high: '高',
  critical: '緊急',
}

function truncate(text: string, max = 300): string {
  return text.length > max ? text.slice(0, max) + '…' : text
}

async function actorName(actorId: string | null): Promise<string> {
  if (!actorId) return '不明'

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data } = await admin
    .from('profiles')
    .select('email, display_name')
    .eq('id', actorId)
    .single()

  return data?.display_name || data?.email || '不明'
}

function buildMessage(event: NotificationEvent, actor: string) {
  const isCritical = event.meta?.priority === 'critical'
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ''
  const bugUrl = event.bug_id ? `${siteUrl}/bugs/${event.bug_id}` : null

  const lines = [`*${event.title}*`, `実行者: ${actor}`]

  if (event.type === 'status_changed') {
    const from = STATUS_LABELS[event.meta?.old_status ?? ''] ?? event.meta?.old_status
    const to = STATUS_LABELS[event.meta?.new_status ?? ''] ?? event.meta?.new_status
    lines.push(`ステータス: ${from} → *${to}*`)
  }

  if (event.meta?.priority) {
    lines.push(`優先度: ${PRIORITY_LABELS[event.meta.priority] ?? event.meta.priority}`)
  }

  if (event.body) {
    lines.push('', truncate(event.body))
  }

  const blocks: object[] = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${isCritical ? '<!here> ' : ''}${HEADINGS[event.type]}\n${lines.join('\n')}`,
      },
    },
  ]

  if (bugUrl) {
    blocks.push({
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: { type: 'plain_text', text: '詳細を開く', emoji: true },
          url: bugUrl,
        },
      ],
    })
  }

  return {
    text: `${HEADINGS[event.type]}: ${event.title}`, // 通知プレビュー・フォールバック用
    attachments: [{ color: isCritical ? '#dc2626' : '#6366f1', blocks }],
  }
}

export async function POST(request: Request) {
  if (request.headers.get('x-notify-secret') !== process.env.NOTIFY_WEBHOOK_SECRET) {
    return new Response('Unauthorized', { status: 401 })
  }

  // ここから先は 200 を返す。pg_net にリトライさせても回復しないため。
  try {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL
    if (!webhookUrl) {
      console.error('[notify/slack] SLACK_WEBHOOK_URL が未設定です')
      return Response.json({ ok: false, reason: 'not_configured' })
    }

    const payload = (await request.json()) as WebhookPayload
    const event = payload.record
    if (payload.type !== 'INSERT' || !event) {
      return Response.json({ ok: false, reason: 'ignored' })
    }

    const message = buildMessage(event, await actorName(event.actor_id))

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(message),
    })

    if (!res.ok) {
      console.error('[notify/slack] Slack への投稿に失敗:', res.status, await res.text())
      return Response.json({ ok: false, reason: 'slack_error' })
    }

    return Response.json({ ok: true })
  } catch (error) {
    console.error('[notify/slack] 予期しないエラー:', error)
    return Response.json({ ok: false, reason: 'error' })
  }
}
