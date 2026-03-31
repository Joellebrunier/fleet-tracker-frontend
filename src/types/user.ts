export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  OPERATOR = 'OPERATOR',
  DRIVER = 'DRIVER',
}

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  avatar?: string
  role: UserRole
  organizationId: string
  isActive: boolean
  lastLogin?: Date
  createdAt: Date
  updatedAt: Date
}

export interface Organization {
  id: string
  name: string
  logo?: string
  country?: string
  city?: string
  address?: string
  phone?: string
  email?: string
  subscriptionPlan: 'free' | 'starter' | 'professional' | 'enterprise'
  maxVehicles: number
  maxUsers: number
  createdAt: Date
  updatedAt: Date
}

export interface AuthResponse {
  accessToken: string
  expiresIn: string
  user: User
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  firstName: string
  lastName: string
  organizationName?: string
}

export interface RefreshTokenRequest {
  refreshToken: string
}

export interface UserProfile extends User {
  organization: Organization
  preferences?: UserPreferences
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  locale: string
  notifications: {
    email: boolean
    push: boolean
    sms: boolean
  }
  speedUnit: 'kmh' | 'mph' | 'kn'
  distanceUnit: 'km' | 'mi' | 'm'
  temperatureUnit: 'celsius' | 'fahrenheit'
  dateFormat: string
  timeFormat: '12h' | '24h'
}
