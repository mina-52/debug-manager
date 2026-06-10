import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Bug } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'
import type { Bug as BugType } from '@/types'
import BugFilters from '@/components/bugs/BugFilters'

const statusLabel: Record<string, string> = {
  open: '未対応',
  in_progress: '対応中',
  resolved: '解決済',
  closed: 'クローズ',
}
const priorityLabel: Record<string, string> = {
  low: '低',
  medium: '中',
  high: '高',
  critical: '緊急',
}
const priorityColor: Record<string, string> = {
  low: 'text-gray-400',
  medium: 'text-blue-400',
  high: 'text-yellow-400',
  critical: 'text-red-400',
}
const statusColor: Record<string, string> = {
  open: 'bg-red-950 text-red-400 border-red-800',
  in_progress: 'bg-yellow-950 text-yellow-400 border-yellow-800',
  resolved: 'bg-green-950 text-green-400 border-green-800',
  closed: 'bg-gray-800 text-gray-400 border-gray-700',
}

interface Props {
  searchParams: Promise<{ status?: string; priority?: string; project?: string; q?: string }>
}

export default async function BugsPage({ searchParams }: Props) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('bugs')
    .select('*, project:projects(id,name)')
    .order('updated_at', { ascending: false })

  if (params.status) query = query.eq('status', params.status)
  if (params.priority) query = query.eq('priority', params.priority)
  if (params.project) query = query.eq('project_id', params.project)
  if (params.q) query = query.ilike('title', `%${params.q}%`)

  const { data: bugs } = await query
  const { data: projects } = await supabase.from('projects').select('id, name').order('name')

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">バグ一覧</h1>
          <p className="text-gray-400 mt-1 text-sm">{bugs?.length ?? 0} 件のバグ</p>
        </div>
        <Link
          href="/bugs/new"
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          新規登録
        </Link>
      </div>

      <BugFilters projects={projects ?? []} currentParams={params} />

      <div className="bg-gray-900 border border-gray-800 rounded-xl mt-4">
        {!bugs || bugs.length === 0 ? (
          <div className="px-6 py-16 text-center text-gray-500">
            <Bug className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>バグが見つかりません</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-800">
            {(bugs as BugType[]).map(bug => (
              <li key={bug.id}>
                <Link href={`/bugs/${bug.id}`} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-800/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{bug.title}</p>
                    <div className="flex items-center gap-3 mt-1">
                      {bug.project && (
                        <span className="text-xs text-indigo-400">{(bug.project as { name: string }).name}</span>
                      )}
                      {bug.tags && bug.tags.length > 0 && (
                        <div className="flex gap-1">
                          {bug.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="text-xs bg-gray-800 text-gray-400 rounded px-1.5 py-0.5">{tag}</span>
                          ))}
                        </div>
                      )}
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(bug.updated_at), { addSuffix: true, locale: ja })}
                      </span>
                    </div>
                  </div>
                  <span className={`text-xs font-medium ${priorityColor[bug.priority]}`}>
                    {priorityLabel[bug.priority]}
                  </span>
                  <span className={`text-xs px-2.5 py-1 rounded-full border ${statusColor[bug.status]}`}>
                    {statusLabel[bug.status]}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
