import { useState, useCallback, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { apiClient } from '@/lib/api'
import { API_ROUTES } from '@/lib/constants'
import { useAuthStore } from '@/stores/authStore'
import {
  Download,
  FileText,
  Table,
  MapPin,
  Navigation,
  Loader2,
} from 'lucide-react'
import { format, subDays } from 'date-fns'

interface GpsDataRecord {
  timestamp: string | number
  lat: number
  lng: number
  speed?: number
  heading?: number
}

interface GpsDataExportProps {
  vehicleId: string
  vehicleName: string
  isOpen: boolean
  onClose: () => void
}

type ExportFormat = 'csv' | 'xlsx' | 'kml' | 'gpx'

/**
 * GPS Data Export Component
 * Allows users to export GPS history in multiple formats with date range filtering
 */
export function GpsDataExport({
  vehicleId,
  vehicleName,
  isOpen,
  onClose,
}: GpsDataExportProps) {
  const orgId = useAuthStore((s) => s.user?.organizationId) || ''

  const [dateFrom, setDateFrom] = useState<string>(
    format(subDays(new Date(), 7), 'yyyy-MM-dd')
  )
  const [dateTo, setDateTo] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('csv')
  const [isLoading, setIsLoading] = useState(false)
  const [dataCount, setDataCount] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  /**
   * Fetch GPS history data with current date range
   */
  const fetchGpsData = useCallback(async (): Promise<GpsDataRecord[] | null> => {
    if (!orgId) {
      setError('Organization ID not found')
      return null
    }

    try {
      setError(null)
      const params = new URLSearchParams({
        vehicleId,
        dateFrom,
        dateTo,
      })

      const response = await apiClient.get(
        `${API_ROUTES.GPS_HISTORY(orgId)}?${params}`
      )

      if (!response.data) {
        setError('No GPS data available for the selected date range')
        return null
      }

      const records = Array.isArray(response.data) ? response.data : []
      setDataCount(records.length)
      return records
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch GPS data'
      setError(message)
      return null
    }
  }, [orgId, vehicleId, dateFrom, dateTo])

  /**
   * Load data count on date range change
   */
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        fetchGpsData()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [isOpen, dateFrom, dateTo, fetchGpsData])

  /**
   * Generate CSV content
   */
  function generateCsv(records: GpsDataRecord[]): string {
    const headers = ['Timestamp', 'Latitude', 'Longitude', 'Speed (km/h)', 'Heading (°)']
    const rows = records.map((record) => [
      typeof record.timestamp === 'number'
        ? new Date(record.timestamp).toISOString()
        : record.timestamp,
      record.lat,
      record.lng,
      record.speed ?? '',
      record.heading ?? '',
    ])

    const csv = [headers, ...rows].map((row) =>
      row.map((cell) => `"${cell}"`).join(',')
    )

    return csv.join('\n')
  }

  /**
   * Generate KML content
   */
  function generateKml(records: GpsDataRecord[]): string {
    const placemarks = records
      .map((record) => {
        const timestamp =
          typeof record.timestamp === 'number'
            ? new Date(record.timestamp).toISOString()
            : record.timestamp

        return `    <Placemark>
      <TimeStamp><when>${timestamp}</when></TimeStamp>
      <description>Speed: ${record.speed ?? 'N/A'} km/h | Heading: ${record.heading ?? 'N/A'}°</description>
      <Point>
        <coordinates>${record.lng},${record.lat},0</coordinates>
      </Point>
    </Placemark>`
      })
      .join('\n')

    return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${vehicleName} GPS Track</name>
    <description>GPS history for ${vehicleName} from ${dateFrom} to ${dateTo}</description>
    <Style id="lineStyle">
      <LineStyle>
        <color>ff0000ff</color>
        <width>2</width>
      </LineStyle>
    </Style>
    <Placemark>
      <name>Track</name>
      <styleUrl>#lineStyle</styleUrl>
      <LineString>
        <coordinates>
${records.map((r) => `          ${r.lng},${r.lat},0`).join('\n')}
        </coordinates>
      </LineString>
    </Placemark>
${placemarks}
  </Document>
</kml>`
  }

  /**
   * Generate GPX content
   */
  function generateGpx(records: GpsDataRecord[]): string {
    const trkpts = records
      .map((record) => {
        const timestamp =
          typeof record.timestamp === 'number'
            ? new Date(record.timestamp).toISOString()
            : record.timestamp

        return `    <trkpt lat="${record.lat}" lon="${record.lng}">
      <ele>0</ele>
      <time>${timestamp}</time>
      <extensions>
        <speed>${record.speed ?? 0}</speed>
        <heading>${record.heading ?? 0}</heading>
      </extensions>
    </trkpt>`
      })
      .join('\n')

    return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Fleet Tracking System" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${vehicleName} GPS Track</name>
    <desc>GPS history for ${vehicleName} from ${dateFrom} to ${dateTo}</desc>
    <time>${new Date().toISOString()}</time>
  </metadata>
  <trk>
    <name>${vehicleName}</name>
    <trkseg>
${trkpts}
    </trkseg>
  </trk>
</gpx>`
  }

  /**
   * Trigger file download
   */
  function downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  /**
   * Handle export
   */
  const handleExport = async () => {
    setIsLoading(true)

    try {
      const records = await fetchGpsData()

      if (!records || records.length === 0) {
        setError('No data to export')
        setIsLoading(false)
        return
      }

      const filename = `${vehicleName}_gps_${dateFrom}_${dateTo}`
      let content: string
      let mimeType: string

      switch (selectedFormat) {
        case 'csv':
          content = generateCsv(records)
          mimeType = 'text/csv'
          downloadFile(content, `${filename}.csv`, mimeType)
          break

        case 'xlsx':
          // Simple CSV format that Excel can open with .xlsx extension
          content = generateCsv(records)
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          downloadFile(content, `${filename}.xlsx`, mimeType)
          break

        case 'kml':
          content = generateKml(records)
          mimeType = 'application/vnd.google-earth.kml+xml'
          downloadFile(content, `${filename}.kml`, mimeType)
          break

        case 'gpx':
          content = generateGpx(records)
          mimeType = 'application/gpx+xml'
          downloadFile(content, `${filename}.gpx`, mimeType)
          break
      }

      onClose()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Export failed'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const formatOptions: Array<{
    value: ExportFormat
    label: string
    icon: React.ReactNode
    description: string
  }> = [
    {
      value: 'csv',
      label: 'CSV',
      icon: <Table className="w-4 h-4" />,
      description: 'Spreadsheet format',
    },
    {
      value: 'xlsx',
      label: 'Excel',
      icon: <FileText className="w-4 h-4" />,
      description: 'Excel format',
    },
    {
      value: 'kml',
      label: 'KML',
      icon: <MapPin className="w-4 h-4" />,
      description: 'Google Earth format',
    },
    {
      value: 'gpx',
      label: 'GPX',
      icon: <Navigation className="w-4 h-4" />,
      description: 'GPS Exchange format',
    },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export GPS Data
          </DialogTitle>
          <DialogDescription>
            Export GPS history for {vehicleName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Date Range Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Date Range</label>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs text-gray-600">From</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-600">To</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Data Count Preview */}
          {dataCount !== null && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-900">
                Found <span className="font-semibold">{dataCount}</span> GPS records
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 p-3 rounded-lg">
              <p className="text-sm text-red-900">{error}</p>
            </div>
          )}

          {/* Format Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Export Format</label>
            <div className="grid grid-cols-2 gap-2">
              {formatOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSelectedFormat(option.value)}
                  disabled={isLoading}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    selectedFormat === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {option.icon}
                    <span className="font-semibold text-sm">{option.label}</span>
                  </div>
                  <p className="text-xs text-gray-600">{option.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Format Info */}
          <div className="bg-gray-50 p-3 rounded-lg text-xs text-gray-700">
            <p>
              {selectedFormat === 'csv' && 'CSV spreadsheet with timestamp, coordinates, speed, and heading'}
              {selectedFormat === 'xlsx' && 'Excel-compatible format for data analysis'}
              {selectedFormat === 'kml' && 'Google Earth format - visualize track on map'}
              {selectedFormat === 'gpx' && 'Standard GPS exchange format for navigation apps'}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isLoading || dataCount === 0}
            className="gap-2"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isLoading ? 'Exporting...' : 'Export'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
