"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, X } from "lucide-react";
import { PublicScreen } from "@/lib/mock/public-screens";

interface EditScreenModalProps {
  screen: PublicScreen | null;
  open: boolean;
  onClose: () => void;
  onSave: (screen: PublicScreen) => void;
}

export function EditScreenModal({ screen, open, onClose, onSave }: EditScreenModalProps) {
  const [name, setName] = useState("");
  const [active, setActive] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (screen) {
      setName(screen.name);
      setActive(screen.active);
      setHasChanges(false);
    }
  }, [screen]);

  const handleSave = () => {
    if (!screen) return;

    // Create updated screen object
    const updatedScreen: PublicScreen = {
      ...screen,
      name: name.trim(),
      active,
      updatedAt: new Date().toISOString()
    };

    onSave(updatedScreen);
    setHasChanges(false);
  };

  const handleNameChange = (value: string) => {
    setName(value);
    setHasChanges(true);
  };

  const handleActiveChange = (checked: boolean) => {
    setActive(checked);
    setHasChanges(true);
  };

  const handleClose = () => {
    if (hasChanges) {
      if (confirm("Er zijn niet-opgeslagen wijzigingen. Weet je zeker dat je wilt sluiten?")) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  if (!screen) return null;

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'LEDENLIJST': return 'Ledenlijst';
      case 'MEDEDELINGEN': return 'Mededelingen';
      default: return type;
    }
  };

  const publicUrl = `${window.location.origin}/screen/${screen.publicToken || screen.id}`;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">Scherm bewerken</DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline">{getTypeLabel(screen.type)}</Badge>
                <Badge 
                  variant={active ? "default" : "secondary"}
                  className={active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                >
                  {active ? "Actief" : "Inactief"}
                </Badge>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basis Instellingen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="screen-name">Naam van het scherm</Label>
                <Input
                  id="screen-name"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Voer een naam in voor dit scherm"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="screen-active">Scherm actief</Label>
                  <p className="text-sm text-gray-500">
                    Wanneer actief, is het scherm toegankelijk via de publieke URL
                  </p>
                </div>
                <Switch
                  id="screen-active"
                  checked={active}
                  onCheckedChange={handleActiveChange}
                />
              </div>
            </CardContent>
          </Card>

          {/* Screen Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Scherm Configuratie</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="basic">Basis</TabsTrigger>
                  <TabsTrigger value="advanced">Geavanceerd</TabsTrigger>
                </TabsList>
                
                <TabsContent value="basic" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Scherm Type</Label>
                    <div className="p-3 bg-gray-50 rounded border">
                      <Badge variant="outline" className="text-sm">
                        {getTypeLabel(screen.type)}
                      </Badge>
                      <p className="text-sm text-gray-500 mt-1">
                        Het scherm type kan niet worden gewijzigd na aanmaak
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Publieke URL</Label>
                    <div className="p-3 bg-gray-50 rounded border">
                      <code className="text-sm text-blue-600">
                        {publicUrl}
                      </code>
                      <p className="text-sm text-gray-500 mt-1">
                        Deze URL wordt automatisch gegenereerd en kan niet worden gewijzigd
                      </p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="advanced" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Token</Label>
                    <div className="p-3 bg-gray-50 rounded border">
                      <code className="text-sm font-mono">
                        {screen.publicToken || screen.id}
                      </code>
                      <p className="text-sm text-gray-500 mt-1">
                        Unieke identificator voor dit scherm
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Aangemaakt</Label>
                    <div className="p-3 bg-gray-50 rounded border">
                      <p className="text-sm">
                        {new Date(screen.createdAt).toLocaleString('nl-NL')}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Laatst gewijzigd</Label>
                    <div className="p-3 bg-gray-50 rounded border">
                      <p className="text-sm">
                        {new Date(screen.updatedAt).toLocaleString('nl-NL')}
                      </p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleClose}
            >
              Annuleren
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges || !name.trim()}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {hasChanges ? "Wijzigingen opslaan" : "Opgeslagen"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}