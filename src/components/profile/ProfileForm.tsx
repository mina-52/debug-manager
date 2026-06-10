'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  userId: string
  userEmail: string
  currentDisplayName: string | null
}

export default function ProfileForm({ userId, userEmail, currentDisplayName }: Props) {
  const router = useRouter()
  const [displayName, setDisplayName] = useState(currentDisplayName ?? '')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email: userEmail,
        display_name: displayName.trim() || null,
      })

    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
      router.refresh()
    }
    setLoading(false)
  }

  const fieldClass = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors text-sm'

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm text-gray-400 mb-1.5">メールアドレス</label>
        <p className="text-sm text-gray-300 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5">
          {userEmail}
        </p>
        <p className="text-xs text-gray-600 mt-1">メールアドレスは変更できません</p>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1.5">表示名</label>
        <input
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
          className={fieldClass}
          placeholder="山田 太郎"
        />
        <p className="text-xs text-gray-500 mt-1">登録者名・コメントの投稿者名として表示されます。未設定の場合はメールアドレスが表示されます。</p>
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-950 border border-red-800 rounded-lg px-3 py-2">{error}</p>
      )}
      {success && (
        <p className="text-sm text-green-400 bg-green-950 border border-green-800 rounded-lg px-3 py-2">保存しました</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white rounded-lg px-6 py-2.5 text-sm font-medium transition-colors"
      >
        {loading ? '保存中...' : '保存する'}
      </button>
    </form>
  )
}
