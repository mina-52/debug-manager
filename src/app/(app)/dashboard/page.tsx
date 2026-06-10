import { createClient } from '@/lib/supabase/server'
import { Bug, CheckCircle, Clock, AlertTriangle, Flame } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'
import type { Bug as BugType } from '@/types'

async function getStats(userId: string) {
  const supabase = await createClient()
  const { data: bugs } = await supabase
    .from('bugs')
    .select('id, status, priority, title, created_at, updated_at')
    .order('updated_at', { ascending: false })

  const all = bugs ?? []
  return {
    total: all.length,
    open: all.filter(b => b.status === 'open').length,
    in_progress: all.filter(b => b.status === 'in_progress').length,
    resolved: all.filter(b => b.status === 'resolved').length,
    critical: all.filter(b => b.priority === 'critical' && b.status !== 'closed').length,
    recent: all.slice(0, 5) as BugType[],
  }
}

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

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const stats = await getStats(user!.id)

  const statCards = [
    { label: '総バグ数', value: stats.total, icon: Bug, color: 'text-indigo-400', bg: 'bg-indigo-950' },
    { label: '未対応', value: stats.open, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-950' },
    { label: '対応中', value: stats.in_progress, icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-950' },
    { label: '解決済', value: stats.resolved, icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-950' },
    { label: '緊急', value: stats.critical, icon: Flame, color: 'text-orange-400', bg: 'bg-orange-950' },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">ダッシュボード</h1>
        <p className="text-gray-400 mt-1 text-sm">バグ管理の概要</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className={`inline-flex p-2 rounded-lg ${bg} mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="text-3xl font-bold text-white">{value}</p>
            <p className="text-sm text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="font-semibold text-white">最近の更新</h2>
          <Link href="/bugs" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
            すべて表示
          </Link>
        </div>

        {stats.recent.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            <Bug className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>バグはまだ登録されていません</p>
            <Link href="/bugs/new" className="mt-3 inline-block text-indigo-400 hover:text-indigo-300 text-sm transition-colors">
              最初のバグを登録する
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-gray-800">
            {stats.recent.map(bug => (
              <li key={bug.id}>
                <Link href={`/bugs/${bug.id}`} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-800/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{bug.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatDistanceToNow(new Date(bug.updated_at), { addSuffix: true, locale: ja })}
                    </p>
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
