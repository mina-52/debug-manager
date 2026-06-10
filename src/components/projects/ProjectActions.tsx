'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus, MoreVertical, Pencil, Trash2, X } from 'lucide-react'
import type { Project } from '@/types'

interface CreateProps {
  mode: 'create'
  userId: string
}
interface MenuProps {
  mode: 'menu'
  project: Project
  userId: string
}
type Props = CreateProps | MenuProps

export default function ProjectActions(props: Props) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [name, setName] = useState(props.mode === 'menu' ? props.project.name : '')
  const [description, setDescription] = useState(props.mode === 'menu' ? (props.project.description ?? '') : '')
  const [loading, setLoading] = useState(false)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    await supabase.from('projects').insert({ name, description: description || null, created_by: props.userId })
    setLoading(false)
    setShowForm(false)
    setName('')
    setDescription('')
    router.refresh()
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (props.mode !== 'menu') return
    setLoading(true)
    const supabase = createClient()
    await supabase.from('projects').update({ name, description: description || null }).eq('id', props.project.id)
    setLoading(false)
    setShowEditForm(false)
    router.refresh()
  }

  async function handleDelete() {
    if (props.mode !== 'menu') return
    const supabase = createClient()
    await supabase.from('projects').delete().eq('id', props.project.id)
    router.refresh()
  }

  const fieldClass = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors text-sm'

  if (props.mode === 'create') {
    return (
      <>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          新規プロジェクト
        </button>

        {showForm && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-white">新規プロジェクト</h2>
                <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">プロジェクト名 <span className="text-red-400">*</span></label>
                  <input value={name} onChange={e => setName(e.target.value)} required className={fieldClass} placeholder="MyProject" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">説明</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className={`${fieldClass} resize-none`} placeholder="プロジェクトの説明..." />
                </div>
                <div className="flex gap-3 pt-1">
                  <button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white rounded-lg px-5 py-2 text-sm font-medium transition-colors">
                    {loading ? '作成中...' : '作成する'}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)} className="bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg px-5 py-2 text-sm font-medium transition-colors">
                    キャンセル
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </>
    )
  }

  return (
    <div className="relative">
      <button onClick={() => setShowMenu(!showMenu)} className="text-gray-500 hover:text-white p-1 rounded transition-colors">
        <MoreVertical className="w-4 h-4" />
      </button>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
          <div className="absolute right-0 top-6 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 py-1 min-w-32">
            <button
              onClick={() => { setShowEditForm(true); setShowMenu(false) }}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 w-full transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              編集
            </button>
            <button
              onClick={() => { handleDelete(); setShowMenu(false) }}
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-gray-700 w-full transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              削除
            </button>
          </div>
        </>
      )}

      {showEditForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-white">プロジェクトを編集</h2>
              <button onClick={() => setShowEditForm(false)} className="text-gray-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">プロジェクト名 <span className="text-red-400">*</span></label>
                <input value={name} onChange={e => setName(e.target.value)} required className={fieldClass} />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">説明</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className={`${fieldClass} resize-none`} />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white rounded-lg px-5 py-2 text-sm font-medium transition-colors">
                  {loading ? '更新中...' : '更新する'}
                </button>
                <button type="button" onClick={() => setShowEditForm(false)} className="bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg px-5 py-2 text-sm font-medium transition-colors">
                  キャンセル
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
