import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import ProfileForm from '@/components/profile/ProfileForm'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, email')
    .eq('id', user.id)
    .single()

  return (
    <div className="p-4 sm:p-8 max-w-lg">
      <Link
        href="/dashboard"
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white mb-6 transition-colors w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        ダッシュボードへ戻る
      </Link>

      <h1 className="text-2xl font-bold text-white mb-8">プロフィール設定</h1>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <ProfileForm
          userId={user.id}
          userEmail={user.email!}
          currentDisplayName={profile?.display_name ?? null}
        />
      </div>
    </div>
  )
}
