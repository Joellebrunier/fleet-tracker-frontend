import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Settings, Users, Building2, BarChart3 } from 'lucide-react'

export default function SuperAdminPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-lg border-l-4 border-red-500 bg-red-50 p-4">
        <h1 className="text-3xl font-bold text-gray-900">System Administration</h1>
        <p className="mt-2 text-gray-600">Super admin only - manage all organizations and users</p>
      </div>

      {/* Admin sections */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <Users className="mb-4 text-blue-600" size={32} />
            <h3 className="font-semibold text-gray-900">Users</h3>
            <p className="mt-1 text-sm text-gray-600">Manage all system users</p>
            <Button variant="outline" className="mt-4 w-full">
              Manage Users
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <Building2 className="mb-4 text-green-600" size={32} />
            <h3 className="font-semibold text-gray-900">Organizations</h3>
            <p className="mt-1 text-sm text-gray-600">Manage all organizations</p>
            <Button variant="outline" className="mt-4 w-full">
              Manage Orgs
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <Settings className="mb-4 text-purple-600" size={32} />
            <h3 className="font-semibold text-gray-900">System Settings</h3>
            <p className="mt-1 text-sm text-gray-600">Configure system settings</p>
            <Button variant="outline" className="mt-4 w-full">
              Settings
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <BarChart3 className="mb-4 text-orange-600" size={32} />
            <h3 className="font-semibold text-gray-900">Analytics</h3>
            <p className="mt-1 text-sm text-gray-600">View system analytics</p>
            <Button variant="outline" className="mt-4 w-full">
              Analytics
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Organizations overview */}
      <Card>
        <CardHeader>
          <CardTitle>Organizations</CardTitle>
          <CardDescription>All registered organizations in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
              <div>
                <p className="font-medium text-gray-900">Acme Transport</p>
                <p className="text-sm text-gray-500">Premium Plan • 150 vehicles</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="success">Active</Badge>
                <Button variant="outline" size="sm">
                  Manage
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
              <div>
                <p className="font-medium text-gray-900">Fast Logistics</p>
                <p className="text-sm text-gray-500">Professional Plan • 45 vehicles</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="success">Active</Badge>
                <Button variant="outline" size="sm">
                  Manage
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
              <div>
                <p className="font-medium text-gray-900">City Delivery</p>
                <p className="text-sm text-gray-500">Starter Plan • 12 vehicles</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Paused</Badge>
                <Button variant="outline" size="sm">
                  Manage
                </Button>
              </div>
            </div>
          </div>
          <Button variant="outline" className="mt-4 w-full">
            View All Organizations
          </Button>
        </CardContent>
      </Card>

      {/* System status */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-green-50 p-4">
              <p className="text-sm text-green-600 font-medium">API Status</p>
              <p className="mt-2 text-2xl font-bold text-green-700">Operational</p>
            </div>
            <div className="rounded-lg bg-green-50 p-4">
              <p className="text-sm text-green-600 font-medium">Database</p>
              <p className="mt-2 text-2xl font-bold text-green-700">Connected</p>
            </div>
            <div className="rounded-lg bg-green-50 p-4">
              <p className="text-sm text-green-600 font-medium">Cache</p>
              <p className="mt-2 text-2xl font-bold text-green-700">Active</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
