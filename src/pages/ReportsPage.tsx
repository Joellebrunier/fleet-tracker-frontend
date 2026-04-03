'use client'

import React, { useState, useCallback, useEffect } from 'react'
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
  Printer,
  Mail,
  Clock as ClockIcon,
  AlertCircle,
  TrendingUp,
  Share2,
  Copy,
  Plus,
  X,
  ToggleLeft,
} from 'lucide-react'
import { format, subDays, startOfWeek, startOfMonth, endOfMonth, addDays, addWeeks, addMonths } from 'date-fns'
import { formatDateTime } from '@/lib/utils'
import { apiClient } from '@/lib/api'
import { API_ROUTES } from '@/lib/constants'
import { useAuthStore } from '@/stores/authStore'
import { useVehicles } from '@/hooks/useVehicles'
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

type ReportType = 'trip' | 'fuel' | 'driver' | 'fleet' | 'maintenance' | 'compliance'
type ReportFormat = 'pdf' | 'excel' | 'csv'
type ReportStatus = 'pending' | 'completed' | 'failed'
type ScheduleFrequency = 'daily' | 'weekly' | 'monthly'

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

interface ReportTemplate {
  name: string
  description: string
  type: ReportType
  frequency?: ScheduleFrequency
  format: ReportFormat
  icon: typeof FileText
}

interface ScheduledReport {
  id: string
  type: ReportType
  frequency: ScheduleFrequency
  nextRun: Date
  isActive: boolean
  recipients: string[]
  dayOfWeek?: number
  timeOfDay?: string
}

interface Vehicle {
  id: string
  name: string
  plate: string
}

interface TrendData {
  date: string
  mileage?: number
  speed?: number
  alerts?: number
  utilization?: number
}

