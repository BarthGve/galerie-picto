import { useEffect, useRef, useState } from "react";
import { Download, Copy, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Pictogram } from "@/lib/types";
import { downloadSvg, downloadSvgAsPng, fetchSvgText } from "@/lib/svg-to-png";
import { toast } from "sonner";

interface PictoModalProps {
  pictogram: Pictogram;
  isOpen: boolean;
  onClose: () => void;
}

export function PictoModal({ pictogram, isOpen, onClose }: PictoModalProps) {
  const [copied, setCopied] = useState(false);
  const [pngSize, setPngSize] = useState(512);
  const svgCacheRef = useRef<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      svgCacheRef.current = null;
      fetchSvgText(pictogram.url).then((text) => {
        svgCacheRef.current = text;
      });
    }
  }, [isOpen, pictogram.url]);

  const handleCopy = async () => {
    if (!svgCacheRef.current) {
      toast.error("SVG en cours de chargement, reessayez");
      return;
    }
    try {
      await navigator.clipboard.writeText(svgCacheRef.current);
      setCopied(true);
      toast.success("Code SVG copie");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Impossible de copier le code SVG");
    }
  };

  const handleDownloadSvg = async () => {
    try {
      await downloadSvg(pictogram.url, pictogram.filename);
    } catch (error) {
      console.error("Failed to download SVG:", error);
    }
  };

  const handleDownloadPng = async () => {
    try {
      await downloadSvgAsPng(pictogram.url, pictogram.filename, pngSize);
    } catch (error) {
      console.error("Failed to download PNG:", error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{pictogram.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Preview */}
          <div className="aspect-square max-h-96 flex items-center justify-center bg-muted/30 rounded-lg p-8">
            <img
              src={pictogram.url}
              alt={pictogram.name}
              className="max-w-full max-h-full object-contain"
            />
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Nom du fichier :</span>
              <p className="font-medium">{pictogram.filename}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Taille :</span>
              <p className="font-medium">{formatFileSize(pictogram.size)}</p>
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground">
                Dernière modification :
              </span>
              <p className="font-medium">
                {formatDate(pictogram.lastModified)}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <div className="flex gap-2">
              <Button onClick={handleDownloadSvg} className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Télécharger SVG
              </Button>
              <Button onClick={handleCopy} variant="outline" className="flex-1">
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2 text-green-600" />
                    Copié !
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copier le code
                  </>
                )}
              </Button>
            </div>

            <div className="flex gap-2">
              <select
                value={pngSize}
                onChange={(e) => setPngSize(Number(e.target.value))}
                className="flex h-10 w-32 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value={128}>128px</option>
                <option value={256}>256px</option>
                <option value={512}>512px</option>
                <option value={1024}>1024px</option>
              </select>
              <Button
                onClick={handleDownloadPng}
                variant="secondary"
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Télécharger PNG ({pngSize}px)
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
