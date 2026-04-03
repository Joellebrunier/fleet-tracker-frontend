import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVehicles, useCreateVehicle, useUpdateVehicle, useDeleteVehicle, useVehicleGroups } from '@/hooks/useVehicles'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Search, Plus, Download, Trash2, Edit2, FileDown, LayoutGrid, List, Clock, Zap, Upload, ChevronDown, AlertCircle, Image as ImageIcon } from 'lucide-react'
import { VehicleStatus } from '@/types/vehicle'
import { formatSpeed, formatTimeAgo } from '@/lib/utils'
import type { Vehicle } from '@/types/vehicle'
import { useAuthStore } from '@/stores/authStore'
import { apiClient } from '@/lib/api'

interface ImportPreviewData {
  [key: string]: string | number
}

export default function VehiclesPage() {
  const navigate = useNavigate()
  const organizationId = useAuthStore((s) => s.user?.organizationId) || ''
  const [activeTab, setActiveTab] = useState<'vehicles' | 'groups'>('vehicles')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSource, setSelectedSource] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [selectedType, setSelectedType] = useState<string>('')
  const [selectedGroup, setSelectedGroup] = useState<string>('')
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showScheduledExports, setShowScheduledExports] = useState(false)
  const [scheduledExports, setScheduledExports] = useState<Array<{ id: string; name: string; format: string; frequency: string; nextRun: string }>>([])
  const [newScheduledExport, setNewScheduledExport] = useState({ name: '', format: 'csv', frequency: 'daily' })

  // Import CSV/XLSX state
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importPreviewData, setImportPreviewData] = useState<ImportPreviewData[]>([])
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({
    Nom: '',
    Plaque: '',
    VIN: '',
    Type: '',
    Marque: '',
    Modèle: '',
  })
  const [importErrors, setImportErrors] = useState<string[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Bulk operations state
  const [selectAllChecked, setSelectAllChecked] = useState(false)
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false)
  const [bulkChangeGroupId, setBulkChangeGroupId] = useState('')
  const [showBulkChangeGroup, setShowBulkChangeGroup] = useState(false)

  // Modal and form state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    plate: '',
    vin: '',
    type: 'voiture',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    notes: '',
    driverId: '',
  })

  const { data: vehiclesData, isLoading } = useVehicles({
    page,
    limit: 20,
    status: selectedStatus as any,
    search: searchTerm,
    type: selectedType || undefined,
    source: selectedSource || undefined,
  } as any)

  const { data: groupsData, isLoading: groupsLoading } = useVehicleGroups()

  // Mutation hooks
  const createVehicle = useCreateVehicle()
  const updateVehicleMutation = useUpdateVehicle(editingVehicle?.id || '')
  const deleteVehicleMutation = useDeleteVehicle(deleteConfirmId || '')

  const allVehicles: Vehicle[] = vehiclesData?.data || []
  const groups = groupsData || []

  // Client-side filtering for type and source (backend may not support these params)
  const vehicles = allVehicles.filter((v) => {
    if (selectedType && v.type !== selectedType) return false
    if (selectedSource) {
      const source = ((v.metadata as any)?.source || '').toLowerCase()
      if (source !== selectedSource.toLowerCase()) return false
    }
    if (selectedGroup && (v.metadata as any)?.groupId !== selectedGroup) return false
    return true
  })
  const totalPages = vehiclesData?.totalPages || 1

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case VehicleStatus.ACTIVE:
        return 'default'
      case VehicleStatus.OFFLINE:
        return 'destructive'
      case VehicleStatus.IDLE:
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const toggleSelectVehicle = (vehicleId: string) => {
    const newSelection = new Set(selectedIds)
    if (newSelection.has(vehicleId)) {
      newSelection.delete(vehicleId)
    } else {
      newSelection.add(vehicleId)
    }
    setSelectedIds(newSelection)
  }

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(vehicles.map(v => v.id))
      setSelectedIds(allIds)
      setSelectAllChecked(true)
    } else {
      setSelectedIds(new Set())
      setSelectAllChecked(false)
    }
  }

  // CSV/XLSX Import functions
  const parseCSVData = (text: string): ImportPreviewData[] => {
    const lines = text.split('\n').filter(line => line.trim())
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    const rows: ImportPreviewData[] = []

    for (let i = 1; i < Math.min(lines.length, 6); i++) {
      const values = lines[i].split(',').map(v => v.trim())
      const row: ImportPreviewData = {}
      headers.forEach((header, idx) => {
        row[header] = values[idx] || ''
      })
      rows.push(row)
    }

    return rows
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImportFile(file)
    setImportErrors([])
    setColumnMapping({
      Nom: '',
      Plaque: '',
      VIN: '',
      Type: '',
      Marque: '',
      Modèle: '',
    })

    const text = await file.text()
    const data = parseCSVData(text)
    setImportPreviewData(data)

    // Auto-detect column headers
    const headers = Object.keys(data[0] || {})
    const mapping: Record<string, string> = { ...columnMapping }

    headers.forEach(header => {
      const lowerHeader = header.toLowerCase()
      if (lowerHeader.includes('nom') || lowerHeader.includes('name')) mapping['Nom'] = header
      else if (lowerHeader.includes('plaque') || lowerHeader.includes('plate') || lowerHeader.includes('immat')) mapping['Plaque'] = header
      else if (lowerHeader.includes('vin')) mapping['VIN'] = header
      else if (lowerHeader.includes('type') || lowerHeader.includes('catégorie')) mapping['Type'] = header
      else if (lowerHeader.includes('marque') || lowerHeader.includes('brand') || lowerHeader.includes('manufacturer')) mapping['Marque'] = header
      else if (lowerHeader.includes('modèle') || lowerHeader.includes('model')) mapping['Modèle'] = header
    })

    setColumnMapping(mapping)
  }

  const validateImportData = (): boolean => {
    const errors: string[] = []

    // Check required mappings
    if (!columnMapping.Nom) errors.push('Colonne "Nom" non mappée')
    if (!columnMapping.Plaque) errors.push('Colonne "Plaque" non mappée')

    // Check for duplicate plates
    const plates = importPreviewData.map(row => row[columnMapping.Plaque])
    const duplicates = plates.filter((plate, idx) => plates.indexOf(plate) !== idx)
    if (duplicates.length > 0) {
      errors.push(`Plaques dupliquées détectées: ${duplicates.join(', ')}`)
    }

    // Check existing plates in database
    const existingPlates = vehicles.map(v => v.plate)
    const conflictingPlates = plates.filter(p => existingPlates.includes(String(p)))
    if (conflictingPlates.length > 0) {
      errors.push(`Plaques déjà existantes: ${conflictingPlates.join(', ')}`)
    }

    setImportErrors(errors)
    return errors.length === 0
  }

  const handleImportVehicles = async () => {
    if (!validateImportData()) return

    setIsImporting(true)
    setImportProgress(0)

    try {
      const vehiclesToImport = importPreviewData.map((row) => ({
        name: String(row[columnMapping.Nom]),
        registrationNumber: String(row[columnMapping.Plaque]),
        vin: columnMapping.VIN ? String(row[columnMapping.VIN]) : '',
        type: columnMapping.Type ? String(row[columnMapping.Type]).toLowerCase() : 'voiture',
        manufacturer: columnMapping.Marque ? String(row[columnMapping.Marque]) : '',
        model: columnMapping.Modèle ? String(row[columnMapping.Modèle]) : '',
        features: { hasGPS: true, hasFuelSensor: false, hasTemperatureSensor: false, hasCrashSensor: false },
      }))

      // Simulate batch import with progress
      for (let i = 0; i < vehiclesToImport.length; i++) {
        await apiClient.post(
          `/api/organizations/${organizationId}/vehicles`,
          vehiclesToImport[i]
        )
        setImportProgress(Math.round(((i + 1) / vehiclesToImport.length) * 100))
      }

      // Refresh vehicles list
      setIsImportDialogOpen(false)
      setImportFile(null)
      setImportPreviewData([])
      setImportProgress(0)
    } catch (error) {
      setImportErrors(['Erreur lors de l\'import des véhicules'])
    } finally {
      setIsImporting(false)
    }
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Supprimer ${selectedIds.size} véhicules ? Cette action est irréversible.`)) return

    try {
      for (const vehicleId of selectedIds) {
        await apiClient.delete(`/api/organizations/${organizationId}/vehicles/${vehicleId}`)
      }
      setSelectedIds(new Set())
      setSelectAllChecked(false)
      setShowBulkDeleteConfirm(false)
    } catch (error) {
      console.error('Erreur lors de la suppression groupée:', error)
    }
  }

  const handleBulkChangeGroup = async () => {
    if (!bulkChangeGroupId || selectedIds.size === 0) return

    try {
      for (const vehicleId of selectedIds) {
        const vehicle = vehicles.find(v => v.id === vehicleId)
        if (vehicle) {
          await updateVehicleMutation.mutateAsync({
            name: vehicle.name,
            vin: vehicle.vin || '',
            registrationNumber: vehicle.plate,
            type: vehicle.type || '',
            manufacturer: vehicle.brand || undefined,
            model: vehicle.model || undefined,
            year: vehicle.year || undefined,
            color: vehicle.metadata?.color,
            groupId: bulkChangeGroupId,
            features: vehicle.features || {
              hasGPS: false,
              hasFuelSensor: false,
              hasTemperatureSensor: false,
              hasCrashSensor: false,
            },
          })
        }
      }
      setSelectedIds(new Set())
      setSelectAllChecked(false)
      setShowBulkChangeGroup(false)
      setBulkChangeGroupId('')
    } catch (error) {
      console.error('Erreur lors du changement de groupe:', error)
    }
  }

  const exportToCSV = () => {
    const headers = ['Nom', 'Plaque', 'Type', 'VIN', 'Statut', 'Vitesse', 'Dernière comm']
    const rows = vehicles.map(v => [
      v.name,
      v.plate,
      v.type || '-',
      v.vin || '-',
      v.status,
      formatSpeed(v.currentSpeed),
      formatTimeAgo(v.lastCommunication)
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `vehicles_${new Date().toISOString().split('T')[0]}.csv`)
    link.click()
    URL.revokeObjectURL(url)
  }

  const exportConducteursCSV = async () => {
    try {
      const response = await apiClient.get(`/api/organizations/${organizationId}/conducteurs`, {
        responseType: 'blob'
      })
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `conducteurs_${new Date().toISOString().split('T')[0]}.csv`)
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Erreur lors de l\'export des conducteurs:', error)
    }
  }

  const generateKMLData = (vehiclesToExport: Vehicle[]): string => {
    let kml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    kml += '<kml xmlns="http://www.opengis.net/kml/2.2">\n'
    kml += '  <Document>\n'
    kml += '    <name>Export Véhicules</name>\n'
    kml += '    <description>Positions des véhicules</description>\n'

    vehiclesToExport.forEach(v => {
      if (v.currentLat && v.currentLng) {
        kml += '    <Placemark>\n'
        kml += `      <name>${v.name}</name>\n`
        kml += `      <description>Plaque: ${v.plate || 'N/A'}\nType: ${v.type || 'N/A'}\nStatut: ${v.status || 'N/A'}\nVitesse: ${formatSpeed(v.currentSpeed)}</description>\n`
        kml += '      <Point>\n'
        kml += `        <coordinates>${v.currentLng},${v.currentLat},0</coordinates>\n`
        kml += '      </Point>\n'
        kml += '    </Placemark>\n'
      }
    })

    kml += '  </Document>\n'
    kml += '</kml>'
    return kml
  }

  const generateGPXData = (vehiclesToExport: Vehicle[]): string => {
    let gpx = '<?xml version="1.0" encoding="UTF-8"?>\n'
    gpx += '<gpx version="1.1" xmlns="http://www.topografix.com/GPX/1/1">\n'
    gpx += '  <metadata>\n'
    gpx += '    <name>Export Véhicules</name>\n'
    gpx += `    <time>${new Date().toISOString()}</time>\n`
    gpx += '  </metadata>\n'

    vehiclesToExport.forEach(v => {
      if (v.currentLat && v.currentLng) {
        gpx += '  <wpt lat="' + v.currentLat + '" lon="' + v.currentLng + '">\n'
        gpx += `    <name>${v.name}</name>\n`
        gpx += `    <desc>Plaque: ${v.plate || 'N/A'}</desc>\n`
        gpx += '  </wpt>\n'
      }
    })

    gpx += '</gpx>'
    return gpx
  }

  const exportToFormat = (format: string, vehiclesToExport: Vehicle[] = vehicles) => {
    if (vehiclesToExport.length === 0) return

    const timestamp = new Date().toISOString().split('T')[0]
    let blob: Blob
    let filename: string

    switch (format) {
      case 'kml':
        blob = new Blob([generateKMLData(vehiclesToExport)], { type: 'application/vnd.google-earth.kml+xml' })
        filename = `vehicles_${timestamp}.kml`
        break
      case 'gpx':
        blob = new Blob([generateGPXData(vehiclesToExport)], { type: 'application/gpx+xml' })
        filename = `vehicles_${timestamp}.gpx`
        break
      case 'xlsx':
        const headers = ['Nom', 'Plaque', 'Type', 'VIN', 'Statut', 'Vitesse', 'Dernière comm']
        const rows = vehiclesToExport.map(v => [
          v.name, v.plate, v.type || '-', v.vin || '-', v.status,
          formatSpeed(v.currentSpeed), formatTimeAgo(v.lastCommunication)
        ])
        const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n')
        blob = new Blob([csvContent], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        filename = `vehicles_${timestamp}.xlsx`
        break
      default:
        return
    }

    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.click()
    URL.revokeObjectURL(url)
  }

  const exportSelected = () => {
    const selectedVehicles = vehicles.filter(v => selectedIds.has(v.id))
    exportToFormat('csv', selectedVehicles)
    setSelectedIds(new Set())
  }

  const saveScheduledExport = () => {
    if (!newScheduledExport.name) return
    const id = Math.random().toString(36).substring(7)
    const nextRun = new Date()
    if (newScheduledExport.frequency === 'daily') nextRun.setDate(nextRun.getDate() + 1)
    else if (newScheduledExport.frequency === 'weekly') nextRun.setDate(nextRun.getDate() + 7)
    else if (newScheduledExport.frequency === 'monthly') nextRun.setMonth(nextRun.getMonth() + 1)

    const export_ = {
      id,
      name: newScheduledExport.name,
      format: newScheduledExport.format,
      frequency: newScheduledExport.frequency,
      nextRun: nextRun.toISOString().split('T')[0]
    }

    const updated = [...scheduledExports, export_]
    setScheduledExports(updated)
    localStorage.setItem('scheduledExports', JSON.stringify(updated))
    setNewScheduledExport({ name: '', format: 'csv', frequency: 'daily' })
  }

  const deleteScheduledExport = (id: string) => {
    const updated = scheduledExports.filter(e => e.id !== id)
    setScheduledExports(updated)
    localStorage.setItem('scheduledExports', JSON.stringify(updated))
  }

  const openCreateModal = () => {
    setEditingVehicle(null)
    setFormData({ name: '', plate: '', vin: '', type: 'voiture', brand: '', model: '', year: new Date().getFullYear(), notes: '', driverId: '' })
    setIsModalOpen(true)
  }

  const openEditModal = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle)
    setFormData({
      name: vehicle.name || '',
      plate: vehicle.plate || '',
      vin: vehicle.vin || '',
      type: vehicle.type || 'car',
      brand: vehicle.brand || '',
      model: vehicle.model || '',
      year: vehicle.year || new Date().getFullYear(),
      notes: (vehicle.metadata as any)?.notes || '',
      driverId: (vehicle as any).driverId || '',
    })
    setIsModalOpen(true)
  }

  const handleSubmitVehicle = async () => {
    if (!formData.name || !formData.plate) return
    const payload: any = {
      name: formData.name,
      registrationNumber: formData.plate,
      vin: formData.vin,
      type: formData.type,
      manufacturer: formData.brand,
      model: formData.model,
      year: formData.year || undefined,
      driverId: formData.driverId || undefined,
      features: { hasGPS: true, hasFuelSensor: false, hasTemperatureSensor: false, hasCrashSensor: false },
    }
    if (editingVehicle) {
      await updateVehicleMutation.mutateAsync(payload)
    } else {
      await createVehicle.mutateAsync(payload)
    }
    setIsModalOpen(false)
    setEditingVehicle(null)
  }

  const handleDeleteVehicle = async () => {
    if (!deleteConfirmId) return
    await deleteVehicleMutation.mutateAsync()
    setDeleteConfirmId(null)
    setSelectedIds(prev => { const n = new Set(prev); n.delete(deleteConfirmId); return n })
  }

  return (
    <div className="space-y-6 bg-[#0A0A0F] min-h-screen p-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#F0F0F5] font-syne">Catalogue Véhicules</h1>
          <p className="text-sm text-[#6B6B80] mt-1">Gestion de la flotte Matériel Tech+</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#1F1F2E]">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab('vehicles')}
            className={`py-3 px-1 border-b-2 font-semibold text-sm transition-colors ${
              activeTab === 'vehicles'
                ? 'border-[#00E5CC] text-[#00E5CC]'
                : 'border-transparent text-[#6B6B80] hover:text-[#F0F0F5]'
            }`}
          >
            VÉHICULES ({vehicles.length})
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={`py-3 px-1 border-b-2 font-semibold text-sm transition-colors ${
              activeTab === 'groups'
                ? 'border-[#00E5CC] text-[#00E5CC]'
                : 'border-transparent text-[#6B6B80] hover:text-[#F0F0F5]'
            }`}
          >
            GROUPES ({groups.length})
          </button>
        </div>
      </div>

      {/* Top Toolbar */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-2 text-[#F0F0F5] bg-[#1A1A25] border-[#1F1F2E] hover:bg-[#1E1E2A]"
          onClick={() => setIsImportDialogOpen(true)}
        >
          <Upload size={16} />
          IMPORTER
        </Button>

        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-[#F0F0F5] bg-[#1A1A25] border-[#1F1F2E] hover:bg-[#1E1E2A]"
            onClick={() => setShowExportMenu(!showExportMenu)}
          >
            <FileDown size={16} />
            EXPORTER
          </Button>
          {showExportMenu && (
            <div className="absolute top-10 left-0 bg-[#12121A] border border-[#1F1F2E] rounded-[8px] shadow-lg z-50 w-48">
              <button onClick={() => { exportToCSV(); setShowExportMenu(false) }} className="w-full text-left px-4 py-2 text-sm text-[#F0F0F5] hover:bg-[#1A1A25] border-b border-[#1F1F2E]">
                CSV (Tous)
              </button>
              <button onClick={() => { exportToFormat('xlsx'); setShowExportMenu(false) }} className="w-full text-left px-4 py-2 text-sm text-[#F0F0F5] hover:bg-[#1A1A25] border-b border-[#1F1F2E]">
                Excel XLSX
              </button>
              <button onClick={() => { exportToFormat('kml'); setShowExportMenu(false) }} className="w-full text-left px-4 py-2 text-sm text-[#F0F0F5] hover:bg-[#1A1A25] border-b border-[#1F1F2E]">
                Google Earth (KML)
              </button>
              <button onClick={() => { exportToFormat('gpx'); setShowExportMenu(false) }} className="w-full text-left px-4 py-2 text-sm text-[#F0F0F5] hover:bg-[#1A1A25]">
                GPS Format (GPX)
              </button>
            </div>
          )}
        </div>

        <Button variant="outline" size="sm" className="gap-2 text-[#F0F0F5] bg-[#1A1A25] border-[#1F1F2E] hover:bg-[#1E1E2A]" onClick={exportConducteursCSV}>
          <FileDown size={16} />
          CONDUCTEURS CSV
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 text-[#F0F0F5] bg-[#1A1A25] border-[#1F1F2E] hover:bg-[#1E1E2A]"
          onClick={() => setShowScheduledExports(!showScheduledExports)}
        >
          <Clock size={16} />
          EXPORTS PROGRAMMÉS
        </Button>
        <Button variant="outline" size="sm" className="gap-2 text-[#F0F0F5] bg-[#1A1A25] border-[#1F1F2E] hover:bg-[#1E1E2A]">
          RÔLES
        </Button>
        <Button variant="outline" size="sm" className="gap-2 text-[#F0F0F5] bg-[#1A1A25] border-[#1F1F2E] hover:bg-[#1E1E2A]">
          AUDIT
        </Button>
        <Button variant="outline" size="sm" className="gap-2 text-[#F0F0F5] bg-[#1A1A25] border-[#1F1F2E] hover:bg-[#1E1E2A]">
          ATTRIBUTION
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-[#44445A]" size={18} />
            <Input
              type="search"
              placeholder="Rechercher par nom ou immatriculation..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setPage(1)
              }}
              className="pl-10 bg-[#12121A] border-[#1F1F2E] text-[#F0F0F5] placeholder:text-[#44445A] focus:border-[#00E5CC]"
            />
          </div>
        </div>
        <select
          value={selectedType}
          onChange={(e) => {
            setSelectedType(e.target.value)
            setPage(1)
          }}
          className="rounded-[12px] border border-[#1F1F2E] bg-[#12121A] px-4 py-2 text-sm font-medium text-[#F0F0F5] hover:bg-[#1A1A25]"
        >
          <option value="">Tous types</option>
          <option value="voiture">Voiture</option>
          <option value="camion">Camion</option>
          <option value="utilitaire">Véhicule utilitaire</option>
          <option value="engin">Engin de chantier</option>
          <option value="moto">Moto</option>
          <option value="bateau">Bateau</option>
          <option value="divers">Divers</option>
        </select>
        <select
          value={selectedGroup}
          onChange={(e) => {
            setSelectedGroup(e.target.value)
            setPage(1)
          }}
          className="rounded-[12px] border border-[#1F1F2E] bg-[#12121A] px-4 py-2 text-sm font-medium text-[#F0F0F5] hover:bg-[#1A1A25]"
        >
          <option value="">Filtrer par groupe</option>
          {groups.map(group => (
            <option key={group.id} value={group.id}>{group.name}</option>
          ))}
        </select>
        <select
          value={selectedSource}
          onChange={(e) => {
            setSelectedSource(e.target.value)
            setPage(1)
          }}
          className="rounded-[12px] border border-[#1F1F2E] bg-[#12121A] px-4 py-2 text-sm font-medium text-[#F0F0F5] hover:bg-[#1A1A25]"
        >
          <option value="">Toutes sources</option>
          <option value="echoes">ECHOES</option>
          <option value="ubiwan">UBIWAN</option>
          <option value="keeptrace">KEEPTRACE</option>
        </select>
        <select
          value={selectedStatus}
          onChange={(e) => {
            setSelectedStatus(e.target.value)
            setPage(1)
          }}
          className="rounded-[12px] border border-[#1F1F2E] bg-[#12121A] px-4 py-2 text-sm font-medium text-[#F0F0F5] hover:bg-[#1A1A25]"
        >
          <option value="">Tous statuts</option>
          <option value="active">ACTIF</option>
          <option value="offline">HORS LIGNE</option>
        </select>
        <div className="text-sm font-medium text-[#F0F0F5]">
          {vehicles.length} résultat{vehicles.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Add Tracker Button and View Toggle */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            className="gap-2 bg-[#1A1A25] border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#1E1E2A]"
            onClick={() => setViewMode('list')}
          >
            <List size={16} />
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            className="gap-2 bg-[#1A1A25] border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#1E1E2A]"
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid size={16} />
          </Button>
        </div>
        <Button className="gap-2 bg-[#00E5CC] hover:bg-[#00CCA6] text-[#0A0A0F] font-semibold" onClick={openCreateModal}>
          <Plus size={18} />
          AJOUTER UN TRACEUR
        </Button>
      </div>

      {/* Content */}
      {activeTab === 'vehicles' && (
        <>
          {isLoading ? (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-2'}>
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className={`${viewMode === 'grid' ? 'h-48' : 'h-12'} bg-[#12121A]`} />
              ))}
            </div>
          ) : vehicles.length === 0 ? (
            <Card className="bg-[#12121A] border-[#1F1F2E] text-center">
              <CardContent className="pt-12">
                <p className="text-[#F0F0F5]">Aucun véhicule trouvé</p>
              </CardContent>
            </Card>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vehicles.map((vehicle) => (
                <Card key={vehicle.id} className="bg-[#12121A] border-[#1F1F2E] hover:border-[#2A2A3D] transition-all">
                  {/* Vehicle Photo Thumbnail */}
                  <div className="h-32 bg-[#0A0A0F] border-b border-[#1F1F2E] flex items-center justify-center overflow-hidden relative group">
                    {(vehicle.metadata as any)?.photoUrl ? (
                      <img
                        src={(vehicle.metadata as any).photoUrl}
                        alt={vehicle.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform cursor-pointer"
                        onClick={() => window.open((vehicle.metadata as any).photoUrl, '_blank')}
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-[#44445A]">
                        <ImageIcon size={32} />
                        <span className="text-xs">Pas de photo</span>
                      </div>
                    )}
                  </div>

                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle
                          className="text-[#F0F0F5] cursor-pointer hover:text-[#00E5CC] transition-colors font-syne"
                          onClick={() => navigate(`/vehicles/${vehicle.id}`)}
                        >
                          {vehicle.name}
                        </CardTitle>
                        <p className="text-sm text-[#6B6B80] mt-1">{vehicle.plate || 'N/A'}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(vehicle.id)}
                        onChange={() => toggleSelectVehicle(vehicle.id)}
                        className="rounded"
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-[#6B6B80]">Type</p>
                        <p className="font-medium text-[#F0F0F5] font-mono">
                          {vehicle.type === 'voiture' && 'Voiture'}
                          {vehicle.type === 'camion' && 'Camion'}
                          {vehicle.type === 'utilitaire' && 'Utilitaire'}
                          {vehicle.type === 'engin' && 'Engin'}
                          {vehicle.type === 'moto' && 'Moto'}
                          {vehicle.type === 'bateau' && 'Bateau'}
                          {vehicle.type === 'divers' && 'Divers'}
                          {!['voiture', 'camion', 'utilitaire', 'engin', 'moto', 'bateau', 'divers'].includes(vehicle.type || '') && (vehicle.type || 'N/A')}
                        </p>
                      </div>
                      <div>
                        <p className="text-[#6B6B80]">VIN</p>
                        <p className="font-medium text-[#F0F0F5] truncate font-mono">
                          {vehicle.vin ? vehicle.vin.substring(0, 8) : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Badge variant={vehicle.status === 'active' ? 'default' : 'destructive'} className={vehicle.status === 'active' ? 'bg-[#00E5CC] bg-opacity-20 text-[#00E5CC]' : 'bg-[#FF4D6A] bg-opacity-20 text-[#FF4D6A]'}>
                        {vehicle.status === 'active' ? 'ACTIF' : 'HORS LIGNE'}
                      </Badge>
                      <span className="text-xs text-[#44445A]">{(vehicle.metadata as any)?.source || 'ECHOES'}</span>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-2 bg-[#1A1A25] border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#1E1E2A]"
                        onClick={() => openEditModal(vehicle)}
                      >
                        <Edit2 size={14} />
                        Éditer
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-[#FF4D6A] hover:text-[#FF4D6A] hover:bg-[#FF4D6A] hover:bg-opacity-10 bg-[#1A1A25] border-[#1F1F2E]"
                        onClick={() => setDeleteConfirmId(vehicle.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-[#12121A] border-[#1F1F2E]">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#1F1F2E] bg-[#0A0A0F]">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-[#F0F0F5] w-12">
                        <input
                          type="checkbox"
                          checked={selectAllChecked && vehicles.length > 0}
                          onChange={(e) => toggleSelectAll(e.target.checked)}
                          className="rounded"
                          title="Sélectionner tous"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-[#F0F0F5]">NOM</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-[#F0F0F5]">VIN</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-[#F0F0F5]">PLAQUE</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-[#F0F0F5]">CATÉGORIE</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-[#F0F0F5]">ÉTAT</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-[#F0F0F5]">DISPONIBILITÉ</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-[#F0F0F5]">SOURCE</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-[#F0F0F5]">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1F1F2E]">
                    {vehicles.map((vehicle) => (
                      <tr
                        key={vehicle.id}
                        className="hover:bg-[#1A1A25] transition-colors"
                      >
                        <td className="px-4 py-4 text-sm font-medium text-[#F0F0F5] w-12">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(vehicle.id)}
                            onChange={() => toggleSelectVehicle(vehicle.id)}
                            className="rounded"
                          />
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-[#F0F0F5]">
                          <button
                            onClick={() => navigate(`/vehicles/${vehicle.id}`)}
                            className="hover:text-[#00E5CC] hover:underline transition-colors"
                          >
                            {vehicle.name}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-sm text-[#F0F0F5] font-mono">
                          {vehicle.vin ? (vehicle.vin.length > 8 ? vehicle.vin.substring(0, 8) + '...' : vehicle.vin) : '—'}
                        </td>
                        <td className="px-6 py-4 text-sm text-[#F0F0F5] font-mono">
                          {vehicle.plate || '—'}
                        </td>
                        <td className="px-6 py-4 text-sm text-[#F0F0F5] capitalize">
                          {vehicle.type ? (
                            <>
                              {vehicle.type === 'voiture' && 'Voiture'}
                              {vehicle.type === 'camion' && 'Camion'}
                              {vehicle.type === 'utilitaire' && 'Véhicule utilitaire'}
                              {vehicle.type === 'engin' && 'Engin de chantier'}
                              {vehicle.type === 'moto' && 'Moto'}
                              {vehicle.type === 'bateau' && 'Bateau'}
                              {vehicle.type === 'divers' && 'Divers'}
                              {!['voiture', 'camion', 'utilitaire', 'engin', 'moto', 'bateau', 'divers'].includes(vehicle.type) && vehicle.type}
                            </>
                          ) : '—'}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {vehicle.status === 'active' ? (
                            <span className="text-[#00E5CC] font-semibold">ACTIF</span>
                          ) : (
                            <span className="text-[#6B6B80] font-semibold">HORS LIGNE</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {vehicle.status === 'active' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#00E5CC] bg-opacity-20 text-[#00E5CC]">Disponible</span>
                          ) : vehicle.status === 'maintenance' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FFB547] bg-opacity-20 text-[#FFB547]">En maintenance</span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FF4D6A] bg-opacity-20 text-[#FF4D6A]">Indisponible</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className="text-[#00E5CC] font-semibold">
                            {(vehicle.metadata as any)?.source || 'ECHOES'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                openEditModal(vehicle)
                              }}
                              title="Modifier"
                              className="text-[#F0F0F5] hover:text-[#00E5CC]"
                            >
                              <Edit2 size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                setDeleteConfirmId(vehicle.id)
                              }}
                              title="Supprimer"
                              className="text-[#F0F0F5] hover:text-[#FF4D6A]"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#F0F0F5]">
                Page {page} sur {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="text-[#F0F0F5] bg-[#1A1A25] border-[#1F1F2E] hover:bg-[#1E1E2A]"
                >
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="text-[#F0F0F5] bg-[#1A1A25] border-[#1F1F2E] hover:bg-[#1E1E2A]"
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Groups Tab */}
      {activeTab === 'groups' && (
        <>
          {groupsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-48 bg-[#12121A]" />
              ))}
            </div>
          ) : groups.length === 0 ? (
            <Card className="bg-[#12121A] border-[#1F1F2E] text-center">
              <CardContent className="pt-12">
                <p className="text-[#F0F0F5]">Aucun groupe configuré</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groups.map((group) => (
                <Card key={group.id} className="bg-[#12121A] border-[#1F1F2E] hover:border-[#2A2A3D] transition-all">
                  <CardHeader>
                    <CardTitle className="text-[#F0F0F5] font-syne">{group.name}</CardTitle>
                    <p className="text-sm text-[#6B6B80] mt-2">{group.description || 'Pas de description'}</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-[#1A1A25] text-[#F0F0F5] border-[#1F1F2E]">
                        {group.vehicleCount || 0} véhicules
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-2 bg-[#1A1A25] border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#1E1E2A]"
                      >
                        <Edit2 size={14} />
                        Éditer
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-[#FF4D6A] hover:text-[#FF4D6A] hover:bg-[#FF4D6A] hover:bg-opacity-10 bg-[#1A1A25] border-[#1F1F2E]"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Floating Action Bar for Selection */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#12121A] border border-[#1F1F2E] rounded-[12px] shadow-lg p-4 flex items-center gap-3 flex-wrap max-w-3xl z-40">
          <span className="text-sm font-medium text-[#F0F0F5] w-full sm:w-auto">
            {selectedIds.size} véhicule{selectedIds.size > 1 ? 's' : ''} sélectionné{selectedIds.size > 1 ? 's' : ''}
          </span>
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="gap-2 text-[#F0F0F5] bg-[#1A1A25] border-[#1F1F2E] hover:bg-[#1E1E2A]"
            >
              <Download size={16} />
              Exporter
            </Button>
            {showExportMenu && (
              <div className="absolute bottom-10 left-0 bg-[#12121A] border border-[#1F1F2E] rounded-[8px] shadow-lg z-50 w-48">
                <button onClick={() => { exportSelected(); setShowExportMenu(false) }} className="w-full text-left px-4 py-2 text-sm text-[#F0F0F5] hover:bg-[#1A1A25] border-b border-[#1F1F2E]">
                  CSV
                </button>
                <button onClick={() => { exportToFormat('xlsx', vehicles.filter(v => selectedIds.has(v.id))); setShowExportMenu(false) }} className="w-full text-left px-4 py-2 text-sm text-[#F0F0F5] hover:bg-[#1A1A25] border-b border-[#1F1F2E]">
                  Excel XLSX
                </button>
                <button onClick={() => { exportToFormat('kml', vehicles.filter(v => selectedIds.has(v.id))); setShowExportMenu(false) }} className="w-full text-left px-4 py-2 text-sm text-[#F0F0F5] hover:bg-[#1A1A25] border-b border-[#1F1F2E]">
                  KML
                </button>
                <button onClick={() => { exportToFormat('gpx', vehicles.filter(v => selectedIds.has(v.id))); setShowExportMenu(false) }} className="w-full text-left px-4 py-2 text-sm text-[#F0F0F5] hover:bg-[#1A1A25]">
                  GPX
                </button>
              </div>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBulkChangeGroup(true)}
            className="gap-2 text-[#F0F0F5] bg-[#1A1A25] border-[#1F1F2E] hover:bg-[#1E1E2A]"
          >
            <ChevronDown size={16} />
            Changer groupe
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowBulkDeleteConfirm(true)}
            className="gap-2 bg-[#FF4D6A] hover:bg-[#E63D5C] text-white"
          >
            <Trash2 size={16} />
            Supprimer ({selectedIds.size})
          </Button>
        </div>
      )}

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="max-w-2xl bg-[#12121A] border-[#1F1F2E]">
          <DialogHeader>
            <DialogTitle className="text-[#F0F0F5] font-syne">Importer des véhicules</DialogTitle>
            <DialogDescription className="text-[#6B6B80]">
              Importez des véhicules à partir d'un fichier CSV ou XLSX
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* File Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#F0F0F5]">Fichier CSV/XLSX</label>
              <div className="border-2 border-dashed border-[#1F1F2E] rounded-[8px] p-6 text-center hover:border-[#00E5CC] transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Upload className="h-8 w-8 mx-auto mb-2 text-[#44445A]" />
                <p className="text-[#F0F0F5]">{importFile ? importFile.name : 'Cliquez pour sélectionner un fichier'}</p>
                <p className="text-xs text-[#6B6B80] mt-1">CSV ou XLSX acceptés</p>
              </div>
            </div>

            {/* Column Mapping */}
            {importPreviewData.length > 0 && (
              <div className="space-y-3">
                <label className="text-sm font-medium text-[#F0F0F5]">Mappage des colonnes</label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.keys(columnMapping).map(field => (
                    <div key={field} className="space-y-1">
                      <label className="text-xs text-[#6B6B80]">{field} {['Nom', 'Plaque'].includes(field) ? '*' : ''}</label>
                      <select
                        value={columnMapping[field]}
                        onChange={(e) => setColumnMapping({ ...columnMapping, [field]: e.target.value })}
                        className="w-full rounded-[8px] border border-[#1F1F2E] bg-[#0A0A0F] px-3 py-2 text-sm text-[#F0F0F5] focus:border-[#00E5CC]"
                      >
                        <option value="">Sélectionner...</option>
                        {Object.keys(importPreviewData[0] || {}).map(header => (
                          <option key={header} value={header}>{header}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Preview */}
            {importPreviewData.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#F0F0F5]">Aperçu (premières 5 lignes)</label>
                <div className="border border-[#1F1F2E] rounded-[8px] overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-[#0A0A0F] border-b border-[#1F1F2E]">
                      <tr>
                        {Object.keys(columnMapping)
                          .filter(field => columnMapping[field])
                          .map(field => (
                            <th key={field} className="px-4 py-2 text-left text-[#F0F0F5] font-medium">
                              {field}
                            </th>
                          ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1F1F2E]">
                      {importPreviewData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-[#1A1A25]">
                          {Object.keys(columnMapping)
                            .filter(field => columnMapping[field])
                            .map(field => (
                              <td key={field} className="px-4 py-2 text-[#F0F0F5]">
                                {row[columnMapping[field]]}
                              </td>
                            ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Errors */}
            {importErrors.length > 0 && (
              <div className="bg-[#FF4D6A] bg-opacity-10 border border-[#FF4D6A] rounded-[8px] p-3">
                <div className="flex gap-2 items-start">
                  <AlertCircle className="h-5 w-5 text-[#FF4D6A] flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-[#FF4D6A]">
                    {importErrors.map((error, idx) => (
                      <div key={idx}>{error}</div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Progress */}
            {isImporting && importProgress > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-[#F0F0F5]">
                  <span>Import en cours...</span>
                  <span>{importProgress}%</span>
                </div>
                <div className="w-full bg-[#1A1A25] rounded-full h-2 border border-[#1F1F2E]">
                  <div
                    className="bg-[#00E5CC] h-full rounded-full transition-all"
                    style={{ width: `${importProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsImportDialogOpen(false)}
              disabled={isImporting}
              className="bg-[#1A1A25] border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#1E1E2A]"
            >
              Annuler
            </Button>
            <Button
              onClick={handleImportVehicles}
              disabled={isImporting || importPreviewData.length === 0}
              className="bg-[#00E5CC] hover:bg-[#00CCA6] text-[#0A0A0F] font-semibold"
            >
              {isImporting ? `Import en cours (${importProgress}%)` : `Importer ${importPreviewData.length} véhicules`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Change Group Dialog */}
      <Dialog open={showBulkChangeGroup} onOpenChange={setShowBulkChangeGroup}>
        <DialogContent className="bg-[#12121A] border-[#1F1F2E]">
          <DialogHeader>
            <DialogTitle className="text-[#F0F0F5] font-syne">Changer le groupe</DialogTitle>
            <DialogDescription className="text-[#6B6B80]">
              Sélectionnez le groupe pour les {selectedIds.size} véhicules sélectionnés
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <select
              value={bulkChangeGroupId}
              onChange={(e) => setBulkChangeGroupId(e.target.value)}
              className="w-full rounded-[8px] border border-[#1F1F2E] bg-[#0A0A0F] px-3 py-2 text-[#F0F0F5] focus:border-[#00E5CC]"
            >
              <option value="">Sélectionner un groupe...</option>
              {groups.map(group => (
                <option key={group.id} value={group.id}>{group.name}</option>
              ))}
            </select>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowBulkChangeGroup(false)}
              className="bg-[#1A1A25] border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#1E1E2A]"
            >
              Annuler
            </Button>
            <Button
              onClick={handleBulkChangeGroup}
              disabled={!bulkChangeGroupId}
              className="bg-[#00E5CC] hover:bg-[#00CCA6] text-[#0A0A0F] font-semibold"
            >
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={showBulkDeleteConfirm} onOpenChange={setShowBulkDeleteConfirm}>
        <DialogContent className="bg-[#12121A] border-[#1F1F2E]">
          <DialogHeader>
            <DialogTitle className="text-[#F0F0F5] font-syne">Confirmer la suppression</DialogTitle>
            <DialogDescription className="text-[#6B6B80]">
              Êtes-vous sûr de vouloir supprimer {selectedIds.size} véhicules ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowBulkDeleteConfirm(false)}
              className="bg-[#1A1A25] border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#1E1E2A]"
            >
              Annuler
            </Button>
            <Button
              onClick={handleBulkDelete}
              className="bg-[#FF4D6A] hover:bg-[#E63D5C] text-white"
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Vehicle Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg bg-[#12121A] border-[#1F1F2E]">
          <DialogHeader>
            <DialogTitle className="text-[#F0F0F5] font-syne">{editingVehicle ? 'Modifier le véhicule' : 'Nouveau véhicule'}</DialogTitle>
            <DialogDescription className="text-[#6B6B80]">{editingVehicle ? 'Mettre à jour les informations du véhicule' : 'Ajouter un nouveau véhicule à votre flotte'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#F0F0F5]">Nom *</label>
                <Input value={formData.name} onChange={(e) => setFormData(p => ({...p, name: e.target.value}))} placeholder="Camion A1" className="bg-[#12121A] border-[#1F1F2E] text-[#F0F0F5] placeholder:text-[#44445A] focus:border-[#00E5CC]" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#F0F0F5]">Immatriculation *</label>
                <Input value={formData.plate} onChange={(e) => setFormData(p => ({...p, plate: e.target.value}))} placeholder="AB-123-CD" className="bg-[#12121A] border-[#1F1F2E] text-[#F0F0F5] placeholder:text-[#44445A] focus:border-[#00E5CC]" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#F0F0F5]">VIN</label>
              <Input value={formData.vin} onChange={(e) => setFormData(p => ({...p, vin: e.target.value}))} placeholder="WDB1234567F123456" className="bg-[#12121A] border-[#1F1F2E] text-[#F0F0F5] placeholder:text-[#44445A] focus:border-[#00E5CC]" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#F0F0F5]">Type</label>
                <select value={formData.type} onChange={(e) => setFormData(p => ({...p, type: e.target.value}))} className="w-full rounded-[12px] border border-[#1F1F2E] bg-[#12121A] text-[#F0F0F5] px-3 py-2 text-sm">
                  <option value="voiture">Voiture</option>
                  <option value="camion">Camion</option>
                  <option value="utilitaire">Véhicule utilitaire</option>
                  <option value="engin">Engin de chantier</option>
                  <option value="moto">Moto</option>
                  <option value="bateau">Bateau</option>
                  <option value="divers">Divers</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#F0F0F5]">Année</label>
                <Input type="number" value={formData.year} onChange={(e) => setFormData(p => ({...p, year: parseInt(e.target.value) || 0}))} placeholder="2024" className="bg-[#12121A] border-[#1F1F2E] text-[#F0F0F5] placeholder:text-[#44445A] focus:border-[#00E5CC]" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#F0F0F5]">Marque</label>
                <Input value={formData.brand} onChange={(e) => setFormData(p => ({...p, brand: e.target.value}))} placeholder="Renault" className="bg-[#12121A] border-[#1F1F2E] text-[#F0F0F5] placeholder:text-[#44445A] focus:border-[#00E5CC]" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#F0F0F5]">Modèle</label>
                <Input value={formData.model} onChange={(e) => setFormData(p => ({...p, model: e.target.value}))} placeholder="Master" className="bg-[#12121A] border-[#1F1F2E] text-[#F0F0F5] placeholder:text-[#44445A] focus:border-[#00E5CC]" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#F0F0F5]">Notes</label>
              <textarea value={formData.notes} onChange={(e) => setFormData(p => ({...p, notes: e.target.value}))} placeholder="Informations supplémentaires..." className="w-full px-3 py-2 border border-[#1F1F2E] rounded-[12px] text-sm text-[#F0F0F5] bg-[#12121A] focus:outline-none focus:ring-2 focus:ring-[#00E5CC] placeholder:text-[#44445A]" rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)} className="text-[#F0F0F5] bg-[#1A1A25] border-[#1F1F2E] hover:bg-[#1E1E2A]">Annuler</Button>
            <Button onClick={handleSubmitVehicle} disabled={createVehicle.isPending || updateVehicleMutation.isPending} className="bg-[#00E5CC] hover:bg-[#00CCA6] text-[#0A0A0F] font-semibold">
              {(createVehicle.isPending || updateVehicleMutation.isPending) ? 'Enregistrement...' : editingVehicle ? 'Mettre à jour' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent className="bg-[#12121A] border-[#1F1F2E]">
          <DialogHeader>
            <DialogTitle className="text-[#F0F0F5] font-syne">Confirmer la suppression</DialogTitle>
            <DialogDescription className="text-[#6B6B80]">Êtes-vous sûr de vouloir supprimer ce véhicule ? Cette action est irréversible.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)} className="text-[#F0F0F5] bg-[#1A1A25] border-[#1F1F2E] hover:bg-[#1E1E2A]">Annuler</Button>
            <Button variant="destructive" onClick={handleDeleteVehicle} disabled={deleteVehicleMutation.isPending} className="bg-[#FF4D6A] hover:bg-[#E63D5C]">
              {deleteVehicleMutation.isPending ? 'Suppression...' : 'Supprimer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
