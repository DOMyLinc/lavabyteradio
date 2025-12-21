import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { History, Music, Radio, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { PlaybackHistory } from "@shared/schema";

interface RecentlyPlayedProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectHistory?: (entry: PlaybackHistory) => void;
}

export function RecentlyPlayed({ isOpen, onClose, onSelectHistory }: RecentlyPlayedProps) {
  const { data: history = [], isLoading } = useQuery<PlaybackHistory[]>({
    queryKey: ["/api/history"],
    enabled: isOpen,
  });

  const handleClearHistory = async () => {
    try {
      await apiRequest("DELETE", "/api/history");
      queryClient.invalidateQueries({ queryKey: ["/api/history"] });
    } catch (error) {
      console.error("Failed to clear history:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-30 bg-black/95 rounded-md flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-lava-400" />
          <span className="text-sm font-mono text-lava-400 tracking-wide">RECENTLY PLAYED</span>
        </div>
        <div className="flex items-center gap-1">
          {history.length > 0 && (
            <Button
              size="icon"
              variant="ghost"
              onClick={handleClearHistory}
              className="w-7 h-7"
              data-testid="button-clear-history"
            >
              <Trash2 className="w-3.5 h-3.5 text-zinc-500" />
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            className="w-7 h-7"
            data-testid="button-close-history"
          >
            <X className="w-4 h-4 text-zinc-400" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-5 h-5 border-2 border-lava-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-zinc-500">
            <History className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-xs font-mono">No playback history yet</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {history.map((entry) => (
              <button
                key={entry.id}
                onClick={() => onSelectHistory?.(entry)}
                className="w-full flex items-center gap-3 p-2 rounded-md hover-elevate active-elevate-2 transition-colors text-left"
                data-testid={`history-entry-${entry.id}`}
              >
                <div className="w-10 h-10 rounded bg-zinc-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {entry.logoUrl ? (
                    <img
                      src={entry.logoUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : entry.trackId ? (
                    <Music className="w-5 h-5 text-zinc-500" />
                  ) : (
                    <Radio className="w-5 h-5 text-zinc-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-200 truncate font-medium">
                    {entry.trackTitle || entry.stationName}
                  </p>
                  <p className="text-xs text-zinc-500 truncate">
                    {entry.trackArtist || (entry.trackTitle ? entry.stationName : entry.userStationId ? "User Station" : "Radio Station")}
                  </p>
                </div>
                <div className="text-[10px] text-zinc-600 font-mono whitespace-nowrap">
                  {formatDistanceToNow(new Date(entry.playedAt), { addSuffix: true })}
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
