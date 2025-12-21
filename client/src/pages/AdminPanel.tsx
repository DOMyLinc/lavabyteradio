import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus, Pencil, Trash2, Radio, ArrowLeft, GripVertical, Loader2, Music, Megaphone, ListMusic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

type TabValue = "external" | "user-stations" | "tracks" | "ads";

interface Station {
  id: number;
  name: string;
  description: string | null;
  streamUrl: string;
  videoStreamUrl: string | null;
  logoUrl: string | null;
  genre: string | null;
  presetNumber: number | null;
  isActive: boolean;
  sortOrder: number;
}

interface StationFormData {
  name: string;
  description: string | null;
  streamUrl: string;
  videoStreamUrl: string | null;
  logoUrl: string | null;
  genre: string | null;
  presetNumber: number | null;
  isActive: boolean;
  sortOrder: number;
}

interface UserStation {
  id: number;
  name: string;
  description: string | null;
  logoUrl: string | null;
  genre: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

interface UserStationFormData {
  name: string;
  description: string | null;
  logoUrl: string | null;
  genre: string | null;
  isActive: boolean;
  sortOrder: number;
}

interface StationTrack {
  id: number;
  stationId: number;
  title: string;
  artist: string | null;
  duration: number | null;
  mediaUrl: string;
  mediaType: string;
  sortOrder: number;
  createdAt: string;
}

interface TrackFormData {
  title: string;
  artist: string | null;
  duration: number | null;
  mediaUrl: string;
  mediaType: string;
  sortOrder: number;
}

interface AdCampaign {
  id: number;
  name: string;
  imageUrl: string;
  targetUrl: string;
  isActive: boolean;
  weight: number;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
}

interface AdCampaignFormData {
  name: string;
  imageUrl: string;
  targetUrl: string;
  isActive: boolean;
  weight: number;
  startDate: string | null;
  endDate: string | null;
}

export default function AdminPanel() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabValue>("external");

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="back-to-player">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Radio className="w-6 h-6 text-lava-400" />
              Admin Panel
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage stations, tracks, and advertisements
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="external" data-testid="tab-external">
              <Radio className="w-4 h-4 mr-2" />
              External Stations
            </TabsTrigger>
            <TabsTrigger value="user-stations" data-testid="tab-user-stations">
              <ListMusic className="w-4 h-4 mr-2" />
              User Stations
            </TabsTrigger>
            <TabsTrigger value="tracks" data-testid="tab-tracks">
              <Music className="w-4 h-4 mr-2" />
              Tracks
            </TabsTrigger>
            <TabsTrigger value="ads" data-testid="tab-ads">
              <Megaphone className="w-4 h-4 mr-2" />
              Ad Campaigns
            </TabsTrigger>
          </TabsList>

