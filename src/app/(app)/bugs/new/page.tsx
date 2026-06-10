import { createClient } from '@/lib/supabase/server'
import BugForm from '@/components/bugs/BugForm'

export default async function NewBugPage() {
  const supabase = await createClient()
  const { data: projects } = await supabase.from('projects').select('id, name').order('name')

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-white mb-8">バグを登録</h1>
      <BugForm projects={projects ?? []} />
    </div>
  )
}
