import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/layout/AppShell'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = user
    ? await supabase.from('profiles').select('display_name, email').eq('id', user.id).single()
    : { data: null }

  return (
    <AppShell
      userEmail={user?.email ?? ''}
      userDisplayName={profile?.display_name ?? null}
    >
      {children}
    </AppShell>
  )
}
