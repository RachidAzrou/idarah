"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus, Upload, Eye, GripVertical, ExternalLink, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface MultimediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  duration: number;
  active: boolean;
  loop?: boolean;
  transition?: 'fade' | 'slide' | 'zoom' | 'none';
  name?: string;
}

interface MultimediaSettings {
  mediaItems: MultimediaItem[];
  autoplay: {
    enabled: boolean;
    interval: number;
  };
}

interface MultimediaConfigStepProps {
  data: {
    multimediaSettings?: MultimediaSettings;
  };
  onUpdate: (data: any) => void;
}

const transitionEffects = [
  { value: 'fade', label: 'Vervaging' },
  { value: 'slide', label: 'Schuiven' },
  { value: 'zoom', label: 'Zoomen' },
  { value: 'none', label: 'Geen effect' }
];

export function MultimediaConfigStep({ data, onUpdate }: MultimediaConfigStepProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [currentPreview, setCurrentPreview] = useState(0);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [uploadUrl, setUploadUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const settings = data.multimediaSettings || {
    mediaItems: [],
    autoplay: {
      enabled: true,
      interval: 5
    }
  };

  const updateSettings = (newSettings: Partial<MultimediaSettings>) => {
    onUpdate({
      multimediaSettings: {
        ...settings,
        ...newSettings
      }
    });
  };

  const addMediaItem = (url: string, type: 'image' | 'video', name?: string) => {
    const newItem: MultimediaItem = {
      id: `media${Date.now()}`,
      url,
      type,
      duration: type === 'video' ? 10 : 5,
      active: true,
      loop: type === 'video',
      transition: 'fade',
      name: name || `${type === 'video' ? 'Video' : 'Afbeelding'} ${settings.mediaItems.length + 1}`
    };
    
    updateSettings({
      mediaItems: [...settings.mediaItems, newItem]
    });
  };

  const removeMediaItem = (itemId: string) => {
    updateSettings({
      mediaItems: settings.mediaItems.filter(item => item.id !== itemId)
    });
  };

  const updateMediaItem = (itemId: string, updates: Partial<MultimediaItem>) => {
    updateSettings({
      mediaItems: settings.mediaItems.map(item => 
        item.id === itemId ? { ...item, ...updates } : item
      )
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);

        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/public-screens/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const result = await response.json();
        addMediaItem(result.url, result.type, result.filename);
        toast({
          title: "Upload succesvol",
          description: `${result.filename} is toegevoegd aan je multimedia scherm`
        });
      } catch (error) {
        console.error('Upload error:', error);
        toast({
          title: "Upload mislukt",
          description: "Er is een fout opgetreden bij het uploaden. Probeer het opnieuw.",
          variant: "destructive"
        });
        // Fallback to blob URL for development/testing
        const fileUrl = URL.createObjectURL(file);
        const fileType = file.type.startsWith('video/') ? 'video' : 'image';
        addMediaItem(fileUrl, fileType, file.name);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleUrlAdd = () => {
    if (uploadUrl.trim()) {
      // Bepaal type op basis van extensie
      const isVideo = /\.(mp4|webm|ogg|avi|mov)$/i.test(uploadUrl);
      addMediaItem(uploadUrl.trim(), isVideo ? 'video' : 'image');
      setUploadUrl("");
    }
  };

  const reorderItems = (fromIndex: number, toIndex: number) => {
    const items = [...settings.mediaItems];
    const [removed] = items.splice(fromIndex, 1);
    items.splice(toIndex, 0, removed);
    updateSettings({ mediaItems: items });
  };

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItem(itemId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedItem) return;

    const fromIndex = settings.mediaItems.findIndex(item => item.id === draggedItem);
    const toIndex = settings.mediaItems.findIndex(item => item.id === targetId);

    if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
      reorderItems(fromIndex, toIndex);
    }
    setDraggedItem(null);
  };

  const PreviewMedia = ({ item }: { item: MultimediaItem }) => (
    <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
      {item.type === 'video' ? (
        <video 
          src={item.url}
          className="w-full h-full object-cover"
          controls
          loop={item.loop}
        />
      ) : (
        <img 
          src={item.url}
          alt={item.name}
          className="w-full h-full object-cover"
        />
      )}
      <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
        {item.name} - {item.duration}s
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Media toevoegen */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Media toevoegen</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">Bestand uploaden</TabsTrigger>
              <TabsTrigger value="url">URL invoeren</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload" className="mt-4">
              <div className="space-y-3">
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="media-upload"
                  disabled={isUploading}
                />
                <Button
                  variant="outline"
                  asChild
                  className="w-full gap-2 h-20 border-dashed"
                  disabled={isUploading}
                >
                  <label htmlFor="media-upload" className={isUploading ? "cursor-not-allowed" : "cursor-pointer"}>
                    {isUploading ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <Upload className="w-6 h-6" />
                    )}
                    <div className="text-center">
                      <div className="font-medium">
                        {isUploading ? "Bezig met uploaden..." : "Afbeelding of video uploaden"}
                      </div>
                      <div className="text-sm text-muted-foreground">Ondersteunt: JPG, PNG, GIF, MP4, WebM</div>
                    </div>
                  </label>
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="url" className="mt-4">
              <div className="flex gap-2">
                <Input
                  placeholder="https://example.com/image.jpg of https://example.com/video.mp4"
                  value={uploadUrl}
                  onChange={(e) => setUploadUrl(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleUrlAdd()}
                />
                <Button onClick={handleUrlAdd} disabled={!uploadUrl.trim()}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Toevoegen
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Media lijst */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Media items ({settings.mediaItems.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {settings.mediaItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Upload className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nog geen media toegevoegd</p>
              <p className="text-sm">Upload een bestand of voer een URL in om te beginnen</p>
            </div>
          ) : (
            <div className="space-y-3">
              {settings.mediaItems.map((item, index) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item.id)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, item.id)}
                  className={`border rounded-lg p-4 transition-all ${
                    draggedItem === item.id ? 'opacity-50' : 'hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <GripVertical className="w-5 h-5 text-gray-400 cursor-grab" />
                    
                    <div className="flex-shrink-0">
                      {item.type === 'video' ? (
                        <video 
                          src={item.url}
                          className="w-16 h-16 object-cover rounded"
                          muted
                        />
                      ) : (
                        <img 
                          src={item.url}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}
                    </div>

                    <div className="flex-1 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Naam</Label>
                          <Input
                            value={item.name || ''}
                            onChange={(e) => updateMediaItem(item.id, { name: e.target.value })}
                            className="h-8"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Weergavetijd (sec)</Label>
                          <Input
                            type="number"
                            value={item.duration}
                            onChange={(e) => updateMediaItem(item.id, { duration: parseInt(e.target.value) || 5 })}
                            min={1}
                            max={60}
                            className="h-8"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Overgangseffect</Label>
                          <Select
                            value={item.transition}
                            onValueChange={(transition: 'fade' | 'slide' | 'zoom' | 'none') => 
                              updateMediaItem(item.id, { transition })
                            }
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {transitionEffects.map(effect => (
                                <SelectItem key={effect.value} value={effect.value}>
                                  {effect.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center gap-3">
                          {item.type === 'video' && (
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={item.loop}
                                onCheckedChange={(loop) => updateMediaItem(item.id, { loop })}
                              />
                              <Label className="text-xs">Loop</Label>
                            </div>
                          )}
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={item.active}
                              onCheckedChange={(active) => updateMediaItem(item.id, { active })}
                            />
                            <Label className="text-xs">Actief</Label>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeMediaItem(item.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Carrousel instellingen */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Carrousel instellingen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              checked={settings.autoplay.enabled}
              onCheckedChange={(enabled) => updateSettings({
                autoplay: { ...settings.autoplay, enabled }
              })}
            />
            <Label>Automatisch afspelen</Label>
          </div>

          {settings.autoplay.enabled && (
            <div>
              <Label>Standaard interval (seconden)</Label>
              <Input
                type="number"
                value={settings.autoplay.interval}
                onChange={(e) => updateSettings({
                  autoplay: { 
                    ...settings.autoplay, 
                    interval: parseInt(e.target.value) || 5 
                  }
                })}
                min={1}
                max={60}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Wordt overschreven door individuele item timing
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview */}
      {settings.mediaItems.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Preview</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="gap-2"
              >
                <Eye className="w-4 h-4" />
                {showPreview ? 'Verberg' : 'Toon'} preview
              </Button>
            </div>
          </CardHeader>
          {showPreview && (
            <CardContent>
              <div className="space-y-4">
                <PreviewMedia item={settings.mediaItems[currentPreview]} />
                
                {settings.mediaItems.length > 1 && (
                  <div className="flex justify-center gap-2">
                    {settings.mediaItems.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentPreview(index)}
                        className={`w-3 h-3 rounded-full transition-colors ${
                          index === currentPreview ? 'bg-primary' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                )}
                
                <div className="flex justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPreview(prev => 
                      prev > 0 ? prev - 1 : settings.mediaItems.length - 1
                    )}
                    disabled={settings.mediaItems.length <= 1}
                  >
                    Vorige
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPreview(prev => 
                      prev < settings.mediaItems.length - 1 ? prev + 1 : 0
                    )}
                    disabled={settings.mediaItems.length <= 1}
                  >
                    Volgende
                  </Button>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}