import { Outlet } from 'react-router-dom'
import Header from './Header'
import TabNavigation from './TabNavigation'

export default function AppLayout() {
  return (
    <div className="flex h-screen bg-[#F5F7FA] overflow-hidden flex-col">
      {/* Top Navigation Header */}
      <Header />

      {/* Tab Navigation */}
      <TabNavigation />

      {/* Main content area */}
      <main className="flex-1 overflow-auto">
        <div className="mx-auto p-4 sm:p-5 lg:p-6 max-w-[1600px]">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
