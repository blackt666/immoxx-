/**
 * Database Service
 * Datenbank-Abstraktionsschicht für Backend-Persistierung
 */

import { BlueprintData, AnalysisParams } from '@/App'
import { AnalysisResult } from './blueprintAnalysis'
import { Model3D } from './model3DGeneration'

// Datenbank-Entitäten
export interface User {
  id: string
  email: string
  name: string
  avatarUrl?: string
  createdAt: Date
  lastLoginAt: Date
  preferences: UserPreferences
  subscription: UserSubscription
}

export interface UserPreferences {
  defaultAnalysisParams: AnalysisParams
  preferredExportFormat: string
  language: 'de' | 'en' | 'fr' | 'es'
  theme: 'light' | 'dark' | 'auto'
  notifications: NotificationSettings
}

export interface NotificationSettings {
  analysisComplete: boolean
  generationComplete: boolean
  exportReady: boolean
  systemUpdates: boolean
  emailNotifications: boolean
}

export interface UserSubscription {
  plan: 'free' | 'basic' | 'pro' | 'enterprise'
  status: 'active' | 'cancelled' | 'expired'
  validUntil: Date
  features: SubscriptionFeatures
  usage: UsageMetrics
}

export interface SubscriptionFeatures {
  maxBlueprintsPerMonth: number
  maxFileSize: number
  aiAnalysisEnabled: boolean
  priorityProcessing: boolean
  exportFormats: string[]
  cloudStorage: boolean
  batchProcessing: boolean
}

export interface UsageMetrics {
  blueprintsProcessedThisMonth: number
  modelsGeneratedThisMonth: number
  storageUsed: number
  apiCallsThisMonth: number
}

export interface Project {
  id: string
  userId: string
  name: string
  description?: string
  createdAt: Date
  updatedAt: Date
  blueprints: Blueprint[]
  tags: string[]
  isPublic: boolean
  collaborators: ProjectCollaborator[]
}

export interface ProjectCollaborator {
  userId: string
  role: 'viewer' | 'editor' | 'admin'
  addedAt: Date
}

export interface Blueprint {
  id: string
  projectId: string
  userId: string
  fileName: string
  originalFileName: string
  fileSize: number
  mimeType: string
  fileUrl: string
  thumbnailUrl?: string
  uploadedAt: Date
  status: 'uploaded' | 'analyzing' | 'analyzed' | 'failed'
  analysisResult?: AnalysisResult
  models: Model3DRecord[]
  metadata: BlueprintMetadata
}

export interface BlueprintMetadata {
  dimensions?: { width: number; height: number }
  scale?: number
  units?: 'meters' | 'feet' | 'inches'
  buildingType?: string
  floorLevel?: number
  tags?: string[]
}

export interface Model3DRecord {
  id: string
  blueprintId: string
  userId: string
  name: string
  generatedAt: Date
  status: 'generating' | 'completed' | 'failed'
  quality: 'low' | 'medium' | 'high' | 'ultra'
  fileUrl: string
  thumbnailUrl?: string
  fileSize: number
  polygonCount: number
  exports: ModelExport[]
  metadata: Model3DMetadata
}

export interface Model3DMetadata {
  generationTime: number
  generationParams: any
  performanceMetrics: any
  version: string
}

export interface ModelExport {
  id: string
  modelId: string
  format: 'gltf' | 'obj' | 'fbx' | 'stl' | 'ply'
  fileUrl: string
  fileSize: number
  compressionLevel: number
  exportedAt: Date
  expiresAt: Date
  downloadCount: number
}

export interface AnalysisJob {
  id: string
  blueprintId: string
  userId: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  priority: 'low' | 'normal' | 'high'
  params: AnalysisParams
  startedAt?: Date
  completedAt?: Date
  progress: number
  error?: string
  result?: AnalysisResult
}

export interface GenerationJob {
  id: string
  blueprintId: string
  userId: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  priority: 'low' | 'normal' | 'high'
  params: any
  startedAt?: Date
  completedAt?: Date
  progress: number
  error?: string
  result?: Model3D
}

export interface SystemMetrics {
  timestamp: Date
  activeUsers: number
  totalUsers: number
  blueprintsProcessed: number
  modelsGenerated: number
  storageUsed: number
  serverLoad: number
  memoryUsage: number
  errorRate: number
}

