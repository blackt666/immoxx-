import {
  pgTable,
  text,
  integer,
  serial,
  timestamp,
  boolean,
  varchar,
  real,
  json
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { CRM_STAGES, DEAL_TYPES } from './constants';

// User authentication and administration
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull().default('admin'),
  isActive: boolean('is_active').notNull().default(true),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Property listings and real estate data
export const properties = pgTable('properties', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  type: varchar('type', { length: 100 }).notNull(), // 'sale', 'rental', 'commercial'
  status: varchar('status', { length: 50 }).notNull().default('active'),
  
  // Property details
  price: real('price').notNull(),
  currency: varchar('currency', { length: 10 }).notNull().default('EUR'),
  size: real('size'), // square meters
  rooms: integer('rooms'),
  bedrooms: integer('bedrooms'),
  bathrooms: integer('bathrooms'),
  
  // Location
  address: text('address').notNull(),
  city: varchar('city', { length: 255 }).notNull(),
  postalCode: varchar('postal_code', { length: 20 }),
  region: varchar('region', { length: 255 }),
  country: varchar('country', { length: 100 }).notNull().default('Germany'),
  latitude: real('latitude'),
  longitude: real('longitude'),
  
  // Property features
  yearBuilt: integer('year_built'),
  hasGarden: boolean('has_garden').default(false),
  hasBalcony: boolean('has_balcony').default(false),
  hasParking: boolean('has_parking').default(false),
  energyRating: varchar('energy_rating', { length: 10 }),
  
  // SEO and metadata
  slug: varchar('slug', { length: 255 }).unique(),
  metaTitle: varchar('meta_title', { length: 255 }),
  metaDescription: text('meta_description'),
  
  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  publishedAt: timestamp('published_at')
});

// Property images and gallery
export const galleryImages = pgTable('gallery_images', {
  id: serial('id').primaryKey(),
  propertyId: integer('property_id').references(() => properties.id, { onDelete: 'cascade' }),
  filename: varchar('filename', { length: 255 }).notNull(),
  originalName: varchar('original_name', { length: 255 }),
  alt: text('alt'),
  caption: text('caption'),
  sortOrder: integer('sort_order').default(0),
  isPrimary: boolean('is_primary').default(false),
  imageType: varchar('image_type', { length: 50 }).default('standard'), // 'standard', '360', 'floor_plan'
  createdAt: timestamp('created_at').notNull().defaultNow()
});

