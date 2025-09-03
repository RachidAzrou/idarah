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
        return { success: false, message: "E-mailadres niet gevonden. Controleer uw inloggegevens." };
      }

      if (!user.active) {
        return { success: false, message: "Dit account is uitgeschakeld. Neem contact op met de beheerder." };
      }

      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return { success: false, message: "Wachtwoord is niet correct. Probeer opnieuw." };
      }

      const token = this.generateToken(user.id);
      
      const { passwordHash, ...userWithoutPassword } = user;
      return {
        success: true,
        user: userWithoutPassword as User,
        token,
      };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, message: "Inloggen mislukt. Probeer het later opnieuw." };
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
