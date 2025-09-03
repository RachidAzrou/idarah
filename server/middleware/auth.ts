import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { authService } from "../services/auth";

declare global {
  namespace Express {
    interface Request {
      user?: any;
      tenantId?: string;
    }
  }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: "Geen geldige authenticatie" });
    }

    const token = authHeader.substring(7);
    const decoded = authService.verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ message: "Ongeldig token" });
    }

    const user = await storage.getUser(decoded.userId);
    if (!user || !user.active) {
      return res.status(401).json({ message: "Gebruiker niet gevonden of inactief" });
    }

    req.user = user;
    req.tenantId = user.tenantId;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: "Authenticatie mislukt" });
  }
}
