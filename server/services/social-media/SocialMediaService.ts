import { nanoid } from 'nanoid';
import { db } from '../../db.js';
import { socialMediaPosts, socialMediaAccounts } from '../../../shared/schema.modules.js';
import { eq, and } from 'drizzle-orm';
import { log } from '../../lib/logger.js';
import type { Platform } from './types.js';

interface PublishRequest {
  userId: string;
  title: string;
  content: string;
  mediaUrls?: string[];
  platforms: Platform[];
  scheduledAt?: Date;
  propertyId?: string;
  platformSpecific?: Record<string, any>;
}

interface PublishResult {
  success: boolean;
  postId?: string;
  postUrl?: string;
  error?: string;
}

export class SocialMediaService {
  /**
   * Create a new social media post (draft or scheduled)
   */
  async createPost(request: PublishRequest) {
    try {
      const postId = nanoid();
      const now = new Date();

      // Determine status based on scheduledAt
      let status: 'draft' | 'scheduled' | 'published' = 'draft';
      if (request.scheduledAt) {
        status = request.scheduledAt > now ? 'scheduled' : 'draft';
      }

      const [post] = await db.insert(socialMediaPosts).values({
        id: postId,
        userId: request.userId,
        propertyId: request.propertyId,
        title: request.title,
        content: request.content,
        mediaUrls: request.mediaUrls || [],
        platforms: request.platforms,
        platformSpecificContent: request.platformSpecific,
        scheduledAt: request.scheduledAt,
        status,
        createdAt: now,
        updatedAt: now,
      }).returning();

      log.info('Social media post created', { postId, userId: request.userId, platforms: request.platforms });

      return { success: true, post };
    } catch (error) {
      log.error('Failed to create social media post', { error, request });
      throw error;
    }
  }

  /**
   * Publish a post immediately to selected platforms
   */
  async publishPost(postId: string, userId: string): Promise<Record<Platform, PublishResult>> {
    try {
      // Get post
      const [post] = await db
        .select()
        .from(socialMediaPosts)
        .where(and(eq(socialMediaPosts.id, postId), eq(socialMediaPosts.userId, userId)));

      if (!post) {
        throw new Error('Post not found');
      }

      // Get connected accounts for user
      const accounts = await db
        .select()
        .from(socialMediaAccounts)
        .where(and(
          eq(socialMediaAccounts.userId, userId),
          eq(socialMediaAccounts.isActive, true)
        ));

      const results: Record<string, PublishResult> = {};

      // Publish to each platform
      for (const platform of post.platforms) {
        const account = accounts.find(a => a.platform === platform);
        
        if (!account) {
          results[platform] = {
            success: false,
            error: `No connected account for ${platform}`,
          };
          continue;
        }

        try {
          // TODO: Implement actual platform publishing via adapters
          // For now, just simulate success
          results[platform] = {
            success: true,
            postId: nanoid(),
            postUrl: `https://${platform}.com/post/${nanoid()}`,
          };

          log.info('Published to platform', { platform, postId, accountId: account.id });
        } catch (error) {
          log.error('Failed to publish to platform', { platform, error });
          results[platform] = {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      }

      // Update post with results
      const allSuccess = Object.values(results).every(r => r.success);
      await db
        .update(socialMediaPosts)
        .set({
          status: allSuccess ? 'published' : 'failed',
          publishedAt: new Date(),
          publishResults: results,
          updatedAt: new Date(),
        })
        .where(eq(socialMediaPosts.id, postId));

      return results as Record<Platform, PublishResult>;
    } catch (error) {
      log.error('Failed to publish post', { error, postId });
      throw error;
    }
  }

  /**
   * Get all posts for a user
   */
  async getPosts(userId: string, filters?: { status?: string; platform?: Platform }) {
    try {
      let query = db
        .select()
        .from(socialMediaPosts)
        .where(eq(socialMediaPosts.userId, userId));

      // TODO: Add filter support

      const posts = await query;
      return posts;
    } catch (error) {
      log.error('Failed to get posts', { error, userId });
      throw error;
    }
  }

  /**
   * Get a single post
   */
  async getPost(postId: string, userId: string) {
    try {
      const [post] = await db
        .select()
        .from(socialMediaPosts)
        .where(and(eq(socialMediaPosts.id, postId), eq(socialMediaPosts.userId, userId)));

      return post;
    } catch (error) {
      log.error('Failed to get post', { error, postId });
      throw error;
    }
  }

  /**
   * Update a post (only if not published)
   */
  async updatePost(postId: string, userId: string, updates: Partial<PublishRequest>) {
    try {
      const [post] = await db
        .select()
        .from(socialMediaPosts)
        .where(and(eq(socialMediaPosts.id, postId), eq(socialMediaPosts.userId, userId)));

      if (!post) {
        throw new Error('Post not found');
      }

      if (post.status === 'published') {
        throw new Error('Cannot update published post');
      }

      await db
        .update(socialMediaPosts)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(socialMediaPosts.id, postId));

      log.info('Post updated', { postId, userId });
      return { success: true };
    } catch (error) {
      log.error('Failed to update post', { error, postId });
      throw error;
    }
  }

  /**
   * Delete a post
   */
  async deletePost(postId: string, userId: string) {
    try {
      await db
        .delete(socialMediaPosts)
        .where(and(eq(socialMediaPosts.id, postId), eq(socialMediaPosts.userId, userId)));

      log.info('Post deleted', { postId, userId });
      return { success: true };
    } catch (error) {
      log.error('Failed to delete post', { error, postId });
      throw error;
    }
  }

  /**
   * Get connected accounts for a user
   */
  async getAccounts(userId: string) {
    try {
      const accounts = await db
        .select()
        .from(socialMediaAccounts)
        .where(eq(socialMediaAccounts.userId, userId));

      return accounts;
    } catch (error) {
      log.error('Failed to get accounts', { error, userId });
      throw error;
    }
  }

  /**
   * Disconnect an account
   */
  async disconnectAccount(accountId: string, userId: string) {
    try {
      await db
        .delete(socialMediaAccounts)
        .where(and(eq(socialMediaAccounts.id, accountId), eq(socialMediaAccounts.userId, userId)));

      log.info('Account disconnected', { accountId, userId });
      return { success: true };
    } catch (error) {
      log.error('Failed to disconnect account', { error, accountId });
      throw error;
    }
  }
}

export const socialMediaService = new SocialMediaService();
