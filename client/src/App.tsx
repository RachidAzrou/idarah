import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import AppShell from "@/components/layout/app-shell";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Login from "@/pages/login";
import Leden from "@/pages/leden";
import Lidgelden from "@/pages/lidgelden";
import Financien from "@/pages/financien";
import PubliekeSchermen from "@/pages/publieke-schermen";
import Instellingen from "@/pages/instellingen";

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Laden...</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ component: Component, ...props }: { component: React.ComponentType }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Login />;
  }

  return (
    <AppShell>
      <Component {...props} />
    </AppShell>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/leden" component={() => <ProtectedRoute component={Leden} />} />
      <Route path="/lidgelden" component={() => <ProtectedRoute component={Lidgelden} />} />
      <Route path="/financien" component={() => <ProtectedRoute component={Financien} />} />
      <Route path="/publieke-schermen" component={() => <ProtectedRoute component={PubliekeSchermen} />} />
      <Route path="/instellingen" component={() => <ProtectedRoute component={Instellingen} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
