import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  LogOut, Radio, Music2, Megaphone, Users, Plus, Trash2, Edit, 
  RefreshCw, Shield, Settings, Disc, Sparkles, Check, X, ClipboardList
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import type { Station, UserStation, StationTrack, AdCampaign, MemberUpgradeRequest, Member, StationApprovalRequest } from "@shared/schema";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type AdminSession = {
  id: number;
  email: string;
  displayName: string | null;
  role: string;
  permissions: string[];
} | null;

type AdminUser = {
  id: number;
  email: string;
  displayName: string | null;
  role: string;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
};

function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/login", { email, password });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/me"] });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
    }
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-white">
            <Shield className="h-6 w-6 text-orange-400" />
            Admin Login
          </CardTitle>
          <CardDescription className="text-slate-300">Sign in to access the admin panel</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => { e.preventDefault(); loginMutation.mutate(); }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-200">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                data-testid="input-admin-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-200">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                data-testid="input-admin-password"
              />
            </div>
            <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white" disabled={loginMutation.isPending} data-testid="button-admin-login">
              {loginMutation.isPending ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function StationsManager() {
  const { toast } = useToast();
  const [editingStation, setEditingStation] = useState<Station | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const { data: stations = [], isLoading } = useQuery<Station[]>({
    queryKey: ["/api/stations"]
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/stations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stations"] });
      toast({ title: "Station deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete", description: error.message, variant: "destructive" });
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (data: { id?: number; station: Partial<Station> }) => {
      if (data.id) {
        const res = await apiRequest("PATCH", `/api/stations/${data.id}`, data.station);
        return res.json();
      } else {
        const res = await apiRequest("POST", "/api/stations", data.station);
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stations"] });
      setEditingStation(null);
      setIsAddOpen(false);
      toast({ title: "Station saved" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to save", description: error.message, variant: "destructive" });
    }
  });

  if (isLoading) return <div className="p-4">Loading stations...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-lg font-medium">External Stations ({stations.length})</h3>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <Tooltip>
            <TooltipTrigger asChild>
              <DialogTrigger asChild>
                <Button size="sm" data-testid="button-add-station">
                  <Plus className="h-4 w-4 mr-1" /> Add Station
                </Button>
              </DialogTrigger>
            </TooltipTrigger>
            <TooltipContent>Create a new radio station</TooltipContent>
          </Tooltip>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Station</DialogTitle>
            </DialogHeader>
            <StationForm onSave={(station) => saveMutation.mutate({ station })} isPending={saveMutation.isPending} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {stations.map((station) => (
          <Card key={station.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                  {station.logoUrl && (
                    <img src={station.logoUrl} alt="" className="w-10 h-10 rounded object-cover" />
                  )}
                  <div className="min-w-0">
                    <div className="font-medium truncate">{station.name}</div>
                    <div className="text-sm text-muted-foreground truncate">{station.genre}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={station.isActive ? "default" : "secondary"}>
                    {station.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <Dialog>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DialogTrigger asChild>
                          <Button size="icon" variant="ghost" onClick={() => setEditingStation(station)} data-testid={`button-edit-station-${station.id}`}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                      </TooltipTrigger>
                      <TooltipContent>Edit station</TooltipContent>
                    </Tooltip>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Station</DialogTitle>
                      </DialogHeader>
                      <StationForm
                        station={station}
                        onSave={(updates) => saveMutation.mutate({ id: station.id, station: updates })}
                        isPending={saveMutation.isPending}
                      />
                    </DialogContent>
                  </Dialog>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteMutation.mutate(station.id)}
                        disabled={deleteMutation.isPending}
                        data-testid={`button-delete-station-${station.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Delete station</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {stations.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">No stations yet</div>
        )}
      </div>
    </div>
  );
}

function StationForm({ station, onSave, isPending }: { station?: Station; onSave: (data: Partial<Station>) => void; isPending: boolean }) {
  const [name, setName] = useState(station?.name || "");
  const [description, setDescription] = useState(station?.description || "");
  const [streamUrl, setStreamUrl] = useState(station?.streamUrl || "");
  const [logoUrl, setLogoUrl] = useState(station?.logoUrl || "");
  const [genre, setGenre] = useState(station?.genre || "");
  const [isActive, setIsActive] = useState(station?.isActive ?? true);
  const [selectedApprovedId, setSelectedApprovedId] = useState<string>("");

  const { data: approvedStations = [] } = useQuery<UserStation[]>({
    queryKey: ["/api/admin/approved-user-stations"],
    enabled: !station
  });

  const handleApprovedSelect = (value: string) => {
    setSelectedApprovedId(value);
    if (value === "manual") {
      setName("");
      setDescription("");
      setLogoUrl("");
      setGenre("");
      setStreamUrl("");
      return;
    }
    const selected = approvedStations.find(s => s.id.toString() === value);
    if (selected) {
      setName(selected.name);
      setDescription(selected.description || "");
      setLogoUrl(selected.logoUrl || "");
      setGenre(selected.genre || "");
      setStreamUrl("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, description, streamUrl, logoUrl, genre, isActive });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!station && (
        <div className="space-y-2">
          <Label>Select Approved Station (optional)</Label>
          {approvedStations.length > 0 ? (
            <>
              <Select value={selectedApprovedId} onValueChange={handleApprovedSelect}>
                <SelectTrigger data-testid="select-approved-station">
                  <SelectValue placeholder="Choose an approved station or enter manually" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Enter manually</SelectItem>
                  {approvedStations.map((s) => (
                    <SelectItem key={s.id} value={s.id.toString()}>
                      {s.name} {s.genre ? `(${s.genre})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Select a pre-approved station to auto-fill details, or enter manually
              </p>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              No approved user stations available. Enter station details manually below.
            </p>
          )}
        </div>
      )}
      <div className="space-y-2">
        <Label>Name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} required data-testid="input-station-name" />
      </div>
      <div className="space-y-2">
        <Label>Stream URL</Label>
        <Input value={streamUrl} onChange={(e) => setStreamUrl(e.target.value)} required data-testid="input-station-url" />
      </div>
      <div className="space-y-2">
        <Label>Logo URL</Label>
        <Input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} data-testid="input-station-logo" />
      </div>
      <div className="space-y-2">
        <Label>Genre</Label>
        <Input value={genre} onChange={(e) => setGenre(e.target.value)} data-testid="input-station-genre" />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} data-testid="input-station-description" />
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={isActive} onCheckedChange={setIsActive} data-testid="switch-station-active" />
        <Label>Active</Label>
      </div>
      <Button type="submit" disabled={isPending} className="w-full" data-testid="button-save-station">
        {isPending ? "Saving..." : "Save Station"}
      </Button>
    </form>
  );
}

function UserStationsManager() {
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);

  const { data: stations = [], isLoading } = useQuery<UserStation[]>({
    queryKey: ["/api/user-stations"]
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/user-stations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-stations"] });
      toast({ title: "User station deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete", description: error.message, variant: "destructive" });
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (data: { id?: number; station: Partial<UserStation> }) => {
      if (data.id) {
        const res = await apiRequest("PATCH", `/api/user-stations/${data.id}`, data.station);
        return res.json();
      } else {
        const res = await apiRequest("POST", "/api/user-stations", data.station);
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-stations"] });
      setIsAddOpen(false);
      toast({ title: "User station saved" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to save", description: error.message, variant: "destructive" });
    }
  });

  if (isLoading) return <div className="p-4">Loading user stations...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-lg font-medium">User Stations ({stations.length})</h3>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <Tooltip>
            <TooltipTrigger asChild>
              <DialogTrigger asChild>
                <Button size="sm" data-testid="button-add-user-station">
                  <Plus className="h-4 w-4 mr-1" /> Add User Station
                </Button>
              </DialogTrigger>
            </TooltipTrigger>
            <TooltipContent>Create a new user station</TooltipContent>
          </Tooltip>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New User Station</DialogTitle>
            </DialogHeader>
            <UserStationForm onSave={(station) => saveMutation.mutate({ station })} isPending={saveMutation.isPending} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {stations.map((station) => (
          <Card key={station.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                  {station.logoUrl && (
                    <img src={station.logoUrl} alt="" className="w-10 h-10 rounded object-cover" />
                  )}
                  <div className="min-w-0">
                    <div className="font-medium truncate">{station.name}</div>
                    <div className="text-sm text-muted-foreground truncate">{station.genre}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={station.isActive ? "default" : "secondary"}>
                    {station.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <Dialog>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DialogTrigger asChild>
                          <Button size="icon" variant="ghost" data-testid={`button-edit-user-station-${station.id}`}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                      </TooltipTrigger>
                      <TooltipContent>Edit user station</TooltipContent>
                    </Tooltip>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit User Station</DialogTitle>
                      </DialogHeader>
                      <UserStationForm
                        station={station}
                        onSave={(updates) => saveMutation.mutate({ id: station.id, station: updates })}
                        isPending={saveMutation.isPending}
                      />
                    </DialogContent>
                  </Dialog>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteMutation.mutate(station.id)}
                        disabled={deleteMutation.isPending}
                        data-testid={`button-delete-user-station-${station.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Delete user station</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {stations.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">No user stations yet</div>
        )}
      </div>
    </div>
  );
}

function UserStationForm({ station, onSave, isPending }: { station?: UserStation; onSave: (data: Partial<UserStation>) => void; isPending: boolean }) {
  const [name, setName] = useState(station?.name || "");
  const [description, setDescription] = useState(station?.description || "");
  const [logoUrl, setLogoUrl] = useState(station?.logoUrl || "");
  const [genre, setGenre] = useState(station?.genre || "");
  const [isActive, setIsActive] = useState(station?.isActive ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, description, logoUrl, genre, isActive });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} required data-testid="input-user-station-name" />
      </div>
      <div className="space-y-2">
        <Label>Logo URL</Label>
        <Input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} data-testid="input-user-station-logo" />
      </div>
      <div className="space-y-2">
        <Label>Genre</Label>
        <Input value={genre} onChange={(e) => setGenre(e.target.value)} data-testid="input-user-station-genre" />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} data-testid="input-user-station-description" />
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={isActive} onCheckedChange={setIsActive} data-testid="switch-user-station-active" />
        <Label>Active</Label>
      </div>
      <Button type="submit" disabled={isPending} className="w-full" data-testid="button-save-user-station">
        {isPending ? "Saving..." : "Save User Station"}
      </Button>
    </form>
  );
}

function TracksManager() {
  const { toast } = useToast();
  const [selectedStationId, setSelectedStationId] = useState<number | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingTrack, setEditingTrack] = useState<StationTrack | null>(null);

  const { data: stations = [], isLoading: stationsLoading } = useQuery<UserStation[]>({
    queryKey: ["/api/user-stations"]
  });

  const { data: tracks = [], isLoading: tracksLoading } = useQuery<StationTrack[]>({
    queryKey: ["/api/user-stations", selectedStationId, "tracks"],
    queryFn: async () => {
      if (!selectedStationId) return [];
      const res = await fetch(`/api/user-stations/${selectedStationId}/tracks`);
      if (!res.ok) throw new Error("Failed to fetch tracks");
      return res.json();
    },
    enabled: !!selectedStationId
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/tracks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-stations", selectedStationId, "tracks"] });
      toast({ title: "Track deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete", description: error.message, variant: "destructive" });
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (data: { id?: number; track: Partial<StationTrack> }) => {
      if (data.id) {
        const res = await apiRequest("PATCH", `/api/tracks/${data.id}`, data.track);
        return res.json();
      } else {
        const res = await apiRequest("POST", `/api/user-stations/${selectedStationId}/tracks`, data.track);
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-stations", selectedStationId, "tracks"] });
      setIsAddOpen(false);
      setEditingTrack(null);
      toast({ title: "Track saved" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to save", description: error.message, variant: "destructive" });
    }
  });

  if (stationsLoading) return <div className="p-4">Loading stations...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="text-lg font-medium">Station Tracks</h3>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedStationId || ""}
            onChange={(e) => setSelectedStationId(e.target.value ? Number(e.target.value) : null)}
            className="h-9 rounded-md border border-slate-600 bg-slate-800 px-3 text-sm text-white"
            data-testid="select-station-for-tracks"
          >
            <option value="">Select a station...</option>
            {stations.map((station) => (
              <option key={station.id} value={station.id}>{station.name}</option>
            ))}
          </select>
          {selectedStationId && (
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button size="sm" data-testid="button-add-track">
                  <Plus className="h-4 w-4 mr-1" /> Add Track
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Track</DialogTitle>
                </DialogHeader>
                <TrackForm onSave={(track) => saveMutation.mutate({ track })} isPending={saveMutation.isPending} />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {!selectedStationId ? (
        <div className="text-center py-8 text-muted-foreground">Select a station to manage its tracks</div>
      ) : tracksLoading ? (
        <div className="p-4">Loading tracks...</div>
      ) : (
        <div className="space-y-2">
          {tracks.map((track) => (
            <Card key={track.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{track.title}</div>
                    <div className="text-sm text-muted-foreground truncate">
                      {track.artist || "Unknown Artist"} - {track.mediaType}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {track.duration && (
                      <Badge variant="outline">
                        {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, "0")}
                      </Badge>
                    )}
                    <Dialog open={editingTrack?.id === track.id} onOpenChange={(open) => !open && setEditingTrack(null)}>
                      <DialogTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setEditingTrack(track)}
                          data-testid={`button-edit-track-${track.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Track</DialogTitle>
                        </DialogHeader>
                        <TrackForm
                          track={track}
                          onSave={(updates) => saveMutation.mutate({ id: track.id, track: updates })}
                          isPending={saveMutation.isPending}
                        />
                      </DialogContent>
                    </Dialog>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteMutation.mutate(track.id)}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-track-${track.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {tracks.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">No tracks yet for this station</div>
          )}
        </div>
      )}
    </div>
  );
}

function TrackForm({ track, onSave, isPending }: { track?: StationTrack; onSave: (data: Partial<StationTrack>) => void; isPending: boolean }) {
  const [title, setTitle] = useState(track?.title || "");
  const [artist, setArtist] = useState(track?.artist || "");
  const [mediaUrl, setMediaUrl] = useState(track?.mediaUrl || "");
  const [mediaType, setMediaType] = useState(track?.mediaType || "audio");
  const [duration, setDuration] = useState(track?.duration?.toString() || "");
  const [coverArtUrl, setCoverArtUrl] = useState(track?.coverArtUrl || "");
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const { toast } = useToast();

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file type", description: "Please select an image file", variant: "destructive" });
      return;
    }

    setIsUploadingCover(true);
    try {
      const response = await fetch("/api/uploads/request-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: file.name,
          size: file.size,
          contentType: file.type,
        }),
      });

      if (!response.ok) throw new Error("Failed to get upload URL");
      const { uploadURL, objectPath } = await response.json();

      const uploadRes = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!uploadRes.ok) throw new Error("Failed to upload file");

      setCoverArtUrl(objectPath);
      toast({ title: "Cover art uploaded successfully" });
    } catch (error) {
      toast({ title: "Upload failed", description: error instanceof Error ? error.message : "Unknown error", variant: "destructive" });
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title,
      artist: artist || undefined,
      mediaUrl,
      mediaType,
      duration: duration ? parseInt(duration) : undefined,
      coverArtUrl: coverArtUrl || undefined
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} required data-testid="input-track-title" />
      </div>
      <div className="space-y-2">
        <Label>Artist</Label>
        <Input value={artist} onChange={(e) => setArtist(e.target.value)} data-testid="input-track-artist" />
      </div>
      <div className="space-y-2">
        <Label>Media URL</Label>
        <Input value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} required placeholder="https://... or object storage path" data-testid="input-track-media-url" />
      </div>
      <div className="space-y-2">
        <Label>Media Type</Label>
        <select
          value={mediaType}
          onChange={(e) => setMediaType(e.target.value)}
          className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
          data-testid="select-track-media-type"
        >
          <option value="audio">Audio</option>
          <option value="video">Video</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label>Duration (seconds)</Label>
        <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="e.g. 180" data-testid="input-track-duration" />
      </div>
      <div className="space-y-2">
        <Label>Cover Art</Label>
        <div className="flex items-center gap-2">
          <Input
            type="file"
            accept="image/*"
            onChange={handleCoverUpload}
            disabled={isUploadingCover}
            className="flex-1"
            data-testid="input-track-cover-art"
          />
          {isUploadingCover && <span className="text-sm text-muted-foreground">Uploading...</span>}
        </div>
        {coverArtUrl && (
          <div className="flex items-center gap-2 mt-2">
            <img src={coverArtUrl} alt="Cover art preview" className="w-16 h-16 object-cover rounded" />
            <span className="text-xs text-muted-foreground truncate flex-1">{coverArtUrl}</span>
            <Button type="button" size="sm" variant="ghost" onClick={() => setCoverArtUrl("")} data-testid="button-remove-cover-art">
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      <Button type="submit" disabled={isPending || isUploadingCover} className="w-full" data-testid="button-save-track">
        {isPending ? "Saving..." : "Save Track"}
      </Button>
    </form>
  );
}

