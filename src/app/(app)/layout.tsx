import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/layout/AppShell'
import type { AppNotification } from '@/types'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = user
    ? await supabase.from('profiles').select('display_name, email').eq('id', user.id).single()
    : { data: null }

  const { data: notifications } = user
    ? await supabase
        .from('notifications')
        .select('*, event:notification_events(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)
    : { data: null }

  return (
    <AppShell
      userId={user?.id ?? ''}
      userEmail={user?.email ?? ''}
      userDisplayName={profile?.display_name ?? null}
      notifications={(notifications as AppNotification[] | null) ?? []}
    >
      {children}
    </AppShell>
  )
}
