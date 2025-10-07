// Social Media Types
export type Platform = 'facebook' | 'instagram' | 'linkedin' | 'tiktok';

export type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed';

export type MediaType = 'image' | 'video' | 'carousel';

export interface SocialMediaPost {
  id: string;
  userId: string;
  propertyId?: string;
  
  // Content
  title: string;
  content: string;
  mediaUrls?: string[];
  mediaType?: MediaType;
  
  // Platforms
  platforms: Platform[];
  platformSpecificContent?: Record<Platform, any>;
  
  // Scheduling
  scheduledAt?: Date;
  publishedAt?: Date;
  status: PostStatus;
  
  // Results
  publishResults?: Record<Platform, PublishResult>;
  analytics?: Record<Platform, PostAnalytics>;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface PublishResult {
  success: boolean;
  postId?: string;
  postUrl?: string;
  error?: string;
}

export interface PostAnalytics {
  impressions: number;
  reach: number;
  engagement: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  saves?: number;
  fetchedAt: Date;
}

export interface SocialMediaAccount {
  id: string;
  userId: string;
  platform: Platform;
  
  // Account Info
  accountId: string;
  accountName: string;
  accountType?: string;
  
  // Authentication
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  
  // Status
  isActive: boolean;
  lastSyncAt?: Date;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface PublishRequest {
  title: string;
  content: string;
  mediaUrls?: string[];
  platforms: Platform[];
  scheduledAt?: Date;
  propertyId?: string;
  platformSpecific?: {
    facebook?: {
      targetType?: 'page' | 'group';
      targetId?: string;
    };
    instagram?: {
      type?: 'feed' | 'story' | 'reel';
    };
    linkedin?: {
      visibility?: 'public' | 'connections';
    };
    tiktok?: {
      privacy?: 'public' | 'friends' | 'private';
    };
  };
}

export interface PlatformAdapter {
  platform: Platform;
  publishPost(post: PublishRequest, account: SocialMediaAccount): Promise<PublishResult>;
  getAnalytics(postId: string, account: SocialMediaAccount): Promise<PostAnalytics>;
  validateToken(account: SocialMediaAccount): Promise<boolean>;
  refreshToken?(account: SocialMediaAccount): Promise<{ accessToken: string; refreshToken?: string; expiresAt?: Date }>;
}
