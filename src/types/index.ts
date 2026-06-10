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
  created_at: string
  updated_at: string
  tags: string[]
  project?: Project
  creator?: { email: string }
  assignee?: { email: string }
  comments_count?: number
}

export interface Comment {
  id: string
  bug_id: string
  content: string
  created_by: string
  created_at: string
  author?: { email: string }
}

export interface Profile {
  id: string
  email: string
  display_name: string | null
  avatar_url: string | null
}
