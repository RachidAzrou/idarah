import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Eye, EyeOff, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickAuthModalProps {
  onAuthenticated: (token: string) => void;
  isOpen: boolean;
}

export function QuickAuthModal({ onAuthenticated, isOpen }: QuickAuthModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/quick-verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Authenticatie mislukt");
      }

      // Controleer of de gebruiker de juiste rol heeft
      if (result.user.role !== 'BEHEERDER' && result.user.role !== 'MEDEWERKER') {
        throw new Error("Geen toegang - alleen medewerkers en beheerders");
      }

      // Sla verificatie token op in sessionStorage
      const verifyToken = `verify_${Date.now()}_${result.user.id}`;
      sessionStorage.setItem("qr_verify_token", verifyToken);
      sessionStorage.setItem("qr_verify_user", JSON.stringify({
        name: result.user.name,
        role: result.user.role,
        authenticatedAt: new Date().toISOString()
      }));

      onAuthenticated(verifyToken);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading && email && password) {
      handleSubmit(e as any);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        style={{
          background: `radial-gradient(circle at 50% 50%, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.8) 100%)`
        }}
      />
      
      {/* Modal */}
      <Card className="relative w-full max-w-md mx-auto shadow-2xl border-2">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 p-3 rounded-full bg-blue-100 w-fit">
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-xl font-semibold">
            Veilige toegang vereist
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Log in als medewerker of beheerder om lidgegevens te bekijken
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mailadres</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="jouw@email.nl"
                className="h-11"
                disabled={loading}
                autoComplete="email"
                autoFocus
                data-testid="input-auth-email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Wachtwoord</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Wachtwoord"
                  className="h-11 pr-12"
                  disabled={loading}
                  autoComplete="current-password"
                  data-testid="input-auth-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-9 w-9"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  data-testid="button-toggle-password"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                className="flex-1 h-11"
                disabled={loading || !email || !password}
                data-testid="button-auth-submit"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Verifiëren...
                  </div>
                ) : (
                  "Toegang verkrijgen"
                )}
              </Button>
            </div>
          </form>

          <div className="text-center pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              Alleen geautoriseerd personeel heeft toegang tot deze informatie
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}