function AdCampaignsManager() {
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);

  const { data: campaigns = [], isLoading } = useQuery<AdCampaign[]>({
    queryKey: ["/api/ad-campaigns"]
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/ad-campaigns/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ad-campaigns"] });
      toast({ title: "Campaign deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete", description: error.message, variant: "destructive" });
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (data: { id?: number; campaign: Partial<AdCampaign> }) => {
      if (data.id) {
        const res = await apiRequest("PATCH", `/api/ad-campaigns/${data.id}`, data.campaign);
        return res.json();
      } else {
        const res = await apiRequest("POST", "/api/ad-campaigns", data.campaign);
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ad-campaigns"] });
      setIsAddOpen(false);
      toast({ title: "Campaign saved" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to save", description: error.message, variant: "destructive" });
    }
  });

  if (isLoading) return <div className="p-4">Loading campaigns...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-lg font-medium">Ad Campaigns ({campaigns.length})</h3>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" data-testid="button-add-campaign">
              <Plus className="h-4 w-4 mr-1" /> Add Campaign
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Campaign</DialogTitle>
            </DialogHeader>
            <CampaignForm onSave={(campaign) => saveMutation.mutate({ campaign })} isPending={saveMutation.isPending} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {campaigns.map((campaign) => (
          <Card key={campaign.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <div className="font-medium truncate">{campaign.name}</div>
                  <div className="text-sm text-muted-foreground truncate">{campaign.targetUrl}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={campaign.isActive ? "default" : "secondary"}>
                    {campaign.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="icon" variant="ghost" data-testid={`button-edit-campaign-${campaign.id}`}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Campaign</DialogTitle>
                      </DialogHeader>
                      <CampaignForm
                        campaign={campaign}
                        onSave={(updates) => saveMutation.mutate({ id: campaign.id, campaign: updates })}
                        isPending={saveMutation.isPending}
                      />
                    </DialogContent>
                  </Dialog>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteMutation.mutate(campaign.id)}
                    disabled={deleteMutation.isPending}
                    data-testid={`button-delete-campaign-${campaign.id}`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {campaigns.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">No campaigns yet</div>
        )}
      </div>
    </div>
  );
}

function CampaignForm({ campaign, onSave, isPending }: { campaign?: AdCampaign; onSave: (data: Partial<AdCampaign>) => void; isPending: boolean }) {
  const [name, setName] = useState(campaign?.name || "");
  const [imageUrl, setImageUrl] = useState(campaign?.imageUrl || "");
  const [targetUrl, setTargetUrl] = useState(campaign?.targetUrl || "");
  const [isActive, setIsActive] = useState(campaign?.isActive ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, imageUrl, targetUrl, isActive });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Campaign Name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} required data-testid="input-campaign-name" />
      </div>
      <div className="space-y-2">
        <Label>Image URL</Label>
        <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} required data-testid="input-campaign-image" />
      </div>
      <div className="space-y-2">
        <Label>Target URL</Label>
        <Input value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)} required data-testid="input-campaign-target-url" />
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={isActive} onCheckedChange={setIsActive} data-testid="switch-campaign-active" />
        <Label>Active</Label>
      </div>
      <Button type="submit" disabled={isPending} className="w-full" data-testid="button-save-campaign">
        {isPending ? "Saving..." : "Save Campaign"}
      </Button>
    </form>
  );
}

