import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Lock, Save } from "lucide-react";

// Schema voor profiel gegevens
const profileSchema = z.object({
  name: z.string().min(1, "Naam is verplicht"),
  email: z.string().email("Ongeldig email adres"),
});

// Schema voor wachtwoord wijzigen
const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Huidig wachtwoord is verplicht"),
  newPassword: z.string().min(6, "Nieuw wachtwoord moet minimaal 6 karakters zijn"),
  confirmPassword: z.string().min(1, "Bevestig het nieuwe wachtwoord"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Wachtwoorden komen niet overeen",
  path: ["confirmPassword"],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export default function Profiel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [profileSaved, setProfileSaved] = useState(false);

  // Profiel formulier
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  });

  // Wachtwoord formulier
  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Watch voor profiel formulier wijzigingen
  const profileFormValues = profileForm.watch();

  // Reset profiel saved state wanneer formulier wijzigt
  useEffect(() => {
    if (profileSaved) {
      setProfileSaved(false);
    }
  }, [profileFormValues]);

  // Initialiseer formulier met gebruikersgegevens
  useEffect(() => {
    if (user) {
      profileForm.reset({
        name: user.name || "",
        email: user.email || "",
      });
      setProfileSaved(false);
    }
  }, [user, profileForm]);

  // Profiel update mutatie
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const response = await apiRequest("PUT", "/api/profile", data);
      return response.json();
    },
    onSuccess: async (result, variables) => {
      // Update de auth cache met nieuwe gebruikersgegevens
      queryClient.setQueryData(["/api/auth/me"], (oldData: any) => {
        if (!oldData) return oldData;
        return { ...oldData, ...variables };
      });
      
      setProfileSaved(true);
      toast({
        title: "Profiel bijgewerkt",
        description: "Uw profiel gegevens zijn succesvol bijgewerkt.",
      });
    },
    onError: () => {
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het bijwerken van uw profiel.",
        variant: "destructive",
      });
    },
  });

  // Wachtwoord wijzigen mutatie
  const changePasswordMutation = useMutation({
    mutationFn: async (data: PasswordFormData) => {
      const response = await apiRequest("PUT", "/api/profile/password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      return response.json();
    },
    onSuccess: () => {
      passwordForm.reset();
      toast({
        title: "Wachtwoord gewijzigd",
        description: "Uw wachtwoord is succesvol gewijzigd.",
      });
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Er is een fout opgetreden bij het wijzigen van het wachtwoord.";
      toast({
        title: "Fout",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const onProfileSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  const onPasswordSubmit = (data: PasswordFormData) => {
    changePasswordMutation.mutate(data);
  };

  if (!user) {
    return null;
  }

  return (
    <main className="flex-1 py-4">
      <div className="px-4 sm:px-6 lg:px-8 w-full">
        {/* Page Header */}
        <div className="border-b border-gray-200 pb-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900" data-testid="page-title">Mijn Profiel</h1>
              <p className="mt-1 text-sm text-gray-700">Beheer uw account gegevens en instellingen</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mt-6">
        {/* Profiel Gegevens */}
        <Card>
          <CardHeader>
            <CardTitle>Profiel Gegevens</CardTitle>
            <CardDescription>
              Werk uw naam en email adres bij
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                <FormField
                  control={profileForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Naam</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Uw volledige naam"
                          data-testid="input-profile-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={profileForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="email"
                          placeholder="uw.email@voorbeeld.be"
                          data-testid="input-profile-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center gap-2">
                  <Button 
                    type="submit" 
                    disabled={updateProfileMutation.isPending || profileSaved}
                    data-testid="button-save-profile"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updateProfileMutation.isPending 
                      ? "Opslaan..." 
                      : profileSaved 
                        ? "Opgeslagen" 
                        : "Opslaan"
                    }
                  </Button>
                  {profileSaved && (
                    <span className="text-sm text-green-600">
                      ✓ Wijzigingen opgeslagen
                    </span>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Wachtwoord Wijzigen */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Wachtwoord Wijzigen
            </CardTitle>
            <CardDescription>
              Wijzig uw account wachtwoord voor extra beveiliging
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                <FormField
                  control={passwordForm.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Huidig Wachtwoord</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="password"
                          placeholder="Voer uw huidige wachtwoord in"
                          data-testid="input-current-password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nieuw Wachtwoord</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="password"
                          placeholder="Voer uw nieuwe wachtwoord in"
                          data-testid="input-new-password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={passwordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bevestig Nieuw Wachtwoord</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="password"
                          placeholder="Bevestig uw nieuwe wachtwoord"
                          data-testid="input-confirm-password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  disabled={changePasswordMutation.isPending}
                  variant="outline"
                  data-testid="button-change-password"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  {changePasswordMutation.isPending ? "Wijzigen..." : "Wachtwoord Wijzigen"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        </div>

        {/* Account Info */}
        <Card className="mt-6">
        <CardHeader>
          <CardTitle>Account Informatie</CardTitle>
          <CardDescription>
            Alleen-lezen informatie over uw account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Rol</Label>
              <p className="text-sm" data-testid="text-user-role">{user.role}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Account aangemaakt</Label>
              <p className="text-sm" data-testid="text-created-at">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString('nl-BE') : 'Onbekend'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </main>
  );
}