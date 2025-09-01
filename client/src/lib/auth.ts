import { type User } from "@shared/schema";

export interface AuthUser extends Omit<User, 'passwordHash'> {}

export function getAuthToken(): string | null {
  return localStorage.getItem("authToken");
}

export function setAuthToken(token: string): void {
  localStorage.setItem("authToken", token);
}

export function removeAuthToken(): void {
  localStorage.removeItem("authToken");
}

export function getUserInitials(name: string): string {
  return name
    .split(" ")
    .map(part => part.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
