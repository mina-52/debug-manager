import { createClient } from '@/lib/supabase/server'
import { FolderOpen, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import Link from 'next/link'
import ProjectActions from '@/components/projects/ProjectActions'

export default async function ProjectsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: projects } = await supabase
    .from('projects')
    .select('*, bugs(count)')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">プロジェクト</h1>
          <p className="text-gray-400 mt-1 text-sm">{projects?.length ?? 0} 件</p>
        </div>
        <ProjectActions mode="create" userId={user!.id} />
      </div>

      {!projects || projects.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl py-16 text-center text-gray-500">
          <FolderOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>プロジェクトはまだありません</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map(project => (
            <div key={project.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-indigo-400 shrink-0" />
                  <h2 className="font-semibold text-white text-sm">{project.name}</h2>
                </div>
                <ProjectActions mode="menu" project={project} userId={user!.id} />
              </div>
              {project.description && (
                <p className="text-sm text-gray-400 leading-relaxed">{project.description}</p>
              )}
              <div className="flex items-center justify-between text-xs text-gray-500 pt-1 border-t border-gray-800">
                <Link
                  href={`/bugs?project=${project.id}`}
                  className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  {(project.bugs as { count: number }[])?.[0]?.count ?? 0} 件の要望・バグ等
                </Link>
                <span>{format(new Date(project.created_at), 'yyyy/MM/dd', { locale: ja })}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
