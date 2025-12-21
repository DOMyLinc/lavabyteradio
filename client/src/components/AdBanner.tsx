import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import type { AdCampaign } from "@shared/schema";

export function AdBanner() {
  const { data: campaigns = [] } = useQuery<AdCampaign[]>({
    queryKey: ["/api/ad-campaigns/active"],
    refetchInterval: 60000,
  });
  
  const [currentCampaign, setCurrentCampaign] = useState<AdCampaign | null>(null);
  
  const selectRandomCampaign = useCallback(() => {
    if (campaigns.length === 0) {
      setCurrentCampaign(null);
      return;
    }
    
    const totalWeight = campaigns.reduce((sum, c) => sum + c.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const campaign of campaigns) {
      random -= campaign.weight;
      if (random <= 0) {
        setCurrentCampaign(campaign);
        return;
      }
    }
    
    setCurrentCampaign(campaigns[0]);
  }, [campaigns]);
  
  useEffect(() => {
    selectRandomCampaign();
  }, [selectRandomCampaign]);
  
  useEffect(() => {
    if (campaigns.length === 0) return;
    
    const interval = setInterval(() => {
      selectRandomCampaign();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [campaigns, selectRandomCampaign]);
  
  if (!currentCampaign) return null;
  
  return (
    <div className="w-full max-w-3xl mx-auto mb-4" data-testid="ad-banner">
      <a
        href={currentCampaign.targetUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block relative rounded-md overflow-hidden border border-border/50 hover-elevate group"
        data-testid={`ad-campaign-${currentCampaign.id}`}
      >
        <img
          src={currentCampaign.imageUrl}
          alt={currentCampaign.name}
          className="w-full h-auto object-cover"
          style={{ maxHeight: "120px" }}
        />
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-1 px-2 py-1 rounded bg-black/70 text-xs text-white">
            <ExternalLink className="w-3 h-3" />
            <span>Visit</span>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-1">
          <span className="text-[10px] uppercase tracking-wider text-white/60">Sponsored</span>
        </div>
      </a>
    </div>
  );
}
