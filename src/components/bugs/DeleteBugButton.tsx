'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Trash2 } from 'lucide-react'

function storagePathFromUrl(url: string): string {
  const marker = '/bug-images/'
  const idx = url.indexOf(marker)
  return idx !== -1 ? url.slice(idx + marker.length) : ''
}

export default function DeleteBugButton({ bugId }: { bugId: string }) {
  const router = useRouter()
  const [confirm, setConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    const supabase = createClient()

    const { data: bug } = await supabase
      .from('bugs')
      .select('images')
      .eq('id', bugId)
      .single()

    if (bug?.images && bug.images.length > 0) {
      const paths = (bug.images as string[]).map(storagePathFromUrl).filter(Boolean)
      if (paths.length > 0) {
        await supabase.storage.from('bug-images').remove(paths)
      }
    }

    await supabase.from('bugs').delete().eq('id', bugId)
    router.push('/bugs')
    router.refresh()
  }

  if (confirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400">本当に削除しますか？</span>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="text-xs text-red-400 hover:text-red-300 bg-red-950 border border-red-800 rounded-lg px-2.5 py-1 transition-colors"
        >
          {loading ? '削除中...' : '削除する'}
        </button>
        <button
          onClick={() => setConfirm(false)}
          className="text-xs text-gray-400 hover:text-white bg-gray-800 rounded-lg px-2.5 py-1 transition-colors"
        >
          キャンセル
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 bg-gray-800 hover:bg-gray-700 rounded-lg px-3 py-1.5 transition-colors"
    >
      <Trash2 className="w-3.5 h-3.5" />
      削除
    </button>
  )
}
