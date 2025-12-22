import { useQuery, useMutation } from "@tanstack/react-query";
import { LavaBackground } from "@/components/LavaBackground";
import { StereoUnit } from "@/components/StereoUnit";
import { AdBanner } from "@/components/AdBanner";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, LogOut } from "lucide-react";
import type { Station, UserStation, MemberDial } from "@shared/schema";
import mascotImage from "@assets/588496392_1194040775959608_6497226853787014568_n_1766347733869.jpg";

type MemberSession = {
  id: number;
  email: string;
  displayName: string | null;
  role: string;
  isPremium: boolean;
  isVerified: boolean;
} | null;

export type UnifiedStation = 
  | (Station & { type: "external"; isSaved?: boolean })
  | (UserStation & { type: "user"; isSaved?: boolean });

export default function PublicPlayer() {
  const { toast } = useToast();

  const { data: member } = useQuery<MemberSession>({
    queryKey: ["/api/members/me"],
    retry: false
  });

  const { data: externalStations = [], isLoading: loadingExternal, error: errorExternal } = useQuery<Station[]>({
    queryKey: ["/api/stations"],
  });
  
  const { data: userStations = [], isLoading: loadingUser, error: errorUser } = useQuery<UserStation[]>({
    queryKey: ["/api/user-stations"],
  });

  const { data: publicUserStations = [] } = useQuery<UserStation[]>({
    queryKey: ["/api/public/user-stations"],
  });

  const { data: memberDial = [] } = useQuery<MemberDial[]>({
    queryKey: ["/api/members/dial"],
    enabled: !!member,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/members/logout");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/members/dial"] });
      toast({ title: "Logged out successfully" });
    }
  });

  const addToDialMutation = useMutation({
    mutationFn: async ({ stationId, userStationId }: { stationId?: number; userStationId?: number }) => {
      const res = await apiRequest("POST", "/api/members/dial", { stationId, userStationId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members/dial"] });
      toast({ title: "Added to your dial" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to save", description: error.message, variant: "destructive" });
    }
  });

  const removeFromDialMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/members/dial/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members/dial"] });
      toast({ title: "Removed from your dial" });
    }
  });

  const isLoading = loadingExternal || loadingUser;
  const error = errorExternal || errorUser;
  
  const savedExternalIds = new Set(memberDial.filter(d => d.stationId).map(d => d.stationId));
  const savedUserIds = new Set(memberDial.filter(d => d.userStationId).map(d => d.userStationId));

  const allPublicUserStations = [
    ...userStations.filter(s => s.isActive),
    ...publicUserStations.filter(s => s.isActive && s.isPublic && s.approvalStatus === "approved")
  ];
  const uniqueUserStations = allPublicUserStations.filter((station, index, self) =>
    index === self.findIndex(s => s.id === station.id)
  );

  const stations: UnifiedStation[] = [
    ...externalStations.filter(s => s.isActive).map(s => ({ 
      ...s, 
      type: "external" as const,
      isSaved: savedExternalIds.has(s.id)
    })),
    ...uniqueUserStations.map(s => ({ 
      ...s, 
      type: "user" as const,
      isSaved: savedUserIds.has(s.id)
    })),
  ];

  const handleToggleSave = (station: UnifiedStation) => {
    if (!member) {
      toast({ title: "Please log in to save stations", variant: "destructive" });
      return;
    }

    if (station.isSaved) {
      const dialEntry = memberDial.find(d => 
        station.type === "external" ? d.stationId === station.id : d.userStationId === station.id
      );
      if (dialEntry) {
        removeFromDialMutation.mutate(dialEntry.id);
      }
    } else {
      if (station.type === "external") {
        addToDialMutation.mutate({ stationId: station.id });
      } else {
        addToDialMutation.mutate({ userStationId: station.id });
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <LavaBackground />

      <header className="relative z-10 flex items-center justify-between gap-4 p-4 md:p-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden border-2 border-lava-500 shadow-lava-glow">
            <img
              src={mascotImage}
              alt="Lava Bytes Mascot"
              className="w-full h-full object-cover"
              data-testid="mascot-logo"
            />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-display font-bold text-lava-200 led-text">
              Lava Bytes Radio
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground">
              Online Radio Experience
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {member ? (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm text-lava-200">{member.displayName || member.email}</p>
                {member.role === "producer" && (
                  <Badge variant="outline" className="text-orange-400 border-orange-400 text-xs">Producer</Badge>
                )}
              </div>
              {member.role === "producer" && (
                <a
                  href="/producer"
                  className="text-xs text-orange-400 hover:text-orange-300 transition-colors"
                  data-testid="producer-dashboard-link"
                >
                  Dashboard
                </a>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          ) : (
            <a
              href="/"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              data-testid="home-link"
            >
              Home
            </a>
          )}
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 md:p-8 relative z-10">
        {isLoading ? (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-lava-400 animate-spin" />
            <p className="text-muted-foreground">Loading stations...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center">
              <span className="text-2xl">!</span>
            </div>
            <p className="text-destructive">Failed to load stations</p>
            <p className="text-sm text-muted-foreground">
              Please try refreshing the page
            </p>
          </div>
        ) : (
          <StereoUnit 
            stations={stations} 
            isLoading={isLoading} 
            member={member}
            onToggleSave={handleToggleSave}
          />
        )}
      </main>

      <footer className="relative z-10 text-center p-4 text-xs text-muted-foreground">
        <AdBanner />
        <p className="mt-3 text-sm font-display text-lava-300 italic tracking-wide">
          "Share your AudioVisuaListic Dreams?"
        </p>
        <p className="mt-2">Lava Bytes Radio - Streaming Online Radio</p>
      </footer>
    </div>
  );
}
