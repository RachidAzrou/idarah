import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Building2, Mail, Lock, Eye, EyeOff, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import backgroundImage from "@assets/Luxury Navy Background_1757015851301.jpg";
import idarahLogo from "@assets/idarah (2)_1757094634426.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState("");
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const result = await login(email, password);
    
    if (result.success) {
      toast({
        title: "Succesvol ingelogd",
        description: "Welkom terug!",
      });
      setLocation("/dashboard");
    } else {
      setError(result.message || "Inloggen mislukt. Controleer uw gegevens.");
    }
    
    setIsLoading(false);
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResetting(true);
    setResetError("");

    try {
      const response = await apiRequest("POST", "/api/auth/reset-password", {
        email: resetEmail
      });

      if (response.ok) {
        toast({
          title: "Wachtwoord reset aangevraagd",
          description: "Er is een nieuw wachtwoord naar uw e-mailadres gestuurd.",
        });
        setShowResetDialog(false);
        setResetEmail("");
      } else {
        const errorData = await response.json();
        setResetError(errorData.message || "Er is een fout opgetreden bij het resetten van uw wachtwoord.");
      }
    } catch (error) {
      setResetError("Er is een fout opgetreden. Probeer het later opnieuw.");
    }

    setIsResetting(false);
  };

  return (
    <div 
      className="min-h-screen flex flex-col lg:flex-row"
      style={{
        backgroundImage: `url("${backgroundImage}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Background overlay */}
      <div className="absolute inset-0 bg-black/30"></div>
      

      {/* Login form section - Bottom on mobile, Right on desktop */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-8 lg:pl-8 lg:pr-16 relative z-10">
        <div className="max-w-md mx-auto w-full">
          {/* Logo above title */}
          <div className="flex justify-center mb-6">
            <img 
              src={idarahLogo} 
              alt="IDARAH Logo" 
              className="h-20 sm:h-24 lg:h-28 w-auto object-contain scale-[4]"
            />
          </div>
          
          {/* Title above login container */}
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-6 leading-tight text-center">
            Inloggen bij uw account
          </h1>
          
          <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6" data-testid="login-form">
              {error && (
                <Alert variant="destructive" data-testid="login-error">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div>
                <Label htmlFor="email" className="text-gray-700 font-medium">E-mailadres</Label>
                <div className="mt-2">
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="h-12 px-4 bg-gray-50 border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-blue-500"
                    placeholder="naam@moskee.be"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    data-testid="input-email"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password" className="text-gray-700 font-medium">Wachtwoord</Label>
                <div className="mt-2 relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    className="h-12 px-4 pr-12 bg-gray-50 border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Uw wachtwoord"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    data-testid="input-password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                    data-testid="toggle-password"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex justify-end text-sm">
                <button 
                  type="button"
                  onClick={() => setShowResetDialog(true)}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                  data-testid="forgot-password-link"
                >
                  Wachtwoord vergeten?
                </button>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-200"
                disabled={isLoading}
                data-testid="button-login"
              >
                {isLoading ? "Bezig met inloggen..." : "Inloggen"}
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Password Reset Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">
              Wachtwoord resetten
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Voer uw e-mailadres in en we sturen u een nieuw wachtwoord toe.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handlePasswordReset} className="space-y-4">
            {resetError && (
              <Alert variant="destructive" data-testid="reset-error">
                <AlertDescription>{resetError}</AlertDescription>
              </Alert>
            )}
            
            <div>
              <Label htmlFor="reset-email" className="text-gray-700 font-medium">
                E-mailadres
              </Label>
              <div className="mt-2">
                <Input
                  id="reset-email"
                  name="reset-email"
                  type="email"
                  autoComplete="email"
                  required
                  className="h-11 px-3 bg-gray-50 border-gray-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-blue-500"
                  placeholder="naam@moskee.be"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  data-testid="input-reset-email"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowResetDialog(false);
                  setResetEmail("");
                  setResetError("");
                }}
                data-testid="button-cancel-reset"
              >
                Annuleren
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={isResetting}
                data-testid="button-submit-reset"
              >
                {isResetting ? "Bezig..." : "Nieuw wachtwoord aanvragen"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}