function UpgradeRequestsManager() {
  const { toast } = useToast();
  const [reviewNotes, setReviewNotes] = useState<Record<number, string>>({});

  const { data: requests = [], isLoading, error } = useQuery<MemberUpgradeRequest[]>({
    queryKey: ["/api/admin/upgrade-requests"]
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: number; status: string; notes?: string }) => {
      const res = await apiRequest("POST", `/api/admin/upgrade-requests/${id}/review`, { status, notes });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/upgrade-requests"] });
      toast({ title: "Request reviewed successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to review", description: error.message, variant: "destructive" });
    }
  });

  if (isLoading) return <div className="text-center py-8">Loading...</div>;
  if (error) return <div className="text-center py-8 text-red-400">Failed to load requests</div>;

  const pendingRequests = requests.filter(r => r.status === "pending");
  const reviewedRequests = requests.filter(r => r.status !== "pending");

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-orange-400" />
          Upgrade Requests
        </CardTitle>
        <CardDescription>Review member requests to become producers</CardDescription>
      </CardHeader>
      <CardContent>
        {pendingRequests.length === 0 && reviewedRequests.length === 0 ? (
          <p className="text-slate-400 text-center py-4">No upgrade requests</p>
        ) : (
          <div className="space-y-6">
            {pendingRequests.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-orange-400 mb-3">Pending Requests ({pendingRequests.length})</h3>
                <div className="space-y-3">
                  {pendingRequests.map((request) => (
                    <div key={request.id} className="p-4 bg-slate-700/50 rounded-lg space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium">Member ID: {request.memberId}</p>
                          <p className="text-xs text-slate-400">
                            Requested: {new Date(request.requestedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-yellow-400 border-yellow-400">Pending</Badge>
                      </div>
                      {request.justification && (
                        <p className="text-sm text-slate-300 bg-slate-800 p-2 rounded">
                          "{request.justification}"
                        </p>
                      )}
                      <div className="space-y-2">
                        <Textarea
                          placeholder="Optional notes for the member..."
                          value={reviewNotes[request.id] || ""}
                          onChange={(e) => setReviewNotes(prev => ({ ...prev, [request.id]: e.target.value }))}
                          className="bg-slate-800 border-slate-600 text-sm"
                          data-testid={`textarea-review-notes-${request.id}`}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => reviewMutation.mutate({ 
                              id: request.id, 
                              status: "approved", 
                              notes: reviewNotes[request.id] 
                            })}
                            disabled={reviewMutation.isPending}
                            className="bg-green-600 hover:bg-green-700"
                            data-testid={`button-approve-${request.id}`}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => reviewMutation.mutate({ 
                              id: request.id, 
                              status: "rejected", 
                              notes: reviewNotes[request.id] 
                            })}
                            disabled={reviewMutation.isPending}
                            data-testid={`button-reject-${request.id}`}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {reviewedRequests.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-slate-400 mb-3">Reviewed ({reviewedRequests.length})</h3>
                <div className="space-y-2">
                  {reviewedRequests.slice(0, 10).map((request) => (
                    <div key={request.id} className="p-3 bg-slate-700/30 rounded-lg flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm">Member ID: {request.memberId}</p>
                        <p className="text-xs text-slate-500">
                          {request.reviewedAt && new Date(request.reviewedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={request.status === "approved" ? "text-green-400 border-green-400" : "text-red-400 border-red-400"}
                      >
                        {request.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

type ApprovalRequestWithStation = StationApprovalRequest & {
  stationName?: string;
  producerName?: string;
};

function StationApprovalRequestsManager() {
  const { toast } = useToast();
  const [reviewNotes, setReviewNotes] = useState<Record<number, string>>({});

  const { data: requests = [], isLoading, error } = useQuery<ApprovalRequestWithStation[]>({
    queryKey: ["/api/admin/approvals"]
  });

  const { data: userStations = [] } = useQuery<UserStation[]>({
    queryKey: ["/api/user-stations"]
  });

  const { data: members = [] } = useQuery<Member[]>({
    queryKey: ["/api/members"]
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: number; status: string; notes?: string }) => {
      const res = await apiRequest("POST", `/api/admin/approvals/${id}/review`, { status, notes });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/approvals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user-stations"] });
      toast({ title: "Station review submitted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to review", description: error.message, variant: "destructive" });
    }
  });

  if (isLoading) return <div className="text-center py-8">Loading...</div>;
  if (error) return <div className="text-center py-8 text-red-400">Failed to load approval requests</div>;

  const getStationName = (stationId: number) => {
    const station = userStations.find(s => s.id === stationId);
    return station?.name || `Station #${stationId}`;
  };

  const getProducerName = (producerId: number) => {
    const member = members.find(m => m.id === producerId);
    return member?.displayName || member?.email || `Producer #${producerId}`;
  };

  const pendingRequests = requests.filter(r => r.status === "pending");
  const reviewedRequests = requests.filter(r => r.status !== "pending");

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-orange-400" />
          Station Approval Requests
        </CardTitle>
        <CardDescription>Review producer station submissions for public listing</CardDescription>
      </CardHeader>
      <CardContent>
        {pendingRequests.length === 0 && reviewedRequests.length === 0 ? (
          <p className="text-slate-400 text-center py-4">No station approval requests</p>
        ) : (
          <div className="space-y-6">
            {pendingRequests.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-orange-400 mb-3">Pending Requests ({pendingRequests.length})</h3>
                <div className="space-y-3">
                  {pendingRequests.map((request) => (
                    <div key={request.id} className="p-4 bg-slate-700/50 rounded-lg space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium">{getStationName(request.userStationId)}</p>
                          <p className="text-sm text-slate-300">By: {getProducerName(request.producerId)}</p>
                          <p className="text-xs text-slate-400">
                            Submitted: {new Date(request.requestedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-yellow-400 border-yellow-400">Pending</Badge>
                      </div>
                      <div className="space-y-2">
                        <Textarea
                          placeholder="Optional notes for the producer..."
                          value={reviewNotes[request.id] || ""}
                          onChange={(e) => setReviewNotes(prev => ({ ...prev, [request.id]: e.target.value }))}
                          className="bg-slate-800 border-slate-600 text-sm"
                          data-testid={`textarea-approval-notes-${request.id}`}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => reviewMutation.mutate({ 
                              id: request.id, 
                              status: "approved", 
                              notes: reviewNotes[request.id] 
                            })}
                            disabled={reviewMutation.isPending}
                            className="bg-green-600 hover:bg-green-700"
                            data-testid={`button-approve-station-${request.id}`}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => reviewMutation.mutate({ 
                              id: request.id, 
                              status: "rejected", 
                              notes: reviewNotes[request.id] 
                            })}
                            disabled={reviewMutation.isPending}
                            data-testid={`button-reject-station-${request.id}`}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {reviewedRequests.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-slate-400 mb-3">Reviewed ({reviewedRequests.length})</h3>
                <div className="space-y-2">
                  {reviewedRequests.slice(0, 10).map((request) => (
                    <div key={request.id} className="p-3 bg-slate-700/30 rounded-lg flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm">{getStationName(request.userStationId)}</p>
                        <p className="text-xs text-slate-500">
                          {request.reviewedAt && new Date(request.reviewedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={request.status === "approved" ? "text-green-400 border-green-400" : "text-red-400 border-red-400"}
                      >
                        {request.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AdminUsersManager() {
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);

  const { data: admins = [], isLoading, error } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"]
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Admin deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete", description: error.message, variant: "destructive" });
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (data: { id?: number; admin: { email: string; password?: string; displayName?: string; role?: string; isActive?: boolean } }) => {
      if (data.id) {
        const res = await apiRequest("PATCH", `/api/admin/users/${data.id}`, data.admin);
        return res.json();
      } else {
        const res = await apiRequest("POST", "/api/admin/users", data.admin);
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsAddOpen(false);
      toast({ title: "Admin saved" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to save", description: error.message, variant: "destructive" });
    }
  });

  if (isLoading) return <div className="p-4">Loading admin users...</div>;
  if (error) return <div className="p-4 text-destructive">Access denied or error loading admins</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-lg font-medium">Admin Users ({admins.length})</h3>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" data-testid="button-add-admin">
              <Plus className="h-4 w-4 mr-1" /> Add Admin
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Admin</DialogTitle>
            </DialogHeader>
            <AdminUserForm onSave={(admin) => saveMutation.mutate({ admin })} isPending={saveMutation.isPending} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {admins.map((admin) => (
          <Card key={admin.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <div className="font-medium truncate">{admin.displayName || admin.email}</div>
                  <div className="text-sm text-muted-foreground truncate">{admin.email}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={admin.role === "super_admin" ? "default" : "secondary"}>
                    {admin.role === "super_admin" ? "Super Admin" : "Admin"}
                  </Badge>
                  <Badge variant={admin.isActive ? "outline" : "destructive"}>
                    {admin.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="icon" variant="ghost" data-testid={`button-edit-admin-${admin.id}`}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Admin</DialogTitle>
                      </DialogHeader>
                      <AdminUserForm
                        admin={admin}
                        onSave={(updates) => saveMutation.mutate({ id: admin.id, admin: updates })}
                        isPending={saveMutation.isPending}
                      />
                    </DialogContent>
                  </Dialog>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteMutation.mutate(admin.id)}
                    disabled={deleteMutation.isPending}
                    data-testid={`button-delete-admin-${admin.id}`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {admins.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">No admin users</div>
        )}
      </div>
    </div>
  );
}

function AdminUserForm({ admin, onSave, isPending }: { admin?: AdminUser; onSave: (data: { email: string; password?: string; displayName?: string; role?: string; isActive?: boolean }) => void; isPending: boolean }) {
  const [email, setEmail] = useState(admin?.email || "");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState(admin?.displayName || "");
  const [role, setRole] = useState(admin?.role || "admin");
  const [isActive, setIsActive] = useState(admin?.isActive ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: { email: string; password?: string; displayName?: string; role?: string; isActive?: boolean } = {
      email,
      displayName,
      role,
      isActive
    };
    if (password) {
      data.password = password;
    }
    onSave(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Email</Label>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required data-testid="input-admin-user-email" />
      </div>
      <div className="space-y-2">
        <Label>{admin ? "New Password (leave blank to keep)" : "Password"}</Label>
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required={!admin} data-testid="input-admin-user-password" />
      </div>
      <div className="space-y-2">
        <Label>Display Name</Label>
        <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} data-testid="input-admin-user-displayname" />
      </div>
      <div className="space-y-2">
        <Label>Role</Label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
          data-testid="select-admin-user-role"
        >
          <option value="admin">Admin</option>
          <option value="super_admin">Super Admin</option>
        </select>
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={isActive} onCheckedChange={setIsActive} data-testid="switch-admin-user-active" />
        <Label>Active</Label>
      </div>
      <Button type="submit" disabled={isPending} className="w-full" data-testid="button-save-admin-user">
        {isPending ? "Saving..." : "Save Admin"}
      </Button>
    </form>
  );
}

function SystemManager() {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateLogs, setUpdateLogs] = useState<string[]>([]);

  const { data: status, isLoading, refetch } = useQuery({
    queryKey: ["/api/admin/system/update-status"],
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      setIsUpdating(true);
      setUpdateLogs(["Starting update process..."]);
      const res = await apiRequest("POST", "/api/admin/system/update");
      return res.json();
    },
    onSuccess: (data) => {
      setUpdateLogs(prev => [...prev, "Update successful!", data.message]);
      toast({ title: "Update successful", description: "The system will restart in a few seconds." });
      setTimeout(() => {
        window.location.reload();
      }, 5000);
    },
    onError: (error: Error) => {
      setIsUpdating(false);
      setUpdateLogs(prev => [...prev, `Update failed: ${error.message}`]);
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    }
  });

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className={`h-5 w-5 text-orange-400 ${isLoading ? 'animate-spin' : ''}`} />
          System Update
        </CardTitle>
        <CardDescription>Manage application updates directly from GitHub</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="text-center py-8 text-slate-400">Checking for updates...</div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-300">Current Version</p>
                <code className="text-xs bg-slate-800 px-2 py-1 rounded">{status?.localVersion || 'Unknown'}</code>
              </div>
              <div className="space-y-1 text-right">
                <p className="text-sm font-medium text-slate-300">Remote Version</p>
                <code className="text-xs bg-slate-800 px-2 py-1 rounded">{status?.remoteVersion || 'Unknown'}</code>
              </div>
            </div>

            {status?.canUpdate ? (
              <div className="p-4 border border-orange-500/30 bg-orange-500/10 rounded-lg space-y-3">
                <div className="flex items-center gap-2 text-orange-400">
                  <Sparkles className="h-5 w-5" />
                  <p className="font-medium">New update available!</p>
                </div>
                <p className="text-sm text-slate-300">
                  There are {status.commitsBehind} new commit(s) available on GitHub.
                </p>
                <Button 
                  onClick={() => updateMutation.mutate()} 
                  disabled={isUpdating}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {isUpdating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Now"
                  )}
                </Button>
              </div>
            ) : (
              <div className="p-4 border border-green-500/30 bg-green-500/10 rounded-lg flex items-center gap-3">
                <Check className="h-5 w-5 text-green-400" />
                <p className="text-sm text-slate-300">Your system is up to date.</p>
                <Button variant="ghost" size="sm" onClick={() => refetch()} className="ml-auto">
                  Check Again
                </Button>
              </div>
            )}

            {updateLogs.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Update Progress</p>
                <div className="bg-slate-950 p-3 rounded-lg font-mono text-xs text-slate-300 max-h-40 overflow-y-auto space-y-1 border border-slate-700">
                  {updateLogs.map((log, i) => (
                    <div key={i}>{log}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminPanel() {
  const { toast } = useToast();

  const { data: session, isLoading, refetch } = useQuery<AdminSession>({
    queryKey: ["/api/admin/me"],
    queryFn: getQueryFn({ on401: "returnNull" })
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/admin/logout");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/me"] });
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <RefreshCw className="h-8 w-8 animate-spin text-orange-400" />
      </div>
    );
  }

  if (!session) {
    return <LoginForm onSuccess={() => refetch()} />;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <header className="sticky top-0 z-50 border-b border-slate-700 bg-slate-800/95 backdrop-blur">
        <div className="container flex h-14 items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-orange-400" />
            <span className="font-semibold">Admin Panel</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-300 hidden sm:inline">
              {session.displayName || session.email}
              {session.role === "super_admin" && (
                <Badge className="ml-2 bg-orange-500 text-white">Super Admin</Badge>
              )}
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={() => logoutMutation.mutate()} className="text-slate-200 hover:text-white hover:bg-slate-700" data-testid="button-admin-logout">
                  <LogOut className="h-4 w-4 mr-1" />
                  Logout
                </Button>
              </TooltipTrigger>
              <TooltipContent>Sign out of admin panel</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6">
        <Tabs defaultValue="stations" className="space-y-4">
          <TabsList className="grid grid-cols-2 sm:grid-cols-5 lg:w-auto lg:inline-grid gap-1">
            <TabsTrigger value="stations" className="flex items-center gap-1" data-testid="tab-stations">
              <Radio className="h-4 w-4" />
              <span className="hidden sm:inline">Stations</span>
            </TabsTrigger>
            <TabsTrigger value="user-stations" className="flex items-center gap-1" data-testid="tab-user-stations">
              <Music2 className="h-4 w-4" />
              <span className="hidden sm:inline">User Stations</span>
            </TabsTrigger>
            <TabsTrigger value="tracks" className="flex items-center gap-1" data-testid="tab-tracks">
              <Disc className="h-4 w-4" />
              <span className="hidden sm:inline">Tracks</span>
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="flex items-center gap-1" data-testid="tab-campaigns">
              <Megaphone className="h-4 w-4" />
              <span className="hidden sm:inline">Ads</span>
            </TabsTrigger>
            {session.role === "super_admin" && (
              <TabsTrigger value="approvals" className="flex items-center gap-1" data-testid="tab-approvals">
                <ClipboardList className="h-4 w-4" />
                <span className="hidden sm:inline">Approvals</span>
              </TabsTrigger>
            )}
            {session.role === "super_admin" && (
              <TabsTrigger value="upgrades" className="flex items-center gap-1" data-testid="tab-upgrades">
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">Upgrades</span>
              </TabsTrigger>
            )}
            {session.role === "super_admin" && (
              <TabsTrigger value="admins" className="flex items-center gap-1" data-testid="tab-admins">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Admins</span>
              </TabsTrigger>
            )}
            {session.role === "super_admin" && (
              <TabsTrigger value="system" className="flex items-center gap-1" data-testid="tab-system">
                <RefreshCw className="h-4 w-4" />
                <span className="hidden sm:inline">System</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="stations">
            <StationsManager />
          </TabsContent>

          <TabsContent value="user-stations">
            <UserStationsManager />
          </TabsContent>

          <TabsContent value="tracks">
            <TracksManager />
          </TabsContent>

          <TabsContent value="campaigns">
            <AdCampaignsManager />
          </TabsContent>

          {session.role === "super_admin" && (
            <TabsContent value="approvals">
              <StationApprovalRequestsManager />
            </TabsContent>
          )}

          {session.role === "super_admin" && (
            <TabsContent value="upgrades">
              <UpgradeRequestsManager />
            </TabsContent>
          )}

          {session.role === "super_admin" && (
            <TabsContent value="admins">
              <AdminUsersManager />
            </TabsContent>
          )}

          {session.role === "super_admin" && (
            <TabsContent value="system">
              <SystemManager />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}
