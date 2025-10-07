import { Router } from 'express';
import type { Request, Response } from 'express';
import { socialMediaService } from '../services/social-media/SocialMediaService.js';
import { log } from '../lib/logger.js';

const router = Router();

/**
 * GET /api/social-media/posts
 * List all posts for the authenticated user
 */
router.get('/posts', async (req: Request, res: Response) => {
  try {
    const userId = req.session?.user?.id || 'demo-user';
    const { status, platform } = req.query;

    const filters: any = {};
    if (status) filters.status = status;
    if (platform) filters.platform = platform;

    const posts = await socialMediaService.getPosts(userId, filters);
    res.json(posts);
  } catch (error) {
    log.error('Failed to get posts', { error });
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

/**
 * GET /api/social-media/posts/:id
 * Get a specific post
 */
router.get('/posts/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.session?.user?.id || 'demo-user';
    const { id } = req.params;

    const post = await socialMediaService.getPost(id, userId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json(post);
  } catch (error) {
    log.error('Failed to get post', { error });
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

/**
 * POST /api/social-media/publish
 * Create and optionally publish a post
 */
router.post('/publish', async (req: Request, res: Response) => {
  try {
    const userId = req.session?.user?.id || 'demo-user';
    const {
      title,
      content,
      mediaUrls,
      platforms,
      scheduledAt,
      propertyId,
      platformSpecific,
    } = req.body;

    // Validate required fields
    if (!title || !content || !platforms || platforms.length === 0) {
      return res.status(400).json({
        error: 'Missing required fields: title, content, and platforms are required',
      });
    }

    // Create post
    const result = await socialMediaService.createPost({
      userId,
      title,
      content,
      mediaUrls,
      platforms,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      propertyId,
      platformSpecific,
    });

    // If no scheduledAt or scheduledAt is in the past, publish immediately
    const shouldPublishNow = !scheduledAt || new Date(scheduledAt) <= new Date();
    
    if (shouldPublishNow && result.post) {
      const publishResults = await socialMediaService.publishPost(result.post.id, userId);
      res.json({
        success: true,
        post: result.post,
        publishResults,
      });
    } else {
      res.json({
        success: true,
        post: result.post,
        message: 'Post scheduled successfully',
      });
    }
  } catch (error) {
    log.error('Failed to publish post', { error });
    res.status(500).json({ error: 'Failed to publish post' });
  }
});

/**
 * PUT /api/social-media/posts/:id
 * Update a post (only if not published)
 */
router.put('/posts/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.session?.user?.id || 'demo-user';
    const { id } = req.params;

    await socialMediaService.updatePost(id, userId, req.body);
    res.json({ success: true, message: 'Post updated successfully' });
  } catch (error) {
    log.error('Failed to update post', { error });
    const message = error instanceof Error ? error.message : 'Failed to update post';
    res.status(400).json({ error: message });
  }
});

/**
 * DELETE /api/social-media/posts/:id
 * Delete a post
 */
router.delete('/posts/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.session?.user?.id || 'demo-user';
    const { id } = req.params;

    await socialMediaService.deletePost(id, userId);
    res.json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    log.error('Failed to delete post', { error });
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

/**
 * GET /api/social-media/accounts
 * List connected social media accounts
 */
router.get('/accounts', async (req: Request, res: Response) => {
  try {
    const userId = req.session?.user?.id || 'demo-user';
    const accounts = await socialMediaService.getAccounts(userId);
    
    // Remove sensitive data before sending
    const safeAccounts = accounts.map(account => ({
      id: account.id,
      platform: account.platform,
      accountId: account.accountId,
      accountName: account.accountName,
      accountType: account.accountType,
      isActive: account.isActive,
      lastSyncAt: account.lastSyncAt,
      createdAt: account.createdAt,
    }));
    
    res.json(safeAccounts);
  } catch (error) {
    log.error('Failed to get accounts', { error });
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

/**
 * POST /api/social-media/accounts/connect
 * Initiate OAuth connection for a platform
 */
router.post('/accounts/connect', async (req: Request, res: Response) => {
  try {
    const userId = req.session?.user?.id || 'demo-user';
    const { platform } = req.body;

    if (!platform) {
      return res.status(400).json({ error: 'Platform is required' });
    }

    // TODO: Implement actual OAuth flow
    // For now, return a placeholder
    res.json({
      authUrl: `https://oauth.${platform}.com/authorize?client_id=YOUR_APP_ID&redirect_uri=${encodeURIComponent(
        `${req.protocol}://${req.get('host')}/api/social-media/callback/${platform}`
      )}&state=${userId}`,
      message: 'OAuth flow not yet implemented',
    });
  } catch (error) {
    log.error('Failed to initiate OAuth', { error });
    res.status(500).json({ error: 'Failed to connect account' });
  }
});

/**
 * GET /api/social-media/callback/:platform
 * OAuth callback handler
 */
router.get('/callback/:platform', async (req: Request, res: Response) => {
  try {
    const { platform } = req.params;
    const { code, state } = req.query;

    // TODO: Implement actual OAuth token exchange
    log.info('OAuth callback received', { platform, code, state });

    res.redirect('/admin/social-media?connected=true');
  } catch (error) {
    log.error('OAuth callback failed', { error });
    res.redirect('/admin/social-media?error=connection_failed');
  }
});

/**
 * DELETE /api/social-media/accounts/:id
 * Disconnect a social media account
 */
router.delete('/accounts/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.session?.user?.id || 'demo-user';
    const { id } = req.params;

    await socialMediaService.disconnectAccount(id, userId);
    res.json({ success: true, message: 'Account disconnected successfully' });
  } catch (error) {
    log.error('Failed to disconnect account', { error });
    res.status(500).json({ error: 'Failed to disconnect account' });
  }
});

/**
 * GET /api/social-media/analytics/:postId
 * Get analytics for a specific post
 */
router.get('/analytics/:postId', async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;

    // TODO: Implement analytics fetching
    res.json({
      postId,
      analytics: {},
      message: 'Analytics not yet implemented',
    });
  } catch (error) {
    log.error('Failed to get analytics', { error });
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

/**
 * GET /api/social-media/analytics/overview
 * Get aggregated analytics overview
 */
router.get('/analytics/overview', async (req: Request, res: Response) => {
  try {
    const userId = req.session?.user?.id || 'demo-user';

    // TODO: Implement aggregated analytics
    res.json({
      totalPosts: 0,
      totalImpressions: 0,
      totalEngagement: 0,
      platforms: {},
      message: 'Analytics overview not yet implemented',
    });
  } catch (error) {
    log.error('Failed to get analytics overview', { error });
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

export default router;
