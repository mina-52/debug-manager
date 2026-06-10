'use server'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

function storagePathFromUrl(url: string): string {
  const marker = '/bug-images/'
  const idx = url.indexOf(marker)
  return idx !== -1 ? url.slice(idx + marker.length) : ''
}

export async function deleteBugImages(imageUrls: string[]) {
  if (imageUrls.length === 0) return

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('認証が必要です')

  const paths = imageUrls.map(storagePathFromUrl).filter(Boolean)
  if (paths.length === 0) return

  const admin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await admin.storage.from('bug-images').remove(paths)
  if (error) throw new Error(error.message)
}
