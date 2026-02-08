import type { Pictogram } from "@/lib/types";
import { PictoCard } from "./PictoCard";

interface PictoGridProps {
  pictograms: Pictogram[];
}

export function PictoGrid({ pictograms }: PictoGridProps) {
  if (pictograms.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-lg text-muted-foreground">
          Aucun pictogramme trouvé
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      {pictograms.map((pictogram) => (
        <PictoCard key={pictogram.id} pictogram={pictogram} />
      ))}
    </div>
  );
}
