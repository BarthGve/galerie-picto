import type { Pictogram } from "@/lib/types";
import { usePictogramUrl } from "@/hooks/usePictogramUrl";

interface DarkAwarePictoProps {
  pictogram: Pictogram;
  className?: string;
  width?: number;
  height?: number;
  alt?: string;
}

export function DarkAwarePicto({
  pictogram,
  className,
  width = 64,
  height = 64,
  alt,
}: DarkAwarePictoProps) {
  const url = usePictogramUrl(pictogram);

  return (
    <img
      src={url}
      alt={alt ?? pictogram.name ?? pictogram.filename.replace(/\.svg$/i, "")}
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
      className={className}
    />
  );
}
