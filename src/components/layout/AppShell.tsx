'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, Bug } from 'lucide-react'
import Sidebar from './Sidebar'
import NotificationBell from './NotificationBell'
import { useNotifications } from '@/lib/useNotifications'
import type { AppNotification } from '@/types'

interface Props {
  userId: string
  userEmail: string
  userDisplayName: string | null
  notifications: AppNotification[]
  children: React.ReactNode
}

export default function AppShell({ userId, userEmail, userDisplayName, notifications: initialNotifications, children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // ベルは PC 用サイドバーとモバイルヘッダーの2箇所に描画されるので、
  // 購読と状態はここで1つだけ持ち、両方に配る
  const { notifications, markRead, markAllRead } = useNotifications(userId, initialNotifications)

  return (
    <div className="flex min-h-screen">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar wrapper */}
      <div
        className={`fixed inset-y-0 left-0 z-30 transition-transform duration-300 md:static md:translate-x-0 md:block ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar
          userEmail={userEmail}
          userDisplayName={userDisplayName}
          notifications={notifications}
          onMarkRead={markRead}
          onMarkAllRead={markAllRead}
          onNavigate={() => setSidebarOpen(false)}
        />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="md:hidden sticky top-0 z-10 bg-gray-900 border-b border-gray-800 h-14 flex items-center px-4 gap-3 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-400 hover:text-white transition-colors p-1 -ml-1"
            aria-label="メニューを開く"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link href="/dashboard" className="flex items-center gap-2">
            <Bug className="w-5 h-5 text-indigo-400" />
            <span className="font-bold text-white">DebugManager</span>
          </Link>
          <div className="ml-auto">
            <NotificationBell
              notifications={notifications}
              onMarkRead={markRead}
              onMarkAllRead={markAllRead}
            />
          </div>
        </header>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
