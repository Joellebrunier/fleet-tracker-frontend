import { useState } from 'react'
import { useAlerts, useAlertStats, useBulkAcknowledgeAlerts } from '@/hooks/useAlerts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, Check, Trash2 } from 'lucide-react'
import { formatDateTime, getSeverityColor } from '@/lib/utils'
import { AlertType, AlertSeverity } from '@/types/alert'

export default function AlertsPage() {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<'unacknowledged' | 'acknowledged' | undefined>('unacknowledged')
  const { data: alertsData, isLoading } = useAlerts({ page, limit: 20, status })
  const { data: stats } = useAlertStats()
  const { mutate: bulkAcknowledge } = useBulkAcknowledgeAlerts()

  const alerts = alertsData?.data || []
  const totalPages = alertsData?.totalPages || 1

  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity) {
      case AlertSeverity.CRITICAL:
        return 'destructive'
      case AlertSeverity.HIGH:
        return 'secondary'
      case AlertSeverity.MEDIUM:
        return 'warning'
      case AlertSeverity.LOW:
        return 'outline'
      default:
        return 'default'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Alerts</h1>
        <p className="mt-2 text-gray-600">Monitor and manage fleet alerts</p>
      </div>

      {/* Stats */}
      {stats ? (
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Total</p>
              <p className="mt-2 text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-red-600 font-medium">Critical</p>
              <p className="mt-2 text-2xl font-bold text-red-600">{stats.critical}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-orange-600 font-medium">High</p>
              <p className="mt-2 text-2xl font-bold text-orange-600">{stats.high}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-yellow-600 font-medium">Medium</p>
              <p className="mt-2 text-2xl font-bold text-yellow-600">{stats.medium}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-blue-600 font-medium">Low</p>
              <p className="mt-2 text-2xl font-bold text-blue-600">{stats.low}</p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Skeleton className="h-24" />
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <button
              onClick={() => {
                setStatus(undefined)
                setPage(1)
              }}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                status === undefined
                  ? 'bg-fleet-tracker-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => {
                setStatus('unacknowledged')
                setPage(1)
              }}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                status === 'unacknowledged'
                  ? 'bg-fleet-tracker-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Unacknowledged
            </button>
            <button
              onClick={() => {
                setStatus('acknowledged')
                setPage(1)
              }}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                status === 'acknowledged'
                  ? 'bg-fleet-tracker-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Acknowledged
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Alerts list */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <Card className="text-center">
          <CardContent className="pt-12">
            <AlertCircle className="mx-auto mb-4 text-gray-400" size={48} />
            <p className="text-gray-500">No alerts found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <Card key={alert.id} className={getSeverityColor(alert.severity)}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <div className={`rounded-lg p-2 ${getSeverityColor(alert.severity)}`}>
                        <AlertCircle size={20} className="text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{alert.title}</h3>
                        <p className="mt-1 text-sm text-gray-600">{alert.message}</p>
                        <p className="mt-2 text-xs text-gray-500">
                          {formatDateTime(alert.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant={getSeverityBadgeVariant(alert.severity)}>
                      {alert.severity}
                    </Badge>
                    {alert.isAcknowledged && (
                      <Badge variant="secondary" className="text-xs">
                        Acknowledged
                      </Badge>
                    )}
                    {!alert.isAcknowledged && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2"
                        onClick={() => bulkAcknowledge([alert.id])}
                      >
                        <Check size={14} />
                        Acknowledge
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
