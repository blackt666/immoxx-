import {
  sqliteTable,
  text,
  integer,
  real,
  blob
} from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// User authentication and administration
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  passwordHash: text('password_hash'),
  name: text('name').notNull(),
  role: text('role').notNull().default('admin'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  lastLoginAt: integer('last_login_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`)
});

// Property listings and real estate data
export const properties = sqliteTable('properties', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  description: text('description'),
  type: text('type').notNull(), // 'sale', 'rental', 'commercial'
  status: text('status').notNull().default('active'),
  
  // Property details
  price: real('price').notNull(),
  currency: text('currency').notNull().default('EUR'),
  size: real('size'), // square meters
  rooms: integer('rooms'),
  bedrooms: integer('bedrooms'),
  bathrooms: integer('bathrooms'),

  // Location
  location: text('location').notNull(),
  city: text('city').notNull(),
  postalCode: text('postal_code'),
  region: text('region'),
  country: text('country').notNull().default('Germany'),
  latitude: real('latitude'),
  longitude: real('longitude'),
  
  // Property features
  yearBuilt: integer('year_built'),
  hasGarden: integer('has_garden', { mode: 'boolean' }).default(false),
  hasBalcony: integer('has_balcony', { mode: 'boolean' }).default(false),
  hasParking: integer('has_parking', { mode: 'boolean' }).default(false),
  energyRating: text('energy_rating'),
  
  // SEO and metadata
  slug: text('slug').unique(),
  metaTitle: text('meta_title'),
  metaDescription: text('meta_description'),
  
  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  publishedAt: integer('published_at', { mode: 'timestamp' })
});

// Property images and gallery
export const galleryImages = sqliteTable('gallery_images', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  propertyId: integer('property_id').references(() => properties.id, { onDelete: 'cascade' }),
  filename: text('filename').notNull(),
  originalName: text('original_name'),
  alt: text('alt'),
  caption: text('caption'),
  sortOrder: integer('sort_order').default(0),
  isPrimary: integer('is_primary', { mode: 'boolean' }).default(false),
  imageType: text('image_type').default('standard'), // 'standard', '360', 'floor_plan'
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`)
});

// Customer inquiries and contact requests
export const inquiries = sqliteTable('inquiries', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  propertyId: integer('property_id').references(() => properties.id, { onDelete: 'set null' }),
  
  // Contact information
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  
  // Inquiry details
  subject: text('subject'),
  message: text('message').notNull(),
  inquiryType: text('inquiry_type').notNull().default('general'), // 'viewing', 'information', 'valuation'
  
  // Status and handling
  status: text('status').notNull().default('new'), // 'new', 'contacted', 'resolved', 'closed'
  isRead: integer('is_read', { mode: 'boolean' }).default(false),
  assignedTo: integer('assigned_to').references(() => users.id),
  
  // Metadata
  source: text('source').default('website'), // 'website', 'phone', 'email', 'referral'
  userAgent: text('user_agent'),
  ipAddress: text('ip_address'),
  
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  resolvedAt: integer('resolved_at', { mode: 'timestamp' })
});

// CRM system - customers
export const customers = sqliteTable('customers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email').unique(),
  phone: text('phone'),
  
  // Address
  address: text('address'),
  city: text('city'),
  postalCode: text('postal_code'),
  country: text('country').default('Germany'),
  
  // Customer details
  dateOfBirth: integer('date_of_birth', { mode: 'timestamp' }),
  occupation: text('occupation'),
  notes: text('notes'),
  
  // Customer preferences
  propertyTypes: text('property_types'), // JSON string
  maxBudget: real('max_budget'),
  minBudget: real('min_budget'),
  preferredLocations: text('preferred_locations'), // JSON string
  
  // Status and metadata
  customerType: text('customer_type').default('prospect'), // 'prospect', 'client', 'former_client'
  source: text('source'),
  tags: text('tags'), // JSON string
  
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  lastContactAt: integer('last_contact_at', { mode: 'timestamp' })
});

// Simplified leads table
export const leads = sqliteTable('leads', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  customerId: integer('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
  propertyId: integer('property_id').references(() => properties.id, { onDelete: 'set null' }),
  
  // Deal information
  stage: text('stage').notNull().default('new'),
  dealType: text('deal_type').notNull().default('not_specified'),
  value: real('value').notNull().default(0),
  
  // Probability and timeline
  probability: integer('probability').notNull().default(25), // 0-100%
  expectedCloseDate: integer('expected_close_date', { mode: 'timestamp' }),
  actualCloseDate: integer('actual_close_date', { mode: 'timestamp' }),
  
  // Details
  title: text('title'),
  notes: text('notes'),
  lostReason: text('lost_reason'), // if deal was lost
  
  // Assignment
  assignedTo: integer('assigned_to').references(() => users.id),
  
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`)
});

