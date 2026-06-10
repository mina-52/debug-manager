'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Send, MessageSquare, User } from 'lucide-react'
import type { Comment } from '@/types'

interface Props {
  bugId: string
  comments: Comment[]
  currentUserId: string
  currentUserEmail: string
  currentUserDisplayName?: string | null
}

function userDisplay(profile?: { email: string; display_name?: string | null } | null): string {
  if (!profile) return '不明'
  return profile.display_name || profile.email
}

export default function CommentSection({ bugId, comments: initial, currentUserId, currentUserEmail, currentUserDisplayName }: Props) {
  const [comments, setComments] = useState<Comment[]>(initial)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    setLoading(true)

    const supabase = createClient()
    const { data } = await supabase
      .from('comments')
      .insert({ bug_id: bugId, content: content.trim(), created_by: currentUserId })
      .select('*')
      .single()

    if (data) {
      setComments([...comments, {
        ...data,
        author: {
          email: currentUserEmail,
          display_name: currentUserDisplayName ?? null,
        },
      }])
      setContent('')
    }
    setLoading(false)
  }

  async function handleDelete(commentId: string) {
    const supabase = createClient()
    await supabase.from('comments').delete().eq('id', commentId)
    setComments(comments.filter(c => c.id !== commentId))
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <h2 className="font-semibold text-white mb-5 flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-gray-400" />
        コメント ({comments.length})
      </h2>

      {comments.length === 0 ? (
        <p className="text-sm text-gray-600 mb-5">コメントはまだありません</p>
      ) : (
        <ul className="space-y-4 mb-5">
          {comments.map(comment => (
            <li key={comment.id} className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-xs font-medium text-gray-300">
                    {userDisplay(comment.author)}
                  </span>
                  <span className="text-xs text-gray-600">·</span>
                  <span className="text-xs text-gray-500">
                    {format(new Date(comment.created_at), 'yyyy/MM/dd HH:mm', { locale: ja })}
                  </span>
                </div>
                {comment.created_by === currentUserId && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="text-xs text-gray-600 hover:text-red-400 transition-colors"
                  >
                    削除
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-200 whitespace-pre-wrap">{comment.content}</p>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="コメントを入力..."
          rows={2}
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
        />
        <button
          type="submit"
          disabled={loading || !content.trim()}
          className="self-end bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white rounded-lg p-2.5 transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  )
}