interface VehicleComparison {
  vehicleId: string
  vehicleName: string
  km: number
  trips: number
  alerts: number
  avgSpeed: number
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

const ENHANCED_TEMPLATES: ReportTemplate[] = [
  {
    name: 'Rapport kilométrage mensuel',
    description: 'Kilométrage mensuel par véhicule',
    type: 'trip',
    frequency: 'monthly',
    format: 'excel',
    icon: FileSpreadsheet,
  },
  {
    name: 'Rapport activité conducteurs',
    description: 'Résumé de l\'activité des conducteurs',
    type: 'driver',
    frequency: 'monthly',
    format: 'pdf',
    icon: FileText,
  },
  {
    name: 'Rapport violations géoclôtures',
    description: 'Violations de géoclôture détectées',
    type: 'compliance',
    frequency: 'weekly',
    format: 'pdf',
    icon: BarChart3,
  },
  {
    name: 'Rapport consommation carburant',
    description: 'Estimation de consommation carburant',
    type: 'fuel',
    frequency: 'monthly',
    format: 'excel',
    icon: FileSpreadsheet,
  },
  {
    name: 'Rapport alertes hebdomadaire',
    description: 'Résumé hebdomadaire des alertes',
    type: 'compliance',
    frequency: 'weekly',
    format: 'pdf',
    icon: BarChart3,
  },
  {
    name: 'Rapport utilisation flotte',
    description: 'Pourcentage utilisation flotte',
    type: 'fleet',
    frequency: 'weekly',
    format: 'excel',
    icon: FileSpreadsheet,
  },
]

// Mock trend data generator
const generateTrendData = (): TrendData[] => {
  const data: TrendData[] = []
  for (let i = 29; i >= 0; i--) {
    const date = subDays(new Date(), i)
    data.push({
      date: format(date, 'MMM dd'),
      mileage: Math.floor(Math.random() * 500) + 200,
      speed: Math.floor(Math.random() * 40) + 40,
      alerts: Math.floor(Math.random() * 10),
      utilization: Math.floor(Math.random() * 40) + 50,
    })
  }
  return data
}

export default function ReportsPage() {
  const orgId = useAuthStore((s) => s.user?.organizationId) || ''

  // State for report generation dialog
  const [selectedReportType, setSelectedReportType] = useState<ReportType | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'generate' | 'scheduled' | 'trends' | 'comparison'>('generate')
  const [showScheduleForm, setShowScheduleForm] = useState(false)
  const [showEmailDialog, setShowEmailDialog] = useState(false)

  // Form state
  const [dateFrom, setDateFrom] = useState<string>(
    format(subDays(new Date(), 30), 'yyyy-MM-dd')
  )
  const [dateTo, setDateTo] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([])
  const [reportFormat, setReportFormat] = useState<ReportFormat>('pdf')
  const [isGenerating, setIsGenerating] = useState(false)

  // Schedule state
  const [scheduleFrequency, setScheduleFrequency] = useState<ScheduleFrequency>('weekly')
  const [scheduleEmail, setScheduleEmail] = useState('')
  const [emailRecipients, setEmailRecipients] = useState<string[]>([])
  const [newRecipient, setNewRecipient] = useState('')
  const [sendCopyToMe, setSendCopyToMe] = useState(false)
  const [scheduleTimeOfDay, setScheduleTimeOfDay] = useState('09:00')
  const [scheduleDayOfWeek, setScheduleDayOfWeek] = useState<number>(1)
  const [isScheduling, setIsScheduling] = useState(false)
  const [scheduleError, setScheduleError] = useState('')
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([])

  // Email state
  const [emailRecipient, setEmailRecipient] = useState('')
  const [emailRecipientsList, setEmailRecipientsList] = useState<string[]>([])
  const [emailSubject, setEmailSubject] = useState('')
  const [emailMessage, setEmailMessage] = useState('')
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [emailError, setEmailError] = useState('')

  // Error state
  const [generationError, setGenerationError] = useState('')

  // Generated reports state
  const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>([])

  // Trends and comparison state
  const [trendData, setTrendData] = useState<TrendData[]>([])
  const [comparisonVehicles, setComparisonVehicles] = useState<string[]>([])
  const [comparisonData, setComparisonData] = useState<VehicleComparison[]>([])
  const [copiedShareLink, setCopiedShareLink] = useState(false)

  // Load report history from API
  useEffect(() => {
    const loadReportHistory = async () => {
      if (!orgId) return
      try {
        const response = await apiClient.get(`${API_ROUTES.REPORTS_GENERATE(orgId)}/history`)
        const data = response.data
        if (Array.isArray(data)) {
          setGeneratedReports(data.map((r: any) => ({
            ...r,
            generatedAt: new Date(r.generatedAt || r.createdAt),
            dateFrom: new Date(r.dateFrom),
            dateTo: new Date(r.dateTo),
          })))
        }
      } catch {
        // API may not have history endpoint yet — keep empty
      }
    }
    loadReportHistory()

    // Generate mock trend data
    setTrendData(generateTrendData())
  }, [orgId])

  // Fetch real vehicles from API
  const { data: vehiclesData } = useVehicles({ limit: 500 })
  const vehicles: Vehicle[] = (vehiclesData?.data || []).map((v: any) => ({
    id: v.id,
    name: v.name || v.plate || 'Sans nom',
    plate: v.plate || '—',
  }))

  const handleOpenDialog = useCallback((reportType: ReportType) => {
    setSelectedReportType(reportType)
    setSelectedVehicles([])
    setReportFormat('pdf')
    setDialogOpen(true)
  }, [])

  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false)
    setSelectedReportType(null)
    setGenerationError('')
    setShowScheduleForm(false)
    setShowEmailDialog(false)
  }, [])

  const applyDateRange = useCallback((range: 'today' | 'week' | 'month' | 'lastMonth') => {
    const today = new Date()
    let newDateFrom: Date
    let newDateTo: Date = today

    switch (range) {
      case 'today':
        newDateFrom = today
        break
      case 'week':
        newDateFrom = startOfWeek(today, { weekStartsOn: 1 })
        break
      case 'month':
        newDateFrom = startOfMonth(today)
        break
      case 'lastMonth':
        const firstOfThisMonth = startOfMonth(today)
        newDateTo = subDays(firstOfThisMonth, 1)
        newDateFrom = startOfMonth(newDateTo)
        break
      default:
        return
    }

    setDateFrom(format(newDateFrom, 'yyyy-MM-dd'))
    setDateTo(format(newDateTo, 'yyyy-MM-dd'))
  }, [])

  const handleVehicleToggle = useCallback((vehicleId: string) => {
    setSelectedVehicles((prev) =>
      prev.includes(vehicleId) ? prev.filter((id) => id !== vehicleId) : [...prev, vehicleId]
    )
  }, [])

  const handleComparisonVehicleToggle = useCallback((vehicleId: string) => {
    setComparisonVehicles((prev) => {
      if (prev.includes(vehicleId)) {
        return prev.filter((id) => id !== vehicleId)
      }
      if (prev.length < 4) {
        return [...prev, vehicleId]
      }
      return prev
    })
  }, [])

  const generateComparisonData = useCallback(() => {
    if (comparisonVehicles.length === 0) return

    const data = comparisonVehicles.map((vehicleId) => {
      const vehicle = vehicles.find((v) => v.id === vehicleId)
      return {
        vehicleId,
        vehicleName: vehicle?.name || 'Unknown',
        km: Math.floor(Math.random() * 5000) + 1000,
        trips: Math.floor(Math.random() * 100) + 20,
        alerts: Math.floor(Math.random() * 20),
        avgSpeed: Math.floor(Math.random() * 40) + 40,
      }
    })
    setComparisonData(data)
  }, [comparisonVehicles, vehicles])

  useEffect(() => {
    generateComparisonData()
  }, [comparisonVehicles, generateComparisonData])

  const handleGenerateReport = useCallback(async () => {
    if (!selectedReportType || !orgId) {
      setGenerationError('Type de rapport non sélectionné')
      return
    }

    setIsGenerating(true)
    setGenerationError('')

    try {
      const payload = {
        type: selectedReportType,
        dateFrom: dateFrom,
        dateTo: dateTo,
        vehicleIds: selectedVehicles.length > 0 ? selectedVehicles : undefined,
        format: reportFormat,
      }

      const response = await apiClient.post(API_ROUTES.REPORTS_GENERATE(orgId), payload)
      const result = response.data || {}

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
      setGenerationError(
        error instanceof Error
          ? error.message
          : 'Erreur lors de la génération du rapport'
      )
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

  const applyTemplate = useCallback((template: ReportTemplate) => {
    setSelectedReportType(template.type)
    setReportFormat(template.format)
    setDialogOpen(true)
  }, [])

  const handlePrint = useCallback(() => {
    window.print()
  }, [])

  const addEmailRecipient = useCallback(() => {
    if (emailRecipient && !emailRecipientsList.includes(emailRecipient)) {
      setEmailRecipientsList((prev) => [...prev, emailRecipient])
      setEmailRecipient('')
    }
  }, [emailRecipient, emailRecipientsList])

  const removeEmailRecipient = useCallback((email: string) => {
    setEmailRecipientsList((prev) => prev.filter((e) => e !== email))
  }, [])

  const handleSendEmail = useCallback(async () => {
    const finalRecipients = [...emailRecipientsList]
    if (sendCopyToMe) {
      const userEmail = useAuthStore((s) => s.user?.email)
      if (userEmail && !finalRecipients.includes(userEmail)) {
        finalRecipients.push(userEmail)
      }
    }

    if (finalRecipients.length === 0 || !emailSubject || !orgId) {
      setEmailError('Veuillez remplir tous les champs requis')
      return
    }

    setIsSendingEmail(true)
    setEmailError('')

    try {
      const payload = {
        recipients: finalRecipients,
        subject: emailSubject,
        message: emailMessage,
        reportType: selectedReportType,
        dateFrom: dateFrom,
        dateTo: dateTo,
        vehicleIds: selectedVehicles.length > 0 ? selectedVehicles : undefined,
        format: reportFormat,
      }

      await apiClient.post(`${API_ROUTES.ORGANIZATIONS}/${orgId}/reports/email`, payload)

      setShowEmailDialog(false)
      setEmailRecipientsList([])
      setEmailSubject('')
      setEmailMessage('')
      setSendCopyToMe(false)
    } catch (error) {
      console.error('Failed to send email:', error)
      setEmailError(
        error instanceof Error
          ? error.message
          : 'Erreur lors de l\'envoi de l\'email'
      )
    } finally {
      setIsSendingEmail(false)
    }
  }, [emailRecipientsList, sendCopyToMe, emailSubject, orgId, selectedReportType, dateFrom, dateTo, selectedVehicles, reportFormat])

  const addScheduleEmailRecipient = useCallback(() => {
    if (scheduleEmail && !emailRecipients.includes(scheduleEmail)) {
      setEmailRecipients((prev) => [...prev, scheduleEmail])
      setScheduleEmail('')
    }
  }, [scheduleEmail, emailRecipients])

  const removeScheduleEmailRecipient = useCallback((email: string) => {
    setEmailRecipients((prev) => prev.filter((e) => e !== email))
  }, [])

  const handleScheduleReport = useCallback(async () => {
    if (emailRecipients.length === 0 || !selectedReportType || !orgId) {
      setScheduleError('Veuillez ajouter au moins une adresse e-mail')
      return
    }

    setIsScheduling(true)
    setScheduleError('')

    try {
      // Calculate next run date
      let nextRun = new Date()
      if (scheduleFrequency === 'daily') {
        nextRun = addDays(nextRun, 1)
      } else if (scheduleFrequency === 'weekly') {
        nextRun = addWeeks(nextRun, 1)
      } else if (scheduleFrequency === 'monthly') {
        nextRun = addMonths(nextRun, 1)
      }

      const payload = {
        reportType: selectedReportType,
        frequency: scheduleFrequency,
        recipientEmails: emailRecipients,
        dayOfWeek: scheduleFrequency === 'weekly' ? scheduleDayOfWeek : undefined,
        timeOfDay: scheduleTimeOfDay,
        dateFrom: dateFrom,
        dateTo: dateTo,
        vehicleIds: selectedVehicles.length > 0 ? selectedVehicles : undefined,
        format: reportFormat,
      }

      await apiClient.post(`${API_ROUTES.ORGANIZATIONS}/${orgId}/reports/schedule`, payload)

      // Add to scheduled reports list
      const newScheduledReport: ScheduledReport = {
        id: `scheduled-${Date.now()}`,
        type: selectedReportType,
        frequency: scheduleFrequency,
        nextRun: nextRun,
        isActive: true,
        recipients: emailRecipients,
        dayOfWeek: scheduleFrequency === 'weekly' ? scheduleDayOfWeek : undefined,
        timeOfDay: scheduleTimeOfDay,
      }
      setScheduledReports((prev) => [newScheduledReport, ...prev])

      setShowScheduleForm(false)
      setEmailRecipients([])
      setScheduleEmail('')
      setScheduleTimeOfDay('09:00')
      setScheduleDayOfWeek(1)
    } catch (error) {
      console.error('Failed to schedule report:', error)
      setScheduleError(
        error instanceof Error
          ? error.message
          : 'Erreur lors de la programmation du rapport'
      )
    } finally {
      setIsScheduling(false)
    }
  }, [emailRecipients, selectedReportType, orgId, scheduleFrequency, scheduleDayOfWeek, scheduleTimeOfDay, dateFrom, dateTo, selectedVehicles, reportFormat])

  const handleToggleScheduledReport = useCallback((reportId: string) => {
    setScheduledReports((prev) =>
      prev.map((r) =>
        r.id === reportId ? { ...r, isActive: !r.isActive } : r
      )
    )
  }, [])

  const generateShareLink = useCallback(() => {
    if (!selectedReportType) return
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const shareUrl = `${baseUrl}/reports/share?type=${selectedReportType}&from=${dateFrom}&to=${dateTo}&vehicles=${selectedVehicles.join(',')}`

    // Copy to clipboard
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopiedShareLink(true)
      setTimeout(() => setCopiedShareLink(false), 2000)
    })
  }, [selectedReportType, dateFrom, dateTo, selectedVehicles])

  const reportTypes = Object.entries(REPORT_TYPE_CONFIG).map(([key, config]) => ({
    type: key as ReportType,
    ...config,
  }))

  const dayOfWeekNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

  return (
    <div className="min-h-screen bg-[#F5F7FA] p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Rapports</h1>
        <p className="mt-2 text-gray-500">Générer, programmer et analyser les rapports de flotte</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('generate')}
          className={`px-4 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
            activeTab === 'generate'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          Générer
        </button>
        <button
          onClick={() => setActiveTab('scheduled')}
          className={`px-4 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
            activeTab === 'scheduled'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          Programmés
        </button>
        <button
          onClick={() => setActiveTab('trends')}
          className={`px-4 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
            activeTab === 'trends'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          Tendances
        </button>
        <button
          onClick={() => setActiveTab('comparison')}
          className={`px-4 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
            activeTab === 'comparison'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          Comparaison
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'generate' && (
        <>
          {/* Report Templates Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Modèles de rapports</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ENHANCED_TEMPLATES.map((template) => {
                const Icon = template.icon
                return (
                  <Card
                    key={template.name}
                    className="bg-white border border-gray-200 rounded-xl hover:border-[#E5E7EB] transition-colors cursor-pointer"
                    onClick={() => applyTemplate(template)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base text-gray-900">{template.name}</CardTitle>
                          <CardDescription className="text-xs text-gray-500">{template.description}</CardDescription>
                        </div>
                        <Icon className="text-blue-600 flex-shrink-0" size={20} />
                      </div>
                    </CardHeader>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Report Types Grid */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Créer un rapport personnalisé</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {reportTypes.map((report) => {
                const Icon = report.icon
                return (
                  <Card
                    key={report.type}
                    className="bg-white border border-gray-200 rounded-xl hover:border-[#E5E7EB] transition-colors cursor-pointer"
                    onClick={() => handleOpenDialog(report.type)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg text-gray-900">{report.title}</CardTitle>
                          <CardDescription className="text-sm text-gray-500">{report.description}</CardDescription>
                        </div>
                        <Icon className="text-blue-600 flex-shrink-0" size={24} />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Button
                        variant="outline"
                        className="w-full gap-2 bg-gray-100 border border-gray-200 text-blue-600 hover:bg-gray-50 hover:border-[#E5E7EB] rounded-lg"
                        onClick={() => handleOpenDialog(report.type)}
                      >
                        <Download size={16} />
                        Générer le rapport
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Generated Reports Section */}
          <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-gray-900">Rapports générés</CardTitle>
                <Badge variant="secondary" className="bg-gray-100 text-gray-900 border border-gray-200">{generatedReports.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {generatedReports.length === 0 ? (
                <div className="space-y-3 text-center py-12">
                  <p className="text-gray-500">Aucun rapport généré encore</p>
                  <Button
                    variant="outline"
                    onClick={() => handleOpenDialog('trip')}
                    className="gap-2 bg-gray-100 border border-gray-200 text-blue-600 hover:bg-gray-50 hover:border-[#E5E7EB] rounded-lg"
                  >
                    <Download size={16} />
                    Générer votre premier rapport
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="px-4 py-3 text-left font-semibold text-gray-900">
                          Type de rapport
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-900">
                          Période
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-900">
                          Format
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-900">Statut</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-900">
                          Généré
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
                            className="border-b border-[#F3F4F6] hover:bg-gray-100 transition-colors"
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
                            <td className="px-4 py-3 text-gray-500">
                              {format(report.dateFrom, 'dd MMM, yyyy')} -{' '}
                              {format(report.dateTo, 'dd MMM, yyyy')}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {formatIcon && React.createElement(formatIcon, { size: 16, className: 'text-gray-500' })}
                                <span className="capitalize text-gray-500">{report.format}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {report.status === 'completed' && (
                                <Badge className="bg-blue-600/10 text-blue-600 border border-blue-600/30 flex w-fit gap-1">
                                  <CheckCircle size={14} />
                                  Complété
                                </Badge>
                              )}
                              {report.status === 'pending' && (
                                <Badge className="bg-amber-500/10 text-amber-500 border border-amber-500/30 flex w-fit gap-1">
                                  <Loader2 size={14} className="animate-spin" />
                                  En attente
                                </Badge>
                              )}
                              {report.status === 'failed' && (
                                <Badge className="bg-red-500/10 text-red-500 border border-red-500/30">Échoué</Badge>
                              )}
                            </td>
                            <td className="px-4 py-3 text-gray-500 text-xs">
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
                                className="gap-2 bg-gray-100 border border-gray-200 text-gray-900 hover:bg-gray-50 hover:border-[#E5E7EB] rounded-[6px] disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Download size={14} />
                                Télécharger
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
        </>
      )}

      {activeTab === 'scheduled' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Rapports programmés</h2>
            <Button
              onClick={() => {
                setShowScheduleForm(true)
                setSelectedReportType('fleet')
              }}
              className="gap-2 bg-blue-600 text-white font-bold hover:bg-[#3B82F6] rounded-lg"
            >
              <Plus size={16} />
              Programmer un rapport
            </Button>
          </div>

          {scheduledReports.length === 0 ? (
            <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
              <CardContent className="py-12 text-center">
                <p className="text-gray-500 mb-4">Aucun rapport programmé</p>
                <Button
                  onClick={() => {
                    setShowScheduleForm(true)
                    setSelectedReportType('fleet')
                  }}
                  className="gap-2 bg-blue-600 text-white font-bold hover:bg-[#3B82F6] rounded-lg"
                >
                  <Plus size={16} />
                  Créer la première programmation
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {scheduledReports.map((report) => {
                const reportConfig = REPORT_TYPE_CONFIG[report.type]
                return (
                  <Card key={report.id} className="bg-white border border-gray-200 rounded-xl shadow-sm">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex gap-4 flex-1">
                          <div className="text-blue-600 mt-1">
                            {React.createElement(reportConfig.icon, { size: 24 })}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{reportConfig.title}</h3>
                            <p className="text-sm text-gray-500 mt-1">
                              Fréquence: {report.frequency === 'daily' ? 'Quotidien' : report.frequency === 'weekly' ? 'Hebdomadaire' : 'Mensuel'}
                              {report.frequency === 'weekly' && ` - ${dayOfWeekNames[report.dayOfWeek || 0]}`}
                            </p>
                            <p className="text-sm text-gray-500">
                              Prochain envoi: {format(report.nextRun, 'dd MMM yyyy')} à {report.timeOfDay}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              Destinataires: {report.recipients.join(', ')}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleToggleScheduledReport(report.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            report.isActive
                              ? 'bg-blue-600/10 text-blue-600'
                              : 'bg-red-500/10 text-red-500'
                          }`}
                        >
                          <ToggleLeft size={20} />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'trends' && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Tendances (30 derniers jours)</h2>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Mileage Trend */}
            <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900">Kilométrage moyen quotidien</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="colorMileage" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4361EE" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#4361EE" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="date" stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}
                      labelStyle={{ color: '#1F2937' }}
                    />
                    <Area type="monotone" dataKey="mileage" stroke="#4361EE" fillOpacity={1} fill="url(#colorMileage)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Speed Trend */}
            <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900">Vitesse moyenne (km/h)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="date" stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}
                      labelStyle={{ color: '#1F2937' }}
                    />
                    <Line type="monotone" dataKey="speed" stroke="#F59E0B" dot={false} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Alerts Trend */}
            <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900">Fréquence des alertes</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="colorAlerts" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="date" stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}
                      labelStyle={{ color: '#1F2937' }}
                    />
                    <Area type="monotone" dataKey="alerts" stroke="#EF4444" fillOpacity={1} fill="url(#colorAlerts)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Utilization Trend */}
            <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900">Utilisation flotte (%)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="date" stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}
                      labelStyle={{ color: '#1F2937' }}
                    />
                    <Line type="monotone" dataKey="utilization" stroke="#4361EE" dot={false} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'comparison' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Sélectionner des véhicules à comparer</h2>
            <p className="text-sm text-gray-500 mb-4">Sélectionnez 2 à 4 véhicules pour les comparer côte à côte</p>
            <div className="grid gap-3 max-h-64 overflow-y-auto">
              {vehicles.map((vehicle) => (
                <label
                  key={vehicle.id}
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-gray-100 hover:bg-gray-50 hover:border-[#E5E7EB] cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={comparisonVehicles.includes(vehicle.id)}
                    onChange={() => handleComparisonVehicleToggle(vehicle.id)}
                    className="rounded border-gray-200 accent-[#4361EE]"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{vehicle.name}</p>
                    <p className="text-xs text-gray-500">{vehicle.plate}</p>
                  </div>
                  {comparisonVehicles.includes(vehicle.id) && (
                    <Badge className="bg-blue-600/10 text-blue-600 border border-blue-600/30">
                      Sélectionné
                    </Badge>
                  )}
                </label>
              ))}
            </div>
          </div>

          {comparisonData.length > 0 && (
            <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900">Comparaison véhicules</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="px-4 py-3 text-left font-semibold text-gray-900">Véhicule</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-900">Km</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-900">Trajets</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-900">Alertes</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-900">Vit. moy.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonData.map((item) => (
                        <tr key={item.vehicleId} className="border-b border-[#F3F4F6] hover:bg-gray-100 transition-colors">
                          <td className="px-4 py-3 font-medium text-gray-900">{item.vehicleName}</td>
                          <td className="px-4 py-3 text-gray-500">{item.km.toLocaleString()}</td>
                          <td className="px-4 py-3 text-gray-500">{item.trips}</td>
                          <td className="px-4 py-3">
                            <Badge className={`${
                              item.alerts > 15
                                ? 'bg-red-500/10 text-red-500'
                                : 'bg-blue-600/10 text-blue-600'
                            }`}>
                              {item.alerts}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-gray-500">{item.avgSpeed} km/h</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Report Configuration Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl bg-white border border-gray-200 rounded-xl shadow-sm">
          <DialogHeader>
            <DialogTitle className="text-gray-900">
              {selectedReportType && REPORT_TYPE_CONFIG[selectedReportType].title}
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              Configurez les paramètres du rapport et le format de téléchargement
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Error Alert */}
            {generationError && (
              <div className="flex gap-3 p-4 bg-red-500/10 border border-red-500 rounded-lg">
                <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-500">{generationError}</p>
              </div>
            )}

            {/* Date Range Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-gray-500" />
                <h3 className="font-semibold text-gray-900">Période</h3>
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applyDateRange('today')}
                  className="text-xs bg-gray-100 border border-gray-200 text-gray-900 hover:bg-gray-50 hover:border-[#E5E7EB] rounded-[6px]"
                >
                  Aujourd'hui
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applyDateRange('week')}
                  className="text-xs bg-gray-100 border border-gray-200 text-gray-900 hover:bg-gray-50 hover:border-[#E5E7EB] rounded-[6px]"
                >
                  Cette semaine
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applyDateRange('month')}
                  className="text-xs bg-gray-100 border border-gray-200 text-gray-900 hover:bg-gray-50 hover:border-[#E5E7EB] rounded-[6px]"
                >
                  Ce mois
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applyDateRange('lastMonth')}
                  className="text-xs bg-gray-100 border border-gray-200 text-gray-900 hover:bg-gray-50 hover:border-[#E5E7EB] rounded-[6px]"
                >
                  Mois dernier
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900">De</label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full bg-white border border-gray-200 text-gray-900 rounded-lg focus:border-blue-600 focus:ring-1 focus:ring-blue-600/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900">À</label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full bg-white border border-gray-200 text-gray-900 rounded-lg focus:border-blue-600 focus:ring-1 focus:ring-blue-600/50"
                  />
                </div>
              </div>
            </div>

            {/* Vehicle Selection */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Car size={18} className="text-gray-500" />
                <h3 className="font-semibold text-gray-900">Véhicules (Optionnel)</h3>
              </div>
              <p className="text-sm text-gray-500">
                Laissez vide pour inclure tous les véhicules de votre flotte
              </p>
              <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto">
                {vehicles.map((vehicle) => (
                  <label
                    key={vehicle.id}
                    className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-gray-100 hover:bg-gray-50 hover:border-[#E5E7EB] cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedVehicles.includes(vehicle.id)}
                      onChange={() => handleVehicleToggle(vehicle.id)}
                      className="rounded border-gray-200 accent-[#4361EE]"
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
                <Filter size={18} className="text-gray-500" />
                <h3 className="font-semibold text-gray-900">Format du rapport</h3>
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
                          ? 'border-blue-600 bg-blue-600/10 text-blue-600'
                          : 'border-gray-200 text-gray-500 hover:border-[#E5E7EB] hover:bg-gray-100'
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

          <DialogFooter className="flex-wrap gap-2">
            <Button variant="outline" onClick={handleCloseDialog} disabled={isGenerating} className="bg-gray-100 border border-gray-200 text-gray-900 hover:bg-gray-50 hover:border-[#E5E7EB] rounded-lg">
              Annuler
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowScheduleForm(!showScheduleForm)}
              className="gap-2 bg-gray-100 border border-gray-200 text-gray-900 hover:bg-gray-50 hover:border-[#E5E7EB] rounded-lg"
            >
              <ClockIcon size={16} />
              Programmer
            </Button>
            <Button
              variant="outline"
              onClick={handlePrint}
              className="gap-2 bg-gray-100 border border-gray-200 text-gray-900 hover:bg-gray-50 hover:border-[#E5E7EB] rounded-lg"
            >
              <Printer size={16} />
              Imprimer
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowEmailDialog(true)}
              className="gap-2 bg-gray-100 border border-gray-200 text-gray-900 hover:bg-gray-50 hover:border-[#E5E7EB] rounded-lg"
            >
              <Mail size={16} />
              Email
            </Button>
            <Button
              variant="outline"
              onClick={generateShareLink}
              className="gap-2 bg-gray-100 border border-gray-200 text-gray-900 hover:bg-gray-50 hover:border-[#E5E7EB] rounded-lg"
            >
              <Share2 size={16} />
              {copiedShareLink ? 'Copié!' : 'Partager'}
            </Button>
            <Button
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className="gap-2 bg-blue-600 text-white font-bold hover:bg-[#3B82F6] rounded-lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Génération...
                </>
              ) : (
                <>
                  <Download size={16} />
                  Générer le rapport
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Dialog */}
      {showScheduleForm && (
        <Dialog open={showScheduleForm} onOpenChange={setShowScheduleForm}>
          <DialogContent className="max-w-md bg-white border border-gray-200 rounded-xl shadow-sm">
            <DialogHeader>
              <DialogTitle className="text-gray-900">Programmer la génération du rapport</DialogTitle>
              <DialogDescription className="text-gray-500">
                Configurez la fréquence d'envoi automatique du rapport
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {scheduleError && (
                <div className="flex gap-3 p-3 bg-red-500/10 border border-red-500 rounded-lg">
                  <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-500">{scheduleError}</p>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900">Fréquence</label>
                <select
                  value={scheduleFrequency}
                  onChange={(e) => setScheduleFrequency(e.target.value as ScheduleFrequency)}
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600/50"
                >
                  <option value="daily">Quotidien</option>
                  <option value="weekly">Hebdomadaire</option>
                  <option value="monthly">Mensuel</option>
                </select>
              </div>

              {scheduleFrequency === 'weekly' && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900">Jour de la semaine</label>
                  <select
                    value={scheduleDayOfWeek}
                    onChange={(e) => setScheduleDayOfWeek(Number(e.target.value))}
                    className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600/50"
                  >
                    <option value={0}>Lundi</option>
                    <option value={1}>Mardi</option>
                    <option value={2}>Mercredi</option>
                    <option value={3}>Jeudi</option>
                    <option value={4}>Vendredi</option>
                    <option value={5}>Samedi</option>
                    <option value={6}>Dimanche</option>
                  </select>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900">Heure de l'envoi</label>
                <Input
                  type="time"
                  value={scheduleTimeOfDay}
                  onChange={(e) => setScheduleTimeOfDay(e.target.value)}
                  className="bg-white border border-gray-200 text-gray-900 rounded-lg focus:border-blue-600 focus:ring-1 focus:ring-blue-600/50"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900">Destinataires</label>
                <div className="flex gap-2 mb-2">
                  <Input
                    type="email"
                    value={scheduleEmail}
                    onChange={(e) => setScheduleEmail(e.target.value)}
                    placeholder="email@exemple.com"
                    className="flex-1 bg-white border border-gray-200 text-gray-900 placeholder-[#9CA3AF] rounded-lg focus:border-blue-600 focus:ring-1 focus:ring-blue-600/50"
                  />
                  <Button
                    onClick={addScheduleEmailRecipient}
                    className="bg-blue-600 text-white hover:bg-[#3B82F6] rounded-lg"
                  >
                    <Plus size={16} />
                  </Button>
                </div>
                <div className="space-y-2">
                  {emailRecipients.map((email) => (
                    <div key={email} className="flex items-center justify-between p-2 bg-gray-100 rounded-lg">
                      <span className="text-sm text-gray-900">{email}</span>
                      <button
                        onClick={() => removeScheduleEmailRecipient(email)}
                        className="text-red-500 hover:bg-red-500/10 p-1 rounded"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="sendCopyToMe"
                  checked={sendCopyToMe}
                  onChange={(e) => setSendCopyToMe(e.target.checked)}
                  className="rounded border-gray-200 accent-[#4361EE]"
                />
                <label htmlFor="sendCopyToMe" className="text-sm text-gray-900 cursor-pointer">
                  M'envoyer une copie
                </label>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900">Prochain envoi</label>
                <div className="text-sm text-gray-500 p-2 bg-gray-100 rounded-lg">
                  {scheduleFrequency === 'daily' && 'Demain à ' + scheduleTimeOfDay}
                  {scheduleFrequency === 'weekly' && `${dayOfWeekNames[scheduleDayOfWeek]} prochain à ${scheduleTimeOfDay}`}
                  {scheduleFrequency === 'monthly' && '1er du mois prochain à ' + scheduleTimeOfDay}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowScheduleForm(false)}
                disabled={isScheduling}
                className="bg-gray-100 border border-gray-200 text-gray-900 hover:bg-gray-50 hover:border-[#E5E7EB] rounded-lg"
              >
                Annuler
              </Button>
              <Button
                onClick={handleScheduleReport}
                disabled={isScheduling}
                className="bg-blue-600 text-white font-bold hover:bg-[#3B82F6] rounded-lg"
              >
                {isScheduling ? (
                  <>
                    <Loader2 size={16} className="animate-spin mr-2" />
                    Programmation...
                  </>
                ) : (
                  'Enregistrer'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Email Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="max-w-md bg-white border border-gray-200 rounded-xl shadow-sm">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Envoyer le rapport par email</DialogTitle>
            <DialogDescription className="text-gray-500">
              Configurez les détails de l'email avant d'envoyer
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {emailError && (
              <div className="flex gap-3 p-3 bg-red-500/10 border border-red-500 rounded-lg">
                <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-500">{emailError}</p>
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900">Destinataires</label>
              <div className="flex gap-2 mb-2">
                <Input
                  type="email"
                  value={emailRecipient}
                  onChange={(e) => setEmailRecipient(e.target.value)}
                  placeholder="email@exemple.com"
                  disabled={isSendingEmail}
                  className="flex-1 bg-white border border-gray-200 text-gray-900 placeholder-[#9CA3AF] rounded-lg focus:border-blue-600 focus:ring-1 focus:ring-blue-600/50"
                />
                <Button
                  onClick={addEmailRecipient}
                  className="bg-blue-600 text-white hover:bg-[#3B82F6] rounded-lg"
                >
                  <Plus size={16} />
                </Button>
              </div>
              <div className="space-y-2 max-h-24 overflow-y-auto">
                {emailRecipientsList.map((email) => (
                  <div key={email} className="flex items-center justify-between p-2 bg-gray-100 rounded-lg">
                    <span className="text-sm text-gray-900">{email}</span>
                    <button
                      onClick={() => removeEmailRecipient(email)}
                      className="text-red-500 hover:bg-red-500/10 p-1 rounded"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="sendCopyToMe2"
                checked={sendCopyToMe}
                onChange={(e) => setSendCopyToMe(e.target.checked)}
                className="rounded border-gray-200 accent-[#4361EE]"
              />
              <label htmlFor="sendCopyToMe2" className="text-sm text-gray-900 cursor-pointer">
                M'envoyer une copie
              </label>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900">Objet</label>
              <Input
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder={selectedReportType ? REPORT_TYPE_CONFIG[selectedReportType].title : 'Objet du rapport'}
                disabled={isSendingEmail}
                className="bg-white border border-gray-200 text-gray-900 placeholder-[#9CA3AF] rounded-lg focus:border-blue-600 focus:ring-1 focus:ring-blue-600/50"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900">Message</label>
              <textarea
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                placeholder="Votre message..."
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-[#9CA3AF] resize-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/50"
                rows={3}
                disabled={isSendingEmail}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900">Format</label>
              <div className="flex gap-2">
                {(['pdf', 'excel', 'csv'] as ReportFormat[]).map((format) => {
                  const Icon = FORMAT_ICONS[format]
                  return (
                    <button
                      key={format}
                      onClick={() => setReportFormat(format)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-sm ${
                        reportFormat === format
                          ? 'border-blue-600 bg-blue-600/10 text-blue-600'
                          : 'border-gray-200 text-gray-500 hover:border-[#E5E7EB]'
                      }`}
                    >
                      <Icon size={16} />
                      <span className="capitalize">{format}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEmailDialog(false)}
              disabled={isSendingEmail}
              className="bg-gray-100 border border-gray-200 text-gray-900 hover:bg-gray-50 hover:border-[#E5E7EB] rounded-lg"
            >
              Annuler
            </Button>
            <Button
              onClick={handleSendEmail}
              disabled={isSendingEmail}
              className="bg-blue-600 text-white font-bold hover:bg-[#3B82F6] rounded-lg"
            >
              {isSendingEmail ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" />
                  Envoi...
                </>
              ) : (
                'Envoyer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
        </Dialog>
    </div>
  )
}
