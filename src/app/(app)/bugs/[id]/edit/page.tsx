import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import BugForm from '@/components/bugs/BugForm'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditBugPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: bug } = await supabase.from('bugs').select('*').eq('id', id).single()
  if (!bug) notFound()

  const { data: projects } = await supabase.from('projects').select('id, name').order('name')

  return (
    <div className="p-8 max-w-2xl">
      <Link href={`/bugs/${id}`} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white mb-6 transition-colors w-fit">
        <ArrowLeft className="w-4 h-4" />
        バグ詳細へ戻る
      </Link>
      <h1 className="text-2xl font-bold text-white mb-8">バグを編集</h1>
      <BugForm projects={projects ?? []} bug={bug} />
    </div>
  )
}
