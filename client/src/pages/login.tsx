import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Building2, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import backgroundImage from "@assets/Luxury Navy Background_1757015851301.jpg";
import idarahLogo from "@assets/idarah_1757016078310.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showLoginContainer, setShowLoginContainer] = useState(false);
  const [showText, setShowText] = useState(false);
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    // After 3 seconds, show the login container sliding out
    const loginTimer = setTimeout(() => {
      setShowLoginContainer(true);
    }, 3000);

    // After login container appears, show the text
    const textTimer = setTimeout(() => {
      setShowText(true);
    }, 3500);

    return () => {
      clearTimeout(loginTimer);
      clearTimeout(textTimer);
    };
  }, []);

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

  return (
    <div 
      className="min-h-screen flex relative"
      style={{
        backgroundImage: `url("${backgroundImage}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Background overlay */}
      <div className="absolute inset-0 bg-black/30"></div>
      
      {/* Centered Logo */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <img 
          src={idarahLogo} 
          alt="IDARAH" 
          className="h-96 w-auto object-contain"
        />
      </div>

      {/* Login container that slides out from logo */}
      <div className={`absolute right-0 top-0 h-full flex items-center justify-center pr-8 transition-all duration-1000 ease-out z-20 ${
        showLoginContainer ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}>
        <div className="w-96">
          {/* Welcome text above login form */}
          <div className={`mb-8 transition-all duration-700 delay-300 ${
            showText ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
              Inloggen bij uw account
            </h1>
            <p className="text-xl text-gray-200">
              Beheersysteem voor uw moskee gemeenschap
            </p>
          </div>
          
          <div className="max-w-md w-full">
            <div className="bg-white rounded-3xl shadow-2xl p-8">
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
                  <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
                    Wachtwoord vergeten?
                  </a>
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
      </div>
    </div>
  );
}