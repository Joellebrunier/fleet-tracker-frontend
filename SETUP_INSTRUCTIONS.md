# Fleet Tracker Frontend - Setup Instructions

## Quick Start (5 minutes)

### 1. Install Dependencies
```bash
cd /sessions/sweet-busy-shannon/fleet-tracker/frontend
npm install
```

### 2. Configure Environment
Create `.env.local` file in the project root:
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
VITE_API_URL=http://localhost:3001
VITE_MAPBOX_TOKEN=your_mapbox_token_here
```

### 3. Start Development Server
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Available Commands

```bash
npm run dev       # Start development server with HMR
npm run build     # Build for production (creates dist/)
npm run preview   # Preview production build locally
npm run lint      # Run TypeScript type checking
```

## Build Output

After running `npm run build`, the production files are in `dist/`:
- `dist/index.html` - HTML entry point
- `dist/assets/` - JavaScript and CSS bundles
- Total size: ~444 KB

## Deployment

### Vercel (Recommended)
The project includes `vercel.json` configuration:
1. Push code to git repository
2. Connect repository to Vercel
3. Vercel automatically builds and deploys

### Docker
```bash
docker build -t fleet-tracker-frontend .
docker run -p 3000:3000 fleet-tracker-frontend
```

### Manual
```bash
npm run build
npm install -g serve
serve -s dist -l 3000
```

## Project Structure

```
src/
├── main.tsx              # React entry point
├── App.tsx              # Routes and layout
├── index.css            # Global styles
├── lib/                 # Utilities & API
├── hooks/               # React Query hooks
├── stores/              # Zustand state
├── types/               # TypeScript types
├── components/
│   ├── ui/             # Reusable UI components
│   ├── layout/         # Layout components
│   ├── map/            # Map components
│   ├── vehicles/       # Vehicle components
│   ├── alerts/         # Alert components
│   ├── geofences/      # Geofence components
│   └── dashboard/      # Dashboard components
└── pages/              # Page components
```

## Configuration Files Explained

### vite.config.ts
- Development server: port 5173
- API proxy: `/api` → backend at port 3001
- Path alias: `@/` → `src/`
- Build output: `dist/`

### tailwind.config.js
- Custom Fleet Tracker theme colors
- Dark mode support
- Custom animations
- Sidebar width utilities

### tsconfig.json
- Strict mode enabled
- JSX support with React 18
- Path aliases configured
- Source maps for debugging

### postcss.config.js
- Tailwind CSS processing
- Use @tailwindcss/postcss for Tailwind v4

## Environment Variables

Required:
- `VITE_API_URL` - Backend API URL (e.g., http://localhost:3001)

Optional:
- `VITE_MAPBOX_TOKEN` - Mapbox GL token for maps
- `VITE_ENABLE_REALTIME` - Enable real-time features
- `VITE_ENABLE_ANALYTICS` - Enable analytics

## Backend Integration

### API Endpoints Expected

The backend should provide these endpoints:

```
Authentication:
POST   /api/auth/login
POST   /api/auth/register
POST   /api/auth/refresh
POST   /api/auth/logout
GET    /api/auth/me

Vehicles:
GET    /api/vehicles
GET    /api/vehicles/:id
POST   /api/vehicles
PUT    /api/vehicles/:id
DELETE /api/vehicles/:id
GET    /api/vehicles/:id/position
GET    /api/vehicles/:id/history
GET    /api/vehicles/:id/stats

Alerts:
GET    /api/alerts
GET    /api/alerts/:id
POST   /api/alerts/:id/acknowledge
GET    /api/alert-rules
POST   /api/alert-rules
PUT    /api/alert-rules/:id
DELETE /api/alert-rules/:id

Geofences:
GET    /api/geofences
GET    /api/geofences/:id
POST   /api/geofences
PUT    /api/geofences/:id
DELETE /api/geofences/:id
GET    /api/geofences/:id/violations
```

### Authentication Flow

1. User logs in with email/password
2. Backend returns JWT token + refresh token
3. Client stores tokens in localStorage
4. All API requests include `Authorization: Bearer <token>`
5. When token expires, refresh token is used automatically

## Troubleshooting

### Port 5173 already in use
Change the port in vite.config.ts or kill the process:
```bash
lsof -i :5173
kill -9 <PID>
```

### Module resolution errors
Clear node_modules and reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Build errors
1. Ensure Node.js 16+ is installed: `node --version`
2. Clear TypeScript cache: `npm run lint`
3. Check for console errors in browser

### API connection issues
1. Verify backend is running on localhost:3001
2. Check VITE_API_URL in .env.local
3. Verify JWT token in localStorage
4. Check browser console for CORS errors

### Mapbox not showing
1. Get token from https://account.mapbox.com/
2. Add to .env.local: `VITE_MAPBOX_TOKEN=pk.eyJ...`
3. Restart dev server after updating .env

## Performance Tips

1. **Development**: Use `npm run dev` for fast HMR
2. **Production**: Always use `npm run build`
3. **Bundle size**: Analyzed in build output
4. **Caching**: React Query handles intelligent caching
5. **Images**: Consider lazy loading for images

## Security Best Practices

1. Never commit `.env.local` to git
2. Keep sensitive tokens in .env files only
3. Verify JWT tokens on backend
4. Use HTTPS in production
5. Implement CORS properly on backend

## Development Workflow

1. Start dev server: `npm run dev`
2. Make code changes (hot reload works automatically)
3. Test in browser at http://localhost:5173
4. Run type check: `npm run lint`
5. Before commit: ensure `npm run build` succeeds

## Common Tasks

### Add a new page
1. Create component in `src/pages/`
2. Import in `App.tsx`
3. Add route to Routes element

### Add a new API call
1. Create hook in `src/hooks/`
2. Use React Query for data fetching
3. Import and use hook in component

### Style a component
1. Use Tailwind CSS classes
2. Custom colors available via `text-fleet-tracker-*`
3. Dark mode: prefix with `dark:`

### Add a form
1. Use `Input` component from `src/components/ui/`
2. Handle validation in component
3. Use API hook for submission

## Getting Help

Check the README.md for:
- Detailed feature documentation
- Component API documentation
- Type definitions
- Utility function reference

For backend integration issues:
- Verify API endpoints match documentation
- Check HTTP status codes
- Review error responses in network tab
- Enable debug logging if available

## Next Steps

1. Configure backend URL in .env.local
2. Test login functionality
3. Verify vehicle list loads
4. Test map integration
5. Implement real-time features
6. Add unit/E2E tests
7. Deploy to production