export interface AuditLog {
  id: string
  userId?: string
  action: string
  entityType: string
  entityId: string
  details: any
  timestamp: Date
  ipAddress: string
  userAgent: string
}

// Datenbank-Repository-Interface
export interface DatabaseRepository<T> {
  findById(id: string): Promise<T | null>
  findByUserId(userId: string): Promise<T[]>
  create(entity: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>
  update(id: string, updates: Partial<T>): Promise<T>
  delete(id: string): Promise<boolean>
  list(filters?: any, pagination?: PaginationOptions): Promise<PaginatedResult<T>>
}

export interface PaginationOptions {
  page: number
  limit: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Spezifische Repository-Interfaces
export interface UserRepository extends DatabaseRepository<User> {
  findByEmail(email: string): Promise<User | null>
  updatePreferences(userId: string, preferences: Partial<UserPreferences>): Promise<User>
  updateSubscription(userId: string, subscription: Partial<UserSubscription>): Promise<User>
  getUsageMetrics(userId: string): Promise<UsageMetrics>
}

export interface ProjectRepository extends DatabaseRepository<Project> {
  findByCollaborator(userId: string): Promise<Project[]>
  addCollaborator(projectId: string, collaborator: ProjectCollaborator): Promise<Project>
  removeCollaborator(projectId: string, userId: string): Promise<Project>
  findPublicProjects(filters?: any): Promise<PaginatedResult<Project>>
}

export interface BlueprintRepository extends DatabaseRepository<Blueprint> {
  findByProject(projectId: string): Promise<Blueprint[]>
  updateStatus(id: string, status: Blueprint['status']): Promise<Blueprint>
  setAnalysisResult(id: string, result: AnalysisResult): Promise<Blueprint>
  findByStatus(status: Blueprint['status']): Promise<Blueprint[]>
}

export interface ModelRepository extends DatabaseRepository<Model3DRecord> {
  findByBlueprint(blueprintId: string): Promise<Model3DRecord[]>
  updateStatus(id: string, status: Model3DRecord['status']): Promise<Model3DRecord>
  addExport(modelId: string, exportData: Omit<ModelExport, 'id'>): Promise<ModelExport>
  getExports(modelId: string): Promise<ModelExport[]>
  deleteExpiredExports(): Promise<number>
}

export interface JobRepository {
  createAnalysisJob(job: Omit<AnalysisJob, 'id' | 'status' | 'progress'>): Promise<AnalysisJob>
  createGenerationJob(job: Omit<GenerationJob, 'id' | 'status' | 'progress'>): Promise<GenerationJob>
  getNextAnalysisJob(): Promise<AnalysisJob | null>
  getNextGenerationJob(): Promise<GenerationJob | null>
  updateJobProgress(jobId: string, progress: number): Promise<void>
  completeJob(jobId: string, result: any): Promise<void>
  failJob(jobId: string, error: string): Promise<void>
  getJobsByUser(userId: string): Promise<(AnalysisJob | GenerationJob)[]>
}

export interface MetricsRepository {
  recordMetrics(metrics: Omit<SystemMetrics, 'timestamp'>): Promise<void>
  getMetrics(from: Date, to: Date): Promise<SystemMetrics[]>
  getAverageMetrics(from: Date, to: Date): Promise<SystemMetrics>
}

export interface AuditRepository {
  log(entry: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void>
  findByUser(userId: string, filters?: any): Promise<PaginatedResult<AuditLog>>
  findByEntity(entityType: string, entityId: string): Promise<AuditLog[]>
  cleanup(olderThan: Date): Promise<number>
}

// Mock-Implementierung für Development/Testing
class MockDatabaseService {
  private users = new Map<string, User>()
  private projects = new Map<string, Project>()
  private blueprints = new Map<string, Blueprint>()
  private models = new Map<string, Model3DRecord>()
  private analysisJobs = new Map<string, AnalysisJob>()
  private generationJobs = new Map<string, GenerationJob>()
  private metrics: SystemMetrics[] = []
  private auditLogs: AuditLog[] = []

  constructor() {
    this.initializeMockData()
  }

