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
import { 
  LogOut, Radio, Music2, Megaphone, Users, Plus, Trash2, Edit, 
  RefreshCw, Shield, Settings
} from "lucide-react";
import type { Station, UserStation, StationTrack, AdCampaign } from "@shared/schema";

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
          <DialogTrigger asChild>
            <Button size="sm" data-testid="button-add-station">
              <Plus className="h-4 w-4 mr-1" /> Add Station
            </Button>
          </DialogTrigger>
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
                    <DialogTrigger asChild>
                      <Button size="icon" variant="ghost" onClick={() => setEditingStation(station)} data-testid={`button-edit-station-${station.id}`}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
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
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteMutation.mutate(station.id)}
                    disabled={deleteMutation.isPending}
                    data-testid={`button-delete-station-${station.id}`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, description, streamUrl, logoUrl, genre, isActive });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
          <DialogTrigger asChild>
            <Button size="sm" data-testid="button-add-user-station">
              <Plus className="h-4 w-4 mr-1" /> Add User Station
            </Button>
          </DialogTrigger>
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
                    <DialogTrigger asChild>
                      <Button size="icon" variant="ghost" data-testid={`button-edit-user-station-${station.id}`}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
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
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteMutation.mutate(station.id)}
                    disabled={deleteMutation.isPending}
                    data-testid={`button-delete-user-station-${station.id}`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
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
            <Button variant="ghost" size="sm" onClick={() => logoutMutation.mutate()} className="text-slate-200 hover:text-white hover:bg-slate-700" data-testid="button-admin-logout">
              <LogOut className="h-4 w-4 mr-1" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6">
        <Tabs defaultValue="stations" className="space-y-4">
          <TabsList className="grid grid-cols-2 sm:grid-cols-4 lg:w-auto lg:inline-grid gap-1">
            <TabsTrigger value="stations" className="flex items-center gap-1" data-testid="tab-stations">
              <Radio className="h-4 w-4" />
              <span className="hidden sm:inline">Stations</span>
            </TabsTrigger>
            <TabsTrigger value="user-stations" className="flex items-center gap-1" data-testid="tab-user-stations">
              <Music2 className="h-4 w-4" />
              <span className="hidden sm:inline">User Stations</span>
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="flex items-center gap-1" data-testid="tab-campaigns">
              <Megaphone className="h-4 w-4" />
              <span className="hidden sm:inline">Ads</span>
            </TabsTrigger>
            {session.role === "super_admin" && (
              <TabsTrigger value="admins" className="flex items-center gap-1" data-testid="tab-admins">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Admins</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="stations">
            <StationsManager />
          </TabsContent>

          <TabsContent value="user-stations">
            <UserStationsManager />
          </TabsContent>

          <TabsContent value="campaigns">
            <AdCampaignsManager />
          </TabsContent>

          {session.role === "super_admin" && (
            <TabsContent value="admins">
              <AdminUsersManager />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}