          <TabsContent value="external">
            <ExternalStationsTab />
          </TabsContent>
          <TabsContent value="user-stations">
            <UserStationsTab />
          </TabsContent>
          <TabsContent value="tracks">
            <TracksTab />
          </TabsContent>
          <TabsContent value="ads">
            <AdCampaignsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function ExternalStationsTab() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStation, setEditingStation] = useState<Station | null>(null);
  const [formData, setFormData] = useState<StationFormData>({
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
    mutationFn: async (data: StationFormData) => {
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
    mutationFn: async ({ id, data }: { id: number; data: Partial<StationFormData> }) => {
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
    <>
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold">External Streaming Stations</h2>
          <p className="text-sm text-muted-foreground">Manage radio stations with external stream URLs</p>
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
            <p className="text-muted-foreground mb-4">No external stations yet</p>
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Station
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sortedStations.map((station) => (
            <Card key={station.id}>
              <div className="flex items-center gap-4 p-4">
                <div className="text-muted-foreground cursor-grab">
                  <GripVertical className="w-5 h-5" />
                </div>
                <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {station.logoUrl ? (
                    <img src={station.logoUrl} alt={station.name} className="w-full h-full object-cover" />
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
                  <Button variant="ghost" size="icon" onClick={() => openEditDialog(station)} data-testid={`edit-station-${station.id}`}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(station)} data-testid={`delete-station-${station.id}`}>
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
            <DialogTitle>{editingStation ? "Edit Station" : "Add New Station"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Station Name *</Label>
              <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Lava Hits FM" required data-testid="input-station-name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="streamUrl">Audio Stream URL *</Label>
              <Input id="streamUrl" value={formData.streamUrl} onChange={(e) => setFormData({ ...formData, streamUrl: e.target.value })} placeholder="https://stream.example.com/radio.mp3" required data-testid="input-stream-url" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="videoStreamUrl">Video Stream URL (optional)</Label>
              <Input id="videoStreamUrl" value={formData.videoStreamUrl ?? ""} onChange={(e) => setFormData({ ...formData, videoStreamUrl: e.target.value })} placeholder="https://stream.example.com/video.m3u8" data-testid="input-video-stream-url" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="genre">Genre</Label>
              <Input id="genre" value={formData.genre ?? ""} onChange={(e) => setFormData({ ...formData, genre: e.target.value })} placeholder="e.g., Pop, Rock, Jazz" data-testid="input-genre" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={formData.description ?? ""} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Brief description of the station..." rows={2} data-testid="input-description" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="logoUrl">Logo URL</Label>
              <Input id="logoUrl" value={formData.logoUrl ?? ""} onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })} placeholder="https://example.com/logo.png" data-testid="input-logo-url" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="presetNumber">Preset Button (1-5)</Label>
                <Input id="presetNumber" type="number" min="1" max="5" value={formData.presetNumber ?? ""} onChange={(e) => setFormData({ ...formData, presetNumber: e.target.value ? parseInt(e.target.value) : null })} placeholder="1-5" data-testid="input-preset-number" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sortOrder">Sort Order</Label>
                <Input id="sortOrder" type="number" min="0" value={formData.sortOrder} onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })} data-testid="input-sort-order" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="isActive">Active</Label>
              <Switch id="isActive" checked={formData.isActive} onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })} data-testid="switch-is-active" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="submit-station">
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingStation ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function UserStationsTab() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStation, setEditingStation] = useState<UserStation | null>(null);
  const [formData, setFormData] = useState<UserStationFormData>({
    name: "",
    description: "",
    logoUrl: "",
    genre: "",
    isActive: true,
    sortOrder: 0,
  });

  const { data: stations = [], isLoading } = useQuery<UserStation[]>({
    queryKey: ["/api/user-stations"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: UserStationFormData) => {
      const response = await apiRequest("POST", "/api/user-stations", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-stations"] });
      toast({ title: "User station created successfully" });
      closeDialog();
    },
    onError: () => {
      toast({ title: "Failed to create user station", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<UserStationFormData> }) => {
      const response = await apiRequest("PATCH", `/api/user-stations/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-stations"] });
      toast({ title: "User station updated successfully" });
      closeDialog();
    },
    onError: () => {
      toast({ title: "Failed to update user station", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/user-stations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-stations"] });
      toast({ title: "User station deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete user station", variant: "destructive" });
    },
  });

  const openCreateDialog = () => {
    setEditingStation(null);
    setFormData({
      name: "",
      description: "",
      logoUrl: "",
      genre: "",
      isActive: true,
      sortOrder: stations.length,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (station: UserStation) => {
    setEditingStation(station);
    setFormData({
      name: station.name,
      description: station.description ?? "",
      logoUrl: station.logoUrl ?? "",
      genre: station.genre ?? "",
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

  const handleDelete = (station: UserStation) => {
    if (window.confirm(`Are you sure you want to delete "${station.name}"? All tracks will also be deleted.`)) {
      deleteMutation.mutate(station.id);
    }
  };

  const sortedStations = [...stations].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <>
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold">User Stations (Playlists)</h2>
          <p className="text-sm text-muted-foreground">Create playlist-based stations with uploaded tracks</p>
        </div>
        <Button onClick={openCreateDialog} data-testid="add-user-station-button">
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
            <ListMusic className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No user stations yet</p>
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Playlist Station
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sortedStations.map((station) => (
            <Card key={station.id}>
              <div className="flex items-center gap-4 p-4">
                <div className="text-muted-foreground cursor-grab">
                  <GripVertical className="w-5 h-5" />
                </div>
                <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {station.logoUrl ? (
                    <img src={station.logoUrl} alt={station.name} className="w-full h-full object-cover" />
                  ) : (
                    <ListMusic className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium truncate" data-testid={`user-station-name-${station.id}`}>
                      {station.name}
                    </h3>
                    {!station.isActive && (
                      <span className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded-full">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {station.genre || "No genre"} - Playlist station
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => openEditDialog(station)} data-testid={`edit-user-station-${station.id}`}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(station)} data-testid={`delete-user-station-${station.id}`}>
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
            <DialogTitle>{editingStation ? "Edit User Station" : "Add New User Station"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user-station-name">Station Name *</Label>
              <Input id="user-station-name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., My Custom Playlist" required data-testid="input-user-station-name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-station-genre">Genre</Label>
              <Input id="user-station-genre" value={formData.genre ?? ""} onChange={(e) => setFormData({ ...formData, genre: e.target.value })} placeholder="e.g., Pop, Rock, Jazz" data-testid="input-user-station-genre" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-station-description">Description</Label>
              <Textarea id="user-station-description" value={formData.description ?? ""} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Brief description of the station..." rows={2} data-testid="input-user-station-description" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-station-logoUrl">Logo URL</Label>
              <Input id="user-station-logoUrl" value={formData.logoUrl ?? ""} onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })} placeholder="https://example.com/logo.png" data-testid="input-user-station-logo-url" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-station-sortOrder">Sort Order</Label>
              <Input id="user-station-sortOrder" type="number" min="0" value={formData.sortOrder} onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })} data-testid="input-user-station-sort-order" />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="user-station-isActive">Active</Label>
              <Switch id="user-station-isActive" checked={formData.isActive} onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })} data-testid="switch-user-station-is-active" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="submit-user-station">
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingStation ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function TracksTab() {
  const { toast } = useToast();
  const [selectedStationId, setSelectedStationId] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTrack, setEditingTrack] = useState<StationTrack | null>(null);
  const [formData, setFormData] = useState<TrackFormData>({
    title: "",
    artist: "",
    duration: null,
    mediaUrl: "",
    mediaType: "audio",
    sortOrder: 0,
  });

  const { data: userStations = [] } = useQuery<UserStation[]>({
    queryKey: ["/api/user-stations"],
  });

  const { data: tracks = [], isLoading: isLoadingTracks } = useQuery<StationTrack[]>({
    queryKey: ["/api/user-stations", selectedStationId, "tracks"],
    enabled: !!selectedStationId,
  });

  const createMutation = useMutation({
    mutationFn: async (data: TrackFormData & { stationId: number }) => {
      const response = await apiRequest("POST", `/api/user-stations/${selectedStationId}/tracks`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-stations", selectedStationId, "tracks"] });
      toast({ title: "Track added successfully" });
      closeDialog();
    },
    onError: () => {
      toast({ title: "Failed to add track", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<TrackFormData> }) => {
      const response = await apiRequest("PATCH", `/api/tracks/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-stations", selectedStationId, "tracks"] });
      toast({ title: "Track updated successfully" });
      closeDialog();
    },
    onError: () => {
      toast({ title: "Failed to update track", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/tracks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-stations", selectedStationId, "tracks"] });
      toast({ title: "Track deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete track", variant: "destructive" });
    },
  });

  const openCreateDialog = () => {
    setEditingTrack(null);
    setFormData({
      title: "",
      artist: "",
      duration: null,
      mediaUrl: "",
      mediaType: "audio",
      sortOrder: tracks.length,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (track: StationTrack) => {
    setEditingTrack(track);
    setFormData({
      title: track.title,
      artist: track.artist ?? "",
      duration: track.duration,
      mediaUrl: track.mediaUrl,
      mediaType: track.mediaType,
      sortOrder: track.sortOrder,
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingTrack(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTrack) {
      updateMutation.mutate({ id: editingTrack.id, data: formData });
    } else if (selectedStationId) {
      createMutation.mutate({ ...formData, stationId: selectedStationId });
    }
  };

  const handleDelete = (track: StationTrack) => {
    if (window.confirm(`Are you sure you want to delete "${track.title}"?`)) {
      deleteMutation.mutate(track.id);
    }
  };

  const sortedTracks = [...tracks].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <>
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold">Track Management</h2>
          <p className="text-sm text-muted-foreground">Upload and manage tracks for your playlist stations</p>
        </div>
      </div>

      <div className="mb-6">
        <Label htmlFor="station-select">Select Station</Label>
        <Select
          value={selectedStationId?.toString() ?? ""}
          onValueChange={(v) => setSelectedStationId(v ? parseInt(v) : null)}
        >
          <SelectTrigger className="w-full max-w-xs mt-2" data-testid="select-station-for-tracks">
            <SelectValue placeholder="Choose a station..." />
          </SelectTrigger>
          <SelectContent>
            {userStations.map((station) => (
              <SelectItem key={station.id} value={station.id.toString()}>
                {station.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!selectedStationId ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Music className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Select a station to manage its tracks</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-end mb-4">
            <Button onClick={openCreateDialog} data-testid="add-track-button">
              <Plus className="w-4 h-4 mr-2" />
              Add Track
            </Button>
          </div>

          {isLoadingTracks ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : tracks.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Music className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No tracks in this station</p>
                <Button onClick={openCreateDialog}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Track
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {sortedTracks.map((track) => (
                <Card key={track.id}>
                  <div className="flex items-center gap-4 p-4">
                    <div className="text-muted-foreground cursor-grab">
                      <GripVertical className="w-5 h-5" />
                    </div>
                    <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                      <Music className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate" data-testid={`track-title-${track.id}`}>{track.title}</h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {track.artist || "Unknown artist"} - {track.mediaType}
                        {track.duration && ` - ${Math.floor(track.duration / 60)}:${String(track.duration % 60).padStart(2, '0')}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(track)} data-testid={`edit-track-${track.id}`}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(track)} data-testid={`delete-track-${track.id}`}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTrack ? "Edit Track" : "Add New Track"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="track-title">Title *</Label>
              <Input id="track-title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g., Sunset Boulevard" required data-testid="input-track-title" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="track-artist">Artist</Label>
              <Input id="track-artist" value={formData.artist ?? ""} onChange={(e) => setFormData({ ...formData, artist: e.target.value })} placeholder="e.g., The Band" data-testid="input-track-artist" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="track-mediaUrl">Media URL *</Label>
              <Input id="track-mediaUrl" value={formData.mediaUrl} onChange={(e) => setFormData({ ...formData, mediaUrl: e.target.value })} placeholder="https://storage.example.com/track.mp3" required data-testid="input-track-media-url" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="track-mediaType">Media Type</Label>
                <Select value={formData.mediaType} onValueChange={(v) => setFormData({ ...formData, mediaType: v })}>
                  <SelectTrigger data-testid="select-track-media-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="audio">Audio</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="track-duration">Duration (seconds)</Label>
                <Input id="track-duration" type="number" min="0" value={formData.duration ?? ""} onChange={(e) => setFormData({ ...formData, duration: e.target.value ? parseInt(e.target.value) : null })} placeholder="180" data-testid="input-track-duration" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="track-sortOrder">Sort Order</Label>
              <Input id="track-sortOrder" type="number" min="0" value={formData.sortOrder} onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })} data-testid="input-track-sort-order" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="submit-track">
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingTrack ? "Update" : "Add Track"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function AdCampaignsTab() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<AdCampaign | null>(null);
  const [formData, setFormData] = useState<AdCampaignFormData>({
    name: "",
    imageUrl: "",
    targetUrl: "",
    isActive: true,
    weight: 1,
    startDate: null,
    endDate: null,
  });

  const { data: campaigns = [], isLoading } = useQuery<AdCampaign[]>({
    queryKey: ["/api/ad-campaigns"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: AdCampaignFormData) => {
      const response = await apiRequest("POST", "/api/ad-campaigns", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ad-campaigns"] });
      toast({ title: "Ad campaign created successfully" });
      closeDialog();
    },
    onError: () => {
      toast({ title: "Failed to create ad campaign", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<AdCampaignFormData> }) => {
      const response = await apiRequest("PATCH", `/api/ad-campaigns/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ad-campaigns"] });
      toast({ title: "Ad campaign updated successfully" });
      closeDialog();
    },
    onError: () => {
      toast({ title: "Failed to update ad campaign", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/ad-campaigns/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ad-campaigns"] });
      toast({ title: "Ad campaign deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete ad campaign", variant: "destructive" });
    },
  });

  const openCreateDialog = () => {
    setEditingCampaign(null);
    setFormData({
      name: "",
      imageUrl: "",
      targetUrl: "",
      isActive: true,
      weight: 1,
      startDate: null,
      endDate: null,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (campaign: AdCampaign) => {
    setEditingCampaign(campaign);
    setFormData({
      name: campaign.name,
      imageUrl: campaign.imageUrl,
      targetUrl: campaign.targetUrl,
      isActive: campaign.isActive,
      weight: campaign.weight,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingCampaign(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCampaign) {
      updateMutation.mutate({ id: editingCampaign.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (campaign: AdCampaign) => {
    if (window.confirm(`Are you sure you want to delete "${campaign.name}"?`)) {
      deleteMutation.mutate(campaign.id);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold">Ad Campaigns</h2>
          <p className="text-sm text-muted-foreground">Manage banner advertisements shown across the app</p>
        </div>
        <Button onClick={openCreateDialog} data-testid="add-ad-campaign-button">
          <Plus className="w-4 h-4 mr-2" />
          Add Campaign
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : campaigns.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Megaphone className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No ad campaigns yet</p>
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Campaign
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {campaigns.map((campaign) => (
            <Card key={campaign.id}>
              <div className="flex items-center gap-4 p-4">
                <div className="w-24 h-12 rounded-md bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {campaign.imageUrl ? (
                    <img src={campaign.imageUrl} alt={campaign.name} className="w-full h-full object-cover" />
                  ) : (
                    <Megaphone className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium truncate" data-testid={`campaign-name-${campaign.id}`}>{campaign.name}</h3>
                    <span className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded-full">
                      Weight: {campaign.weight}
                    </span>
                    {!campaign.isActive && (
                      <span className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded-full">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{campaign.targetUrl}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => openEditDialog(campaign)} data-testid={`edit-campaign-${campaign.id}`}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(campaign)} data-testid={`delete-campaign-${campaign.id}`}>
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
            <DialogTitle>{editingCampaign ? "Edit Ad Campaign" : "Add New Ad Campaign"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="campaign-name">Campaign Name *</Label>
              <Input id="campaign-name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Holiday Special" required data-testid="input-campaign-name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="campaign-imageUrl">Banner Image URL *</Label>
              <Input id="campaign-imageUrl" value={formData.imageUrl} onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })} placeholder="https://example.com/banner.jpg" required data-testid="input-campaign-image-url" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="campaign-targetUrl">Target URL *</Label>
              <Input id="campaign-targetUrl" value={formData.targetUrl} onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })} placeholder="https://example.com/offer" required data-testid="input-campaign-target-url" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="campaign-weight">Weight (1-10)</Label>
              <Input id="campaign-weight" type="number" min="1" max="10" value={formData.weight} onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) || 1 })} data-testid="input-campaign-weight" />
              <p className="text-xs text-muted-foreground">Higher weight = more frequent display</p>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="campaign-isActive">Active</Label>
              <Switch id="campaign-isActive" checked={formData.isActive} onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })} data-testid="switch-campaign-is-active" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="submit-campaign">
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingCampaign ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
