import { useRef, useState } from "react";
import { Copy, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Pictogram } from "@/lib/types";
import { fetchSvgText, copyTextToClipboard } from "@/lib/svg-to-png";
import { PictoModal } from "./PictoModal";
import { toast } from "sonner";

interface PictoCardProps {
  pictogram: Pictogram;
}

export function PictoCard({ pictogram }: PictoCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const svgCacheRef = useRef<string | null>(null);

  const prefetchSvg = () => {
    if (!svgCacheRef.current) {
      fetchSvgText(pictogram.url).then((text) => {
        svgCacheRef.current = text;
      });
    }
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!svgCacheRef.current) {
      toast.error("SVG en cours de chargement, reessayez");
      return;
    }
    const success = copyTextToClipboard(svgCacheRef.current);
    if (success) {
      setCopied(true);
      toast.success("Code SVG copie");
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error("Impossible de copier le code SVG");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <>
      <Card
        className="group relative overflow-hidden transition-all hover:shadow-lg cursor-pointer"
        onClick={() => setIsModalOpen(true)}
        onMouseEnter={prefetchSvg}
      >
        <div className="aspect-square p-6 flex items-center justify-center bg-muted/30">
          <img
            src={pictogram.url}
            alt={pictogram.name}
            className="max-w-full max-h-full object-contain transition-transform group-hover:scale-110"
          />
        </div>

        {/* Quick actions overlay */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          <Button
            size="sm"
            variant="secondary"
            className="h-8 w-8 p-0"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="p-4 border-t">
          <h3 className="font-semibold text-sm truncate mb-2">
            {pictogram.name}
          </h3>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <Badge variant="secondary" className="text-xs">
              {formatFileSize(pictogram.size)}
            </Badge>
            <span>SVG</span>
          </div>
        </div>
      </Card>

      <PictoModal
        pictogram={pictogram}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
