'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, MessageSquare, RefreshCw, Bug as BugIcon } from 'lucide-react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { AppNotification, NotificationEvent, NotificationType } from '@/types'

interface Props {
  userId: string
  initial: AppNotification[]
  onNavigate?: () => void
}

const ICONS: Record<NotificationType, typeof Bell> = {
  comment_added: MessageSquare,
  status_changed: RefreshCw,
  bug_created: BugIcon,
}

const LABELS: Record<NotificationType, string> = {
  comment_added: 'コメントが追加されました',
  status_changed: 'ステータスが変更されました',
  bug_created: '新しい要望・バグが登録されました',
}

export default function NotificationBell({ userId, initial, onNavigate }: Props) {
  const [notifications, setNotifications] = useState<AppNotification[]>(initial)
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter(n => !n.is_read).length

  // Realtime で自分宛ての新着を受け取る
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        async payload => {
          const row = payload.new as AppNotification
          // Realtime の payload には join した event が含まれないので個別に取得する
          const { data: event } = await supabase
            .from('notification_events')
            .select('*')
            .eq('id', row.event_id)
            .single<NotificationEvent>()

          setNotifications(prev =>
            prev.some(n => n.id === row.id)
              ? prev
              : [{ ...row, event: event ?? undefined }, ...prev].slice(0, 20)
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  // 外側クリックで閉じる
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  async function handleSelect(notification: AppNotification) {
    setOpen(false)
    onNavigate?.()

    if (!notification.is_read) {
      setNotifications(prev =>
        prev.map(n => (n.id === notification.id ? { ...n, is_read: true } : n))
      )
      const supabase = createClient()
      await supabase.from('notifications').update({ is_read: true }).eq('id', notification.id)
    }

    if (notification.event?.bug_id) {
      router.push(`/bugs/${notification.event.bug_id}`)
      router.refresh()
    }
  }

  async function handleMarkAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    const supabase = createClient()
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative text-gray-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-gray-800"
        aria-label={unreadCount > 0 ? `通知 (未読 ${unreadCount}件)` : '通知'}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] bg-gray-900 border border-gray-800 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
            <span className="text-sm font-semibold text-white">通知</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-gray-400 hover:text-white transition-colors"
              >
                すべて既読にする
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <p className="text-sm text-gray-600 px-4 py-8 text-center">通知はまだありません</p>
          ) : (
            <ul className="max-h-96 overflow-y-auto divide-y divide-gray-800">
              {notifications.map(notification => {
                const event = notification.event
                const Icon = event ? ICONS[event.type] : Bell
                return (
                  <li key={notification.id}>
                    <button
                      onClick={() => handleSelect(notification)}
                      className={cn(
                        'w-full text-left px-4 py-3 flex gap-3 transition-colors hover:bg-gray-800',
                        !notification.is_read && 'bg-gray-800/50'
                      )}
                    >
                      <Icon
                        className={cn(
                          'w-4 h-4 mt-0.5 shrink-0',
                          notification.is_read ? 'text-gray-600' : 'text-indigo-400'
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-400">
                          {event ? LABELS[event.type] : '通知'}
                        </p>
                        <p
                          className={cn(
                            'text-sm truncate',
                            notification.is_read ? 'text-gray-400' : 'text-white font-medium'
                          )}
                        >
                          {event?.title ?? '(削除された項目)'}
                        </p>
                        {event?.body && (
                          <p className="text-xs text-gray-500 truncate mt-0.5">{event.body}</p>
                        )}
                        <p className="text-xs text-gray-600 mt-1">
                          {format(new Date(notification.created_at), 'yyyy/MM/dd HH:mm', {
                            locale: ja,
                          })}
                        </p>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
