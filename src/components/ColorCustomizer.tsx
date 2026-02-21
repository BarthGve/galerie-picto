import { useState, useMemo, useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { parseSvgColors, replaceSvgColors } from "@/lib/svg-color-parser";

const DSFR_COLORS = [
  { label: "Blanc", hex: "#ffffff" },
  { label: "Gris clair", hex: "#929292" },
  { label: "Noir", hex: "#161616" },
  { label: "Bleu France", hex: "#6a6af4" },
  { label: "Rouge Marianne", hex: "#e1000f" },
  { label: "Tilleul verveine", hex: "#b7a73f" },
  { label: "Bourgeon", hex: "#68a532" },
  { label: "Émeraude", hex: "#00a95f" },
  { label: "Menthe", hex: "#009081" },
  { label: "Archipel", hex: "#009099" },
  { label: "Écume", hex: "#465f9d" },
  { label: "Cumulus", hex: "#417dc4" },
  { label: "Glycine", hex: "#a558a0" },
  { label: "Macaron", hex: "#e18b76" },
  { label: "Tuile", hex: "#ce614a" },
  { label: "Tournesol", hex: "#c8aa39" },
  { label: "Moutarde", hex: "#c3992a" },
  { label: "Terre battue", hex: "#e4794a" },
  { label: "Café crème", hex: "#d1b781" },
  { label: "Caramel", hex: "#c08c65" },
  { label: "Opéra", hex: "#bd987a" },
  { label: "Gris galet", hex: "#aea397" },
];

interface ColorCustomizerProps {
  svgText: string;
  onModifiedSvgChange: (modifiedSvg: string | null) => void;
}

export function ColorCustomizer({ svgText, onModifiedSvgChange }: ColorCustomizerProps) {
  const { originalColors } = parseSvgColors(svgText);
  const [colorMap, setColorMap] = useState<Record<string, string>>(() =>
    Object.fromEntries(originalColors.map((c) => [c, c])),
  );

  const hasChanges = Object.entries(colorMap).some(([k, v]) => k !== v);

  const modifiedSvg = useMemo(
    () => (hasChanges ? replaceSvgColors(svgText, colorMap) : null),
    [svgText, colorMap, hasChanges],
  );

  useEffect(() => {
    onModifiedSvgChange(modifiedSvg);
  }, [modifiedSvg, onModifiedSvgChange]);

  const handleColorChange = (original: string, newColor: string) => {
    setColorMap((prev) => ({ ...prev, [original]: newColor }));
  };

  const handleReset = () => {
    setColorMap(Object.fromEntries(originalColors.map((c) => [c, c])));
  };

  if (originalColors.length === 0) {
    return (
      <div className="text-center py-2 text-xs text-muted-foreground">
        Aucune couleur détectée dans ce pictogramme.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Remplacer les couleurs
        </span>
        {hasChanges && (
          <Button variant="ghost" size="sm" onClick={handleReset} className="h-6 text-xs px-2">
            <RotateCcw className="h-3 w-3 mr-1" />
            Reset
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {originalColors.map((color) => {
          const current = colorMap[color] ?? color;
          const isChanged = current !== color;
          return (
            <div key={color} className="space-y-2">
              {/* Color header */}
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-[4px] border border-border shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="text-[10px] font-mono text-muted-foreground">{color}</span>
                {isChanged && (
                  <>
                    <span className="text-[10px] text-muted-foreground">→</span>
                    <div
                      className="w-4 h-4 rounded-[4px] border border-border shrink-0"
                      style={{ backgroundColor: current }}
                    />
                    <span className="text-[10px] font-mono text-muted-foreground">{current}</span>
                    <button
                      type="button"
                      title="Remettre la couleur d'origine"
                      onClick={() => handleColorChange(color, color)}
                      className="ml-auto text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                    >
                      ↺
                    </button>
                  </>
                )}
              </div>

              {/* DSFR palette */}
              <div className="flex flex-wrap gap-1.5">
                {DSFR_COLORS.map((c) => {
                  const isSelected = current === c.hex;
                  return (
                    <button
                      key={c.hex}
                      type="button"
                      title={c.label}
                      onClick={() => handleColorChange(color, c.hex)}
                      className="w-6 h-6 rounded-[4px] border transition-transform hover:scale-110"
                      style={{
                        backgroundColor: c.hex,
                        borderColor: isSelected
                          ? "var(--primary)"
                          : "var(--border)",
                        boxShadow: isSelected
                          ? "0 0 0 2px var(--primary)"
                          : undefined,
                      }}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
