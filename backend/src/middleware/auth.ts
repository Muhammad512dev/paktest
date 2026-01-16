
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-123';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    schoolId?: string;
    name: string;
  };
}

// Fixed: Use explicit any casting for req and res to resolve property existence errors (e.g., 'headers', 'status')
// which often occur when global DOM types shadow Express types in certain environments.
export const authenticate = (req: any, res: any, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    (req as AuthRequest).user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Fixed: Use explicit any casting for res to resolve the status property error.
export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthRequest).user;
    if (!user || !roles.includes(user.role)) {
      return (res as any).status(403).json({ error: 'Access denied: insufficient permissions' });
    }
    next();
  };
};
