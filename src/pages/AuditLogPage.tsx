import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/useAuth'
import { apiClient } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'
import { Shield, Search, Filter, Download, Clock, User, FileText, AlertTriangle, Settings } from 'lucide-react'
import { formatDateTime, formatTimeAgo } from '@/lib/utils'

interface AuditLog {
  id: string
  userId: string
  userName: string
  action: string
  resource: string
  resourceId?: string
  details?: string
  ipAddress?: string
  timestamp: string
  severity: 'info' | 'warning' | 'critical'
}

export default function AuditLogPage() {
  const { user } = useAuth()
  const orgId = user?.organizationId || ''
  const [searchQuery, setSearchQuery] = useState('')
  const [severityFilter, setSeverityFilter] = useState<'all' | 'info' | 'warning' | 'critical'>('all')
  const [actionFilter, setActionFilter] = useState<string>('all')

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit-logs', orgId],
    queryFn: async () => {
      if (!orgId) return []
      const response = await apiClient.get(`/api/organizations/${orgId}/audit-logs`)
      return response.data as AuditLog[]
    },
    enabled: !!orgId,
  })

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.details || '').toLowerCase().includes(searchQuery.toLowerCase())
    const matchesSeverity = severityFilter === 'all' || log.severity === severityFilter
    const matchesAction = actionFilter === 'all' || log.action === actionFilter
    return matchesSearch && matchesSeverity && matchesAction
  })

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-[rgba(255,77,106,0.12)] text-[#FF4D6A]'
      case 'warning': return 'bg-[rgba(255,181,71,0.12)] text-[#FFB547]'
      default: return 'bg-[rgba(0,229,204,0.12)] text-[#00E5CC]'
    }
  }

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'critical': return 'Critique'
      case 'warning': return 'Avertissement'
      default: return 'Info'
    }
  }

  const getActionIcon = (action: string) => {
    if (action.includes('login') || action.includes('auth')) return <User size={14} />
    if (action.includes('alert')) return <AlertTriangle size={14} />
    if (action.includes('config') || action.includes('setting')) return <Settings size={14} />
    return <FileText size={14} />
  }

  const exportLogs = () => {
    const csv = ['Date,Utilisateur,Action,Ressource,Détails,Sévérité,IP']
      .concat(filteredLogs.map(l =>
        `${l.timestamp},${l.userName},${l.action},${l.resource},${l.details || ''},${l.severity},${l.ipAddress || ''}`
      )).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit_log_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6 p-6 bg-[#0A0A0F] min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#F0F0F5] font-syne">Journal d'audit</h1>
          <p className="mt-1 text-sm text-[#6B6B80]">Suivez toutes les actions et modifications du système</p>
        </div>
        <Button variant="outline" onClick={exportLogs} className="gap-2 bg-[#1A1A25] border border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#2A2A3D]">
          <Download size={16} />
          Exporter CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-[#6B6B80]" />
          <Input
            placeholder="Rechercher par utilisateur, action..."
            className="pl-10 bg-[#0A0A0F] border-[#1F1F2E] text-[#F0F0F5] rounded-[8px] focus:border-[#00E5CC] placeholder-[#44445A]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'info', 'warning', 'critical'] as const).map(sev => (
            <Button
              key={sev}
              variant={severityFilter === sev ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSeverityFilter(sev)}
              className={`${
                severityFilter === sev
                  ? 'bg-[#00E5CC] text-[#0A0A0F] font-bold'
                  : 'bg-[#1A1A25] border border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#2A2A3D]'
              }`}
            >
              {sev === 'all' ? 'Tous' : getSeverityLabel(sev)}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="bg-[#12121A] border border-[#1F1F2E] rounded-[12px]">
          <CardContent className="pt-5 pb-4 text-center">
            <p className="text-2xl font-bold text-[#F0F0F5] font-syne">{logs.length}</p>
            <p className="text-xs text-[#6B6B80]">Total événements</p>
          </CardContent>
        </Card>
        <Card className="bg-[#12121A] border border-[#1F1F2E] rounded-[12px]">
          <CardContent className="pt-5 pb-4 text-center">
            <p className="text-2xl font-bold text-[#00E5CC] font-syne">{logs.filter(l => l.severity === 'info').length}</p>
            <p className="text-xs text-[#6B6B80]">Informations</p>
          </CardContent>
        </Card>
        <Card className="bg-[#12121A] border border-[#1F1F2E] rounded-[12px]">
          <CardContent className="pt-5 pb-4 text-center">
            <p className="text-2xl font-bold text-[#FFB547] font-syne">{logs.filter(l => l.severity === 'warning').length}</p>
            <p className="text-xs text-[#6B6B80]">Avertissements</p>
          </CardContent>
        </Card>
        <Card className="bg-[#12121A] border border-[#1F1F2E] rounded-[12px]">
          <CardContent className="pt-5 pb-4 text-center">
            <p className="text-2xl font-bold text-[#FF4D6A] font-syne">{logs.filter(l => l.severity === 'critical').length}</p>
            <p className="text-xs text-[#6B6B80]">Critiques</p>
          </CardContent>
        </Card>
      </div>

      {/* Logs List */}
      <Card className="bg-[#12121A] border border-[#1F1F2E] rounded-[12px]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#F0F0F5] font-syne">
            <Shield size={18} />
            Événements ({filteredLogs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 bg-[#1A1A25]" />)}
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-[#6B6B80]">
              <Shield size={48} className="mx-auto mb-4 text-[#44445A]" />
              <p>Aucun événement d'audit trouvé</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredLogs.map(log => (
                <div key={log.id} className="flex items-center justify-between rounded-lg border border-[#1F1F2E] p-3 hover:bg-[#1A1A25] transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 text-[#44445A]">{getActionIcon(log.action)}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[#F0F0F5] text-sm">{log.userName}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${getSeverityColor(log.severity)}`}>
                          {getSeverityLabel(log.severity)}
                        </span>
                      </div>
                      <p className="text-sm text-[#6B6B80]">{log.action} — {log.resource}</p>
                      {log.details && <p className="text-xs text-[#44445A] mt-0.5">{log.details}</p>}
                    </div>
                  </div>
                  <div className="text-right text-xs text-[#44445A]">
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      {log.timestamp ? formatTimeAgo(new Date(log.timestamp)) : '—'}
                    </div>
                    {log.ipAddress && <p className="mt-0.5 font-mono">{log.ipAddress}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
