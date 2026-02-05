'use client'

import { useState } from 'react'
import { Flag, Users, AlertTriangle, UserX } from 'lucide-react'
import FlagsList from './FlagsList'
import ReportsList from './ReportsList'
import UserIncidentsList from './UserIncidentsList'
import type {
  MessageFlagRow,
  MessageReportWithUsers,
  PaginationInfo,
} from '@/lib/moderation/types'

interface ModerationPanelProps {
  initialFlags: MessageFlagRow[]
  initialFlagsPagination: PaginationInfo
  initialReports: MessageReportWithUsers[]
  initialReportsPagination: PaginationInfo
  stats: {
    totalFlags: number
    openReports: number
    highSeverityFlags: number
  }
}

export default function ModerationPanel({
  initialFlags,
  initialFlagsPagination,
  initialReports,
  initialReportsPagination,
  stats,
}: ModerationPanelProps) {
  const [activeTab, setActiveTab] = useState<'flags' | 'reports' | 'users'>('flags')

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Flag className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-sm text-white/60">Total flags</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.totalFlags}</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <Users className="w-5 h-5 text-yellow-400" />
            </div>
            <span className="text-sm text-white/60">Reportes abiertos</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.openReports}</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <span className="text-sm text-white/60">Flags alta severidad</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.highSeverityFlags}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 rounded-xl p-1 w-fit">
        <button
          onClick={() => setActiveTab('flags')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'flags'
              ? 'bg-brand text-white'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          Flags automáticos
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'reports'
              ? 'bg-brand text-white'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          Reportes de usuarios
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
            activeTab === 'users'
              ? 'bg-brand text-white'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <UserX className="w-4 h-4" />
          Usuarios con incidencias
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'flags' && (
        <FlagsList
          initialFlags={initialFlags}
          initialPagination={initialFlagsPagination}
        />
      )}
      {activeTab === 'reports' && (
        <ReportsList
          initialReports={initialReports}
          initialPagination={initialReportsPagination}
        />
      )}
      {activeTab === 'users' && (
        <UserIncidentsList />
      )}
    </div>
  )
}
