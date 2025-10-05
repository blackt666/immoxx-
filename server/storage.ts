import { db, pool } from "./db.js";
import * as schema from "@shared/schema";
import type {
  DesignSettings,
  InsertProperty,
  InsertInquiry,
  InsertCustomer,
  InsertGalleryImage,
  Inquiry,
  GalleryImage
} from "@shared/schema";
import { eq, desc, and, sql, like } from "drizzle-orm";
import fs from "fs";
import path from "path";
import { PerformanceMonitor } from "./lib/performance-monitor.js";

type PropertyMarketAnalysis = {
  pricePerSqm?: number | null;
  marketTrend?: string | null;
  comparableProperties?: string | null;
  investmentPotential?: string | null;
};

type PropertyExtras = {
  features?: string[];
  images?: string[];
  energyClass?: string | null;
  agentNotes?: string | null;
  condition?: string | null;
  nearbyAmenities?: string[];
  heatingType?: string | null;
  plotSize?: number | null;
  garageSpaces?: number | null;
  basement?: string | null;
  balconyTerrace?: string | null;
  renovation?: string | null;
  lakeDistance?: string | null;
  publicTransport?: string | null;
  internetSpeed?: string | null;
  noiseLevel?: string | null;
  viewQuality?: string | null;
  flooring?: string | null;
  kitchen?: string | null;
  bathroom?: string | null;
  security?: string | null;
  smartHome?: string | null;
  elevator?: string | null;
  wellness?: string | null;
  fireplace?: string | null;
  airConditioning?: string | null;
  solarSystem?: string | null;
  electricCar?: string | null;
  storageSpace?: string | null;
  marketAnalysis?: PropertyMarketAnalysis | null;
  seoMeta?: string | null;
  [key: string]: unknown;
};

type DbPropertyRow = typeof schema.properties.$inferSelect;
type DbPropertyInsert = typeof schema.properties.$inferInsert;

export interface Property {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  price: number;
  currency: string;
  size: number | null;
  rooms: number | null;
  bathrooms: number | null;
  bedrooms: number | null;
  location: string;
  city: string;
  postalCode?: string | null;
  region?: string | null;
  country: string;
  latitude?: number | null;
  longitude?: number | null;
  yearBuilt?: number | null;
  hasGarden?: boolean | null;
  hasBalcony?: boolean | null;
  hasParking?: boolean | null;
  energyRating?: string | null;
  slug?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  publishedAt?: string | null;
  features: string[];
  images: string[];
  energyClass?: string | null;
  agentNotes?: string | null;
  condition?: string | null;
  nearbyAmenities?: string[];
  heatingType?: string | null;
  plotSize?: number | null;
  garageSpaces?: number | null;
  basement?: string | null;
  balconyTerrace?: string | null;
  renovation?: string | null;
  lakeDistance?: string | null;
  publicTransport?: string | null;
  internetSpeed?: string | null;
  noiseLevel?: string | null;
  viewQuality?: string | null;
  flooring?: string | null;
  kitchen?: string | null;
  bathroom?: string | null;
  security?: string | null;
  smartHome?: string | null;
  elevator?: string | null;
  wellness?: string | null;
  fireplace?: string | null;
  airConditioning?: string | null;
  solarSystem?: string | null;
  electricCar?: string | null;
  storageSpace?: string | null;
  marketAnalysis?: PropertyMarketAnalysis | null;
  createdAt: string;
  updatedAt: string;
}

type CacheEntry = { data: unknown; expires: number };

class Storage {
  private initialized = false;
  
  // Simple in-memory cache with TTL
  private cache = new Map<string, CacheEntry>();
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
  
