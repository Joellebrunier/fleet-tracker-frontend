# Fleet Tracker Frontend

A professional GPS fleet management system built with React 18, TypeScript, and Tailwind CSS.

## Features

- **Real-time Vehicle Tracking**: Monitor vehicle positions and status in real-time
- **Fleet Dashboard**: Comprehensive dashboard with KPIs and analytics
- **Map Integration**: Interactive maps with Mapbox GL JS
- **Alert Management**: Create and manage alerts with multiple severity levels
- **Geofence Management**: Define and monitor geographical boundaries
- **Vehicle Management**: Full CRUD operations for vehicles
- **User Authentication**: Secure JWT-based authentication with token refresh
- **Role-Based Access Control**: Admin, Manager, Driver, and Viewer roles
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Dark Mode Support**: Full dark mode implementation
- **React Query**: Efficient data fetching and caching
- **State Management**: Zustand for global state management

## Tech Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with custom Fleet Tracker theme
- **UI Components**: Shadcn/ui patterns with Radix UI
- **Data Fetching**: React Query (TanStack Query)
- **API Client**: Axios with JWT interceptors
- **State Management**: Zustand
- **Maps**: Mapbox GL JS
- **Charts**: Recharts
- **Icons**: Lucide React
- **Date Utilities**: date-fns

## Project Structure

```
src/
├── main.tsx                 # React entry point
├── App.tsx                  # Route configuration
├── index.css               # Global styles and Tailwind
├── lib/
│   ├── api.ts             # Axios instance with interceptors
│   ├── utils.ts           # Utility functions
│   ├── constants.ts       # Application constants
│   └── supabase.ts        # Supabase/WebSocket config (optional)
├── hooks/
│   ├── useAuth.ts         # Authentication hooks
│   ├── useVehicles.ts     # Vehicle data hooks
│   ├── useAlerts.ts       # Alert management hooks
│   └── useGeofences.ts    # Geofence hooks
├── stores/
│   ├── authStore.ts       # Zustand auth state
│   ├── mapStore.ts        # Map UI state
│   └── uiStore.ts         # Global UI state
├── types/
│   ├── user.ts            # User and auth types
│   ├── vehicle.ts         # Vehicle types
│   ├── alert.ts           # Alert types
│   ├── geofence.ts        # Geofence types
│   ├── gps.ts             # GPS position types
│   └── api.ts             # API response types
├── components/
│   ├── ui/                # Shadcn-style components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   └── ...
│   ├── layout/
│   │   ├── AppLayout.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── ProtectedRoute.tsx
│   ├── map/               # Map components
│   ├── vehicles/          # Vehicle components
│   ├── alerts/            # Alert components
│   ├── geofences/         # Geofence components
│   └── dashboard/         # Dashboard components
└── pages/
    ├── LoginPage.tsx
    ├── DashboardPage.tsx
    ├── MapPage.tsx
    ├── VehiclesPage.tsx
    ├── VehicleDetailPage.tsx
    ├── AlertsPage.tsx
    ├── GeofencesPage.tsx
    ├── ReportsPage.tsx
    ├── SettingsPage.tsx
    └── SuperAdminPage.tsx
```

## Getting Started

### Prerequisites

- Node.js 16+ or npm 8+
- Mapbox account with API token (optional, for map features)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` file:
```bash
cp .env.example .env.local
```

3. Configure environment variables in `.env.local`:
```
VITE_API_URL=http://localhost:3001
VITE_MAPBOX_TOKEN=your_mapbox_token_here
```

### Development

Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

### Type Checking

Run TypeScript type checking:
```bash
npm run lint
```

## Configuration

### Tailwind CSS Theme

The project includes a custom Fleet Tracker theme with:
- Primary color: Sky Blue (#0ea5e9)
- Semantic colors: success, warning, error, info
- Custom animations: pulse-dot, float
- Custom spacing: sidebar width

### API Configuration

The API client automatically:
- Adds JWT token to all requests
- Handles token refresh when expired
- Redirects to login on 401 errors
- Proxies `/api` calls to backend (configured in vite.config.ts)

### Mapbox Integration

To enable map features:
1. Get a Mapbox token from https://account.mapbox.com/
2. Add to `.env.local`: `VITE_MAPBOX_TOKEN=pk.eyJ...`
3. The token is available as `import.meta.env.VITE_MAPBOX_TOKEN`

## Authentication

### Login Flow

1. User enters credentials on LoginPage
2. API returns JWT token + refresh token
3. Tokens stored in localStorage
4. Auth state persists across browser sessions

### Token Refresh

- Access token expires: configured on backend
- Refresh token automatically used when access token expires
- 401 responses trigger automatic refresh
- If refresh fails, user redirected to login

### Protected Routes

Wrap components with `<ProtectedRoute>`:
```tsx
<ProtectedRoute requiredRoles={['admin', 'manager']}>
  <AdminPage />
