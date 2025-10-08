// Express Session Type Extension
// This fixes the TypeScript errors for req.session.user

declare module 'express-session' {
  interface SessionData {
    user?: {
      id: string;
      username: string;
      name: string;
      role: string;
    };
    isAuthenticated?: boolean;
    siteContent?: Array<{
      id: string;
      section: string;
      content: any;
      updatedAt: string;
    }>;
    // Calendar OAuth security
    oauthStates?: {
      [stateNonce: string]: {
        agentId: string;
        provider: 'google' | 'apple' | 'outlook';
        createdAt: number;
        expiresAt: number;
      };
    };
  }
}

// Extend Express Request interface to include agentId
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      agentId?: string;
    }
  }
}

export {}; // Make this a module