import type { Pictogram } from "@/lib/types";
import { usePictogramUrl } from "@/hooks/usePictogramUrl";

interface DarkAwarePictoProps {
  pictogram: Pictogram;
  className?: string;
  width?: number;
  height?: number;
}

export function DarkAwarePicto({
  pictogram,
  className,
  width = 64,
  height = 64,
}: DarkAwarePictoProps) {
  const url = usePictogramUrl(pictogram);

  return (
    <img
      src={url}
      alt=""
      width={width}
      height={height}
      decoding="async"
      className={className}
    />
  );
}
