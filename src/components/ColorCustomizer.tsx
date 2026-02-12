import { useState, useMemo, useEffect } from "react";
import { ArrowRight, RotateCcw } from "lucide-react";
import { parseColor } from "react-aria-components";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ColorPicker,
  ColorArea,
  ColorThumb,
  ColorSlider,
  SliderTrack,
  ColorSwatch,
} from "@/components/ui/color";
import { parseSvgColors, replaceSvgColors } from "@/lib/svg-color-parser";

interface ColorCustomizerProps {
  svgText: string;
  onModifiedSvgChange: (modifiedSvg: string | null) => void;
}

function InlineColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (hex: string) => void;
}) {
  const color = useMemo(() => {
    try {
      return parseColor(value).toFormat("hsl");
    } catch {
      return parseColor("#000000").toFormat("hsl");
    }
  }, [value]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="w-8 h-8 rounded-md border border-input shrink-0 cursor-pointer transition-shadow hover:ring-2 hover:ring-ring hover:ring-offset-1"
          style={{ backgroundColor: value }}
        />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <ColorPicker
          value={color}
          onChange={(c) => onChange(c.toString("hex"))}
        >
          <div className="flex flex-col gap-3">
            <ColorArea
              xChannel="saturation"
              yChannel="lightness"
              className="!w-48 !h-48"
            >
              <ColorThumb />
            </ColorArea>
            <ColorSlider channel="hue">
              <SliderTrack className="!w-48">
                <ColorThumb />
              </SliderTrack>
            </ColorSlider>
            <div className="flex items-center justify-between">
              <ColorSwatch className="size-6 rounded-md border" />
              <span className="text-xs font-mono text-muted-foreground">
                {value}
              </span>
            </div>
          </div>
        </ColorPicker>
      </PopoverContent>
    </Popover>
  );
}

export function ColorCustomizer({
  svgText,
  onModifiedSvgChange,
}: ColorCustomizerProps) {
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
        Aucune couleur détectée.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          Couleurs
        </span>
        {hasChanges && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-6 text-xs px-2"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Reset
          </Button>
        )}
      </div>

      <div className="space-y-1.5">
        {originalColors.map((color) => (
          <div key={color} className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded border shrink-0"
              style={{ backgroundColor: color }}
            />
            <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
            <InlineColorPicker
              value={colorMap[color] || color}
              onChange={(hex) => handleColorChange(color, hex)}
            />
            <Badge
              variant="outline"
              className="font-mono text-[10px] px-1.5 py-0"
            >
              {color}
            </Badge>
            {colorMap[color] !== color && (
              <Badge
                variant="secondary"
                className="font-mono text-[10px] px-1.5 py-0"
              >
                {colorMap[color]}
              </Badge>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
