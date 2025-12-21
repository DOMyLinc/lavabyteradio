import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus, Pencil, Trash2, Radio, ArrowLeft, GripVertical, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Station, InsertStation } from "@shared/schema";

export default function AdminPanel() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStation, setEditingStation] = useState<Station | null>(null);
  const [formData, setFormData] = useState<InsertStation>({
    name: "",
    description: "",
    streamUrl: "",
    videoStreamUrl: "",
    logoUrl: "",
    genre: "",
    presetNumber: null,
    isActive: true,
    sortOrder: 0,
  });

  const { data: stations = [], isLoading } = useQuery<Station[]>({
    queryKey: ["/api/stations"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertStation) => {
      const response = await apiRequest("POST", "/api/stations", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stations"] });
      toast({ title: "Station created successfully" });
      closeDialog();
    },
    onError: () => {
      toast({ title: "Failed to create station", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertStation> }) => {
      const response = await apiRequest("PATCH", `/api/stations/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stations"] });
      toast({ title: "Station updated successfully" });
      closeDialog();
    },
    onError: () => {
      toast({ title: "Failed to update station", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/stations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stations"] });
      toast({ title: "Station deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete station", variant: "destructive" });
    },
  });

  const openCreateDialog = () => {
    setEditingStation(null);
    setFormData({
      name: "",
      description: "",
      streamUrl: "",
      videoStreamUrl: "",
      logoUrl: "",
      genre: "",
      presetNumber: null,
      isActive: true,
      sortOrder: stations.length,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (station: Station) => {
    setEditingStation(station);
    setFormData({
      name: station.name,
      description: station.description ?? "",
      streamUrl: station.streamUrl,
      videoStreamUrl: station.videoStreamUrl ?? "",
      logoUrl: station.logoUrl ?? "",
      genre: station.genre ?? "",
      presetNumber: station.presetNumber,
      isActive: station.isActive,
      sortOrder: station.sortOrder,
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingStation(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStation) {
      updateMutation.mutate({ id: editingStation.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (station: Station) => {
    if (window.confirm(`Are you sure you want to delete "${station.name}"?`)) {
      deleteMutation.mutate(station.id);
    }
  };

  const sortedStations = [...stations].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" data-testid="back-to-player">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Radio className="w-6 h-6 text-lava-400" />
                Station Management
              </h1>
              <p className="text-sm text-muted-foreground">
                Add, edit, and manage your radio stations
              </p>
            </div>
          </div>

          <Button onClick={openCreateDialog} data-testid="add-station-button">
            <Plus className="w-4 h-4 mr-2" />
            Add Station
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : stations.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Radio className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No stations yet</p>
              <Button onClick={openCreateDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Station
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {sortedStations.map((station) => (
              <Card key={station.id} className="overflow-hidden">
                <div className="flex items-center gap-4 p-4">
                  <div className="text-muted-foreground cursor-grab">
                    <GripVertical className="w-5 h-5" />
                  </div>

                  <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {station.logoUrl ? (
                      <img
                        src={station.logoUrl}
                        alt={station.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Radio className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium truncate" data-testid={`station-name-${station.id}`}>
                        {station.name}
                      </h3>
                      {station.presetNumber && (
                        <span className="text-xs px-2 py-0.5 bg-lava-900/60 text-lava-300 rounded-full font-mono">
                          P{station.presetNumber}
                        </span>
                      )}
                      {!station.isActive && (
                        <span className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded-full">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {station.genre || "No genre"} - {station.streamUrl}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(station)}
                      data-testid={`edit-station-${station.id}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(station)}
                      data-testid={`delete-station-${station.id}`}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingStation ? "Edit Station" : "Add New Station"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Station Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Lava Hits FM"
                  required
                  data-testid="input-station-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="streamUrl">Audio Stream URL *</Label>
                <Input
                  id="streamUrl"
                  value={formData.streamUrl}
                  onChange={(e) => setFormData({ ...formData, streamUrl: e.target.value })}
                  placeholder="https://stream.example.com/radio.mp3"
                  required
                  data-testid="input-stream-url"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="videoStreamUrl">Video Stream URL (optional)</Label>
                <Input
                  id="videoStreamUrl"
                  value={formData.videoStreamUrl ?? ""}
                  onChange={(e) => setFormData({ ...formData, videoStreamUrl: e.target.value })}
                  placeholder="https://stream.example.com/video.m3u8"
                  data-testid="input-video-stream-url"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="genre">Genre</Label>
                <Input
                  id="genre"
                  value={formData.genre ?? ""}
                  onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                  placeholder="e.g., Pop, Rock, Jazz"
                  data-testid="input-genre"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description ?? ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the station..."
                  rows={2}
                  data-testid="input-description"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="logoUrl">Logo URL</Label>
                <Input
                  id="logoUrl"
                  value={formData.logoUrl ?? ""}
                  onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                  placeholder="https://example.com/logo.png"
                  data-testid="input-logo-url"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="presetNumber">Preset Button (1-5)</Label>
                  <Input
                    id="presetNumber"
                    type="number"
                    min="1"
                    max="5"
                    value={formData.presetNumber ?? ""}
                    onChange={(e) => setFormData({
                      ...formData,
                      presetNumber: e.target.value ? parseInt(e.target.value) : null,
                    })}
                    placeholder="1-5"
                    data-testid="input-preset-number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sortOrder">Sort Order</Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    min="0"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({
                      ...formData,
                      sortOrder: parseInt(e.target.value) || 0,
                    })}
                    data-testid="input-sort-order"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="isActive">Active</Label>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  data-testid="switch-is-active"
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="submit-station"
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  {editingStation ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
