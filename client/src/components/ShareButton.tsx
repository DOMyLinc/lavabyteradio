import { useState } from "react";
import { Share2, Copy, Check, Twitter, Facebook, Link2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { UnifiedStation } from "@/pages/RadioPlayer";

interface ShareButtonProps {
  station: UnifiedStation | null;
  disabled?: boolean;
  compact?: boolean;
}

export function ShareButton({ station, disabled = false, compact = false }: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const shareUrl = station ? `${window.location.origin}?station=${station.id}&type=${station.type}` : window.location.href;
  const shareText = station ? `Listen to ${station.name} on Lava Bytes Radio!` : "Check out Lava Bytes Radio!";

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Lava Bytes Radio",
          text: shareText,
          url: shareUrl,
        });
        setIsOpen(false);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Share failed:", error);
        }
      }
    } else {
      setIsOpen(true);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: "Link Copied",
        description: "Share link copied to clipboard!",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Copy failed:", error);
      toast({
        title: "Copy Failed",
        description: "Could not copy link to clipboard.",
        variant: "destructive",
      });
    }
  };

  const handleTwitterShare = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, "_blank", "noopener,noreferrer");
    setIsOpen(false);
  };

  const handleFacebookShare = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(facebookUrl, "_blank", "noopener,noreferrer");
    setIsOpen(false);
  };

  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={handleNativeShare}
          disabled={disabled}
          className={`
            flex items-center gap-1.5 px-2 py-1 rounded
            text-[10px] font-mono text-zinc-400 uppercase tracking-wider
            ${!disabled ? "hover:bg-zinc-800/50 hover:text-zinc-300" : "opacity-50 cursor-not-allowed"}
            transition-colors
          `}
          data-testid="button-share"
        >
          <Share2 className="w-3 h-3" />
          Share
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute bottom-full left-0 mb-2 z-50 bg-zinc-900 border border-zinc-700 rounded-md shadow-lg p-2 min-w-[140px]">
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 rounded transition-colors"
                data-testid="share-copy-link"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied!" : "Copy Link"}
              </button>
              <button
                onClick={handleTwitterShare}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 rounded transition-colors"
                data-testid="share-twitter"
              >
                <Twitter className="w-3.5 h-3.5" />
                Twitter / X
              </button>
              <button
                onClick={handleFacebookShare}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 rounded transition-colors"
                data-testid="share-facebook"
              >
                <Facebook className="w-3.5 h-3.5" />
                Facebook
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={handleNativeShare}
        disabled={disabled}
        className={`
          w-9 h-9 rounded-md flex items-center justify-center
          bg-gradient-to-b from-zinc-700 to-zinc-900
          border border-zinc-600
          shadow-[0_2px_3px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)]
          transition-all duration-150
          ${!disabled ? "active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]" : "opacity-50 cursor-not-allowed"}
        `}
        data-testid="button-share"
        aria-label="Share station"
      >
        <Share2 className="w-4 h-4 text-zinc-300" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full right-0 mt-2 z-50 bg-zinc-900 border border-zinc-700 rounded-md shadow-lg p-2 min-w-[160px]">
            <div className="px-3 py-1.5 border-b border-zinc-700 mb-1">
              <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">Share Station</p>
            </div>
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-2 w-full px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 rounded transition-colors"
              data-testid="share-copy-link"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Link2 className="w-3.5 h-3.5" />}
              {copied ? "Copied!" : "Copy Link"}
            </button>
            <button
              onClick={handleTwitterShare}
              className="flex items-center gap-2 w-full px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 rounded transition-colors"
              data-testid="share-twitter"
            >
              <Twitter className="w-3.5 h-3.5" />
              Twitter / X
            </button>
            <button
              onClick={handleFacebookShare}
              className="flex items-center gap-2 w-full px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 rounded transition-colors"
              data-testid="share-facebook"
            >
              <Facebook className="w-3.5 h-3.5" />
              Facebook
            </button>
          </div>
        </>
      )}
    </div>
  );
}
