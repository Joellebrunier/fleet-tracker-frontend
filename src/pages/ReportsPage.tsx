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
  Printer,
  Mail,
  Clock as ClockIcon,
  AlertCircle,
} from 'lucide-react'
import { format, subDays, startOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import { formatDateTime } from '@/lib/utils'
import { apiClient } from '@/lib/api'
import { API_ROUTES } from '@/lib/constants'
import { useAuthStore } from '@/stores/authStore'

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

const reportTemplates: ReportTemplate[] = [
  {
    name: 'Rapport hebdomadaire flotte',
    description: 'Rapport hebdomadaire, tous les véhicules, PDF',
    type: 'fleet',
    frequency: 'weekly',
    format: 'pdf',
    icon: BarChart3,
  },
  {
    name: 'Rapport mensuel conducteurs',
    description: 'Rapport mensuel, performance des conducteurs, Excel',
    type: 'driver',
    frequency: 'monthly',
    format: 'excel',
    icon: FileText,
  },
  {
    name: 'Rapport quotidien alertes',
    description: 'Rapport quotidien, résumé des alertes, Email',
    type: 'compliance',
    frequency: 'daily',
    format: 'pdf',
    icon: BarChart3,
  },
]

export default function ReportsPage() {
  const orgId = useAuthStore((s) => s.user?.organizationId) || ''

  // State for report generation dialog
  const [selectedReportType, setSelectedReportType] = useState<ReportType | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
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
  const [isScheduling, setIsScheduling] = useState(false)
  const [scheduleError, setScheduleError] = useState('')

  // Email state
  const [emailRecipient, setEmailRecipient] = useState('')
  const [emailSubject, setEmailSubject] = useState('')
  const [emailMessage, setEmailMessage] = useState('')
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [emailError, setEmailError] = useState('')

  // Error state
  const [generationError, setGenerationError] = useState('')

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
    setGenerationError('')
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

  const handleSendEmail = useCallback(async () => {
    if (!emailRecipient || !emailSubject || !orgId) {
      setEmailError('Veuillez remplir tous les champs requis')
      return
    }

    setIsSendingEmail(true)
    setEmailError('')

    try {
      const payload = {
        recipient: emailRecipient,
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
      setEmailRecipient('')
      setEmailSubject('')
      setEmailMessage('')
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
  }, [emailRecipient, emailSubject, orgId, selectedReportType, dateFrom, dateTo, selectedVehicles, reportFormat])

  const handleScheduleReport = useCallback(async () => {
    if (!scheduleEmail || !selectedReportType || !orgId) {
      setScheduleError('Veuillez remplir tous les champs requis')
      return
    }

    setIsScheduling(true)
    setScheduleError('')

    try {
      const payload = {
        reportType: selectedReportType,
        frequency: scheduleFrequency,
        recipientEmail: scheduleEmail,
        dateFrom: dateFrom,
        dateTo: dateTo,
        vehicleIds: selectedVehicles.length > 0 ? selectedVehicles : undefined,
        format: reportFormat,
      }

      await apiClient.post(`${API_ROUTES.ORGANIZATIONS}/${orgId}/reports/schedule`, payload)

      setShowScheduleForm(false)
      setScheduleEmail('')
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
  }, [scheduleEmail, selectedReportType, orgId, scheduleFrequency, dateFrom, dateTo, selectedVehicles, reportFormat])

  const reportTypes = Object.entries(REPORT_TYPE_CONFIG).map(([key, config]) => ({
    type: key as ReportType,
    ...config,
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Rapports</h1>
        <p className="mt-2 text-gray-600">Générer et télécharger les rapports de flotte</p>
      </div>

      {/* Report Templates Section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Modèles de rapports</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {reportTemplates.map((template) => {
            const Icon = template.icon
            return (
              <Card
                key={template.name}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => applyTemplate(template)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <CardDescription className="text-xs">{template.description}</CardDescription>
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
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleOpenDialog(report.type)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{report.title}</CardTitle>
                    <CardDescription className="text-sm">{report.description}</CardDescription>
                  </div>
                  <Icon className="text-blue-600 flex-shrink-0" size={24} />
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full gap-2"
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

      {/* Report Configuration Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedReportType && REPORT_TYPE_CONFIG[selectedReportType].title}
            </DialogTitle>
            <DialogDescription>
              Configurez les paramètres du rapport et le format de téléchargement
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Error Alert */}
            {generationError && (
              <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle size={18} className="text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-700">{generationError}</p>
              </div>
            )}

            {/* Date Range Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-gray-600" />
                <h3 className="font-semibold text-gray-900">Période</h3>
              </div>

              {/* Quick select buttons */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applyDateRange('today')}
                  className="text-xs"
                >
                  Aujourd'hui
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applyDateRange('week')}
                  className="text-xs"
                >
                  Cette semaine
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applyDateRange('month')}
                  className="text-xs"
                >
                  Ce mois
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applyDateRange('lastMonth')}
                  className="text-xs"
                >
                  Mois dernier
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">De</label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">À</label>
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
                <h3 className="font-semibold text-gray-900">Véhicules (Optionnel)</h3>
              </div>
              <p className="text-sm text-gray-600">
                Laissez vide pour inclure tous les véhicules de votre flotte
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
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
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

          <DialogFooter className="flex-wrap gap-2">
            <Button variant="outline" onClick={handleCloseDialog} disabled={isGenerating}>
              Annuler
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowScheduleForm(!showScheduleForm)}
              className="gap-2"
            >
              <ClockIcon size={16} />
              Programmer
            </Button>
            <Button
              variant="outline"
              onClick={handlePrint}
              className="gap-2"
            >
              <Printer size={16} />
              Imprimer
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowEmailDialog(true)}
              className="gap-2"
            >
              <Mail size={16} />
              Email
            </Button>
            <Button
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className="gap-2"
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
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Programmer la génération du rapport</DialogTitle>
              <DialogDescription>
                Configurez la fréquence d'envoi automatique du rapport
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {scheduleError && (
                <div className="flex gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{scheduleError}</p>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Fréquence</label>
                <select
                  value={scheduleFrequency}
                  onChange={(e) => setScheduleFrequency(e.target.value as ScheduleFrequency)}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="daily">Quotidien</option>
                  <option value="weekly">Hebdomadaire</option>
                  <option value="monthly">Mensuel</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Email de livraison *</label>
                <Input
                  type="email"
                  value={scheduleEmail}
                  onChange={(e) => setScheduleEmail(e.target.value)}
                  placeholder="votre.email@exemple.com"
                  disabled={isScheduling}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Prochain envoi</label>
                <div className="text-sm text-gray-600">
                  {scheduleFrequency === 'daily' && 'Demain à 08:00'}
                  {scheduleFrequency === 'weekly' && 'Lundi prochain à 09:00'}
                  {scheduleFrequency === 'monthly' && '1er du mois prochain à 09:00'}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowScheduleForm(false)}
                disabled={isScheduling}
              >
                Annuler
              </Button>
              <Button
                onClick={handleScheduleReport}
                disabled={isScheduling}
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Envoyer le rapport par email</DialogTitle>
            <DialogDescription>
              Configurez les détails de l'email avant d'envoyer
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {emailError && (
              <div className="flex gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{emailError}</p>
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Destinataire *</label>
              <Input
                type="email"
                value={emailRecipient}
                onChange={(e) => setEmailRecipient(e.target.value)}
                placeholder="destinataire@exemple.com"
                disabled={isSendingEmail}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Objet *</label>
              <Input
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder={selectedReportType ? REPORT_TYPE_CONFIG[selectedReportType].title : 'Objet du rapport'}
                disabled={isSendingEmail}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Message</label>
              <textarea
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                placeholder="Votre message..."
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm resize-none"
                rows={3}
                disabled={isSendingEmail}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEmailDialog(false)}
              disabled={isSendingEmail}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSendEmail}
              disabled={isSendingEmail}
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

      {/* Generated Reports Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Rapports générés</CardTitle>
            <Badge variant="secondary">{generatedReports.length}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {generatedReports.length === 0 ? (
            <div className="space-y-3 text-center py-12">
              <p className="text-gray-500">Aucun rapport généré encore</p>
              <Button
                variant="outline"
                onClick={() => handleOpenDialog('trip')}
                className="gap-2"
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
                          {format(report.dateFrom, 'dd MMM, yyyy')} -{' '}
                          {format(report.dateTo, 'dd MMM, yyyy')}
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
                              Complété
                            </Badge>
                          )}
                          {report.status === 'pending' && (
                            <Badge className="bg-yellow-100 text-yellow-800 flex w-fit gap-1">
                              <Loader2 size={14} className="animate-spin" />
                              En attente
                            </Badge>
                          )}
                          {report.status === 'failed' && (
                            <Badge className="bg-red-100 text-red-800">Échoué</Badge>
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
    </div>
  )
}
