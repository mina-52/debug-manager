'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Search } from 'lucide-react'
import { useState, useTransition } from 'react'
interface Props {
  projects: { id: string; name: string }[]
  currentParams: { status?: string; priority?: string; project?: string; q?: string }
}

const statuses = [
  { value: '', label: 'すべて' },
  { value: 'open', label: '未対応' },
  { value: 'in_progress', label: '対応中' },
  { value: 'resolved', label: '解決済' },
  { value: 'closed', label: 'クローズ' },
]

const priorities = [
  { value: '', label: 'すべて' },
  { value: 'critical', label: '緊急' },
  { value: 'high', label: '高' },
  { value: 'medium', label: '中' },
  { value: 'low', label: '低' },
]

export default function BugFilters({ projects, currentParams }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [, startTransition] = useTransition()
  const [q, setQ] = useState(currentParams.q ?? '')

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams()
    if (currentParams.status) params.set('status', currentParams.status)
    if (currentParams.priority) params.set('priority', currentParams.priority)
    if (currentParams.project) params.set('project', currentParams.project)
    if (currentParams.q) params.set('q', currentParams.q)
    if (value) params.set(key, value)
    else params.delete(key)
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    updateParam('q', q)
  }

  return (
    <div className="flex flex-wrap gap-2 sm:gap-3">
      <form onSubmit={handleSearch} className="relative w-full sm:w-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="タイトルで検索..."
          className="bg-gray-900 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 w-full sm:w-56 transition-colors"
        />
      </form>

      <select
        value={currentParams.status ?? ''}
        onChange={e => updateParam('status', e.target.value)}
        className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
      >
        {statuses.map(s => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>

      <select
        value={currentParams.priority ?? ''}
        onChange={e => updateParam('priority', e.target.value)}
        className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
      >
        {priorities.map(p => (
          <option key={p.value} value={p.value}>{p.label === 'すべて' ? '優先度: すべて' : p.label}</option>
        ))}
      </select>

      {projects.length > 0 && (
        <select
          value={currentParams.project ?? ''}
          onChange={e => updateParam('project', e.target.value)}
          className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
        >
          <option value="">プロジェクト: すべて</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      )}
    </div>
  )
}
