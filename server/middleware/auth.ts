import { Request, Response, NextFunction } from 'express';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.session && req.session.user) {
    req.agentId = req.session.user.id;
    return next();
  }
  res.status(401).json({ message: 'Unauthorized: Please log in.' });
}
