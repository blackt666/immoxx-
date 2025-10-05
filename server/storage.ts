import { db, pool } from "./db.js";
import * as schema from "@shared/schema";
import type { DesignSettings } from "@shared/schema";
import { eq, desc, and, sql, like } from "drizzle-orm";
import fs from "fs";
import path from "path";
import { PerformanceMonitor } from "./lib/performance-monitor.js";

export interface Property {
  id: string;
  title: string;
  description?: string;
  type: string;
  location: string;
  price: number;
  size: number;
  rooms: number;
  bathrooms: number;
  bedrooms: number;
  status: string;
  features: string[];
  images: string[];
  createdAt: string;
  updatedAt: string;
}

export interface GalleryImage {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  alt?: string;
  category: string;
  propertyId?: string;
  size: number;
  uploadedAt: string;
}

export interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  propertyId?: string;
  status: string;
  createdAt: string;
}

class Storage {
  private initialized = false;
  
  // Simple in-memory cache with TTL
  private cache = new Map<string, { data: any; expires: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  
  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) {
      PerformanceMonitor.trackCacheMiss();
      return null;
    }
    
    if (Date.now() > cached.expires) {
      this.cache.delete(key);
      PerformanceMonitor.trackCacheMiss();
      return null;
    }
    
    PerformanceMonitor.trackCacheHit();
    return cached.data as T;
  }
  
  private setCache(key: string, data: any, ttl?: number): void {
    const expires = Date.now() + (ttl || this.CACHE_TTL);
    this.cache.set(key, { data, expires });
    
    // Update cache size for performance monitoring
    PerformanceMonitor.updateCacheSize(this.cache.size);
    
    // Simple cache cleanup - remove expired entries when cache gets large
    if (this.cache.size > 1000) {
      const now = Date.now();
      for (const [key, value] of this.cache.entries()) {
        if (now > value.expires) {
          this.cache.delete(key);
        }
      }
      // Update cache size after cleanup
      PerformanceMonitor.updateCacheSize(this.cache.size);
    }
  }
  
  private clearCacheByPattern(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  // Batch Operations for Performance
  async batchInsertProperties(properties: Partial<Property>[]): Promise<{ success: number; failed: number; errors: any[] }> {
    if (properties.length === 0) return { success: 0, failed: 0, errors: [] };
    
    const batchSize = 100; // Process in batches of 100
    let success = 0;
    let failed = 0;
    const errors: any[] = [];

    try {
      // Process in batches to avoid overwhelming the database
      for (let i = 0; i < properties.length; i += batchSize) {
        const batch = properties.slice(i, i + batchSize);
        
        try {
          await PerformanceMonitor.timeDbOperation('batchInsertProperties', async () => {
            await db.transaction(async (tx) => {
              const insertData = batch.map(prop => ({
                title: prop.title!,
                description: prop.description,
                type: prop.type!,
                location: prop.location!,
                price: prop.price?.toString(),
                area: prop.size,
                rooms: prop.rooms,
                bathrooms: prop.bathrooms,
                bedrooms: prop.bedrooms,
                status: prop.status || 'available',
                features: prop.features || [],
                images: prop.images || []
              }));

              await tx.insert(schema.properties).values(insertData);
              success += batch.length;
            });
          });
        } catch (error) {
          console.error(`❌ Batch insert failed for properties ${i}-${i + batch.length - 1}:`, error);
          failed += batch.length;
          errors.push({ batch: i, error: error instanceof Error ? error.message : String(error) });
        }
      }

      // Clear cache since we added new properties
      this.clearCacheByPattern('properties');
      this.clearCacheByPattern('dashboard_stats');

      return { success, failed, errors };
    } catch (error) {
      console.error('❌ batchInsertProperties error:', error);
      return { success: 0, failed: properties.length, errors: [error] };
    }
  }

  async batchInsertInquiries(inquiries: Partial<Inquiry>[]): Promise<{ success: number; failed: number; errors: any[] }> {
    if (inquiries.length === 0) return { success: 0, failed: 0, errors: [] };
    
    const batchSize = 100;
    let success = 0;
    let failed = 0;
    const errors: any[] = [];

    try {
      for (let i = 0; i < inquiries.length; i += batchSize) {
        const batch = inquiries.slice(i, i + batchSize);
        
        try {
          await PerformanceMonitor.timeDbOperation('batchInsertInquiries', async () => {
            await db.transaction(async (tx) => {
              const insertData = batch.map(inquiry => ({
                name: inquiry.name!,
                email: inquiry.email!,
                phone: inquiry.phone,
                subject: inquiry.subject!,
                message: inquiry.message!,
                propertyId: inquiry.propertyId,
                status: 'new'
              }));

              await tx.insert(schema.inquiries).values(insertData);
              success += batch.length;
            });
          });
        } catch (error) {
          console.error(`❌ Batch insert failed for inquiries ${i}-${i + batch.length - 1}:`, error);
          failed += batch.length;
          errors.push({ batch: i, error: error instanceof Error ? error.message : String(error) });
        }
      }

      // Clear cache since we added new inquiries
      this.clearCacheByPattern('inquiries');
      this.clearCacheByPattern('dashboard_stats');

      return { success, failed, errors };
    } catch (error) {
      console.error('❌ batchInsertInquiries error:', error);
      return { success: 0, failed: inquiries.length, errors: [error] };
    }
  }

  async batchInsertCustomers(customers: any[]): Promise<{ success: number; failed: number; errors: any[] }> {
    if (customers.length === 0) return { success: 0, failed: 0, errors: [] };
    
    const batchSize = 100;
    let success = 0;
    let failed = 0;
    const errors: any[] = [];

    try {
      for (let i = 0; i < customers.length; i += batchSize) {
        const batch = customers.slice(i, i + batchSize);
        
        try {
          await PerformanceMonitor.timeDbOperation('batchInsertCustomers', async () => {
            await db.transaction(async (tx) => {
              const insertData = batch.map(customer => ({
                name: customer.name,
                email: customer.email,
                phone: customer.phone,
                type: customer.type || 'lead',
                source: customer.source,
                leadScore: customer.leadScore || 50,
                status: customer.status || 'new',
                budgetMin: customer.budgetMin,
                budgetMax: customer.budgetMax,
                preferredLocations: customer.preferredLocations || [],
                propertyTypes: customer.propertyTypes || [],
                timeline: customer.timeline,
                address: customer.address,
                occupation: customer.occupation,
                company: customer.company,
                notes: customer.notes,
                tags: customer.tags || []
              }));

              await tx.insert(schema.customers).values(insertData);
              success += batch.length;
            });
          });
        } catch (error) {
          console.error(`❌ Batch insert failed for customers ${i}-${i + batch.length - 1}:`, error);
          failed += batch.length;
          errors.push({ batch: i, error: error instanceof Error ? error.message : String(error) });
        }
      }

      // Clear cache since we added new customers
      this.clearCacheByPattern('customers');
      this.clearCacheByPattern('dashboard_stats');

      return { success, failed, errors };
    } catch (error) {
      console.error('❌ batchInsertCustomers error:', error);
      return { success: 0, failed: customers.length, errors: [error] };
    }
  }

  async ensureInitialized() {
    if (this.initialized) return;

    try {
      console.log('🔄 Initializing database connection...');
      // Test connection
      await pool.query('SELECT CURRENT_TIMESTAMP');
      this.initialized = true;
      console.log('✅ Database connection established');

      // Auto-import existing images immediately
      await this.importExistingImages();
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      console.log('🔄 Continuing with fallback mode...');
      this.initialized = true; // Set to true to prevent infinite retry
    }
  }

  // Properties - Enhanced with configurable pagination
  async getAllProperties(options: { 
    limit?: number; 
    offset?: number; 
    status?: string;
    includeDeleted?: boolean;
  } = {}): Promise<{ properties: Property[]; total: number; hasMore: boolean }> {
    // Check cache first
    const cacheKey = `properties_all_${JSON.stringify(options)}`;
    const cached = this.getFromCache<{ properties: Property[]; total: number; hasMore: boolean }>(cacheKey);
    if (cached) {
      return cached;
    }
    
    try {
      const result = await PerformanceMonitor.timeDbOperation('getAllProperties', async () => {
        const { limit = 100, offset = 0, status = 'available', includeDeleted = false } = options;
        
        let whereConditions = [];
        if (!includeDeleted) {
          whereConditions.push(sql`${schema.properties.status} != 'deleted'`);
        }
        if (status && status !== 'all') {
          whereConditions.push(eq(schema.properties.status, status));
        }

        const whereClause = whereConditions.length > 0 
          ? whereConditions.reduce((acc, condition) => sql`${acc} AND ${condition}`) 
          : undefined;

        const [properties, totalResult] = await Promise.race([
          Promise.all([
            db.select().from(schema.properties)
              .where(whereClause)
              .orderBy(desc(schema.properties.createdAt))
              .limit(limit + 1), // Get one extra to check if there are more
            db.select({ count: sql<number>`count(*)` })
              .from(schema.properties)
              .where(whereClause)
          ]),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Query timeout')), 5000)
          )
        ]);

        const hasMore = properties.length > limit;
        const resultProperties = hasMore ? properties.slice(0, limit) : properties;

        return {
          properties: resultProperties.map(this.mapProperty),
          total: Number(totalResult[0].count),
          hasMore
        };
      });
      
      // Cache successful results
      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('❌ getAllProperties error:', error);
      return {
        properties: this.getFallbackProperties(),
        total: 3,
        hasMore: false
      };
    }
  }

  async getProperties(filters: {
    type?: string;
    location?: string;
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    // Check cache first
    const cacheKey = `properties_filtered_${JSON.stringify(filters)}`;
    const cached = this.getFromCache<any>(cacheKey);
    if (cached) {
      return cached;
    }
    
    try {
      const result = await PerformanceMonitor.timeDbOperation('getProperties', async () => {
        const { limit = 12, offset = 0 } = filters;

        let query = db.select().from(schema.properties);
        const conditions = [];

        if (filters.status) {
          conditions.push(eq(schema.properties.status, filters.status));
        }
        if (filters.type) {
          conditions.push(eq(schema.properties.type, filters.type));
        }
        if (filters.location) {
          conditions.push(like(schema.properties.location, `%${filters.location}%`));
        }
        if (filters.search) {
          const searchTerm = `%${filters.search}%`;
          conditions.push(
            sql`${schema.properties.title} ILIKE ${searchTerm} OR ${schema.properties.description} ILIKE ${searchTerm}`
          );
        }

        if (conditions.length > 0) {
          query = query.where(and(...conditions)) as any;
        }

        const [properties, totalResult] = await Promise.all([
          query.orderBy(desc(schema.properties.createdAt))
            .limit(limit)
            .offset(offset),
          db.select({ count: sql<number>`count(*)` }).from(schema.properties)
        ]);

        return {
          properties: properties.map(this.mapProperty),
          total: Number(totalResult[0].count),
          page: Math.floor(offset / limit) + 1,
          limit
        };
      });
      
      // Cache successful results
      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('❌ getProperties error:', error);
      return {
        properties: this.getFallbackProperties(),
        total: 3,
        page: 1,
        limit: filters.limit || 12
      };
    }
  }

  async getProperty(id: string): Promise<Property | null> {
    // Check cache first
    const cacheKey = `property_${id}`;
    const cached = this.getFromCache<Property | null>(cacheKey);
    if (cached) {
      return cached;
    }
    
    try {
      const result = await PerformanceMonitor.timeDbOperation('getProperty', async () => {
        const [property] = await db.select()
          .from(schema.properties)
          .where(eq(schema.properties.id, id));

        return property ? this.mapProperty(property) : null;
      });
      
      // Cache successful results (including null)
      this.setCache(cacheKey, result, 10 * 60 * 1000); // 10 minutes for individual properties
      return result;
    } catch (error) {
      console.error('❌ getProperty error:', error);
      return null;
    }
  }

  async createProperty(data: Partial<Property>): Promise<Property> {
    const [property] = await db.insert(schema.properties)
      .values({
        title: data.title!,
        description: data.description,
        type: data.type!,
        location: data.location || data.address || '',
        city: data.city || '',
        price: parseFloat(data.price?.toString() || '0'),
        size: data.size,
        rooms: data.rooms,
        bathrooms: data.bathrooms,
        bedrooms: data.bedrooms,
        status: data.status || 'active'
      })
      .returning();

    return this.mapProperty(property);
  }

  async updateProperty(id: string, data: Partial<Property>): Promise<Property> {
    const updateData: any = { ...data };
    // Features are stored as jsonb, no need to stringify
    updateData.updatedAt = new Date();
    
    // Remove createdAt from update data as it shouldn't be updated
    delete updateData.createdAt;
    
    const [property] = await db.update(schema.properties)
      .set(updateData)
      .where(eq(schema.properties.id, id))
      .returning();

    return this.mapProperty(property);
  }

  async deleteProperty(id: string): Promise<void> {
    await db.update(schema.properties)
      .set({ status: 'deleted' })
      .where(eq(schema.properties.id, id));
  }

  // Gallery Images - Enhanced with better pagination and filtering
  async getGalleryImages(options: {
    limit?: number;
    offset?: number;
    category?: string;
    propertyId?: string;
    search?: string;
  } = {}): Promise<{ images: GalleryImage[]; total: number; hasMore: boolean }> {
    try {
      const { limit = 100, offset = 0, category, propertyId, search } = options;
      
      let whereConditions = [];

      if (category) {
        whereConditions.push(eq(schema.galleryImages.category, category));
      }
      if (propertyId) {
        whereConditions.push(eq(schema.galleryImages.propertyId, propertyId));
      }
      if (search) {
        const searchTerm = `%${search}%`;
        whereConditions.push(
          sql`${schema.galleryImages.filename} ILIKE ${searchTerm} OR 
              ${schema.galleryImages.originalName} ILIKE ${searchTerm} OR
              ${schema.galleryImages.alt} ILIKE ${searchTerm}`
        );
      }

      const whereClause = whereConditions.length > 0 
        ? whereConditions.reduce((acc, condition) => sql`${acc} AND ${condition}`) 
        : undefined;

      const [images, totalResult] = await Promise.all([
        db.select().from(schema.galleryImages)
          .where(whereClause)
          .limit(limit + 1), // Get one extra to check if there are more
        db.select({ count: sql<number>`count(*)` })
          .from(schema.galleryImages)
          .where(whereClause)
      ]);

      const hasMore = images.length > limit;
      const resultImages = hasMore ? images.slice(0, limit) : images;

      return {
        images: resultImages.map(this.mapGalleryImage),
        total: Number(totalResult[0].count),
        hasMore
      };
    } catch (error) {
      console.error('❌ getGalleryImages error:', error);
      return { images: [], total: 0, hasMore: false };
    }
  }

  async getGalleryImage(id: string): Promise<GalleryImage | null> {
    try {
      const [image] = await db.select()
        .from(schema.galleryImages)
        .where(eq(schema.galleryImages.id, id));

      return image ? this.mapGalleryImage(image) : null;
    } catch (error) {
      console.error('❌ getGalleryImage error:', error);
      return null;
    }
  }

  async createGalleryImage(data: {
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    category?: string;
    alt?: string;
    propertyId?: string;
  }): Promise<GalleryImage> {
    const [image] = await db.insert(schema.galleryImages)
      .values({
        filename: data.filename,
        originalName: data.originalName,
        url: `/uploads/${data.filename}`,
        alt: data.alt || data.originalName,
        category: data.category || 'general',
        propertyId: data.propertyId || null,
        size: data.size
      })
      .returning();

    return this.mapGalleryImage(image);
  }

  async updateGalleryImage(id: string, data: {
    alt?: string;
    category?: string;
    propertyId?: string;
  }): Promise<GalleryImage> {
    const [updatedImage] = await db.update(schema.galleryImages)
      .set({
        alt: data.alt,
        category: data.category,
        propertyId: data.propertyId
      })
      .where(eq(schema.galleryImages.id, id))
      .returning();

    return this.mapGalleryImage(updatedImage);
  }

  async deleteGalleryImage(id: string): Promise<void> {
    await db.delete(schema.galleryImages)
      .where(eq(schema.galleryImages.id, id));
  }

  // Inquiries - Enhanced with filtering and better pagination
  async getInquiries(options: { 
    limit?: number; 
    offset?: number; 
    status?: string;
    propertyId?: string;
    priority?: string;
    search?: string;
  } = {}) {
    const { limit = 50, offset = 0, status, propertyId, priority, search } = options;

    // Check cache first
    const cacheKey = `inquiries_${JSON.stringify(options)}`;
    const cached = this.getFromCache<any>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const result = await PerformanceMonitor.timeDbOperation('getInquiries', async () => {
        let whereConditions = [];

        if (status) {
          whereConditions.push(eq(schema.inquiries.status, status));
        }
        if (propertyId) {
          whereConditions.push(eq(schema.inquiries.propertyId, propertyId));
        }
        if (priority) {
          whereConditions.push(eq(schema.inquiries.priority, priority));
        }
        if (search) {
          const searchTerm = `%${search}%`;
          whereConditions.push(
            sql`${schema.inquiries.name} ILIKE ${searchTerm} OR 
                ${schema.inquiries.subject} ILIKE ${searchTerm} OR 
                ${schema.inquiries.message} ILIKE ${searchTerm} OR
                ${schema.inquiries.email} ILIKE ${searchTerm}`
          );
        }

        const whereClause = whereConditions.length > 0 
          ? whereConditions.reduce((acc, condition) => sql`${acc} AND ${condition}`) 
          : undefined;

        const [inquiries, totalResult] = await Promise.all([
          db.select().from(schema.inquiries)
            .where(whereClause)
            .orderBy(desc(schema.inquiries.createdAt))
            .limit(limit)
            .offset(offset),
          db.select({ count: sql<number>`count(*)` })
            .from(schema.inquiries)
            .where(whereClause)
        ]);

        return {
          inquiries: inquiries.map(this.mapInquiry),
          total: Number(totalResult[0].count),
          page: Math.floor(offset / limit) + 1,
          limit,
          hasMore: inquiries.length === limit
        };
      });
      
      // Cache successful results
      this.setCache(cacheKey, result, 2 * 60 * 1000); // 2 minutes for inquiries (shorter cache for more dynamic data)
      return result;
    } catch (error) {
      console.error('❌ getInquiries error:', error);
      return { inquiries: [], total: 0, page: 1, limit, hasMore: false };
    }
  }

  async createInquiry(data: Partial<Inquiry>): Promise<Inquiry> {
    const [inquiry] = await db.insert(schema.inquiries)
      .values({
        name: data.name!,
        email: data.email!,
        phone: data.phone,
        subject: data.subject!,
        message: data.message!,
        propertyId: data.propertyId,
        status: 'new'
      })
      .returning();

    return this.mapInquiry(inquiry);
  }

  // Users
  async getUserByUsername(username: string) {
    try {
      const [user] = await db.select()
        .from(schema.users)
        .where(eq(schema.users.username, username));

      return user;
    } catch (error) {
      console.error('❌ getUserByUsername error:', error);
      return null;
    }
  }

  async getUser(id: string) {
    try {
      const [user] = await db.select()
        .from(schema.users)
        .where(eq(schema.users.id, id));

      return user;
    } catch (error) {
      console.error('❌ getUser error:', error);
      return null;
    }
  }

  async updateUser(id: string, data: any) {
    const [user] = await db.update(schema.users)
      .set(data)
      .where(eq(schema.users.id, id))
      .returning();

    return user;
  }

  // Dashboard Stats (Enhanced for CRM) - With caching
  async getDashboardStats(useCache: boolean = true) {
    const cacheKey = 'dashboard_stats';
    
    if (useCache) {
      const cached = this.getFromCache<any>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      const [propertiesCount, imagesCount, inquiriesCount, newInquiriesCount, customersCount, appointmentsCount, leadsCount] = await Promise.all([
        db.select({ count: sql<number>`count(*)` })
          .from(schema.properties)
          .where(eq(schema.properties.status, 'available')),
        db.select({ count: sql<number>`count(*)` })
          .from(schema.galleryImages),
        db.select({ count: sql<number>`count(*)` })
          .from(schema.inquiries),
        db.select({ count: sql<number>`count(*)` })
          .from(schema.inquiries)
          .where(eq(schema.inquiries.status, 'new')),
        db.select({ count: sql<number>`count(*)` })
          .from(schema.customers),
        db.select({ count: sql<number>`count(*)` })
          .from(schema.appointments)
          .where(eq(schema.appointments.status, 'scheduled')),
        db.select({ count: sql<number>`count(*)` })
          .from(schema.leads)
          .where(sql`stage NOT IN ('won', 'lost')`)
      ]);

      const stats = {
        propertiesCount: Number(propertiesCount[0].count),
        imagesCount: Number(imagesCount[0].count),
        inquiriesCount: Number(inquiriesCount[0].count),
        newInquiriesCount: Number(newInquiriesCount[0].count),
        customersCount: Number(customersCount[0].count),
        scheduledAppointmentsCount: Number(appointmentsCount[0].count),
        activeLeadsCount: Number(leadsCount[0].count),
        lastUpdated: new Date().toISOString()
      };

      // Cache for 2 minutes since dashboard stats change frequently
      this.setCache(cacheKey, stats, 2 * 60 * 1000);
      
      return stats;
    } catch (error) {
      console.error('❌ getDashboardStats error:', error);
      return {
        propertiesCount: 0,
        imagesCount: 0,
        inquiriesCount: 0,
        newInquiriesCount: 0,
        customersCount: 0,
        scheduledAppointmentsCount: 0,
        activeLeadsCount: 0
      };
    }
  }

  // ========================================
  // CRM FUNCTIONS - CUSTOMERS
  // ========================================

  // Get all customers with filtering and pagination
  async getCustomers(options: { 
    limit?: number; 
    offset?: number; 
    type?: string; 
    status?: string; 
    search?: string;
    assignedAgent?: string;
  } = {}) {
    const { limit = 10, offset = 0, type, status, search, assignedAgent } = options;

    try {
      let whereConditions = [];

      if (type) {
        whereConditions.push(eq(schema.customers.type, type));
      }
      if (status) {
        whereConditions.push(eq(schema.customers.status, status));
      }
      if (assignedAgent) {
        whereConditions.push(eq(schema.customers.assignedAgent, assignedAgent));
      }
      if (search) {
        whereConditions.push(
          sql`(
            ${schema.customers.name} ILIKE ${`%${search}%`} OR 
            ${schema.customers.email} ILIKE ${`%${search}%`} OR
            ${schema.customers.phone} ILIKE ${`%${search}%`}
          )`
        );
      }

      const whereClause = whereConditions.length > 0 ? sql`${whereConditions.reduce((acc, condition) => sql`${acc} AND ${condition}`)}` : undefined;

      const [customers, totalResult] = await Promise.all([
        db.select()
          .from(schema.customers)
          .where(whereClause)
          .orderBy(desc(schema.customers.createdAt))
          .limit(limit)
          .offset(offset),
        db.select({ count: sql<number>`count(*)` })
          .from(schema.customers)
          .where(whereClause)
      ]);

      return {
        customers: customers.map(this.mapCustomer),
        total: Number(totalResult[0].count)
      };
    } catch (error) {
      console.error('❌ getCustomers error:', error);
      return { customers: [], total: 0 };
    }
  }

  // Create new customer
  async createCustomer(data: any) {
    try {
      const [customer] = await db.insert(schema.customers)
        .values({
          name: data.name,
          email: data.email,
          phone: data.phone || null,
          type: data.type || 'lead',
          source: data.source || null,
          status: data.status || 'new',
          leadScore: data.leadScore || 50,
          assignedAgent: data.assignedAgent || null,
          budgetMin: data.budgetMin || null,
          budgetMax: data.budgetMax || null,
          preferredLocations: data.preferredLocations || [],
          propertyTypes: data.propertyTypes || [],
          timeline: data.timeline || null,
          address: data.address || null,
          occupation: data.occupation || null,
          company: data.company || null,
          notes: data.notes || null,
          tags: data.tags || [],
          lastContactDate: new Date(),
          nextFollowUp: data.nextFollowUp || null
        })
        .returning();

      return this.mapCustomer(customer);
    } catch (error) {
      console.error('❌ createCustomer error:', error);
      throw error;
    }
  }

  // Get single customer with related data
  async getCustomer(id: string) {
    try {
      const [customer] = await db.select()
        .from(schema.customers)
        .where(eq(schema.customers.id, id));

      if (!customer) return null;
      return this.mapCustomer(customer);
    } catch (error) {
      console.error('❌ getCustomer error:', error);
      return null;
    }
  }

  // Update customer
  async updateCustomer(id: string, data: any) {
    try {
      const [customer] = await db.update(schema.customers)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(schema.customers.id, id))
        .returning();

      return customer ? this.mapCustomer(customer) : null;
    } catch (error) {
      console.error('❌ updateCustomer error:', error);
      throw error;
    }
  }

  // Delete customer
  async deleteCustomer(id: string) {
    try {
      await db.delete(schema.customers)
        .where(eq(schema.customers.id, id));
      return true;
    } catch (error) {
      console.error('❌ deleteCustomer error:', error);
      throw error;
    }
  }

  // ========================================
  // CRM FUNCTIONS - APPOINTMENTS
  // ========================================

  async getAppointments(options: { limit?: number; offset?: number; agentId?: string; status?: string; date?: string } = {}) {
    const { limit = 10, offset = 0, agentId, status, date } = options;

    try {
      let whereConditions = [];

      if (agentId) {
        whereConditions.push(eq(schema.appointments.agentId, agentId));
      }
      if (status) {
        whereConditions.push(eq(schema.appointments.status, status));
      }
      if (date) {
        whereConditions.push(sql`DATE(${schema.appointments.scheduledDate}) = ${date}`);
      }

      const whereClause = whereConditions.length > 0 
        ? whereConditions.reduce((acc, condition) => sql`${acc} AND ${condition}`) 
        : undefined;

      const [appointments, totalResult] = await Promise.all([
        db.select()
          .from(schema.appointments)
          .where(whereClause)
          .orderBy(desc(schema.appointments.scheduledDate))
          .limit(limit)
          .offset(offset),
        db.select({ count: sql<number>`count(*)` })
          .from(schema.appointments)
          .where(whereClause)
      ]);

      return {
        appointments: appointments.map(this.mapAppointment),
        total: Number(totalResult[0].count)
      };
    } catch (error) {
      console.error('❌ getAppointments error:', error);
      return { appointments: [], total: 0 };
    }
  }

  async createAppointment(data: any) {
    try {
      const [appointment] = await db.insert(schema.appointments)
        .values({
          title: data.title,
          type: data.type,
          status: data.status || 'scheduled',
          customerId: data.customerId || null,
          agentId: data.agentId,
          propertyId: data.propertyId || null,
          scheduledDate: new Date(data.scheduledDate),
          endDate: data.endDate ? new Date(data.endDate) : null,
          duration: data.duration || 60,
          location: data.location || null,
          address: data.address || null,
          notes: data.notes || null,
          preparation: data.preparation || null,
          reminderSettings: data.reminderSettings || null
        })
        .returning();

      return this.mapAppointment(appointment);
    } catch (error) {
      console.error('❌ createAppointment error:', error);
      throw error;
    }
  }

  // ========================================
  // BACKUP DATA METHODS
  // ========================================

  // Get all users for backup (excluding sensitive fields)
  async getAllUsers() {
    try {
      const users = await db.select({
        id: schema.users.id,
        username: schema.users.username,
        email: schema.users.email,
        role: schema.users.role,
        name: schema.users.name,
        createdAt: schema.users.createdAt,
        updatedAt: schema.users.updatedAt
      }).from(schema.users);
      return users;
    } catch (error) {
      console.error('❌ getAllUsers error:', error);
      return [];
    }
  }

  // Get all newsletters for backup
  async getAllNewsletters() {
    try {
      const newsletters = await db.select().from(schema.newsletters);
      return newsletters;
    } catch (error) {
      console.error('❌ getAllNewsletters error:', error);
      return [];
    }
  }

  // Get all newsletter subscribers for backup
  async getAllNewsletterSubscribers() {
    try {
      const subscribers = await db.select().from(schema.newsletterSubscribers);
      return subscribers;
    } catch (error) {
      console.error('❌ getAllNewsletterSubscribers error:', error);
      return [];
    }
  }

  // Get all site content for backup
  async getAllSiteContent() {
    try {
      const content = await db.select().from(schema.siteContent);
      return content;
    } catch (error) {
      console.error('❌ getAllSiteContent error:', error);
      return [];
    }
  }

  // Get all customer segments for backup
  async getAllCustomerSegments() {
    try {
      const segments = await db.select().from(schema.customerSegments);
      return segments;
    } catch (error) {
      console.error('❌ getAllCustomerSegments error:', error);
      return [];
    }
  }

  // Get all customer segment memberships for backup
  async getAllCustomerSegmentMemberships() {
    try {
      const memberships = await db.select().from(schema.customerSegmentMemberships);
      return memberships;
    } catch (error) {
      console.error('❌ getAllCustomerSegmentMemberships error:', error);
      return [];
    }
  }

  // Get all customer interactions for backup
  async getAllCustomerInteractions() {
    try {
      const interactions = await db.select().from(schema.customerInteractions);
      return interactions.map(this.mapCustomerInteraction);
    } catch (error) {
      console.error('❌ getAllCustomerInteractions error:', error);
      return [];
    }
  }

  // Get all customers for backup
  async getAllCustomers() {
    try {
      const customers = await db.select().from(schema.customers);
      return customers.map(this.mapCustomer);
    } catch (error) {
      console.error('❌ getAllCustomers error:', error);
      return [];
    }
  }

  // Get all appointments for backup
  async getAllAppointments() {
    try {
      const appointments = await db.select().from(schema.appointments);
      return appointments.map(this.mapAppointment);
    } catch (error) {
      console.error('❌ getAllAppointments error:', error);
      return [];
    }
  }

  // Get all leads for backup
  async getAllLeads() {
    try {
      const leads = await db.select().from(schema.leads);
      return leads.map(this.mapLead);
    } catch (error) {
      console.error('❌ getAllLeads error:', error);
      return [];
    }
  }

  // Get all inquiries for backup
  async getAllInquiries() {
    try {
      const inquiries = await db.select().from(schema.inquiries);
      return inquiries.map(this.mapInquiry);
    } catch (error) {
      console.error('❌ getAllInquiries error:', error);
      return [];
    }
  }

  // Get all gallery images for backup
  async getAllGalleryImages() {
    try {
      const images = await db.select().from(schema.galleryImages);
      return images.map(this.mapGalleryImage);
    } catch (error) {
      console.error('❌ getAllGalleryImages error:', error);
      return [];
    }
  }

  // ========================================
  // CRM FUNCTIONS - CUSTOMER INTERACTIONS  
  // ========================================

  async createCustomerInteraction(data: any) {
    try {
      const [interaction] = await db.insert(schema.customerInteractions)
        .values({
          customerId: data.customerId,
          agentId: data.agentId || null,
          type: data.type,
          subject: data.subject || null,
          notes: data.notes || null,
          outcome: data.outcome || null,
          nextAction: data.nextAction || null,
          scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : null,
          completedDate: data.completedDate ? new Date(data.completedDate) : new Date(),
          duration: data.duration || null,
          propertyId: data.propertyId || null,
          communicationMethod: data.communicationMethod || null,
          attachments: data.attachments || []
        })
        .returning();

      // Update customer's last contact date
      await db.update(schema.customers)
        .set({ lastContactDate: new Date() })
        .where(eq(schema.customers.id, data.customerId));

      return this.mapCustomerInteraction(interaction);
    } catch (error) {
      console.error('❌ createCustomerInteraction error:', error);
      throw error;
    }
  }

  // ========================================
  // CRM FUNCTIONS - LEADS MANAGEMENT
  // ========================================

  async getLeads(options: { limit?: number; offset?: number; stage?: string; agentId?: string } = {}) {
    const { limit = 10, offset = 0, stage, agentId } = options;

    try {
      let whereConditions = [];

      if (stage) {
        whereConditions.push(eq(schema.leads.stage, stage));
      }
      if (agentId) {
        whereConditions.push(eq(schema.leads.agentId, agentId));
      }

      const whereClause = whereConditions.length > 0 
        ? whereConditions.reduce((acc, condition) => sql`${acc} AND ${condition}`) 
        : undefined;

      const [leads, totalResult] = await Promise.all([
        db.select()
          .from(schema.leads)
          .where(whereClause)
          .orderBy(desc(schema.leads.createdAt))
          .limit(limit)
          .offset(offset),
        db.select({ count: sql<number>`count(*)` })
          .from(schema.leads)
          .where(whereClause)
      ]);

      return {
        leads: leads.map(this.mapLead),
        total: Number(totalResult[0].count)
      };
    } catch (error) {
      console.error('❌ getLeads error:', error);
      return { leads: [], total: 0 };
    }
  }

  async createLead(data: any) {
    try {
      const [lead] = await db.insert(schema.leads)
        .values({
          customerId: data.customerId,
          propertyId: data.propertyId || null,
          agentId: data.agentId || null,
          stage: data.stage || 'new',
          probability: data.probability || 25,
          value: data.value || null,
          dealType: data.dealType || null,
          commission: data.commission || null,
          expectedCloseDate: data.expectedCloseDate ? new Date(data.expectedCloseDate) : null,
          notes: data.notes || null,
          nextAction: data.nextAction || null,
          actionDueDate: data.actionDueDate ? new Date(data.actionDueDate) : null
        })
        .returning();

      return this.mapLead(lead);
    } catch (error) {
      console.error('❌ createLead error:', error);
      throw error;
    }
  }

  // ========================================
  // CRM MAPPER FUNCTIONS
  // ========================================

  private mapCustomer(row: any) {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      type: row.type,
      source: row.source,
      leadScore: row.leadScore || 50,
      status: row.status,
      assignedAgent: row.assignedAgent,
      budgetMin: row.budgetMin ? Number(row.budgetMin) : null,
      budgetMax: row.budgetMax ? Number(row.budgetMax) : null,
      preferredLocations: row.preferredLocations || [],
      propertyTypes: row.propertyTypes || [],
      timeline: row.timeline,
      address: row.address,
      occupation: row.occupation,
      company: row.company,
      notes: row.notes,
      tags: row.tags || [],
      firstContactDate: row.firstContactDate?.toISOString() || new Date().toISOString(),
      lastContactDate: row.lastContactDate?.toISOString() || null,
      nextFollowUp: row.nextFollowUp?.toISOString() || null,
      createdAt: row.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: row.updatedAt?.toISOString() || new Date().toISOString()
    };
  }

  private mapCustomerInteraction(row: any) {
    return {
      id: row.id,
      customerId: row.customerId,
      agentId: row.agentId,
      type: row.type,
      subject: row.subject,
      notes: row.notes,
      outcome: row.outcome,
      nextAction: row.nextAction,
      scheduledDate: row.scheduledDate?.toISOString() || null,
      completedDate: row.completedDate?.toISOString() || null,
      duration: row.duration,
      propertyId: row.propertyId,
      communicationMethod: row.communicationMethod,
      attachments: row.attachments || [],
      createdAt: row.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: row.updatedAt?.toISOString() || new Date().toISOString()
    };
  }

  private mapAppointment(row: any) {
    return {
      id: row.id,
      title: row.title,
      type: row.type,
      status: row.status,
      customerId: row.customerId,
      agentId: row.agentId,
      propertyId: row.propertyId,
      scheduledDate: row.scheduledDate?.toISOString(),
      endDate: row.endDate?.toISOString() || null,
      duration: row.duration || 60,
      location: row.location,
      address: row.address,
      notes: row.notes,
      preparation: row.preparation,
      outcome: row.outcome,
      followUpRequired: row.followUpRequired || false,
      followUpDate: row.followUpDate?.toISOString() || null,
      rating: row.rating,
      remindersSent: row.remindersSent || {},
      reminderSettings: row.reminderSettings || {},
      createdAt: row.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: row.updatedAt?.toISOString() || new Date().toISOString()
    };
  }

  private mapLead(row: any) {
    return {
      id: row.id,
      customerId: row.customerId,
      propertyId: row.propertyId,
      agentId: row.agentId,
      stage: row.stage,
      probability: row.probability || 25,
      value: row.value ? Number(row.value) : null,
      dealType: row.dealType,
      commission: row.commission ? Number(row.commission) : null,
      expectedCloseDate: row.expectedCloseDate?.toISOString() || null,
      actualCloseDate: row.actualCloseDate?.toISOString() || null,
      lostReason: row.lostReason,
      competitor: row.competitor,
      notes: row.notes,
      nextAction: row.nextAction,
      actionDueDate: row.actionDueDate?.toISOString() || null,
      createdAt: row.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: row.updatedAt?.toISOString() || new Date().toISOString()
    };
  }

  // Private helper methods
  private mapProperty(row: any): Property {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      type: row.type,
      location: row.location,
      price: Number(row.price) || 0,
      size: row.area || row.size || 0, // Use area field from database or fallback to size
      rooms: row.rooms || 0,
      bathrooms: row.bathrooms || 0,
      bedrooms: row.bedrooms || 0,
      status: row.status,
      features: this.parseFeatures(row.features),
      images: row.images || ['/uploads/hero-bodensee-sunset.jpg'],
      createdAt: row.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: row.updatedAt?.toISOString() || new Date().toISOString()
    };
  }

  private mapGalleryImage(row: any): GalleryImage {
    return {
      id: row.id,
      filename: row.filename,
      originalName: row.originalName,
      url: row.url || `/api/gallery/${row.id}/image`,
      alt: row.alt,
      category: row.category,
      propertyId: row.propertyId,
      size: row.size,
      uploadedAt: row.uploadedAt?.toISOString() || new Date().toISOString()
    };
  }

  private mapInquiry(row: any): Inquiry {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      subject: row.subject,
      message: row.message,
      propertyId: row.propertyId,
      status: row.status,
      createdAt: row.createdAt?.toISOString() || new Date().toISOString()
    };
  }

  private parseFeatures(features: any): string[] {
    if (Array.isArray(features)) return features;
    if (typeof features === 'string') {
      try {
        return JSON.parse(features);
      } catch {
        return features.split(',').map(f => f.trim());
      }
    }
    return [];
  }

  private getFallbackProperties(): Property[] {
    // Echte Upload-Dateien scannen
    const uploadsDir = path.join(process.cwd(), 'uploads');
    let availableImages: string[] = [];

    try {
      if (fs.existsSync(uploadsDir)) {
        const files = fs.readdirSync(uploadsDir);
        availableImages = files
          .filter(file => /\.(jpg|jpeg|png|webp|gif)$/i.test(file))
          .map(file => `/uploads/${file}`);
      }
    } catch (error) {
      console.log('📁 Upload scan error:', (error as Error).message);
    }

    // Wenn keine Bilder vorhanden, leeres Array zurückgeben
    if (availableImages.length === 0) {
      console.log('📁 Keine Upload-Dateien gefunden - Properties werden aus DB geladen');
      return [];
    }

    console.log(`📁 ${availableImages.length} Upload-Bilder gefunden:`, availableImages);

    return [
      {
        id: "1",
        title: "Luxusvilla Bodensee Premium",
        description: "Exklusive Villa mit direktem Bodensee-Zugang und Panoramablick",
        type: "villa",
        location: "konstanz", // Using slug for consistent filtering
        price: 1250000,
        size: 180,
        rooms: 5,
        bathrooms: 3,
        bedrooms: 4,
        status: "available",
        features: ["Seeblick", "Pool", "Garten", "Garage"],
        images: availableImages.slice(0, 3), // Erste 3 Bilder verwenden
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: "2",
        title: "Penthouse Überlingen",
        description: "Exklusives Penthouse mit Dachterrasse und Seeblick",
        type: "apartment",
        location: "ueberlingen", // Using slug for consistent filtering
        price: 685000,
        size: 120,
        rooms: 4,
        bathrooms: 2,
        bedrooms: 3,
        status: "available",
        features: ["Dachterrasse", "Aufzug", "Tiefgarage"],
        images: availableImages.slice(1, 4), // Nächste 3 Bilder
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: "3",
        title: "Einfamilienhaus Friedrichshafen",
        description: "Modernes Einfamilienhaus in bester Wohnlage",
        type: "house",
        location: "friedrichshafen", // Using slug for consistent filtering
        price: 850000,
        size: 160,
        rooms: 6,
        bathrooms: 3,
        bedrooms: 5,
        status: "available",
        features: ["Garten", "Keller", "Doppelgarage"],
        images: availableImages.slice(2, 5), // Weitere Bilder
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  }

  private async importExistingImages() {
    try {
      const uploadsDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        console.log('📁 Creating uploads directory...');
        fs.mkdirSync(uploadsDir, { recursive: true });
        return;
      }

      const files = fs.readdirSync(uploadsDir)
        .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file));

      console.log(`📁 Found ${files.length} image files in uploads`);

      let imported = 0;
      for (const file of files) {
        try {
          // Check by filename instead of ID
          const [existing] = await db.select()
            .from(schema.galleryImages)
            .where(eq(schema.galleryImages.filename, file))
            .limit(1);

          if (!existing) {
            const stats = fs.statSync(path.join(uploadsDir, file));
            const category = file.toLowerCase().includes('360') ? '360' : 
                           file.toLowerCase().includes('hero') ? 'hero' : 'general';

            await this.createGalleryImage({
              filename: file,
              originalName: file,
              mimetype: this.getMimeTypeFromExtension(file),
              size: stats.size,
              category: category,
              alt: file.replace(/\.[^/.]+$/, "").replace(/[-_]/g, ' ')
            });
            imported++;
            console.log(`✅ Imported: ${file}`);
          }
        } catch (error) {
          console.log(`⚠️ Skip import ${file}:`, (error as Error).message);
        }
      }
      console.log(`✅ Image import completed: ${imported} new images`);
    } catch (error) {
      console.log('📁 Image import error:', (error as Error).message);
    }
  }

  private getMimeTypeFromExtension(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp'
    };
    return (mimeTypes as any)[ext] || 'image/jpeg';
  }

  // Design Settings Management
  async getDesignSettings(): Promise<any | null> {
    try {
      await this.ensureInitialized();
      
      // Get all active design settings from the designSettings table
      const settings = await db.select()
        .from(schema.designSettings)
        .where(eq(schema.designSettings.isActive, true));
      
      if (settings.length === 0) {
        return null;
      }

      // Convert flat key-value pairs back to nested structure
      const result: any = {
        light: { colors: {}, typography: {} },
        dark: { colors: {}, typography: {} },
        palette: []
      };

      settings.forEach(setting => {
        const { key, value, category } = setting;
        
        if (key.startsWith('light.colors.')) {
          const colorKey = key.replace('light.colors.', '');
          result.light.colors[colorKey] = value;
        } else if (key.startsWith('light.typography.')) {
          const typographyKey = key.replace('light.typography.', '');
          result.light.typography[typographyKey] = value;
        } else if (key.startsWith('dark.colors.')) {
          const colorKey = key.replace('dark.colors.', '');
          result.dark.colors[colorKey] = value;
        } else if (key.startsWith('dark.typography.')) {
          const typographyKey = key.replace('dark.typography.', '');
          result.dark.typography[typographyKey] = value;
        } else if (key === 'palette') {
          result.palette = value;
        }
      });
      
      return result;
    } catch (error) {
      console.error('❌ Failed to get design settings:', (error as Error).message);
      return null;
    }
  }

  async setDesignSettings(settings: any): Promise<boolean> {
    try {
      await this.ensureInitialized();
      
      // Convert nested settings structure to flat key-value pairs
      const settingsToUpsert: Array<{ key: string; value: any; category: string; description?: string }> = [];
      
      // Process light theme colors
      if (settings.light?.colors) {
        Object.entries(settings.light.colors).forEach(([colorKey, colorValue]) => {
          settingsToUpsert.push({
            key: `light.colors.${colorKey}`,
            value: colorValue,
            category: 'colors',
            description: `Light theme color: ${colorKey}`
          });
        });
      }
      
      // Process light theme typography
      if (settings.light?.typography) {
        Object.entries(settings.light.typography).forEach(([typographyKey, typographyValue]) => {
          settingsToUpsert.push({
            key: `light.typography.${typographyKey}`,
            value: typographyValue,
            category: 'typography',
            description: `Light theme typography: ${typographyKey}`
          });
        });
      }
      
      // Process dark theme colors
      if (settings.dark?.colors) {
        Object.entries(settings.dark.colors).forEach(([colorKey, colorValue]) => {
          settingsToUpsert.push({
            key: `dark.colors.${colorKey}`,
            value: colorValue,
            category: 'colors',
            description: `Dark theme color: ${colorKey}`
          });
        });
      }
      
      // Process dark theme typography
      if (settings.dark?.typography) {
        Object.entries(settings.dark.typography).forEach(([typographyKey, typographyValue]) => {
          settingsToUpsert.push({
            key: `dark.typography.${typographyKey}`,
            value: typographyValue,
            category: 'typography',
            description: `Dark theme typography: ${typographyKey}`
          });
        });
      }
      
      // Process palette
      if (settings.palette) {
        settingsToUpsert.push({
          key: 'palette',
          value: settings.palette,
          category: 'palette',
          description: 'Color palette options'
        });
      }
      
      // Use transaction to ensure atomicity
      await db.transaction(async (tx) => {
        // First, deactivate all existing design settings
        await tx.update(schema.designSettings)
          .set({ isActive: false })
          .where(eq(schema.designSettings.isActive, true));
        
        // Insert new settings
        for (const setting of settingsToUpsert) {
          await tx.insert(schema.designSettings)
            .values({
              key: setting.key,
              value: setting.value,
              category: setting.category,
              description: setting.description,
              isActive: true
            })
            .onConflictDoUpdate({
              target: schema.designSettings.key,
              set: {
                value: setting.value,
                category: setting.category,
                description: setting.description,
                isActive: true,
                updatedAt: sql`CURRENT_TIMESTAMP`
              }
            });
        }
      });
      
      console.log('✅ Design settings updated successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to set design settings:', (error as Error).message);
      return false;
    }
  }

  // Calendar methods (stubs for now)
  async getAllCalendarConnections(): Promise<any[]> {
    console.log('📅 getAllCalendarConnections: Not implemented yet');
    return [];
  }

  async getAllCalendarEvents(): Promise<any[]> {
    console.log('📅 getAllCalendarEvents: Not implemented yet');
    return [];
  }

  async getAllCalendarSyncLogs(): Promise<any[]> {
    console.log('📅 getAllCalendarSyncLogs: Not implemented yet');
    return [];
  }

  async close() {
    console.log('Storage connections managed by pool');
  }
}

export const storage = new Storage();