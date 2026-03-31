import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart3, Download, FileText } from 'lucide-react'

export default function ReportsPage() {
  const reportTypes = [
    {
      title: 'Trip Report',
      description: 'Detailed trip information with distance, duration, and route',
      icon: FileText,
    },
    {
      title: 'Fuel Report',
      description: 'Fuel consumption analysis and optimization recommendations',
      icon: BarChart3,
    },
    {
      title: 'Driver Report',
      description: 'Driver behavior analysis and performance metrics',
      icon: FileText,
    },
    {
      title: 'Fleet Report',
      description: 'Overall fleet performance and utilization statistics',
      icon: BarChart3,
    },
    {
      title: 'Maintenance Report',
      description: 'Maintenance schedule and service history',
      icon: FileText,
    },
    {
      title: 'Compliance Report',
      description: 'Alert violations and compliance metrics',
      icon: BarChart3,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
        <p className="mt-2 text-gray-600">Generate and download fleet reports</p>
      </div>

      {/* Report types */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reportTypes.map((report) => {
          const Icon = report.icon
          return (
            <Card key={report.title} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{report.title}</CardTitle>
                    <CardDescription>{report.description}</CardDescription>
                  </div>
                  <Icon className="text-fleet-tracker-600" size={24} />
                </div>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full gap-2">
                  <Download size={16} />
                  Generate Report
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Recent reports */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-center py-12">
            <p className="text-gray-500">No reports generated yet</p>
            <Button variant="outline">Generate your first report</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
