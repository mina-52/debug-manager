import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import CommentSection from '@/components/bugs/CommentSection'
import DeleteBugButton from '@/components/bugs/DeleteBugButton'

const statusLabel: Record<string, string> = {
  open: '未対応', in_progress: '対応中', resolved: '解決済', closed: 'クローズ',
}
const priorityLabel: Record<string, string> = {
  low: '低', medium: '中', high: '高', critical: '緊急',
}
const priorityColor: Record<string, string> = {
  low: 'text-gray-400', medium: 'text-blue-400', high: 'text-yellow-400', critical: 'text-red-400',
}
const statusColor: Record<string, string> = {
  open: 'bg-red-950 text-red-400 border-red-800',
  in_progress: 'bg-yellow-950 text-yellow-400 border-yellow-800',
  resolved: 'bg-green-950 text-green-400 border-green-800',
  closed: 'bg-gray-800 text-gray-400 border-gray-700',
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function BugDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: bug } = await supabase
    .from('bugs')
    .select('*, project:projects(id,name)')
    .eq('id', id)
    .single()

  if (!bug) notFound()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: comments } = await supabase
    .from('comments')
    .select('*')
    .eq('bug_id', id)
    .order('created_at', { ascending: true })

  return (
    <div className="p-8 max-w-3xl">
      <Link href="/bugs" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white mb-6 transition-colors w-fit">
        <ArrowLeft className="w-4 h-4" />
        バグ一覧へ戻る
      </Link>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="text-xl font-bold text-white leading-snug">{bug.title}</h1>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/bugs/${id}/edit`}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg px-3 py-1.5 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              編集
            </Link>
            <DeleteBugButton bugId={id} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <span className={`text-xs px-2.5 py-1 rounded-full border ${statusColor[bug.status]}`}>
            {statusLabel[bug.status]}
          </span>
          <span className={`text-sm font-medium ${priorityColor[bug.priority]}`}>
            優先度: {priorityLabel[bug.priority]}
          </span>
          {bug.project && (
            <Link href={`/projects`} className="text-xs text-indigo-400 bg-indigo-950 border border-indigo-800 rounded-full px-2.5 py-1">
              {(bug.project as { name: string }).name}
            </Link>
          )}
        </div>

        {bug.tags && bug.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-6">
            {(bug.tags as string[]).map((tag: string) => (
              <span key={tag} className="text-xs bg-gray-800 text-gray-400 rounded-full px-2.5 py-1">{tag}</span>
            ))}
          </div>
        )}

        {bug.description ? (
          <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed border-t border-gray-800 pt-4">
            {bug.description}
          </div>
        ) : (
          <p className="text-sm text-gray-600 border-t border-gray-800 pt-4">説明なし</p>
        )}

        <div className="mt-6 pt-4 border-t border-gray-800 flex gap-6 text-xs text-gray-500">
          <span>作成: {format(new Date(bug.created_at), 'yyyy/MM/dd HH:mm', { locale: ja })}</span>
          <span>更新: {format(new Date(bug.updated_at), 'yyyy/MM/dd HH:mm', { locale: ja })}</span>
        </div>
      </div>

      <CommentSection bugId={id} comments={comments ?? []} currentUserId={user!.id} />
    </div>
  )
}
