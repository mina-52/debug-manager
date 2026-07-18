'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { AppNotification, NotificationEvent } from '@/types'

/**
 * 通知の状態と Realtime 購読をまとめて扱う。
 *
 * ベルは PC 用サイドバーとモバイルヘッダーの両方に描画されるため、
 * このフックは AppShell で「1回だけ」呼び、結果を両方へ配ること。
 * 各ベルが個別に呼ぶと、同名チャンネルを二重購読して
 * "cannot add postgres_changes callbacks after subscribe()" で落ちる。
 */
export function useNotifications(userId: string, initial: AppNotification[]) {
  const [notifications, setNotifications] = useState<AppNotification[]>(initial)

  useEffect(() => {
    if (!userId) return

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

  const markRead = useCallback(async (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, is_read: true } : n)))
    const supabase = createClient()
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
  }, [])

  const markAllRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    const supabase = createClient()
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)
  }, [userId])

  return { notifications, markRead, markAllRead }
}
