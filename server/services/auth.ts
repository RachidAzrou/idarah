import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { storage } from "../storage";
import { type User } from "@shared/schema";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

interface LoginResult {
  success: boolean;
  message?: string;
  user?: User;
  token?: string;
}

class AuthService {
  async login(email: string, password: string): Promise<LoginResult> {
    try {
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return { success: false, message: "Ongeldig e-mailadres of wachtwoord" };
      }

      if (!user.active) {
        return { success: false, message: "Account is gedeactiveerd" };
      }

      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return { success: false, message: "Ongeldig e-mailadres of wachtwoord" };
      }

      const token = this.generateToken(user.id);
      
      return {
        success: true,
        user: {
          ...user,
          passwordHash: undefined, // Don't send password hash
        } as User,
        token,
      };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, message: "Er is een fout opgetreden tijdens het inloggen" };
    }
  }

  generateToken(userId: string): string {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "24h" });
  }

  verifyToken(token: string): { userId: string } | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      return decoded;
    } catch (error) {
      return null;
    }
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }
}

export const authService = new AuthService();
