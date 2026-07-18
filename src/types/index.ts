export type BugStatus = 'open' | 'in_progress' | 'resolved' | 'closed'
export type BugPriority = 'low' | 'medium' | 'high' | 'critical'

export interface Project {
  id: string
  name: string
  description: string | null
  created_at: string
  created_by: string
}

export interface Bug {
  id: string
  title: string
  description: string | null
  status: BugStatus
  priority: BugPriority
  project_id: string | null
  assigned_to: string | null
  created_by: string
  updated_by: string | null
  created_at: string
  updated_at: string
  tags: string[]
  images: string[]
  project?: Project
  creator?: { email: string; display_name?: string | null }
  updater?: { email: string; display_name?: string | null }
  assignee?: { email: string; display_name?: string | null }
  comments_count?: number
}

export interface Comment {
  id: string
  bug_id: string
  content: string
  created_by: string
  created_at: string
  author?: { email: string; display_name?: string | null }
}

export interface Profile {
  id: string
  email: string
  display_name: string | null
  avatar_url: string | null
}

export type NotificationType = 'comment_added' | 'status_changed' | 'bug_created'

export interface NotificationEventMeta {
  priority?: BugPriority
  old_status?: BugStatus
  new_status?: BugStatus
}

export interface NotificationEvent {
  id: string
  type: NotificationType
  bug_id: string | null
  actor_id: string | null
  title: string
  body: string | null
  meta: NotificationEventMeta
  created_at: string
}

// ブラウザ標準の Notification 型と衝突するため AppNotification とする
export interface AppNotification {
  id: string
  event_id: string
  user_id: string
  is_read: boolean
  created_at: string
  event?: NotificationEvent
}
