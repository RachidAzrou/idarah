import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import backgroundImage from "@assets/Luxury Navy Background_1757015851301.jpg";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [hideLogoText, setHideLogoText] = useState(false);
  const [showLoginContainer, setShowLoginContainer] = useState(false);
  const [showText, setShowText] = useState(false);
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    // Step 1: After 800ms, hide logo text
    const hideTextTimer = setTimeout(() => {
      setHideLogoText(true);
    }, 800);

    // Step 2: After logo text fades out (1100ms total), show login container
    const showContainerTimer = setTimeout(() => {
      setShowLoginContainer(true);
    }, 1100);

    // Step 3: After login container slides in (1800ms total), show text
    const showTextTimer = setTimeout(() => {
      setShowText(true);
    }, 1800);

    return () => {
      clearTimeout(hideTextTimer);
      clearTimeout(showContainerTimer);
      clearTimeout(showTextTimer);
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
      className="min-h-screen relative overflow-hidden"
      style={{
        backgroundImage: `url("${backgroundImage}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Background overlay */}
      <div className="absolute inset-0 bg-black/30"></div>
      
      {/* Main content container */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-6">
        <div className="w-full max-w-6xl relative">
          
          {/* LOGO SECTION */}
          <div className="flex items-center gap-7">
            {/* Blue "i" mark */}
            <div className="relative w-28 h-80 bg-blue-600 rounded-2xl shadow-2xl">
              {/* Top circle of "i" */}
              <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-14 h-20 bg-[#071938] rounded-xl"></div>
              {/* Bottom rectangle of "i" */}
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-16 h-32 bg-[#071938] rounded-2xl rounded-t-3xl"></div>
            </div>
            
            {/* White vertical divider */}
            <div className="w-1 h-96 bg-white rounded-sm shadow-sm"></div>
            
            {/* Logo text (fades out) */}
            <div className={`transition-all duration-700 ease-out ${
              hideLogoText ? 'opacity-0 -translate-x-2' : 'opacity-100 translate-x-0'
            }`}>
              <h1 className="text-white font-bold text-8xl tracking-wide mb-1">IDARAH</h1>
              <p className="text-blue-200 text-sm tracking-[0.35em] uppercase">
                VAN OVERZICHT NAAR <span className="text-white">INZICHT.</span>
              </p>
            </div>
          </div>

          {/* LOGIN TEXT (appears after login container) */}
          <div className={`absolute top-6 right-6 max-w-md transition-all duration-600 ease-out ${
            showText ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <h2 className="text-white text-4xl font-bold mb-2 leading-tight">
              Inloggen bij uw account
            </h2>
            <p className="text-blue-200 text-lg">
              Beheersysteem voor uw moskee gemeenschap
            </p>
          </div>

          {/* LOGIN CONTAINER (slides from white divider) */}
          <div className={`absolute top-32 right-6 w-96 bg-white rounded-2xl shadow-2xl p-7 transition-all duration-800 ease-out ${
            showLoginContainer ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 -translate-x-16 scale-95'
          }`}>
            <form onSubmit={handleSubmit} className="space-y-5" data-testid="login-form">
              {error && (
                <Alert variant="destructive" data-testid="login-error">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div>
                <Label htmlFor="email" className="text-slate-700 font-semibold mb-2 block">
                  E-mailadres
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="h-12 px-4 bg-slate-50 border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-blue-500 text-base"
                  placeholder="naam@moskee.be"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  data-testid="input-email"
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-slate-700 font-semibold mb-2 block">
                  Wachtwoord
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    className="h-12 px-4 pr-12 bg-slate-50 border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-blue-500 text-base"
                    placeholder="Uw wachtwoord"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    data-testid="input-password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center bg-white border border-slate-200 rounded-xl ml-2 px-3 hover:bg-slate-50"
                    onClick={() => setShowPassword(!showPassword)}
                    data-testid="toggle-password"
                    aria-label={showPassword ? "Verberg wachtwoord" : "Toon wachtwoord"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-slate-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-slate-400" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <a href="#" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  Wachtwoord vergeten?
                </a>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-all duration-200"
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
  );
}