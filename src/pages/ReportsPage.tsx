'use client'

import React, { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  BarChart3,
  Download,
  FileText,
  Calendar,
  Car,
  Filter,
  Clock,
  CheckCircle,
  Loader2,
  FileSpreadsheet,
  File,
} from 'lucide-react'
import { format, subDays } from 'date-fns'
import { formatDateTime } from '@/lib/utils'
import { apiClient } from '@/lib/api'
import { API_ROUTES } from '@/lib/constants'
import { useAuthStore } from '@/stores/authStore'

type ReportType = 'trip' | 'fuel' | 'driver' | 'fleet' | 'maintenance' | 'compliance'
type ReportFormat = 'pdf' | 'excel' | 'csv'
type ReportStatus = 'pending' | 'completed' | 'failed'

interface GeneratedReport {
  id: string
  type: ReportType
  format: ReportFormat
  status: ReportStatus
  generatedAt: Date
  dateFrom: Date
  dateTo: Date
  vehicleCount?: number
  downloadUrl?: string
}

interface Vehicle {
  id: string
  name: string
  plate: string
}

const REPORT_TYPE_CONFIG: Record<
  ReportType,
  { title: string; description: string; icon: typeof FileText }
> = {
  trip: {
    title: 'Trip Report',
    description: 'Detailed trip information with distance, duration, and route',
    icon: FileText,
  },
  fuel: {
    title: 'Fuel Report',
    description: 'Fuel consumption analysis and optimization recommendations',
    icon: BarChart3,
  },
  driver: {
    title: 'Driver Report',
    description: 'Driver behavior analysis and performance metrics',
    icon: FileText,
  },
  fleet: {
    title: 'Fleet Report',
    description: 'Overall fleet performance and utilization statistics',
    icon: BarChart3,
  },
  maintenance: {
    title: 'Maintenance Report',
    description: 'Maintenance schedule and service history',
    icon: FileText,
  },
  compliance: {
    title: 'Compliance Report',
    description: 'Alert violations and compliance metrics',
    icon: BarChart3,
  },
}

const FORMAT_ICONS: Record<ReportFormat, typeof File> = {
  pdf: FileText,
  excel: FileSpreadsheet,
  csv: File,
}

