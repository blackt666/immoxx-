import { Router } from 'express';
import { getDeepSeekService } from '../services/deepseekService.js';
import { z } from 'zod';
import type { Request, Response } from 'express';

const router = Router();

// Validation schemas
const propertyValuationSchema = z.object({
  address: z.string().min(1, 'Address is required'),
  propertyType: z.string().min(1, 'Property type is required'),
  size: z.number().positive('Size must be positive'),
  rooms: z.number().positive('Number of rooms must be positive'),
  yearBuilt: z.number().optional(),
  condition: z.string().optional(),
  features: z.array(z.string()).optional(),
  location: z.object({
    city: z.string(),
    region: z.string(),
    proximity: z.array(z.string()).optional(),
  }).optional(),
});

const marketAnalysisSchema = z.object({
  region: z.string().min(1, 'Region is required'),
  propertyType: z.string().optional(),
  timeframe: z.string().optional(),
});

const propertyDescriptionSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  type: z.string().min(1, 'Type is required'),
  size: z.number().positive('Size must be positive'),
  rooms: z.number().positive('Number of rooms must be positive'),
  features: z.array(z.string()),
  location: z.string().min(1, 'Location is required'),
});

const chatSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  context: z.string().optional(),
  conversationHistory: z.array(z.object({
    role: z.enum(['system', 'user', 'assistant']),
    content: z.string(),
  })).optional(),
});

const emailResponseSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(1, 'Message is required'),
  propertyReference: z.string().optional(),
});

/**
 * POST /api/deepseek/valuation
 * AI-powered property valuation
 */
router.post('/valuation', async (req: Request, res: Response) => {
  try {
    const validatedData = propertyValuationSchema.parse(req.body);
    const deepseek = getDeepSeekService();

    const valuation = await deepseek.valuateProperty(validatedData);

    res.json({
      success: true,
      data: valuation,
    });
  } catch (error) {
    console.error('Property valuation error:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Property valuation failed',
    });
  }
});

/**
 * POST /api/deepseek/market-analysis
 * Generate market analysis for a region
 */
router.post('/market-analysis', async (req: Request, res: Response) => {
  try {
    const validatedData = marketAnalysisSchema.parse(req.body);
    const deepseek = getDeepSeekService();

    const analysis = await deepseek.analyzeMarket(validatedData);

    res.json({
      success: true,
      data: {
        analysis,
        region: validatedData.region,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('Market analysis error:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Market analysis failed',
    });
  }
});

/**
 * POST /api/deepseek/generate-description
 * Generate property description
 */
router.post('/generate-description', async (req: Request, res: Response) => {
  try {
    const validatedData = propertyDescriptionSchema.parse(req.body);
    const deepseek = getDeepSeekService();

    const description = await deepseek.generatePropertyDescription(validatedData);

    res.json({
      success: true,
      data: {
        description,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('Description generation error:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Description generation failed',
    });
  }
});

/**
 * POST /api/deepseek/chat
 * Chat with AI assistant
 */
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const validatedData = chatSchema.parse(req.body) as {
      message: string;
      context?: string;
      conversationHistory?: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
    };
    const deepseek = getDeepSeekService();

    const response = await deepseek.chat(validatedData);

    res.json({
      success: true,
      data: {
        response,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('Chat error:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Chat failed',
    });
  }
});

/**
 * POST /api/deepseek/generate-email
 * Generate email response for customer inquiry
 */
router.post('/generate-email', async (req: Request, res: Response) => {
  try {
    const validatedData = emailResponseSchema.parse(req.body) as {
      customerName: string;
      subject: string;
      message: string;
      propertyReference?: string;
    };
    const deepseek = getDeepSeekService();

    const emailResponse = await deepseek.generateEmailResponse(validatedData);

    res.json({
      success: true,
      data: {
        emailResponse,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('Email generation error:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Email generation failed',
    });
  }
});

/**
 * GET /api/deepseek/test
 * Test DeepSeek API connection
 */
router.get('/test', async (_req: Request, res: Response) => {
  try {
    const deepseek = getDeepSeekService();
    const isConnected = await deepseek.testConnection();

    res.json({
      success: true,
      data: {
        connected: isConnected,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('DeepSeek connection test error:', error);

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Connection test failed',
    });
  }
});

/**
 * GET /api/deepseek/status
 * Get DeepSeek service status
 */
router.get('/status', async (_req: Request, res: Response) => {
  try {
    const apiKeyConfigured = !!process.env.DEEPSEEK_API_KEY;

    res.json({
      success: true,
      data: {
        configured: apiKeyConfigured,
        model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
        maxTokens: parseInt(process.env.DEEPSEEK_MAX_TOKENS || '2000'),
        temperature: parseFloat(process.env.DEEPSEEK_TEMPERATURE || '0.7'),
      },
    });
  } catch (error) {
    console.error('DeepSeek status error:', error);

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Status check failed',
    });
  }
});

export default router;