  // User Repository
  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'lastLoginAt'>): Promise<User> {
    const user: User = {
      ...userData,
      id: this.generateId(),
      createdAt: new Date(),
      lastLoginAt: new Date(),
      preferences: {
        defaultAnalysisParams: {
          wallHeight: 2.5,
          wallThickness: 0.15,
          generateDoors: true,
          generateWindows: true,
          generateRoof: false
        },
        preferredExportFormat: 'gltf',
        language: 'de',
        theme: 'auto',
        notifications: {
          analysisComplete: true,
          generationComplete: true,
          exportReady: true,
          systemUpdates: false,
          emailNotifications: true
        }
      },
      subscription: {
        plan: 'free',
        status: 'active',
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        features: {
          maxBlueprintsPerMonth: 5,
          maxFileSize: 10 * 1024 * 1024,
          aiAnalysisEnabled: false,
          priorityProcessing: false,
          exportFormats: ['gltf', 'obj'],
          cloudStorage: false,
          batchProcessing: false
        },
        usage: {
          blueprintsProcessedThisMonth: 0,
          modelsGeneratedThisMonth: 0,
          storageUsed: 0,
          apiCallsThisMonth: 0
        }
      }
    }

    this.users.set(user.id, user)
    await this.logAudit({
      userId: user.id,
      action: 'create',
      entityType: 'user',
      entityId: user.id,
      details: { email: user.email },
      ipAddress: '127.0.0.1',
      userAgent: 'test'
    })

    return user
  }

  async getUserById(id: string): Promise<User | null> {
    return this.users.get(id) || null
  }

