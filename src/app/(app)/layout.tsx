import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = user
    ? await supabase.from('profiles').select('display_name, email').eq('id', user.id).single()
    : { data: null }

  return (
    <div className="flex min-h-screen">
      <Sidebar
        userEmail={user?.email ?? ''}
        userDisplayName={profile?.display_name ?? null}
      />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
