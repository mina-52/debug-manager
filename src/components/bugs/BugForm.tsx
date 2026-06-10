'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { X } from 'lucide-react'
import type { Bug } from '@/types'

interface Props {
  projects: { id: string; name: string }[]
  bug?: Bug
}

export default function BugForm({ projects, bug }: Props) {
  const router = useRouter()
  const isEdit = !!bug

  const [title, setTitle] = useState(bug?.title ?? '')
  const [description, setDescription] = useState(bug?.description ?? '')
  const [status, setStatus] = useState(bug?.status ?? 'open')
  const [priority, setPriority] = useState(bug?.priority ?? 'medium')
  const [projectId, setProjectId] = useState(bug?.project_id ?? '')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>(bug?.tags ?? [])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function addTag() {
    const t = tagInput.trim()
    if (t && !tags.includes(t)) {
      setTags([...tags, t])
    }
    setTagInput('')
  }

  function removeTag(tag: string) {
    setTags(tags.filter(t => t !== tag))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('ログインが必要です'); setLoading(false); return }

    const payload = {
      title,
      description: description || null,
      status,
      priority,
      project_id: projectId || null,
      tags,
      updated_at: new Date().toISOString(),
    }

    let result
    if (isEdit) {
      result = await supabase.from('bugs').update(payload).eq('id', bug!.id)
    } else {
      result = await supabase.from('bugs').insert({ ...payload, created_by: user.id })
    }

    if (result.error) {
      setError(result.error.message)
      setLoading(false)
    } else {
      router.push('/bugs')
      router.refresh()
    }
  }

  const fieldClass = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors text-sm'

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm text-gray-400 mb-1.5">タイトル <span className="text-red-400">*</span></label>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
          className={fieldClass}
          placeholder="バグのタイトル"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1.5">説明</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={5}
          className={`${fieldClass} resize-none`}
          placeholder="再現手順、期待する動作、実際の動作など..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">ステータス</label>
          <select value={status} onChange={e => setStatus(e.target.value as Bug['status'])} className={fieldClass}>
            <option value="open">未対応</option>
            <option value="in_progress">対応中</option>
            <option value="resolved">解決済</option>
            <option value="closed">クローズ</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">優先度</label>
          <select value={priority} onChange={e => setPriority(e.target.value as Bug['priority'])} className={fieldClass}>
            <option value="low">低</option>
            <option value="medium">中</option>
            <option value="high">高</option>
            <option value="critical">緊急</option>
          </select>
        </div>
      </div>

      {projects.length > 0 && (
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">プロジェクト</label>
          <select value={projectId} onChange={e => setProjectId(e.target.value)} className={fieldClass}>
            <option value="">なし</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm text-gray-400 mb-1.5">タグ</label>
        <div className="flex gap-2 mb-2 flex-wrap">
          {tags.map(tag => (
            <span key={tag} className="flex items-center gap-1 text-xs bg-indigo-950 text-indigo-300 border border-indigo-800 rounded-full px-2.5 py-1">
              {tag}
              <button type="button" onClick={() => removeTag(tag)} className="hover:text-white transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
            className={`${fieldClass} flex-1`}
            placeholder="タグを入力してEnter"
          />
          <button
            type="button"
            onClick={addTag}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors border border-gray-700"
          >
            追加
          </button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-950 border border-red-800 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white rounded-lg px-6 py-2.5 text-sm font-medium transition-colors"
        >
          {loading ? '保存中...' : isEdit ? '更新する' : '登録する'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg px-6 py-2.5 text-sm font-medium transition-colors"
        >
          キャンセル
        </button>
      </div>
    </form>
  )
}