  async getUserByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user
      }
    }
    return null
  }

  async updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<User | null> {
    const user = this.users.get(userId)
    if (!user) return null

    user.preferences = { ...user.preferences, ...preferences }
    this.users.set(userId, user)

    await this.logAudit({
      userId,
      action: 'update_preferences',
      entityType: 'user',
      entityId: userId,
      details: preferences,
      ipAddress: '127.0.0.1',
      userAgent: 'test'
    })

    return user
  }

  // Project Repository
  async createProject(projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    const project: Project = {
      ...projectData,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this.projects.set(project.id, project)
    await this.logAudit({
      userId: project.userId,
      action: 'create',
      entityType: 'project',
      entityId: project.id,
      details: { name: project.name },
      ipAddress: '127.0.0.1',
      userAgent: 'test'
    })

    return project
  }

  async getProjectsByUser(userId: string): Promise<Project[]> {
    const projects: Project[] = []
    for (const project of this.projects.values()) {
      if (project.userId === userId || 
          project.collaborators.some(c => c.userId === userId)) {
        projects.push(project)
      }
    }
    return projects
  }

  // Blueprint Repository
  async createBlueprint(blueprintData: Omit<Blueprint, 'id' | 'uploadedAt'>): Promise<Blueprint> {
    const blueprint: Blueprint = {
      ...blueprintData,
      id: this.generateId(),
      uploadedAt: new Date()
    }

    this.blueprints.set(blueprint.id, blueprint)
    
    // Aktualisiere Benutzer-Usage
    const user = this.users.get(blueprint.userId)
    if (user) {
      user.subscription.usage.blueprintsProcessedThisMonth++
      this.users.set(blueprint.userId, user)
    }

    await this.logAudit({
      userId: blueprint.userId,
      action: 'upload',
      entityType: 'blueprint',
      entityId: blueprint.id,
      details: { fileName: blueprint.fileName, fileSize: blueprint.fileSize },
      ipAddress: '127.0.0.1',
      userAgent: 'test'
    })

    return blueprint
  }

  async updateBlueprintStatus(id: string, status: Blueprint['status']): Promise<Blueprint | null> {
    const blueprint = this.blueprints.get(id)
    if (!blueprint) return null

    blueprint.status = status
    this.blueprints.set(id, blueprint)

    await this.logAudit({
      userId: blueprint.userId,
      action: 'status_change',
      entityType: 'blueprint',
      entityId: id,
      details: { status },
      ipAddress: '127.0.0.1',
      userAgent: 'test'
    })

    return blueprint
  }

  async setBlueprintAnalysisResult(id: string, result: AnalysisResult): Promise<Blueprint | null> {
    const blueprint = this.blueprints.get(id)
    if (!blueprint) return null

    blueprint.analysisResult = result
    blueprint.status = 'analyzed'
    this.blueprints.set(id, blueprint)

    return blueprint
  }

  // Model Repository
  async createModel(modelData: Omit<Model3DRecord, 'id' | 'generatedAt'>): Promise<Model3DRecord> {
    const model: Model3DRecord = {
      ...modelData,
      id: this.generateId(),
      generatedAt: new Date()
    }

    this.models.set(model.id, model)

    // Aktualisiere Benutzer-Usage
    const user = this.users.get(model.userId)
    if (user) {
      user.subscription.usage.modelsGeneratedThisMonth++
      this.users.set(model.userId, user)
    }

    await this.logAudit({
      userId: model.userId,
      action: 'generate',
      entityType: 'model',
      entityId: model.id,
      details: { quality: model.quality, polygonCount: model.polygonCount },
      ipAddress: '127.0.0.1',
      userAgent: 'test'
    })

    return model
  }

  async getModelsByBlueprint(blueprintId: string): Promise<Model3DRecord[]> {
    const models: Model3DRecord[] = []
    for (const model of this.models.values()) {
      if (model.blueprintId === blueprintId) {
        models.push(model)
      }
    }
    return models
  }

  // Job Repository
  async createAnalysisJob(jobData: Omit<AnalysisJob, 'id' | 'status' | 'progress'>): Promise<AnalysisJob> {
    const job: AnalysisJob = {
      ...jobData,
      id: this.generateId(),
      status: 'queued',
      progress: 0
    }

    this.analysisJobs.set(job.id, job)
    return job
  }

  async getNextAnalysisJob(): Promise<AnalysisJob | null> {
    for (const job of this.analysisJobs.values()) {
      if (job.status === 'queued') {
        job.status = 'processing'
        job.startedAt = new Date()
        this.analysisJobs.set(job.id, job)
        return job
      }
    }
    return null
  }

  async updateJobProgress(jobId: string, progress: number): Promise<void> {
    const job = this.analysisJobs.get(jobId) || this.generationJobs.get(jobId)
    if (job) {
      job.progress = progress
      if (this.analysisJobs.has(jobId)) {
        this.analysisJobs.set(jobId, job as AnalysisJob)
      } else {
        this.generationJobs.set(jobId, job as GenerationJob)
      }
    }
  }

  // Metrics Repository
  async recordMetrics(metrics: Omit<SystemMetrics, 'timestamp'>): Promise<void> {
    const systemMetrics: SystemMetrics = {
      ...metrics,
      timestamp: new Date()
    }
    this.metrics.push(systemMetrics)

    // Behalte nur die letzten 1000 Einträge
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000)
    }
  }

  async getMetrics(from: Date, to: Date): Promise<SystemMetrics[]> {
    return this.metrics.filter(m => 
      m.timestamp >= from && m.timestamp <= to
    )
  }

  // Audit Repository
  async logAudit(entry: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void> {
    const auditEntry: AuditLog = {
      ...entry,
      id: this.generateId(),
      timestamp: new Date()
    }
    this.auditLogs.push(auditEntry)

    // Behalte nur die letzten 10000 Einträge
    if (this.auditLogs.length > 10000) {
      this.auditLogs = this.auditLogs.slice(-10000)
    }
  }

  async getAuditLogsByUser(userId: string): Promise<AuditLog[]> {
    return this.auditLogs.filter(log => log.userId === userId)
  }

  // Hilfsmethoden
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  }

  private initializeMockData(): void {
    // Initialisiere mit einigen Beispieldaten
    const testUser: User = {
      id: 'test-user-001',
      email: 'test@example.com',
      name: 'Test Benutzer',
      avatarUrl: 'https://via.placeholder.com/150',
      createdAt: new Date('2023-01-01'),
      lastLoginAt: new Date(),
      preferences: {
        defaultAnalysisParams: {
          wallHeight: 2.5,
          wallThickness: 0.15,
          generateDoors: true,
          generateWindows: true,
          generateRoof: false
        },
        preferredExportFormat: 'gltf',
        language: 'de',
        theme: 'light',
        notifications: {
          analysisComplete: true,
          generationComplete: true,
          exportReady: true,
          systemUpdates: false,
          emailNotifications: true
        }
      },
      subscription: {
        plan: 'pro',
        status: 'active',
        validUntil: new Date('2024-12-31'),
        features: {
          maxBlueprintsPerMonth: 100,
          maxFileSize: 50 * 1024 * 1024,
          aiAnalysisEnabled: true,
          priorityProcessing: true,
          exportFormats: ['gltf', 'obj', 'fbx', 'stl', 'ply'],
          cloudStorage: true,
          batchProcessing: true
        },
        usage: {
          blueprintsProcessedThisMonth: 15,
          modelsGeneratedThisMonth: 12,
          storageUsed: 256 * 1024 * 1024,
          apiCallsThisMonth: 450
        }
      }
    }

    this.users.set(testUser.id, testUser)

    // Beispiel-Projekt
    const testProject: Project = {
      id: 'test-project-001',
      userId: testUser.id,
      name: 'Beispiel Wohnhaus',
      description: 'Ein modernes Einfamilienhaus mit offenem Grundriss',
      createdAt: new Date('2023-06-01'),
      updatedAt: new Date(),
      blueprints: [],
      tags: ['wohnhaus', 'einfamilienhaus', 'modern'],
      isPublic: false,
      collaborators: []
    }

    this.projects.set(testProject.id, testProject)
  }

  // Statistiken und Berichte
  async getUserStatistics(userId: string): Promise<any> {
    const user = this.users.get(userId)
    if (!user) return null

    const userProjects = await this.getProjectsByUser(userId)
    const userBlueprints = Array.from(this.blueprints.values()).filter(b => b.userId === userId)
    const userModels = Array.from(this.models.values()).filter(m => m.userId === userId)

    return {
      totalProjects: userProjects.length,
      totalBlueprints: userBlueprints.length,
      totalModels: userModels.length,
      storageUsed: user.subscription.usage.storageUsed,
      subscription: user.subscription,
      recentActivity: this.auditLogs
        .filter(log => log.userId === userId)
        .slice(-10)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    }
  }

  async getSystemStatistics(): Promise<any> {
    const totalUsers = this.users.size
    const totalProjects = this.projects.size
    const totalBlueprints = this.blueprints.size
    const totalModels = this.models.size

    const activeUsers = Array.from(this.users.values())
      .filter(u => u.lastLoginAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      .length

    const totalStorage = Array.from(this.users.values())
      .reduce((sum, u) => sum + u.subscription.usage.storageUsed, 0)

    const subscriptionDistribution = Array.from(this.users.values())
      .reduce((acc, u) => {
        acc[u.subscription.plan] = (acc[u.subscription.plan] || 0) + 1
        return acc
      }, {} as Record<string, number>)

    return {
      totalUsers,
      activeUsers,
      totalProjects,
      totalBlueprints,
      totalModels,
      totalStorage,
      subscriptionDistribution,
      recentMetrics: this.metrics.slice(-24) // Letzte 24 Stunden
    }
  }

  // Cleanup-Operationen
  async cleanupExpiredData(): Promise<{ deletedExports: number; deletedAuditLogs: number }> {
    const now = new Date()
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Bereinige abgelaufene Exports
    let deletedExports = 0
    for (const model of this.models.values()) {
      model.exports = model.exports.filter(exp => {
        if (exp.expiresAt < now) {
          deletedExports++
          return false
        }
        return true
      })
    }

    // Bereinige alte Audit-Logs
    const initialLogCount = this.auditLogs.length
    this.auditLogs = this.auditLogs.filter(log => log.timestamp > oneMonthAgo)
    const deletedAuditLogs = initialLogCount - this.auditLogs.length

    return { deletedExports, deletedAuditLogs }
  }

  // Backup und Restore
  async createBackup(): Promise<{ users: User[]; projects: Project[]; blueprints: Blueprint[]; models: Model3DRecord[] }> {
    return {
      users: Array.from(this.users.values()),
      projects: Array.from(this.projects.values()),
      blueprints: Array.from(this.blueprints.values()),
      models: Array.from(this.models.values())
    }
  }

  async restoreFromBackup(backup: any): Promise<void> {
    this.users.clear()
    this.projects.clear()
    this.blueprints.clear()
    this.models.clear()

    backup.users?.forEach((user: User) => this.users.set(user.id, user))
    backup.projects?.forEach((project: Project) => this.projects.set(project.id, project))
    backup.blueprints?.forEach((blueprint: Blueprint) => this.blueprints.set(blueprint.id, blueprint))
    backup.models?.forEach((model: Model3DRecord) => this.models.set(model.id, model))
  }
}

// Singleton-Instanz für Mock-Database
export const mockDatabase = new MockDatabaseService()