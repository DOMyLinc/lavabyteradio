import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  LogOut, Radio, Music2, Plus, Trash2, Edit, Send, 
  Check, X, Clock, ArrowLeft, Upload, Link as LinkIcon
} from "lucide-react";
import { Link } from "wouter";
import { ObjectUploader } from "@/components/ObjectUploader";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { UserStation, StationTrack } from "@shared/schema";

type MemberSession = {
  id: number;
  email: string;
  displayName: string | null;
  role: string;
  isPremium: boolean;
  isVerified: boolean;
} | null;

function ProducerLogin({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/members/login", { email, password });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members/me"] });
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
            <Radio className="h-6 w-6 text-orange-400" />
            Producer Login
          </CardTitle>
          <CardDescription className="text-slate-300">Sign in to manage your stations</CardDescription>
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
                placeholder="producer@example.com"
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                data-testid="input-producer-email"
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
                data-testid="input-producer-password"
              />
            </div>
            <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white" disabled={loginMutation.isPending} data-testid="button-producer-login">
              {loginMutation.isPending ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <Link href="/" className="text-slate-400 hover:text-slate-300 text-sm">
              Back to home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StationForm({ station, onSave, isPending }: { station?: UserStation; onSave: (data: Partial<UserStation>) => void; isPending: boolean }) {
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
        <Label>Station Name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} required data-testid="input-producer-station-name" />
      </div>
      <div className="space-y-2">
        <Label>Logo URL</Label>
        <Input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." data-testid="input-producer-station-logo" />
      </div>
      <div className="space-y-2">
        <Label>Genre</Label>
        <Input value={genre} onChange={(e) => setGenre(e.target.value)} placeholder="Electronic, Jazz, etc." data-testid="input-producer-station-genre" />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} data-testid="input-producer-station-description" />
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={isActive} onCheckedChange={setIsActive} data-testid="switch-producer-station-active" />
        <Label>Active</Label>
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button type="submit" disabled={isPending} className="w-full" data-testid="button-save-producer-station">
            {isPending ? "Saving..." : "Save Station"}
          </Button>
        </TooltipTrigger>
        <TooltipContent>Save your station details</TooltipContent>
      </Tooltip>
    </form>
  );
}

const GENRE_OPTIONS = [
  "Pop", "Rock", "Hip Hop", "R&B", "Electronic", "Jazz", "Classical", 
  "Country", "Reggae", "Latin", "Folk", "Blues", "Metal", "Punk",
  "Indie", "Soul", "Funk", "Ambient", "Lo-fi", "World", "Other"
];