// Customer inquiries and contact requests
export const inquiries = pgTable('inquiries', {
  id: serial('id').primaryKey(),
  propertyId: integer('property_id').references(() => properties.id, { onDelete: 'set null' }),
  
  // Contact information
  firstName: varchar('first_name', { length: 255 }).notNull(),
  lastName: varchar('last_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  
  // Inquiry details
  subject: varchar('subject', { length: 255 }),
  message: text('message').notNull(),
  inquiryType: varchar('inquiry_type', { length: 100 }).notNull().default('general'), // 'viewing', 'information', 'valuation'
  
  // Status and handling
  status: varchar('status', { length: 50 }).notNull().default('new'), // 'new', 'contacted', 'resolved', 'closed'
  isRead: boolean('is_read').default(false),
  assignedTo: integer('assigned_to').references(() => users.id),
  
  // Metadata
  source: varchar('source', { length: 100 }).default('website'), // 'website', 'phone', 'email', 'referral'
  userAgent: text('user_agent'),
  ipAddress: varchar('ip_address', { length: 45 }),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  resolvedAt: timestamp('resolved_at')
});

// CRM system - customers
export const customers = pgTable('customers', {
  id: serial('id').primaryKey(),
  firstName: varchar('first_name', { length: 255 }).notNull(),
  lastName: varchar('last_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).unique(),
  phone: varchar('phone', { length: 50 }),
  
  // Address
  address: text('address'),
  city: varchar('city', { length: 255 }),
  postalCode: varchar('postal_code', { length: 20 }),
  country: varchar('country', { length: 100 }).default('Germany'),
  
  // Customer details
  dateOfBirth: timestamp('date_of_birth'),
  occupation: varchar('occupation', { length: 255 }),
  notes: text('notes'),
  
  // Customer preferences
  propertyTypes: json('property_types').$type<string[]>(), // preferred property types
  maxBudget: real('max_budget'),
  minBudget: real('min_budget'),
  preferredLocations: json('preferred_locations').$type<string[]>(),
  
  // Status and metadata
  customerType: varchar('customer_type', { length: 50 }).default('prospect'), // 'prospect', 'client', 'former_client'
  source: varchar('source', { length: 100 }),
  tags: json('tags').$type<string[]>(),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  lastContactAt: timestamp('last_contact_at')
});

// CRM system - leads and deals
export const leads = pgTable('leads', {
  id: serial('id').primaryKey(),
  customerId: integer('customer_id')
    .notNull()
    .references(() => customers.id, { onDelete: 'cascade' }),
  propertyId: integer('property_id').references(() => properties.id, { onDelete: 'set null' }),
  
  // Deal information
  stage: varchar('stage', { length: 50 }).notNull().default(CRM_STAGES.NEW),
  dealType: varchar('deal_type', { length: 50 }).notNull().default(DEAL_TYPES.NOT_SPECIFIED),
  value: real('value').notNull().default(0),
  
  // Probability and timeline
  probability: integer('probability').notNull().default(25), // 0-100%
  expectedCloseDate: timestamp('expected_close_date'),
  actualCloseDate: timestamp('actual_close_date'),
  
  // Details
  title: varchar('title', { length: 255 }),
  notes: text('notes'),
  lostReason: text('lost_reason'), // if deal was lost
  
  // Assignment
  assignedTo: integer('assigned_to').references(() => users.id),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Site content management system
export const siteContent = pgTable('site_content', {
  id: serial('id').primaryKey(),
  key: varchar('key', { length: 255 }).notNull().unique(), // 'hero.title', 'about.description'
  value: text('value').notNull(),
  type: varchar('type', { length: 50 }).notNull().default('text'), // 'text', 'html', 'markdown', 'json'
  category: varchar('category', { length: 100 }), // 'hero', 'about', 'services', 'footer'
  language: varchar('language', { length: 10 }).notNull().default('de'), // 'de', 'en'
  isActive: boolean('is_active').default(true),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Newsletter subscribers
export const newsletterSubscribers = pgTable('newsletter_subscribers', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  firstName: varchar('first_name', { length: 255 }),
  lastName: varchar('last_name', { length: 255 }),
  isActive: boolean('is_active').default(true),
  preferences: json('preferences').$type<Record<string, boolean>>(), // newsletter preferences
  source: varchar('source', { length: 100 }).default('website'),
  
  subscribedAt: timestamp('subscribed_at').notNull().defaultNow(),
  unsubscribedAt: timestamp('unsubscribed_at'),
  lastEmailSentAt: timestamp('last_email_sent_at')
});

// Virtual tours and 360° content
export const virtualTours = pgTable('virtual_tours', {
  id: serial('id').primaryKey(),
  propertyId: integer('property_id').references(() => properties.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  
  // Tour configuration
  sceneData: json('scene_data').$type<Record<string, any>>(), // Pannellum scene configuration
  hotspots: json('hotspots').$type<Array<Record<string, any>>>(), // Interactive hotspots
  autoRotate: boolean('auto_rotate').default(true),
  showControls: boolean('show_controls').default(true),
  
  // Files
  previewImage: varchar('preview_image', { length: 255 }),
  tourUrl: varchar('tour_url', { length: 255 }), // URL to access the tour
  
  // Status
  isActive: boolean('is_active').default(true),
  isPublished: boolean('is_published').default(false),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// User sessions for authentication
export const userSessions = pgTable('user_sessions', {
  sid: varchar('sid').primaryKey(),
  sess: json('sess').notNull(),
  expire: timestamp('expire').notNull()
});

// Rate limiting for security
export const rateLimitEntries = pgTable('rate_limit_entries', {
  id: serial('id').primaryKey(),
  clientId: varchar('client_id', { length: 255 }).notNull(),
  limitType: varchar('limit_type', { length: 100 }).notNull(),
  count: integer('count').notNull().default(0),
  resetTime: timestamp('reset_time').notNull(),
  firstAttemptTime: timestamp('first_attempt_time'),
  blocked: boolean('blocked').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Calendar connections for integrations
export const calendarConnections = pgTable('calendar_connections', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  provider: varchar('provider', { length: 50 }).notNull(), // 'google', 'apple', 'outlook'
  providerId: varchar('provider_id', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  tokenExpiresAt: timestamp('token_expires_at'),
  isActive: boolean('is_active').default(true),
  lastSyncAt: timestamp('last_sync_at'),
  syncEnabled: boolean('sync_enabled').default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Calendar appointments
export const appointments = pgTable('appointments', {
  id: serial('id').primaryKey(),
  customerId: integer('customer_id').references(() => customers.id, { onDelete: 'cascade' }),
  propertyId: integer('property_id').references(() => properties.id, { onDelete: 'set null' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  location: varchar('location', { length: 255 }),
  type: varchar('type', { length: 50 }).notNull().default('viewing'), // 'viewing', 'consultation', 'meeting'
  status: varchar('status', { length: 50 }).notNull().default('scheduled'), // 'scheduled', 'confirmed', 'cancelled', 'completed'
  
  // Contact information
  contactName: varchar('contact_name', { length: 255 }),
  contactEmail: varchar('contact_email', { length: 255 }),
  contactPhone: varchar('contact_phone', { length: 50 }),
  
  // Internal notes
  notes: text('notes'),
  reminderSent: boolean('reminder_sent').default(false),
  
  // Assignment
  assignedTo: integer('assigned_to').references(() => users.id),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Calendar events (for external calendar sync)
export const calendarEvents = pgTable('calendar_events', {
  id: serial('id').primaryKey(),
  calendarConnectionId: integer('calendar_connection_id').references(() => calendarConnections.id, { onDelete: 'cascade' }),
  appointmentId: integer('appointment_id').references(() => appointments.id, { onDelete: 'cascade' }),
  externalId: varchar('external_id', { length: 255 }).notNull(), // ID from external calendar
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  location: varchar('location', { length: 255 }),
  status: varchar('status', { length: 50 }).notNull(),
  lastModified: timestamp('last_modified'),
  syncStatus: varchar('sync_status', { length: 50 }).default('synced'), // 'synced', 'pending', 'error'
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Calendar sync logs
export const calendarSyncLogs = pgTable('calendar_sync_logs', {
  id: serial('id').primaryKey(),
  calendarConnectionId: integer('calendar_connection_id').references(() => calendarConnections.id, { onDelete: 'cascade' }),
  syncType: varchar('sync_type', { length: 50 }).notNull(), // 'import', 'export', 'update', 'delete'
  status: varchar('status', { length: 50 }).notNull(), // 'success', 'error', 'warning'
  message: text('message'),
  eventCount: integer('event_count').default(0),
  errorDetails: json('error_details'),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

// Design settings for theme customization
export const designSettings = pgTable('design_settings', {
  id: serial('id').primaryKey(),
  key: varchar('key', { length: 255 }).notNull().unique(),
  value: json('value').notNull(),
  category: varchar('category', { length: 100 }), // 'colors', 'fonts', 'layout'
  description: text('description'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Validation schemas using Zod
import { z } from 'zod';

export const userSchema = z.object({
  email: z.string().email(),
  passwordHash: z.string().min(1),
  name: z.string().min(1),
  role: z.string().default('admin'),
  isActive: z.boolean().default(true)
});

export const propertySchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.string(),
  price: z.number().positive(),
  currency: z.string().default('EUR'),
  address: z.string().min(1),
  city: z.string().min(1),
  country: z.string().default('Germany')
});

export const inquirySchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  message: z.string().min(1),
  inquiryType: z.string().default('general')
});

export const leadSchema = z.object({
  customerId: z.number().positive(),
  stage: z.enum(Object.values(CRM_STAGES) as [string, ...string[]]),
  dealType: z.enum(Object.values(DEAL_TYPES) as [string, ...string[]]),
  value: z.number().min(0),
  probability: z.number().min(0).max(100),
  expectedCloseDate: z.string().optional(),
  notes: z.string().optional()
});

// Export types
export type User = z.infer<typeof userSchema>;
export type Property = z.infer<typeof propertySchema>;
export type Inquiry = z.infer<typeof inquirySchema>;
export type Lead = z.infer<typeof leadSchema>;

// Additional types for the application
export type CalendarConnection = typeof calendarConnections.$inferSelect;
export type InsertCalendarConnection = typeof calendarConnections.$inferInsert;

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = typeof appointments.$inferInsert;

export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type InsertCalendarEvent = typeof calendarEvents.$inferInsert;

export type CalendarSyncLog = typeof calendarSyncLogs.$inferSelect;
export type InsertCalendarSyncLog = typeof calendarSyncLogs.$inferInsert;

export type DesignSettings = typeof designSettings.$inferSelect;
export type InsertDesignSettings = typeof designSettings.$inferInsert;

// Table exports for relationships
export type UserTable = typeof users;
export type PropertyTable = typeof properties;
export type InquiryTable = typeof inquiries;
export type CustomerTable = typeof customers;
export type LeadTable = typeof leads;