"use client";

import { useState, useEffect } from "react";
import { PublicScreen } from "@/lib/mock/public-screens";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";

interface EditScreenDialogProps {
  screen: PublicScreen | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditScreenDialog({ screen, open, onOpenChange }: EditScreenDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    active: false,
    config: {} as any
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (screen) {
      setFormData({
        name: screen.name,
        type: screen.type,
        active: screen.active,
        config: screen.config
      });
    }
  }, [screen]);

  const handleSave = async () => {
    if (!screen) return;
    
    setIsLoading(true);
    try {
      await apiRequest('PATCH', `/api/public-screens/${screen.id}`, {
        name: formData.name,
        active: formData.active,
        config: formData.config
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/public-screens"] });
      toast({
        title: "Scherm bijgewerkt",
        description: `${formData.name} is succesvol bijgewerkt.`,
      });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Fout",
        description: error.message || "Er is een fout opgetreden bij het bijwerken van het scherm.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'LEDENLIJST': return 'Ledenlijst';
      case 'MEDEDELINGEN': return 'Mededelingen';
      case 'MULTIMEDIA': return 'Multimedia';
      default: return type;
    }
  };

  const updateConfigField = (path: string, value: any) => {
    const keys = path.split('.');
    const newConfig = { ...formData.config };
    let current = newConfig;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    setFormData({ ...formData, config: newConfig });
  };

  if (!screen) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="edit-screen-dialog">
        <DialogHeader>
          <DialogTitle>Scherm bewerken</DialogTitle>
          <DialogDescription>
            Bewerk alle eigenschappen van dit publieke scherm
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basis informatie</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="screen-name">Naam</Label>
                <Input
                  id="screen-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  data-testid="input-screen-name"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Type</Label>
                <div className="flex items-center h-10">
                  <Badge variant="outline" className="h-8">
                    {getTypeLabel(formData.type)}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="screen-active"
                checked={formData.active}
                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                data-testid="switch-screen-active"
              />
              <Label htmlFor="screen-active">Scherm actief</Label>
            </div>

            <div className="space-y-2">
              <Label>Publieke URL</Label>
              <div className="flex items-center space-x-2">
                <Input
                  value={`${window.location.origin}/screen/${screen.publicToken || screen.id}`}
                  readOnly
                  className="bg-gray-50"
                />
              </div>
            </div>
          </div>

          {/* Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Configuratie</h3>
            
            {/* Description */}
            {formData.config.description !== undefined && (
              <div className="space-y-2">
                <Label htmlFor="config-description">Beschrijving</Label>
                <Textarea
                  id="config-description"
                  value={formData.config.description || ''}
                  onChange={(e) => updateConfigField('description', e.target.value)}
                  data-testid="textarea-config-description"
                />
              </div>
            )}

            {/* Title Configuration */}
            {formData.config.title && (
              <div className="space-y-4">
                <h4 className="font-medium">Titel instellingen</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Titel tekst</Label>
                    <Input
                      value={formData.config.title.text || ''}
                      onChange={(e) => updateConfigField('title.text', e.target.value)}
                      data-testid="input-title-text"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Titel kleur</Label>
                    <Input
                      type="color"
                      value={formData.config.title.color || '#000000'}
                      onChange={(e) => updateConfigField('title.color', e.target.value)}
                      data-testid="input-title-color"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Titel lettergrootte</Label>
                    <Input
                      type="number"
                      value={formData.config.title.fontSize || 24}
                      onChange={(e) => updateConfigField('title.fontSize', parseInt(e.target.value))}
                      data-testid="input-title-fontsize"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Titel lettergewicht</Label>
                    <Select
                      value={formData.config.title.fontWeight || 'normal'}
                      onValueChange={(value) => updateConfigField('title.fontWeight', value)}
                    >
                      <SelectTrigger data-testid="select-title-fontweight">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normaal</SelectItem>
                        <SelectItem value="bold">Vet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Subtitle Configuration */}
            {formData.config.subtitle && (
              <div className="space-y-4">
                <h4 className="font-medium">Ondertitel instellingen</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Ondertitel tekst</Label>
                    <Input
                      value={formData.config.subtitle.text || ''}
                      onChange={(e) => updateConfigField('subtitle.text', e.target.value)}
                      data-testid="input-subtitle-text"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ondertitel kleur</Label>
                    <Input
                      type="color"
                      value={formData.config.subtitle.color || '#666666'}
                      onChange={(e) => updateConfigField('subtitle.color', e.target.value)}
                      data-testid="input-subtitle-color"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ondertitel lettergrootte</Label>
                    <Input
                      type="number"
                      value={formData.config.subtitle.fontSize || 16}
                      onChange={(e) => updateConfigField('subtitle.fontSize', parseInt(e.target.value))}
                      data-testid="input-subtitle-fontsize"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ondertitel lettergewicht</Label>
                    <Select
                      value={formData.config.subtitle.fontWeight || 'normal'}
                      onValueChange={(value) => updateConfigField('subtitle.fontWeight', value)}
                    >
                      <SelectTrigger data-testid="select-subtitle-fontweight">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normaal</SelectItem>
                        <SelectItem value="bold">Vet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Ledenlijst specific settings */}
            {formData.type === 'LEDENLIJST' && formData.config.display && (
              <div className="space-y-4">
                <h4 className="font-medium">Ledenlijst instellingen</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Jaar</Label>
                    <Input
                      type="number"
                      value={formData.config.year || new Date().getFullYear()}
                      onChange={(e) => updateConfigField('year', parseInt(e.target.value))}
                      data-testid="input-year"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Rijen per pagina</Label>
                    <Input
                      type="number"
                      value={formData.config.display.rowsPerPage || 20}
                      onChange={(e) => updateConfigField('display.rowsPerPage', parseInt(e.target.value))}
                      data-testid="input-rows-per-page"
                    />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.config.display.useFullNames || false}
                      onCheckedChange={(checked) => updateConfigField('display.useFullNames', checked)}
                      data-testid="switch-use-full-names"
                    />
                    <Label>Volledige namen gebruiken</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.config.display.useInitials || false}
                      onCheckedChange={(checked) => updateConfigField('display.useInitials', checked)}
                      data-testid="switch-use-initials"
                    />
                    <Label>Initialen gebruiken</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.config.display.filterByCategories || false}
                      onCheckedChange={(checked) => updateConfigField('display.filterByCategories', checked)}
                      data-testid="switch-filter-categories"
                    />
                    <Label>Filteren op categorieën</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.config.display.showVotingRights || false}
                      onCheckedChange={(checked) => updateConfigField('display.showVotingRights', checked)}
                      data-testid="switch-voting-rights"
                    />
                    <Label>Stemrecht tonen</Label>
                  </div>
                </div>
              </div>
            )}

            {/* Mededelingen specific settings */}
            {formData.type === 'MEDEDELINGEN' && formData.config.autoplay && (
              <div className="space-y-4">
                <h4 className="font-medium">Mededelingen instellingen</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Autoplay interval (seconden)</Label>
                    <Input
                      type="number"
                      value={formData.config.autoplay.interval || 8}
                      onChange={(e) => updateConfigField('autoplay.interval', parseInt(e.target.value))}
                      data-testid="input-autoplay-interval"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Autoplay volgorde</Label>
                    <Select
                      value={formData.config.autoplay.order || 'date'}
                      onValueChange={(value) => updateConfigField('autoplay.order', value)}
                    >
                      <SelectTrigger data-testid="select-autoplay-order">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="date">Datum</SelectItem>
                        <SelectItem value="manual">Handmatig</SelectItem>
                        <SelectItem value="shuffle">Willekeurig</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.config.autoplay.enabled || false}
                    onCheckedChange={(checked) => updateConfigField('autoplay.enabled', checked)}
                    data-testid="switch-autoplay-enabled"
                  />
                  <Label>Autoplay ingeschakeld</Label>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end space-x-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel"
            >
              <X className="h-4 w-4 mr-2" />
              Annuleren
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading}
              data-testid="button-save"
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Opslaan...' : 'Opslaan'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}