function TrackForm({ track, onSave, isPending }: { track?: StationTrack; onSave: (data: Partial<StationTrack>) => void; isPending: boolean }) {
  const [title, setTitle] = useState(track?.title || "");
  const [artist, setArtist] = useState(track?.artist || "");
  const [mediaUrl, setMediaUrl] = useState(track?.mediaUrl || "");
  const [mediaType, setMediaType] = useState<string>(track?.mediaType || "audio");
  const [genre, setGenre] = useState(track?.genre || "");
  const [customGenre, setCustomGenre] = useState("");
  const [uploadMode, setUploadMode] = useState<"upload" | "url">("upload");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [uploadedMediaUrl, setUploadedMediaUrl] = useState("");
  const [validationError, setValidationError] = useState("");
  const pendingObjectPathRef = useRef<string | null>(null);

  const handleModeSwitch = (mode: "upload" | "url") => {
    setUploadMode(mode);
    setMediaUrl("");
    setUploadedFileName("");
    setUploadedMediaUrl("");
    setValidationError("");
  };

  const handleGenreChange = (value: string) => {
    setGenre(value);
    if (value !== "Other") {
      setCustomGenre("");
    }
  };

  const finalMediaUrl = uploadMode === "upload" ? uploadedMediaUrl : mediaUrl;
  const finalGenre = genre === "Other" ? customGenre : genre;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!finalMediaUrl.trim()) {
      setValidationError(uploadMode === "upload" ? "Please upload an audio file first" : "Please enter a valid URL");
      return;
    }
    setValidationError("");
    onSave({
      title,
      artist: artist || undefined,
      mediaUrl: finalMediaUrl,
      mediaType,
      genre: finalGenre || undefined
    });
  };

  const allowedMimeTypes = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/flac", "audio/ogg", "audio/x-flac"];
  
  const handleGetUploadParameters = async (file: { name: string; size: number | null; type?: string }) => {
    const mimeType = file.type || "";
    if (!allowedMimeTypes.includes(mimeType)) {
      setValidationError("Unsupported file format. Please use MP3, WAV, FLAC, or OGG files.");
      setIsUploading(false);
      throw new Error("Unsupported file format");
    }
    setValidationError("");
    setIsUploading(true);
    const res = await fetch("/api/uploads/request-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: file.name,
        size: file.size || 0,
        contentType: mimeType
      })
    });
    const data = await res.json();
    pendingObjectPathRef.current = data.objectPath;
    return {
      method: "PUT" as const,
      url: data.uploadURL as string,
      headers: { "Content-Type": mimeType }
    };
  };

  const handleUploadComplete = (result: { successful?: Array<{ name?: string; response?: { body?: string } }> }) => {
    setIsUploading(false);
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      setUploadedFileName(uploadedFile.name || "audio file");
      if (pendingObjectPathRef.current) {
        setUploadedMediaUrl(pendingObjectPathRef.current);
        pendingObjectPathRef.current = null;
        setValidationError("");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Track Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} required data-testid="input-producer-track-title" />
      </div>
      <div className="space-y-2">
        <Label>Artist</Label>
        <Input value={artist} onChange={(e) => setArtist(e.target.value)} data-testid="input-producer-track-artist" />
      </div>
      
      <div className="space-y-2">
        <Label>Audio Source</Label>
        <div className="flex gap-2 mb-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                type="button" 
                variant={uploadMode === "upload" ? "default" : "outline"} 
                size="sm"
                onClick={() => handleModeSwitch("upload")}
                disabled={isUploading}
                data-testid="button-upload-mode"
              >
                <Upload className="h-4 w-4 mr-1" />
                Upload File
              </Button>
            </TooltipTrigger>
            <TooltipContent>Select an audio file from your device</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                type="button" 
                variant={uploadMode === "url" ? "default" : "outline"} 
                size="sm"
                onClick={() => handleModeSwitch("url")}
                disabled={isUploading}
                data-testid="button-url-mode"
              >
                <LinkIcon className="h-4 w-4 mr-1" />
                Enter URL
              </Button>
            </TooltipTrigger>
            <TooltipContent>Use a URL link to an audio file</TooltipContent>
          </Tooltip>
        </div>
        {validationError && (
          <p className="text-sm text-red-400">{validationError}</p>
        )}
        
        {uploadMode === "upload" ? (
          <div className="space-y-2">
            <ObjectUploader
              maxNumberOfFiles={1}
              maxFileSize={104857600}
              onGetUploadParameters={handleGetUploadParameters}
              onComplete={handleUploadComplete}
              buttonClassName="w-full bg-slate-700 hover:bg-slate-600"
            >
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? "Uploading..." : "Select Audio File"}
            </ObjectUploader>
            {uploadedFileName && (
              <p className="text-sm text-green-400 flex items-center gap-1">
                <Check className="h-3 w-3" />
                Uploaded: {uploadedFileName}
              </p>
            )}
            {uploadedMediaUrl && (
              <p className="text-xs text-muted-foreground truncate">
                Path: {uploadedMediaUrl}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Supported formats: MP3, WAV, FLAC, OGG (max 100MB)
            </p>
          </div>
        ) : (
          <Input 
            value={mediaUrl} 
            onChange={(e) => setMediaUrl(e.target.value)} 
            placeholder="https://example.com/audio.mp3" 
            data-testid="input-producer-track-url" 
          />
        )}
      </div>
      
      <div className="space-y-2">
        <Label>Media Type</Label>
        <select
          value={mediaType}
          onChange={(e) => setMediaType(e.target.value)}
          className="w-full h-9 rounded-md border border-slate-600 bg-slate-800 px-3 text-sm text-white"
          data-testid="select-producer-track-type"
        >
          <option value="audio">Audio</option>
          <option value="video">Video</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label>Genre</Label>
        <select
          value={genre}
          onChange={(e) => handleGenreChange(e.target.value)}
          className="w-full h-9 rounded-md border border-slate-600 bg-slate-800 px-3 text-sm text-white"
          data-testid="select-producer-track-genre"
        >
          <option value="">Select a genre...</option>
          {GENRE_OPTIONS.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
        {genre === "Other" && (
          <Input
            value={customGenre}
            onChange={(e) => setCustomGenre(e.target.value)}
            placeholder="Enter your genre..."
            className="mt-2"
            data-testid="input-producer-track-custom-genre"
          />
        )}
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button type="submit" disabled={isPending} className="w-full" data-testid="button-save-producer-track">
            {isPending ? "Saving..." : "Save Track"}
          </Button>
        </TooltipTrigger>
        <TooltipContent>Save this track to your station playlist</TooltipContent>
      </Tooltip>
    </form>
  );
}

function ApprovalStatusBadge({ status }: { status: string | null }) {
  if (!status || status === "pending") {
    return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
  }
  if (status === "approved") {
    return <Badge className="bg-green-600"><Check className="h-3 w-3 mr-1" />Approved</Badge>;
  }
  if (status === "rejected") {
    return <Badge variant="destructive"><X className="h-3 w-3 mr-1" />Rejected</Badge>;
  }
  return <Badge variant="outline">{status}</Badge>;
}

function StationsManager() {
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedStationId, setSelectedStationId] = useState<number | null>(null);
  const [isAddTrackOpen, setIsAddTrackOpen] = useState(false);

  const { data: stations = [], isLoading } = useQuery<UserStation[]>({
    queryKey: ["/api/producer/stations"]
  });

  const selectedStation = stations.find(s => s.id === selectedStationId);

  const { data: tracks = [], isLoading: tracksLoading } = useQuery<StationTrack[]>({
    queryKey: ["/api/producer/stations", selectedStationId, "tracks"],
    queryFn: async () => {
      if (!selectedStationId) return [];
      const res = await fetch(`/api/producer/stations/${selectedStationId}/tracks`);
      if (!res.ok) throw new Error("Failed to fetch tracks");
      return res.json();
    },
    enabled: !!selectedStationId
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<UserStation>) => {
      const res = await apiRequest("POST", "/api/producer/stations", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/producer/stations"] });
      setIsAddOpen(false);
      toast({ title: "Station created" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create station", description: error.message, variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<UserStation> }) => {
      const res = await apiRequest("PATCH", `/api/producer/stations/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/producer/stations"] });
      toast({ title: "Station updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update station", description: error.message, variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/producer/stations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/producer/stations"] });
      setSelectedStationId(null);
      toast({ title: "Station deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete station", description: error.message, variant: "destructive" });
    }
  });

  const submitMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/producer/stations/${id}/submit`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/producer/stations"] });
      toast({ title: "Station submitted for approval" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to submit", description: error.message, variant: "destructive" });
    }
  });

  const addTrackMutation = useMutation({
    mutationFn: async (data: Partial<StationTrack>) => {
      const res = await apiRequest("POST", `/api/producer/stations/${selectedStationId}/tracks`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/producer/stations", selectedStationId, "tracks"] });
      setIsAddTrackOpen(false);
      toast({ title: "Track added" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to add track", description: error.message, variant: "destructive" });
    }
  });

  const deleteTrackMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/tracks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/producer/stations", selectedStationId, "tracks"] });
      toast({ title: "Track deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete track", description: error.message, variant: "destructive" });
    }
  });

  if (isLoading) return <div className="p-4 text-slate-300">Loading stations...</div>;

  if (selectedStationId && selectedStation) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setSelectedStationId(null)} data-testid="button-back-to-stations">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <h3 className="text-lg font-medium text-white">{selectedStation.name}</h3>
          <ApprovalStatusBadge status={selectedStation.approvalStatus} />
        </div>

        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h4 className="font-medium text-slate-300">Tracks ({tracks.length})</h4>
          <Dialog open={isAddTrackOpen} onOpenChange={setIsAddTrackOpen}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid="button-add-producer-track">
                <Plus className="h-4 w-4 mr-1" /> Add Track
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700 text-white">
              <DialogHeader>
                <DialogTitle>Add Track</DialogTitle>
              </DialogHeader>
              <TrackForm onSave={(data) => addTrackMutation.mutate(data)} isPending={addTrackMutation.isPending} />
            </DialogContent>
          </Dialog>
        </div>

        {tracksLoading ? (
          <div className="text-slate-400">Loading tracks...</div>
        ) : (
          <div className="space-y-2">
            {tracks.map((track) => (
              <Card key={track.id} className="bg-slate-800 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="min-w-0">
                      <div className="font-medium truncate text-white">{track.title}</div>
                      <div className="text-sm text-slate-400 truncate">
                        {track.artist || "Unknown Artist"} - {track.mediaType}
                        {track.duration && ` - ${Math.floor(track.duration / 60)}:${(track.duration % 60).toString().padStart(2, "0")}`}
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteTrackMutation.mutate(track.id)}
                      disabled={deleteTrackMutation.isPending}
                      data-testid={`button-delete-producer-track-${track.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {tracks.length === 0 && (
              <div className="text-center py-8 text-slate-400">No tracks yet. Add some tracks to your station.</div>
            )}
          </div>
        )}

        {selectedStation.approvalStatus !== "approved" && (
          <div className="pt-4 border-t border-slate-700">
            <Button
              onClick={() => submitMutation.mutate(selectedStation.id)}
              disabled={submitMutation.isPending || tracks.length === 0}
              className="w-full bg-green-600 hover:bg-green-700"
              data-testid="button-submit-for-approval"
            >
              <Send className="h-4 w-4 mr-2" />
              {submitMutation.isPending ? "Submitting..." : "Submit for Approval"}
            </Button>
            {tracks.length === 0 && (
              <p className="text-sm text-slate-400 mt-2 text-center">Add at least one track before submitting</p>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-lg font-medium text-white">My Stations ({stations.length})</h3>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" data-testid="button-add-producer-station">
              <Plus className="h-4 w-4 mr-1" /> Create Station
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle>Create New Station</DialogTitle>
            </DialogHeader>
            <StationForm onSave={(data) => createMutation.mutate(data)} isPending={createMutation.isPending} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {stations.map((station) => (
          <Card key={station.id} className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 min-w-0 cursor-pointer" onClick={() => setSelectedStationId(station.id)}>
                  {station.logoUrl ? (
                    <img src={station.logoUrl} alt="" className="w-10 h-10 rounded object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded bg-slate-700 flex items-center justify-center">
                      <Radio className="h-5 w-5 text-slate-400" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="font-medium truncate text-white">{station.name}</div>
                    <div className="text-sm text-slate-400 truncate">{station.genre || "No genre"}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ApprovalStatusBadge status={station.approvalStatus} />
                  {station.isPublic && <Badge className="bg-blue-600">Public</Badge>}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="icon" variant="ghost" data-testid={`button-edit-producer-station-${station.id}`}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-800 border-slate-700 text-white">
                      <DialogHeader>
                        <DialogTitle>Edit Station</DialogTitle>
                      </DialogHeader>
                      <StationForm
                        station={station}
                        onSave={(data) => updateMutation.mutate({ id: station.id, data })}
                        isPending={updateMutation.isPending}
                      />
                    </DialogContent>
                  </Dialog>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteMutation.mutate(station.id)}
                    disabled={deleteMutation.isPending}
                    data-testid={`button-delete-producer-station-${station.id}`}
                  >
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setSelectedStationId(station.id)}
                    data-testid={`button-manage-tracks-${station.id}`}
                  >
                    <Music2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {stations.length === 0 && (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-8 text-center">
              <Radio className="h-12 w-12 mx-auto mb-4 text-slate-500" />
              <p className="text-slate-400 mb-4">You haven't created any stations yet</p>
              <Button onClick={() => setIsAddOpen(true)} data-testid="button-create-first-station">
                <Plus className="h-4 w-4 mr-1" /> Create Your First Station
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function ProducerDashboardContent({ member, onLogout }: { member: MemberSession; onLogout: () => void }) {
  const { toast } = useToast();

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/members/logout");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members/me"] });
      onLogout();
    },
    onError: (error: Error) => {
      toast({ title: "Logout failed", description: error.message, variant: "destructive" });
    }
  });

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="border-b border-slate-700 bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Radio className="h-8 w-8 text-orange-400" />
            <div>
              <h1 className="text-xl font-bold text-white">Producer Dashboard</h1>
              <p className="text-sm text-slate-400">Manage your radio stations</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-white">{member?.displayName || member?.email}</p>
              <Badge variant="outline" className="text-orange-400 border-orange-400">Producer</Badge>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              data-testid="button-producer-logout"
            >
              <LogOut className="h-5 w-5 text-slate-400" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <Tabs defaultValue="stations">
          <TabsList className="mb-6 bg-slate-800">
            <TabsTrigger value="stations" data-testid="tab-producer-stations">
              <Radio className="h-4 w-4 mr-2" /> My Stations
            </TabsTrigger>
          </TabsList>
          <TabsContent value="stations">
            <StationsManager />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default function ProducerDashboard() {
  const { data: member, isLoading, error } = useQuery<MemberSession>({
    queryKey: ["/api/members/me"],
    retry: false
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  if (error || !member) {
    return <ProducerLogin onSuccess={() => {}} />;
  }

  if (member.role !== "producer") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
        <Card className="w-full max-w-md bg-slate-800 border-slate-700">
          <CardHeader className="text-center">
            <CardTitle className="text-white">Access Denied</CardTitle>
            <CardDescription className="text-slate-300">
              Your account is not a producer account. Please contact an administrator to upgrade your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/">
              <Button variant="outline" data-testid="button-back-home">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <ProducerDashboardContent member={member} onLogout={() => {}} />;
}
