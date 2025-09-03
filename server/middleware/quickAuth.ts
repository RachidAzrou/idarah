import { Request, Response, NextFunction } from 'express';

// Simple in-memory store for verification tokens (in production use Redis or database)
const verifyTokens = new Map<string, { userId: string; role: string; createdAt: Date }>();

// Cleanup expired tokens every hour
setInterval(() => {
  const now = new Date();
  const tokensToDelete: string[] = [];
  
  verifyTokens.forEach((data, token) => {
    const hoursPassed = (now.getTime() - data.createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursPassed > 2) { // 2 hour expiry
      tokensToDelete.push(token);
    }
  });
  
  tokensToDelete.forEach(token => verifyTokens.delete(token));
}, 60 * 60 * 1000);

export const quickAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Inloggen vereist. Log eerst in.' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const tokenData = verifyTokens.get(token);

    if (!tokenData) {
      return res.status(401).json({ error: 'Uw sessie is verlopen. Log opnieuw in.' });
    }

    // Check token age (2 hours max)
    const now = new Date();
    const hoursPassed = (now.getTime() - tokenData.createdAt.getTime()) / (1000 * 60 * 60);
    
    if (hoursPassed > 2) {
      verifyTokens.delete(token);
      return res.status(401).json({ error: 'Inlogtijd verlopen. Log opnieuw in.' });
    }

    // Check role permissions
    if (tokenData.role !== 'BEHEERDER' && tokenData.role !== 'MEDEWERKER') {
      return res.status(403).json({ error: 'Onvoldoende rechten voor deze actie' });
    }

    // Add user info to request
    req.user = {
      id: tokenData.userId,
      role: tokenData.role,
    } as any;

    next();
  } catch (error) {
    res.status(401).json({ error: 'Inloggen mislukt. Probeer opnieuw.' });
  }
};

// Helper to store verification tokens
export const storeVerifyToken = (token: string, userId: string, role: string) => {
  verifyTokens.set(token, {
    userId,
    role,
    createdAt: new Date(),
  });
};