import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { storage } from "../storage";
import { type User } from "@shared/schema";
import { sendEmail, generatePasswordResetEmail } from "./email";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

interface LoginResult {
  success: boolean;
  message?: string;
  user?: User;
  token?: string;
}

interface ResetPasswordResult {
  success: boolean;
  message?: string;
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

  generateRandomPassword(): string {
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }

  async resetPassword(email: string): Promise<ResetPasswordResult> {
    try {
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return { success: false, message: "E-mailadres niet gevonden in het systeem." };
      }

      if (!user.active) {
        return { success: false, message: "Dit account is uitgeschakeld. Neem contact op met de beheerder." };
      }

      // Generate new password
      const newPassword = this.generateRandomPassword();
      const hashedPassword = await this.hashPassword(newPassword);

      // Update user password
      await storage.updateUserPassword(user.id, hashedPassword);

      // Send email with new password
      const emailContent = generatePasswordResetEmail(newPassword, user.email);
      const emailSent = await sendEmail({
        to: user.email,
        from: "noreply@idarah.be", // You can configure this
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.html,
      });

      if (!emailSent) {
        console.error("Failed to send password reset email to:", user.email);
        // Still return success since password was updated
      }

      return { success: true, message: "Een nieuw wachtwoord is verzonden naar uw e-mailadres." };
    } catch (error) {
      console.error("Password reset error:", error);
      return { success: false, message: "Er is een fout opgetreden bij het resetten van uw wachtwoord." };
    }
  }
}

export const authService = new AuthService();
