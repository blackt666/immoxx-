import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Social Media Posts
export const socialMediaPosts = sqliteTable('social_media_posts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  propertyId: text('property_id'),
  
  // Content
  title: text('title').notNull(),
  content: text('content').notNull(),
  mediaUrls: text('media_urls', { mode: 'json' }).$type<string[]>(),
  mediaType: text('media_type').$type<'image' | 'video' | 'carousel'>(),
  
  // Platforms
  platforms: text('platforms', { mode: 'json' }).$type<string[]>().notNull(),
  platformSpecificContent: text('platform_specific_content', { mode: 'json' }),
  
  // Scheduling
  scheduledAt: integer('scheduled_at', { mode: 'timestamp' }),
  publishedAt: integer('published_at', { mode: 'timestamp' }),
  status: text('status').$type<'draft' | 'scheduled' | 'published' | 'failed'>().notNull().default('draft'),
  
  // Results
  publishResults: text('publish_results', { mode: 'json' }),
  analytics: text('analytics', { mode: 'json' }),
  
  // Metadata
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Social Media Accounts (Connected platforms)
export const socialMediaAccounts = sqliteTable('social_media_accounts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  platform: text('platform').$type<'facebook' | 'instagram' | 'linkedin' | 'tiktok'>().notNull(),
  
  // Account Info
  accountId: text('account_id').notNull(),
  accountName: text('account_name').notNull(),
  accountType: text('account_type'),
  
  // Authentication
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token'),
  tokenExpiresAt: integer('token_expires_at', { mode: 'timestamp' }),
  
  // Status
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  lastSyncAt: integer('last_sync_at', { mode: 'timestamp' }),
  
  // Metadata
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Social Media Analytics
export const socialMediaAnalytics = sqliteTable('social_media_analytics', {
  id: text('id').primaryKey(),
  postId: text('post_id').notNull(),
  platform: text('platform').notNull(),
  
  // Metrics
  impressions: integer('impressions').default(0),
  reach: integer('reach').default(0),
  engagement: integer('engagement').default(0),
  likes: integer('likes').default(0),
  comments: integer('comments').default(0),
  shares: integer('shares').default(0),
  clicks: integer('clicks').default(0),
  saves: integer('saves').default(0),
  
  // Metadata
  fetchedAt: integer('fetched_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

// AI Generations
export const aiGenerations = sqliteTable('ai_generations', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  
  // Provider & Type
  provider: text('provider').$type<'deepseek' | 'openai' | 'google' | 'qwen'>().notNull(),
  generationType: text('generation_type').$type<'text' | 'image' | 'video'>().notNull(),
  
  // Input
  prompt: text('prompt').notNull(),
  context: text('context', { mode: 'json' }),
  parameters: text('parameters', { mode: 'json' }),
  
  // Output
  result: text('result', { mode: 'json' }),
  resultUrls: text('result_urls', { mode: 'json' }).$type<string[]>(),
  
  // Metadata
  status: text('status').$type<'pending' | 'generating' | 'completed' | 'failed'>().notNull().default('pending'),
  errorMessage: text('error_message'),
  tokensUsed: integer('tokens_used'),
  costUSD: real('cost_usd'),
  generationTime: integer('generation_time'),
  
  // Relations
  propertyId: text('property_id'),
  socialMediaPostId: text('social_media_post_id'),
  
  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
});

// AI Provider Settings
export const aiProviderSettings = sqliteTable('ai_provider_settings', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  provider: text('provider').notNull(),
  
  // Configuration
  apiKey: text('api_key'),
  isEnabled: integer('is_enabled', { mode: 'boolean' }).default(true),
  defaultSettings: text('default_settings', { mode: 'json' }),
  
  // Usage Tracking
  totalGenerations: integer('total_generations').default(0),
  totalCostUSD: real('total_cost_usd').default(0),
  monthlyBudgetUSD: real('monthly_budget_usd'),
  
  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

// 3D Models
export const threeDModels = sqliteTable('3d_models', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  propertyId: text('property_id'),
  
  // Model Info
  name: text('name').notNull(),
  description: text('description'),
  modelType: text('model_type').$type<'floor_plan' | 'exterior' | 'interior' | 'full_building'>(),
  
  // Files
  sourceFile: text('source_file'),
  modelUrl: text('model_url').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  alternateFormats: text('alternate_formats', { mode: 'json' }),
  
  // Metadata
  polyCount: integer('poly_count'),
  fileSize: integer('file_size'),
  dimensions: text('dimensions', { mode: 'json' }),
  
  // Generation
  generationMethod: text('generation_method').$type<'upload' | 'ai' | 'template' | 'manual'>(),
  generationParams: text('generation_params', { mode: 'json' }),
  
  // Status
  status: text('status').$type<'processing' | 'completed' | 'failed'>().notNull().default('processing'),
  
  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Projects (Project Management)
export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  propertyId: text('property_id'),
  
  // Project Info
  name: text('name').notNull(),
  description: text('description'),
  projectType: text('project_type').$type<'acquisition' | 'marketing' | 'transaction' | 'custom'>(),
  
  // Timeline
  startDate: integer('start_date', { mode: 'timestamp' }),
  endDate: integer('end_date', { mode: 'timestamp' }),
  status: text('status').$type<'planning' | 'active' | 'completed' | 'on_hold'>().notNull().default('planning'),
  
  // Team
  ownerId: text('owner_id').notNull(),
  teamMembers: text('team_members', { mode: 'json' }).$type<string[]>(),
  
  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Project Tasks
export const projectTasks = sqliteTable('project_tasks', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull(),
  
  // Task Info
  title: text('title').notNull(),
  description: text('description'),
  priority: text('priority').$type<'low' | 'medium' | 'high' | 'urgent'>().notNull().default('medium'),
  status: text('status').$type<'todo' | 'in_progress' | 'review' | 'done'>().notNull().default('todo'),
  
  // Assignment
  assignedTo: text('assigned_to'),
  dueDate: integer('due_date', { mode: 'timestamp' }),
  
  // Relationships
  parentTaskId: text('parent_task_id'),
  dependencies: text('dependencies', { mode: 'json' }).$type<string[]>(),
  
  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
});

// Documents
export const documents = sqliteTable('documents', {
  id: text('id').primaryKey(),
  propertyId: text('property_id'),
  leadId: text('lead_id'),
  
  // Document Info
  name: text('name').notNull(),
  category: text('category').$type<'contract' | 'energy_cert' | 'floor_plan' | 'photos' | 'other'>(),
  fileUrl: text('file_url').notNull(),
  fileSize: integer('file_size'),
  mimeType: text('mime_type'),
  
  // Metadata
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
  isConfidential: integer('is_confidential', { mode: 'boolean' }).default(false),
  tags: text('tags', { mode: 'json' }).$type<string[]>(),
  
  // OCR
  ocrText: text('ocr_text'),
  ocrProcessed: integer('ocr_processed', { mode: 'boolean' }).default(false),
  
  // Timestamps
  uploadedAt: integer('uploaded_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
});