  private setCache(key: string, data: unknown, ttl?: number): void {
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
  async batchInsertProperties(properties: Partial<Property>[]): Promise<{ success: number; failed: number; errors: unknown[] }> {
    if (properties.length === 0) return { success: 0, failed: 0, errors: [] };
    
    const batchSize = 100; // Process in batches of 100
    let success = 0;
    let failed = 0;
    const errors: unknown[] = [];

    try {
      // Process in batches to avoid overwhelming the database
      for (let i = 0; i < properties.length; i += batchSize) {
        const batch = properties.slice(i, i + batchSize);
        
        try {
          await PerformanceMonitor.timeDbOperation('batchInsertProperties', async () => {
            await db.transaction(async (tx) => {
              const insertData: InsertProperty[] = batch.map((prop) => this.composeInsertProperty(prop));

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
                firstName: inquiry.firstName || '',
                lastName: inquiry.lastName || '',
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
                firstName: customer.firstName || customer.name?.split(' ')[0] || '',
                lastName: customer.lastName || customer.name?.split(' ').slice(1).join(' ') || '',
                email: customer.email,
                phone: customer.phone,
                customerType: customer.type || 'prospect',
                source: customer.source,
                maxBudget: customer.budgetMax || customer.maxBudget,
                minBudget: customer.budgetMin || customer.minBudget,
                preferredLocations: JSON.stringify(customer.preferredLocations || []),
                propertyTypes: JSON.stringify(customer.propertyTypes || []),
                address: customer.address,
                occupation: customer.occupation,
                notes: customer.notes,
                tags: JSON.stringify(customer.tags || [])
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
        
        const whereConditions = [];
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

  async getProperty(id: number): Promise<Property | null> {
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
    const insertValues = this.composeInsertProperty(data);

    const [property] = await db.insert(schema.properties)
      .values(insertValues)
      .returning();

    this.clearCacheByPattern('properties_');
    this.clearCacheByPattern('property_');

    return this.mapProperty(property);
  }

  async updateProperty(id: number, data: Partial<Property>): Promise<Property> {
    const propertyId = Number(id);
    if (Number.isNaN(propertyId)) {
      throw new Error(`Ungültige Immobilien-ID: ${id}`);
    }

    const [existing] = await db.select()
      .from(schema.properties)
      .where(eq(schema.properties.id, propertyId));

    if (!existing) {
      throw new Error(`Immobilie mit ID ${id} wurde nicht gefunden.`);
    }

    const updateValues = this.composeUpdateProperty(existing, data);
    updateValues.updatedAt = new Date();

    const [property] = await db.update(schema.properties)
      .set(updateValues)
      .where(eq(schema.properties.id, propertyId))
      .returning();

    this.clearCacheByPattern('properties_');
    this.clearCacheByPattern('property_');

    return this.mapProperty(property);
  }

  async deleteProperty(id: number): Promise<void> {
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
      
      const whereConditions = [];

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

  async getGalleryImage(id: number): Promise<GalleryImage | null> {
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

  async updateGalleryImage(id: number, data: {
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

  async deleteGalleryImage(id: number): Promise<void> {
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
        const whereConditions = [];

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
            sql`${schema.inquiries.firstName} ILIKE ${searchTerm} OR 
                ${schema.inquiries.lastName} ILIKE ${searchTerm} OR 
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
        firstName: data.firstName || '',
        lastName: data.lastName || '',
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
      const whereConditions = [];

      if (type) {
        whereConditions.push(eq(schema.customers.customerType, type));
      }
      // status field doesn't exist in customers schema
      // if (status) {
      //   whereConditions.push(eq(schema.customers.status, status));
      // }
      // assignedAgent field doesn't exist in customers schema  
      // if (assignedAgent) {
      //   whereConditions.push(eq(schema.customers.assignedAgent, assignedAgent));
      // }
      if (search) {
        whereConditions.push(
          sql`(
            ${schema.customers.firstName} ILIKE ${`%${search}%`} OR 
            ${schema.customers.lastName} ILIKE ${`%${search}%`} OR 
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
  async getCustomer(id: number) {
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
  async updateCustomer(id: number, data: any) {
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
  async deleteCustomer(id: number) {
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
      const whereConditions = [];

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
      const whereConditions = [];

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
  private composeInsertProperty(data: Partial<Property>): DbPropertyInsert {
    const extras = this.mergePropertyExtras({}, data);
    const metadata = this.serializePropertyExtras(extras);

    const location = this.normalizeString(data.location) ?? "Unbekannte Adresse";
    const city = this.normalizeString(data.city) ?? location;

    return {
      title: this.normalizeString(data.title) ?? "Unbenannte Immobilie",
      description: data.description ?? null,
      type: this.normalizeString(data.type) ?? "sale",
      status: this.normalizeString(data.status) ?? "active",
      price: this.normalizeNumber(data.price) ?? 0,
      currency: this.normalizeString(data.currency) ?? "EUR",
      size: this.normalizeNumber(data.size),
      rooms: this.normalizeNumber(data.rooms),
      bathrooms: this.normalizeNumber(data.bathrooms),
      bedrooms: this.normalizeNumber(data.bedrooms),
      location,
      city,
      postalCode: this.normalizeString(data.postalCode),
      region: this.normalizeString(data.region),
      country: this.normalizeString(data.country) ?? "Germany",
      latitude: this.normalizeNumber(data.latitude),
      longitude: this.normalizeNumber(data.longitude),
      yearBuilt: this.normalizeNumber(data.yearBuilt),
      hasGarden: this.normalizeBoolean(data.hasGarden),
      hasBalcony: this.normalizeBoolean(data.hasBalcony),
      hasParking: this.normalizeBoolean(data.hasParking),
      energyRating: this.normalizeString(data.energyRating),
      slug: this.normalizeString(data.slug),
      metaTitle: this.normalizeString(data.metaTitle),
      metaDescription: this.normalizeString(data.metaDescription),
      metadata,
      publishedAt: this.toNullableDate(data.publishedAt)
    };
  }

  private composeUpdateProperty(existing: DbPropertyRow, updates: Partial<Property>): Partial<DbPropertyInsert> {
    const base = this.propertyRowToInsert(existing);
    const next: DbPropertyInsert = { ...base };
    const updateRecord = updates as Record<string, unknown>;

    if (this.hasOwn(updateRecord, "title")) {
      const title = this.normalizeString(updates.title);
      next.title = title ?? base.title ?? "Unbenannte Immobilie";
    }

    if (this.hasOwn(updateRecord, "description")) {
      next.description = updates.description ?? null;
    }

    if (this.hasOwn(updateRecord, "type")) {
      const type = this.normalizeString(updates.type);
      next.type = type ?? base.type ?? "sale";
    }

    if (this.hasOwn(updateRecord, "status")) {
      const status = this.normalizeString(updates.status);
      next.status = status ?? base.status ?? "active";
    }

    if (this.hasOwn(updateRecord, "price")) {
      const price = this.normalizeNumber(updates.price);
      next.price = price ?? base.price ?? 0;
    }

    if (this.hasOwn(updateRecord, "currency")) {
      const currency = this.normalizeString(updates.currency);
      next.currency = currency ?? base.currency ?? "EUR";
    }

    if (this.hasOwn(updateRecord, "size")) {
      next.size = this.normalizeNumber(updates.size);
    }
    if (this.hasOwn(updateRecord, "rooms")) {
      next.rooms = this.normalizeNumber(updates.rooms);
    }
    if (this.hasOwn(updateRecord, "bathrooms")) {
      next.bathrooms = this.normalizeNumber(updates.bathrooms);
    }
    if (this.hasOwn(updateRecord, "bedrooms")) {
      next.bedrooms = this.normalizeNumber(updates.bedrooms);
    }

    if (this.hasOwn(updateRecord, "location")) {
      const location = this.normalizeString(updates.location) ?? base.location ?? "Unbekannte Adresse";
      next.location = location;
      if (!this.hasOwn(updateRecord, "city") && !next.city) {
        next.city = location;
      }
    }

    if (this.hasOwn(updateRecord, "city")) {
      const city = this.normalizeString(updates.city);
      next.city = city ?? next.location ?? base.city ?? "Unbekannt";
    }

    if (this.hasOwn(updateRecord, "postalCode")) {
      next.postalCode = this.normalizeString(updates.postalCode);
    }
    if (this.hasOwn(updateRecord, "region")) {
      next.region = this.normalizeString(updates.region);
    }
    if (this.hasOwn(updateRecord, "country")) {
      next.country = this.normalizeString(updates.country) ?? base.country ?? "Germany";
    }

    if (this.hasOwn(updateRecord, "latitude")) {
      next.latitude = this.normalizeNumber(updates.latitude);
    }
    if (this.hasOwn(updateRecord, "longitude")) {
      next.longitude = this.normalizeNumber(updates.longitude);
    }
    if (this.hasOwn(updateRecord, "yearBuilt")) {
      next.yearBuilt = this.normalizeNumber(updates.yearBuilt);
    }

    if (this.hasOwn(updateRecord, "hasGarden")) {
      next.hasGarden = this.normalizeBoolean(updates.hasGarden);
    }
    if (this.hasOwn(updateRecord, "hasBalcony")) {
      next.hasBalcony = this.normalizeBoolean(updates.hasBalcony);
    }
    if (this.hasOwn(updateRecord, "hasParking")) {
      next.hasParking = this.normalizeBoolean(updates.hasParking);
    }

    if (this.hasOwn(updateRecord, "energyRating")) {
      next.energyRating = this.normalizeString(updates.energyRating);
    }
    if (this.hasOwn(updateRecord, "slug")) {
      next.slug = this.normalizeString(updates.slug);
    }
    if (this.hasOwn(updateRecord, "metaTitle")) {
      next.metaTitle = this.normalizeString(updates.metaTitle);
    }
    if (this.hasOwn(updateRecord, "metaDescription")) {
      next.metaDescription = this.normalizeString(updates.metaDescription);
    }

    if (this.hasOwn(updateRecord, "publishedAt")) {
      next.publishedAt = this.toNullableDate(updates.publishedAt);
    }

    const mergedExtras = this.mergePropertyExtras(this.extractPropertyExtras(existing), updates);
    next.metadata = this.serializePropertyExtras(mergedExtras);

    return next;
  }

  private propertyRowToInsert(row: DbPropertyRow): DbPropertyInsert {
    return {
      title: row.title,
      description: row.description ?? null,
      type: row.type,
      status: row.status,
      price: Number(row.price ?? 0),
      currency: row.currency ?? "EUR",
      size: row.size ?? null,
      rooms: row.rooms ?? null,
      bathrooms: row.bathrooms ?? null,
      bedrooms: row.bedrooms ?? null,
      location: row.location,
      city: row.city,
      postalCode: row.postalCode ?? null,
      region: row.region ?? null,
      country: row.country ?? "Germany",
      latitude: row.latitude ?? null,
      longitude: row.longitude ?? null,
      yearBuilt: row.yearBuilt ?? null,
      hasGarden: row.hasGarden ?? null,
      hasBalcony: row.hasBalcony ?? null,
      hasParking: row.hasParking ?? null,
      energyRating: row.energyRating ?? null,
      slug: row.slug ?? null,
      metaTitle: row.metaTitle ?? null,
      metaDescription: row.metaDescription ?? null,
      metadata: row.metadata ?? null,
      publishedAt: row.publishedAt ?? null
    };
  }

  private extractPropertyExtras(row: DbPropertyRow): PropertyExtras {
    if (!row.metadata) {
      return {};
    }

    try {
      const raw = JSON.parse(row.metadata) as Record<string, unknown>;
      return this.mergePropertyExtras({}, raw);
    } catch (error) {
      console.warn('⚠️ Failed to parse property metadata:', error);
      return {};
    }
  }

  private mergePropertyExtras(base: PropertyExtras, updates: Partial<Property> | Record<string, unknown>): PropertyExtras {
    const result: PropertyExtras = { ...base };
    const source = updates as Record<string, unknown>;

    const arrayKeys: Array<keyof PropertyExtras> = ["features", "images", "nearbyAmenities"];
    for (const key of arrayKeys) {
      if (this.hasOwn(source, key as string)) {
        const normalized = this.normalizeStringArray(source[key as string]);
        if (normalized.length > 0) {
          result[key] = normalized;
        } else {
          delete result[key];
        }
      }
    }

    const numberKeys: Array<keyof PropertyExtras> = ["plotSize", "garageSpaces"];
    for (const key of numberKeys) {
      if (this.hasOwn(source, key as string)) {
        const normalized = this.normalizeNumber(source[key as string]);
        if (normalized !== null) {
          result[key] = normalized;
        } else {
          delete result[key];
        }
      }
    }

    const stringKeys: Array<keyof PropertyExtras> = [
      "energyClass",
      "agentNotes",
      "condition",
      "heatingType",
      "basement",
      "balconyTerrace",
      "renovation",
      "lakeDistance",
      "publicTransport",
      "internetSpeed",
      "noiseLevel",
      "viewQuality",
      "flooring",
      "kitchen",
      "bathroom",
      "security",
      "smartHome",
      "elevator",
      "wellness",
      "fireplace",
      "airConditioning",
      "solarSystem",
      "electricCar",
      "storageSpace",
      "seoMeta"
    ];

    for (const key of stringKeys) {
      if (this.hasOwn(source, key as string)) {
        const normalized = this.normalizeString(source[key as string]);
        if (normalized) {
          result[key] = normalized;
        } else {
          delete result[key];
        }
      }
    }

    if (this.hasOwn(source, "marketAnalysis")) {
      const normalized = this.normalizeMarketAnalysis(source.marketAnalysis);
      if (normalized) {
        result.marketAnalysis = normalized;
      } else {
        delete result.marketAnalysis;
      }
    }

    return result;
  }

  private serializePropertyExtras(extras: PropertyExtras): string | null {
    const sanitized = Object.entries(extras).reduce<Record<string, unknown>>((acc, [key, value]) => {
      if (value === undefined) {
        return acc;
      }

      if (Array.isArray(value)) {
        if (value.length > 0) {
          acc[key] = value;
        }
        return acc;
      }

      if (value && typeof value === 'object') {
        if (Object.keys(value as Record<string, unknown>).length > 0) {
          acc[key] = value;
        }
        return acc;
      }

      if (value !== null) {
        acc[key] = value;
      } else {
        acc[key] = null;
      }

      return acc;
    }, {});

    return Object.keys(sanitized).length > 0 ? JSON.stringify(sanitized) : null;
  }

  private normalizeStringArray(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value
        .map(entry => this.normalizeString(entry))
        .filter((entry): entry is string => Boolean(entry));
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) {
        return [];
      }

      return trimmed
        .split(',')
        .map(entry => this.normalizeString(entry))
        .filter((entry): entry is string => Boolean(entry));
    }

    return [];
  }

  private normalizeString(value: unknown): string | null {
    if (value === undefined || value === null) {
      return null;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }

    return null;
  }

  private normalizeNumber(value: unknown): number | null {
    if (value === undefined || value === null || value === '') {
      return null;
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const normalized = value.replace(/,/g, '.').trim();
      if (!normalized) {
        return null;
      }

      const parsed = Number(normalized);
      return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
  }

  private normalizeBoolean(value: unknown): boolean | null {
    if (value === undefined || value === null || value === '') {
      return null;
    }

    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'number') {
      return value !== 0;
    }

    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (['true', '1', 'yes', 'on'].includes(normalized)) {
        return true;
      }
      if (['false', '0', 'no', 'off'].includes(normalized)) {
        return false;
      }
    }

    return null;
  }

  private normalizeMarketAnalysis(value: unknown): PropertyMarketAnalysis | null {
    if (value === undefined || value === null || value === '') {
      return null;
    }

    let source: Record<string, unknown> | null = null;

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) {
        return null;
      }

      try {
        source = JSON.parse(trimmed) as Record<string, unknown>;
      } catch {
        return { marketTrend: trimmed };
      }
    } else if (typeof value === 'object') {
      source = value as Record<string, unknown>;
    }

    if (!source) {
      return null;
    }

    const result: PropertyMarketAnalysis = {};

    const pricePerSqm = this.normalizeNumber(source.pricePerSqm);
    if (pricePerSqm !== null) {
      result.pricePerSqm = pricePerSqm;
    }

    const marketTrend = this.normalizeString(source.marketTrend);
    if (marketTrend) {
      result.marketTrend = marketTrend;
    }

    const comparableProperties = this.normalizeString(source.comparableProperties);
    if (comparableProperties) {
      result.comparableProperties = comparableProperties;
    }

    const investmentPotential = this.normalizeString(source.investmentPotential);
    if (investmentPotential) {
      result.investmentPotential = investmentPotential;
    }

    return Object.keys(result).length > 0 ? result : null;
  }

  private toNullableDate(value: unknown): Date | null {
    if (value === undefined || value === null || value === '') {
      return null;
    }

    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value;
    }

    const parsed = typeof value === 'number' ? new Date(value) : new Date(String(value));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private toIsoString(value: unknown): string {
    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? new Date().toISOString() : value.toISOString();
    }

    if (typeof value === 'number') {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
    }

    if (typeof value === 'string') {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? value : date.toISOString();
    }

    return new Date().toISOString();
  }

  private hasOwn(source: Record<string, unknown>, key: string): boolean {
    return Object.prototype.hasOwnProperty.call(source, key);
  }

  private mapProperty(row: DbPropertyRow): Property {
    const extras = this.extractPropertyExtras(row);
    const location = row.location ?? "";
    const city = row.city ?? location;

    return {
      id: String(row.id),
      title: row.title,
      description: row.description ?? null,
      type: row.type,
      status: row.status,
      price: Number(row.price ?? 0),
      currency: row.currency ?? "EUR",
      size: row.size ?? null,
      rooms: row.rooms ?? null,
      bathrooms: row.bathrooms ?? null,
      bedrooms: row.bedrooms ?? null,
      location,
      city,
      postalCode: row.postalCode ?? null,
      region: row.region ?? null,
      country: row.country ?? "Germany",
      latitude: row.latitude ?? null,
      longitude: row.longitude ?? null,
      yearBuilt: row.yearBuilt ?? null,
      hasGarden: row.hasGarden ?? null,
      hasBalcony: row.hasBalcony ?? null,
      hasParking: row.hasParking ?? null,
      energyRating: row.energyRating ?? null,
      slug: row.slug ?? null,
      metaTitle: row.metaTitle ?? null,
      metaDescription: row.metaDescription ?? null,
      publishedAt: row.publishedAt ? this.toIsoString(row.publishedAt) : null,
      features: Array.isArray(extras.features) ? extras.features : [],
      images: extras.images && Array.isArray(extras.images) && extras.images.length > 0
        ? extras.images
        : ['/uploads/hero-bodensee-sunset.jpg'],
      energyClass: extras.energyClass ?? null,
      agentNotes: extras.agentNotes ?? null,
      condition: extras.condition ?? null,
      nearbyAmenities: Array.isArray(extras.nearbyAmenities) ? extras.nearbyAmenities : [],
      heatingType: extras.heatingType ?? null,
      plotSize: typeof extras.plotSize === 'number' ? extras.plotSize : null,
      garageSpaces: typeof extras.garageSpaces === 'number' ? extras.garageSpaces : null,
      basement: extras.basement ?? null,
      balconyTerrace: extras.balconyTerrace ?? null,
      renovation: extras.renovation ?? null,
      lakeDistance: extras.lakeDistance ?? null,
      publicTransport: extras.publicTransport ?? null,
      internetSpeed: extras.internetSpeed ?? null,
      noiseLevel: extras.noiseLevel ?? null,
      viewQuality: extras.viewQuality ?? null,
      flooring: extras.flooring ?? null,
      kitchen: extras.kitchen ?? null,
      bathroom: extras.bathroom ?? null,
      security: extras.security ?? null,
      smartHome: extras.smartHome ?? null,
      elevator: extras.elevator ?? null,
      wellness: extras.wellness ?? null,
      fireplace: extras.fireplace ?? null,
      airConditioning: extras.airConditioning ?? null,
      solarSystem: extras.solarSystem ?? null,
      electricCar: extras.electricCar ?? null,
      storageSpace: extras.storageSpace ?? null,
      marketAnalysis: extras.marketAnalysis ?? null,
      createdAt: this.toIsoString(row.createdAt),
      updatedAt: this.toIsoString(row.updatedAt)
    };
  }

  private mapGalleryImage(row: any): GalleryImage {
    return {
      ...row,
      url: (row as Record<string, unknown>).url ?? `/api/gallery/${row.id}/image`,
      uploadedAt: this.toIsoString((row as Record<string, unknown>).uploadedAt ?? row.createdAt ?? new Date())
    } as GalleryImage;
  }

  private mapInquiry(row: any): Inquiry {
    return {
      ...row,
      createdAt: this.toIsoString(row.createdAt)
    } as Inquiry;
  }

  private getFallbackProperties(): Property[] {
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

    if (availableImages.length === 0) {
      console.log('📁 Keine Upload-Dateien gefunden - Properties werden aus DB geladen');
      return [];
    }

    const timestamp = new Date().toISOString();

    return [
      {
        id: "1",
        title: "Luxusvilla Bodensee Premium",
        description: "Exklusive Villa mit direktem Bodensee-Zugang und Panoramablick",
        type: "villa",
        status: "available",
        price: 1_250_000,
        currency: "EUR",
        size: 180,
        rooms: 5,
        bathrooms: 3,
        bedrooms: 4,
        location: "Konstanz",
        city: "Konstanz",
        postalCode: null,
        region: null,
        country: "Germany",
        latitude: null,
        longitude: null,
        yearBuilt: null,
        hasGarden: true,
        hasBalcony: true,
        hasParking: true,
        energyRating: null,
        slug: null,
        metaTitle: null,
        metaDescription: null,
        publishedAt: null,
        features: ["Seeblick", "Pool", "Garten", "Garage"],
        images: availableImages.slice(0, 3),
        energyClass: null,
        agentNotes: null,
        condition: "renovated",
        nearbyAmenities: ["See", "Innenstadt"],
        heatingType: null,
        plotSize: null,
        garageSpaces: 2,
        basement: "ja",
        balconyTerrace: "großzügige Terrasse",
        renovation: null,
        lakeDistance: "Direkter Zugang",
        publicTransport: "5 Minuten",
        internetSpeed: null,
        noiseLevel: "ruhig",
        viewQuality: "Panorama",
        flooring: null,
        kitchen: null,
        bathroom: null,
        security: null,
        smartHome: null,
        elevator: null,
        wellness: null,
        fireplace: null,
        airConditioning: null,
        solarSystem: null,
        electricCar: null,
        storageSpace: null,
        marketAnalysis: null,
        createdAt: timestamp,
        updatedAt: timestamp
      },
      {
        id: "2",
        title: "Penthouse Überlingen",
        description: "Exklusives Penthouse mit Dachterrasse und Seeblick",
        type: "apartment",
        status: "available",
        price: 685_000,
        currency: "EUR",
        size: 120,
        rooms: 4,
        bathrooms: 2,
        bedrooms: 3,
        location: "Überlingen",
        city: "Überlingen",
        postalCode: null,
        region: null,
        country: "Germany",
        latitude: null,
        longitude: null,
        yearBuilt: null,
        hasGarden: false,
        hasBalcony: true,
        hasParking: true,
        energyRating: null,
        slug: null,
        metaTitle: null,
        metaDescription: null,
        publishedAt: null,
        features: ["Dachterrasse", "Aufzug", "Tiefgarage"],
        images: availableImages.slice(1, 4),
        energyClass: null,
        agentNotes: null,
        condition: "excellent",
        nearbyAmenities: ["Innenstadt"],
        heatingType: null,
        plotSize: null,
        garageSpaces: 1,
        basement: null,
        balconyTerrace: "Dachterrasse",
        renovation: null,
        lakeDistance: "200 m",
        publicTransport: "2 Minuten",
        internetSpeed: null,
        noiseLevel: "mittel",
        viewQuality: "Seeblick",
        flooring: null,
        kitchen: null,
        bathroom: null,
        security: null,
        smartHome: null,
        elevator: "ja",
        wellness: null,
        fireplace: null,
        airConditioning: null,
        solarSystem: null,
        electricCar: null,
        storageSpace: null,
        marketAnalysis: null,
        createdAt: timestamp,
        updatedAt: timestamp
      },
      {
        id: "3",
        title: "Einfamilienhaus Friedrichshafen",
        description: "Modernes Einfamilienhaus in bester Wohnlage",
        type: "house",
        status: "available",
        price: 850_000,
        currency: "EUR",
        size: 160,
        rooms: 6,
        bathrooms: 3,
        bedrooms: 5,
        location: "Friedrichshafen",
        city: "Friedrichshafen",
        postalCode: null,
        region: null,
        country: "Germany",
        latitude: null,
        longitude: null,
        yearBuilt: null,
        hasGarden: true,
        hasBalcony: true,
        hasParking: true,
        energyRating: null,
        slug: null,
        metaTitle: null,
        metaDescription: null,
        publishedAt: null,
        features: ["Garten", "Keller", "Doppelgarage"],
        images: availableImages.slice(2, 5),
        energyClass: null,
        agentNotes: null,
        condition: "good",
        nearbyAmenities: ["Schule", "Supermarkt"],
        heatingType: null,
        plotSize: null,
        garageSpaces: 2,
        basement: "ja",
        balconyTerrace: "Terrasse",
        renovation: null,
        lakeDistance: "800 m",
        publicTransport: "10 Minuten",
        internetSpeed: null,
        noiseLevel: "ruhig",
        viewQuality: "Gartenblick",
        flooring: null,
        kitchen: null,
        bathroom: null,
        security: null,
        smartHome: null,
        elevator: null,
        wellness: null,
        fireplace: null,
        airConditioning: null,
        solarSystem: null,
        electricCar: null,
        storageSpace: null,
        marketAnalysis: null,
        createdAt: timestamp,
        updatedAt: timestamp
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