</ProtectedRoute>
```

## Data Fetching

### React Query Hooks

Example vehicle list hook:
```tsx
const { data, isLoading, error } = useVehicles({
  page: 1,
  limit: 20,
  status: 'active'
})
```

Query keys automatically invalidate on mutations:
- useCreateVehicle() invalidates vehicle list
- useUpdateVehicle() invalidates specific vehicle
- Stale data refreshed based on staleTime config

### API Calls

Direct API calls with error handling:
```tsx
const { data, error } = await apiRequest('GET', '/api/vehicles')
```

## State Management

### Auth Store
```tsx
const { user, token, logout, login } = useAuthStore()
```

### Map Store
```tsx
const { selectedVehicleId, selectVehicle } = useMapStore()
```

### UI Store
```tsx
const { theme, setTheme, sidebarOpen } = useUIStore()
```

## Component Library

All UI components follow Shadcn/ui patterns:
- Customizable variants and sizes
- Accessible by default (ARIA)
- Tailwind CSS + CVA for styling
- Composable and extensible

### Button Component
```tsx
<Button
  variant="default"
  size="lg"
  onClick={handleClick}
>
  Click Me
</Button>
```

### Card Component
```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
</Card>
```

## Utilities

### Formatting Functions
```tsx
formatDate(date)           // "Jan 15, 2024"
formatDateTime(date)       // "Jan 15, 2024 14:30"
formatSpeed(kmh)           // "65.5 km/h"
formatDistance(meters)     // "12.3 km"
formatTimeAgo(date)        // "5 minutes ago"
```

### Helper Functions
```tsx
cn(...classes)             // Merge Tailwind classes
getInitials('John Doe')    // "JD"
getDistance(pos1, pos2)    // Distance in km
getBearing(pos1, pos2)     // Bearing in degrees
```

## Best Practices

### Component Organization
- Keep components small and focused
- Use custom hooks to extract logic
- Separate container and presentation
- Co-locate styles with components

### State Management
- Use Zustand for global state
- Use React Query for server state
- Use useState for local component state
- Avoid prop drilling with context

### API Integration
- Use React Query hooks for data fetching
- Handle loading and error states
- Show appropriate user feedback
- Implement optimistic updates

### Performance
- Lazy load pages with React Router
- Memoize expensive computations
- Use React Query's caching
- Image optimization for maps

### Accessibility
- Use semantic HTML
- Add ARIA labels where needed
- Test with keyboard navigation
- Ensure sufficient color contrast

## Troubleshooting

### Map not showing
- Check Mapbox token in .env.local
- Verify token has correct permissions
- Check browser console for errors

### API calls failing
- Ensure backend running on localhost:3001
- Check VITE_API_URL in .env.local
- Verify auth token in localStorage

### Build errors
- Run `npm install` to update dependencies
- Clear `node_modules` and reinstall
- Check Node.js version (16+ required)

## Future Enhancements

- [ ] Real-time position updates with WebSocket
- [ ] GPS trail visualization and playback
- [ ] Advanced filtering and search
- [ ] Export reports to PDF/Excel
- [ ] Mobile app with React Native
- [ ] E2E testing with Cypress
- [ ] Unit tests with Vitest
- [ ] Storybook for component documentation

## License

Proprietary - Fleet Tracker Fleet Management System