// Appointments
export const appointments = sqliteTable('appointments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  customerId: integer('customer_id').references(() => customers.id, { onDelete: 'cascade' }),
  propertyId: integer('property_id').references(() => properties.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  description: text('description'),
  startTime: integer('start_time', { mode: 'timestamp' }).notNull(),
  endTime: integer('end_time', { mode: 'timestamp' }).notNull(),
  location: text('location'),
  type: text('type').notNull().default('viewing'), // 'viewing', 'consultation', 'meeting'
  status: text('status').notNull().default('scheduled'), // 'scheduled', 'confirmed', 'cancelled', 'completed'
  
  // Contact information
  contactName: text('contact_name'),
  contactEmail: text('contact_email'),
  contactPhone: text('contact_phone'),
  
  // Internal notes
  notes: text('notes'),
  reminderSent: integer('reminder_sent', { mode: 'boolean' }).default(false),
  
  // Assignment
  assignedTo: integer('assigned_to').references(() => users.id),
  
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`)
});

// Calendar connections
export const calendarConnections = sqliteTable('calendar_connections', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  provider: text('provider').notNull(), // 'google', 'apple', 'outlook'
  providerId: text('provider_id').notNull(),
  email: text('email').notNull(),
  name: text('name'),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  tokenExpiresAt: integer('token_expires_at', { mode: 'timestamp' }),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  lastSyncAt: integer('last_sync_at', { mode: 'timestamp' }),
  syncEnabled: integer('sync_enabled', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`)
});

// Calendar events
export const calendarEvents = sqliteTable('calendar_events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  calendarConnectionId: integer('calendar_connection_id').references(() => calendarConnections.id, { onDelete: 'cascade' }),
  appointmentId: integer('appointment_id').references(() => appointments.id, { onDelete: 'cascade' }),
  externalId: text('external_id').notNull(), // ID from external calendar
  title: text('title').notNull(),
  description: text('description'),
  startTime: integer('start_time', { mode: 'timestamp' }).notNull(),
  endTime: integer('end_time', { mode: 'timestamp' }).notNull(),
  location: text('location'),
  status: text('status').notNull(),
  lastModified: integer('last_modified', { mode: 'timestamp' }),
  syncStatus: text('sync_status').default('synced'), // 'synced', 'pending', 'error'
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`)
});

// Calendar sync logs
export const calendarSyncLogs = sqliteTable('calendar_sync_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  calendarConnectionId: integer('calendar_connection_id').references(() => calendarConnections.id, { onDelete: 'cascade' }),
  syncType: text('sync_type').notNull(), // 'import', 'export', 'update', 'delete'
  status: text('status').notNull(), // 'success', 'error', 'warning'
  message: text('message'),
  eventCount: integer('event_count').default(0),
  errorDetails: text('error_details'), // JSON string
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`)
});

// Rate limiting table
export const rateLimitEntries = sqliteTable('rate_limit_entries', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  identifier: text('identifier').notNull(), // IP address or user ID
  endpoint: text('endpoint').notNull(), // API endpoint being rate limited
  count: integer('count').notNull().default(0),
  resetTime: integer('reset_time', { mode: 'timestamp' }).notNull(),
  firstAttemptTime: integer('first_attempt_time', { mode: 'timestamp' }),
  blocked: integer('blocked', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`)
});

// Zod schemas for validation
import { z } from 'zod';

export const leadSchema = z.object({
  customerId: z.number().int().positive(),
  propertyId: z.number().int().positive().optional(),
  stage: z.string().min(1),
  dealType: z.string().min(1),
  value: z.number().min(0),
  probability: z.number().int().min(0).max(100),
  expectedCloseDate: z.date().optional(),
  title: z.string().optional(),
  notes: z.string().optional(),
  assignedTo: z.number().int().positive().optional()
});

// Export types for compatibility
export type User = typeof users.$inferSelect;
export type Property = typeof properties.$inferSelect;
export type Inquiry = typeof inquiries.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type Appointment = typeof appointments.$inferSelect;
export type CalendarConnection = typeof calendarConnections.$inferSelect;
export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type CalendarSyncLog = typeof calendarSyncLogs.$inferSelect;
export type RateLimitEntry = typeof rateLimitEntries.$inferSelect;
