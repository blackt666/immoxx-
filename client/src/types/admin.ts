// User and Authentication Types
export interface User {
  id: string;
  username: string;
  name?: string;
  email?: string;
  phone?: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token?: string;
}

// Property Types
export interface Property {
  id: string;
  title: string;
  description?: string;
  type: PropertyType;
  location: string;
  address?: string;
  price?: number;
  size?: number;
  rooms?: number;
  bathrooms?: number;
  bedrooms?: number;
  status: PropertyStatus;
  condition?: PropertyCondition;
  features?: string[];
  images?: string[];
  agentId?: string;
  createdAt: string;
  updatedAt: string;
}

export type PropertyType =
  | "Einfamilienhaus"
  | "Wohnung"
  | "Villa"
  | "Grundstück";
export type PropertyStatus = "available" | "reserved" | "sold";
export type PropertyCondition =
  | "Neuwertig"
  | "Gut"
  | "Renovierungsbedürftig"
  | "Sanierungsbedürftig";

export interface PropertyFilters {
  type?: string;
  location?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PropertiesResponse {
  properties: Property[];
  total: number;
}

// Inquiry Types
export interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  inquiryType?: InquiryType;
  propertyId?: string;
  status: InquiryStatus;
  priority?: InquiryPriority;
  response?: string;
  respondedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type InquiryType = "property_interest" | "valuation" | "consultation";
export type InquiryStatus = "new" | "in_progress" | "answered";
export type InquiryPriority = "low" | "normal" | "high";

export interface InquiryFilters {
  status?: string;
  page?: number;
  limit?: number;
}

export interface InquiriesResponse {
  inquiries: Inquiry[];
  total: number;
}

// Newsletter Types
export interface Newsletter {
  id: string;
  subject: string;
  content: string;
  category?: NewsletterCategory;
  status: NewsletterStatus;
  sentAt?: string;
  recipientCount?: number;
  openRate?: number;
  createdAt: string;
  updatedAt: string;
}

export type NewsletterCategory =
  | "new_properties"
  | "market_update"
  | "tips"
  | "company_news";
export type NewsletterStatus = "draft" | "scheduled" | "sent";

export interface NewsletterSubscriber {
  id: string;
  email: string;
  name?: string;
  status: SubscriberStatus;
  source?: string;
  subscribeDate: string;
  unsubscribeDate?: string;
}

export type SubscriberStatus = "active" | "unsubscribed";

// Gallery Types
export interface GalleryImage {
  id: string;
  filename: string;
  originalName?: string;
  url: string;
  alt?: string;
  category?: string;
  propertyId?: string;
  size?: number;
  uploadedAt: string;
}

// Site Content Types
export interface SiteContent {
  id: string;
  section: string;
  content: any;
  updatedAt: string;
}

export interface HeroContent {
  title: string;
  subtitle: string;
  ctaText: string;
}

export interface AboutContent {
  description: string;
  experience: string;
  sales: string;
}

export interface ContactContent {
  phone: string;
  mobile: string;
  email: string;
  address: string;
  hours: string;
}

// Dashboard Types
export interface DashboardStats {
  propertiesCount: number;
  inquiriesCount: number;
  salesCount: number;
  subscribersCount: number;
}

// Settings Types
export interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  newsletterConfirmations: boolean;
}

export interface SystemInfo {
  version: string;
  lastUpdate: string;
  storageUsed: string;
  lastActivity: string;
}

// Form Types
export interface PropertyFormData {
  title: string;
  description?: string;
  type: PropertyType;
  location: string;
  address?: string;
  price?: number;
  size?: number;
  rooms?: number;
  bathrooms?: number;
  bedrooms?: number;
  condition?: PropertyCondition;
  features?: string[];
}

export interface InquiryFormData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  inquiryType?: InquiryType;
  propertyId?: string;
}

export interface NewsletterFormData {
  subject: string;
  content: string;
  category?: NewsletterCategory;
}

export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
  errors?: any[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Navigation Types
export interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  path?: string;
}

export interface TabInfo {
  title: string;
  subtitle: string;
}

// Component Props Types
export interface AdminComponentProps {
  className?: string;
  onTabChange?: (tab: string) => void;
}

export interface DataTableProps<T> {
  data: T[];
  columns: any[];
  loading?: boolean;
  onEdit?: (item: T) => void;
  onDelete?: (id: string) => void;
  onView?: (item: T) => void;
}

// Error Types
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

// Upload Types
export interface FileUploadResult {
  id: string;
  url: string;
  filename: string;
  size: number;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

// Analytics Types
export interface AnalyticsData {
  period: string;
  metrics: {
    pageViews: number;
    uniqueVisitors: number;
    inquiries: number;
    conversions: number;
  };
}

// Export/Import Types
export interface ExportOptions {
  format: "csv" | "json" | "xlsx";
  dateRange?: {
    start: string;
    end: string;
  };
  fields?: string[];
}

export interface BackupData {
  timestamp: string;
  version: string;
  data: {
    users: User[];
    properties: Property[];
    inquiries: Inquiry[];
    newsletters: Newsletter[];
    subscribers: NewsletterSubscriber[];
    siteContent: SiteContent[];
    images: GalleryImage[];
  };
}
