import { Outlet, useLocation } from 'react-router-dom'
import Header from './Header'
import TabNavigation from './TabNavigation'

export default function AppLayout() {
  const location = useLocation()
  // Map page gets full height with no padding
  const isMapPage = location.pathname === '/map'

  return (
    <div className="flex h-screen bg-[#F8F9FC] overflow-hidden flex-col">
      {/* Top Navigation Header */}
      <Header />

      {/* Tab Navigation */}
      <TabNavigation />

      {/* Main content area */}
      <main className="flex-1 overflow-auto">
        {isMapPage ? (
          <div className="h-full">
            <Outlet />
          </div>
        ) : (
          <div className="mx-auto px-4 py-5 sm:px-6 lg:px-8 max-w-[1600px]">
            <Outlet />
          </div>
        )}
      </main>
    </div>
  )
}