export default function ReportsPage() {
  const { user } = useAuthStore()
  const orgId = user?.organizationId

  // State for report generation dialog
  const [selectedReportType, setSelectedReportType] = useState<ReportType | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  // Form state
  const [dateFrom, setDateFrom] = useState<string>(
    format(subDays(new Date(), 30), 'yyyy-MM-dd')
  )
  const [dateTo, setDateTo] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([])
  const [reportFormat, setReportFormat] = useState<ReportFormat>('pdf')
  const [isGenerating, setIsGenerating] = useState(false)

  // Generated reports state
  const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>([
    {
      id: '1',
      type: 'trip',
      format: 'pdf',
      status: 'completed',
      generatedAt: new Date(Date.now() - 86400000),
      dateFrom: subDays(new Date(), 60),
      dateTo: subDays(new Date(), 30),
      vehicleCount: 5,
      downloadUrl: '/reports/trip-report-2024.pdf',
    },
    {
      id: '2',
      type: 'fuel',
      format: 'excel',
      status: 'completed',
      generatedAt: new Date(Date.now() - 172800000),
      dateFrom: subDays(new Date(), 90),
      dateTo: subDays(new Date(), 60),
      vehicleCount: 8,
      downloadUrl: '/reports/fuel-report-2024.xlsx',
    },
  ])

  // Mock vehicles (in a real app, these would come from the backend)
  const [vehicles] = useState<Vehicle[]>([
    { id: 'v1', name: 'Truck 1', plate: 'ABC-123' },
    { id: 'v2', name: 'Truck 2', plate: 'DEF-456' },
    { id: 'v3', name: 'Van 1', plate: 'GHI-789' },
    { id: 'v4', name: 'Van 2', plate: 'JKL-012' },
    { id: 'v5', name: 'Car 1', plate: 'MNO-345' },
  ])

  const handleOpenDialog = useCallback((reportType: ReportType) => {
    setSelectedReportType(reportType)
    setSelectedVehicles([])
    setReportFormat('pdf')
    setDialogOpen(true)
  }, [])

  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false)
    setSelectedReportType(null)
  }, [])

  const handleVehicleToggle = useCallback((vehicleId: string) => {
    setSelectedVehicles((prev) =>
      prev.includes(vehicleId) ? prev.filter((id) => id !== vehicleId) : [...prev, vehicleId]
    )
  }, [])

  const handleGenerateReport = useCallback(async () => {
    if (!selectedReportType || !orgId) {
      return
    }

    setIsGenerating(true)

    try {
      const payload = {
        type: selectedReportType,
        dateFrom: new Date(dateFrom),
        dateTo: new Date(dateTo),
        vehicleIds: selectedVehicles.length > 0 ? selectedVehicles : undefined,
        format: reportFormat,
      }

      const response = await apiClient.post(API_ROUTES.REPORTS_GENERATE(orgId), payload)
      const result = response.data || {}

      // Add new report to the list
      const newReport: GeneratedReport = {
        id: result.id || `report-${Date.now()}`,
        type: selectedReportType,
        format: reportFormat,
        status: (result.status as ReportStatus) || 'completed',
        generatedAt: new Date(),
        dateFrom: new Date(dateFrom),
        dateTo: new Date(dateTo),
        vehicleCount: selectedVehicles.length || undefined,
        downloadUrl: result.downloadUrl,
      }

      setGeneratedReports((prev) => [newReport, ...prev])
      handleCloseDialog()
    } catch (error) {
      console.error('Failed to generate report:', error)
      // Optionally show error toast here
    } finally {
      setIsGenerating(false)
    }
  }, [selectedReportType, orgId, dateFrom, dateTo, selectedVehicles, reportFormat, handleCloseDialog])

  const handleDownloadReport = useCallback((report: GeneratedReport) => {
    if (report.downloadUrl) {
      const link = document.createElement('a')
      link.href = report.downloadUrl
      link.download = `${report.type}-report.${report.format === 'excel' ? 'xlsx' : report.format}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }, [])

  const reportTypes = Object.entries(REPORT_TYPE_CONFIG).map(([key, config]) => ({
    type: key as ReportType,
    ...config,
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
        <p className="mt-2 text-gray-600">Generate and download fleet reports</p>
      </div>

      {/* Report Types Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reportTypes.map((report) => {
          const Icon = report.icon
          return (
            <Card
              key={report.type}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleOpenDialog(report.type)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{report.title}</CardTitle>
                    <CardDescription className="text-sm">{report.description}</CardDescription>
                  </div>
                  <Icon className="text-fleet-tracker-600 flex-shrink-0" size={24} />
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => handleOpenDialog(report.type)}
                >
                  <Download size={16} />
                  Generate Report
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Report Configuration Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedReportType && REPORT_TYPE_CONFIG[selectedReportType].title}
            </DialogTitle>
            <DialogDescription>
              Configure the report parameters and download format
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Date Range Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-gray-600" />
                <h3 className="font-semibold text-gray-900">Date Range</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">From</label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">To</label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Vehicle Selection */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Car size={18} className="text-gray-600" />
                <h3 className="font-semibold text-gray-900">Vehicles (Optional)</h3>
              </div>
              <p className="text-sm text-gray-600">
                Leave blank to include all vehicles in your fleet
              </p>
              <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto">
                {vehicles.map((vehicle) => (
                  <label
                    key={vehicle.id}
                    className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedVehicles.includes(vehicle.id)}
                      onChange={() => handleVehicleToggle(vehicle.id)}
                      className="rounded border-gray-300"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900">{vehicle.name}</p>
                      <p className="text-xs text-gray-500">{vehicle.plate}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Report Format */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Filter size={18} className="text-gray-600" />
                <h3 className="font-semibold text-gray-900">Report Format</h3>
              </div>
              <div className="flex gap-3">
                {(['pdf', 'excel', 'csv'] as ReportFormat[]).map((format) => {
                  const Icon = FORMAT_ICONS[format]
                  return (
                    <button
                      key={format}
                      onClick={() => setReportFormat(format)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                        reportFormat === format
                          ? 'border-fleet-tracker-600 bg-fleet-tracker-50 text-fleet-tracker-700'
                          : 'border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Icon size={18} />
                      <span className="text-sm font-medium capitalize">{format}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog} disabled={isGenerating}>
              Cancel
            </Button>
            <Button
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className="gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download size={16} />
                  Generate Report
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generated Reports Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Generated Reports</CardTitle>
            <Badge variant="secondary">{generatedReports.length}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {generatedReports.length === 0 ? (
            <div className="space-y-3 text-center py-12">
              <p className="text-gray-500">No reports generated yet</p>
              <Button
                variant="outline"
                onClick={() => handleOpenDialog('trip')}
                className="gap-2"
              >
                <Download size={16} />
                Generate your first report
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">
                      Report Type
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">
                      Date Range
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">
                      Format
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Status</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">
                      Generated
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-900">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {generatedReports.map((report) => {
                    const reportConfig = REPORT_TYPE_CONFIG[report.type]
                    const formatIcon = FORMAT_ICONS[report.format]

                    return (
                      <tr
                        key={report.id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <reportConfig.icon
                              size={16}
                              className="text-gray-500 flex-shrink-0"
                            />
                            <span className="font-medium text-gray-900">
                              {reportConfig.title}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {format(report.dateFrom, 'MMM dd, yyyy')} -{' '}
                          {format(report.dateTo, 'MMM dd, yyyy')}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {formatIcon && React.createElement(formatIcon, { size: 16, className: 'text-gray-500' })}
                            <span className="capitalize text-gray-600">{report.format}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {report.status === 'completed' && (
                            <Badge className="bg-green-100 text-green-800 flex w-fit gap-1">
                              <CheckCircle size={14} />
                              Completed
                            </Badge>
                          )}
                          {report.status === 'pending' && (
                            <Badge className="bg-yellow-100 text-yellow-800 flex w-fit gap-1">
                              <Loader2 size={14} className="animate-spin" />
                              Pending
                            </Badge>
                          )}
                          {report.status === 'failed' && (
                            <Badge className="bg-red-100 text-red-800">Failed</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">
                          <div className="flex items-center gap-1">
                            <Clock size={14} />
                            {formatDateTime(report.generatedAt)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={report.status !== 'completed'}
                            onClick={() => handleDownloadReport(report)}
                            className="gap-2"
                          >
                            <Download size={14} />
                            Download
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
