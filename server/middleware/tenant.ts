import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";

export async function tenantMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.tenantId) {
      return res.status(401).json({ message: "Geen tenant context" });
    }

    const tenant = await storage.getTenant(req.tenantId);
    if (!tenant) {
      return res.status(404).json({ message: "Tenant niet gevonden" });
    }

    next();
  } catch (error) {
    console.error('Tenant middleware error:', error);
    res.status(500).json({ message: "Tenant verificatie mislukt" });
  }
}
