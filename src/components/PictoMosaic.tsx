import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { DarkAwarePicto } from "@/components/DarkAwarePicto";
import type { Pictogram } from "@/lib/types";

interface PictoMosaicProps {
  pictograms: Pictogram[];
  loading?: boolean;
}

const COLUMN_COUNT = 5;
const ITEMS_PER_COLUMN = 8;

export function PictoMosaic({ pictograms, loading }: PictoMosaicProps) {
  const columns = useMemo(() => {
    if (!pictograms.length) return [];
    const cols: Pictogram[][] = [];
    for (let c = 0; c < COLUMN_COUNT; c++) {
      const col: Pictogram[] = [];
      for (let i = 0; i < ITEMS_PER_COLUMN; i++) {
        col.push(pictograms[(c * ITEMS_PER_COLUMN + i) % pictograms.length]);
      }
      // Duplicate for seamless loop
      cols.push([...col, ...col]);
    }
    return cols;
  }, [pictograms]);

  if (loading) {
    return (
      <div className="grid grid-cols-5 gap-3 h-[420px] overflow-hidden">
        {Array.from({ length: 15 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="relative h-[420px] overflow-hidden select-none pointer-events-none">
      <div
        className="flex gap-3 absolute inset-0"
        style={{
          transform: "rotate(-12deg) scale(1.4)",
          transformOrigin: "center center",
        }}
      >
        {columns.map((col, colIdx) => (
          <div
            key={colIdx}
            className="flex flex-col gap-3 shrink-0 w-[100px]"
            style={{
              animation: `mosaic-scroll-${colIdx % 2 === 0 ? "up" : "down"} ${28 + colIdx * 4}s linear infinite`,
            }}
          >
            {col.map((picto, i) => (
              <div
                key={`${colIdx}-${i}`}
                className="w-[100px] h-[100px] shrink-0 rounded-xl bg-white/10 dark:bg-white/5 backdrop-blur-sm border border-white/20 dark:border-white/10 flex items-center justify-center p-3"
                style={{
                  perspective: "600px",
                  boxShadow:
                    "0 4px 16px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.2)",
                }}
              >
                <DarkAwarePicto
                  pictogram={picto}
                  className="w-16 h-16 object-contain drop-shadow-sm"
                />
              </div>
            ))}
          </div>
        ))}
      </div>
      {/* Fade edges */}
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-background to-transparent z-10" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent z-10" />
      <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-background to-transparent z-10" />
      <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent z-10" />
    </div>
  );
}
