import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import StatusBar from './StatusBar'

export default function AppLayout() {
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Status Bar at the very top */}
      <StatusBar />

      {/* Main layout with sidebar and content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-hidden lg:ml-64">
          {/* Header */}
          <Header />

          {/* Page content */}
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-4 sm:p-6 lg:p-8">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
