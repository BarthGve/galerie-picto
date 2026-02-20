import { useEffect } from "react";
import { useTheme } from "@/hooks/use-theme";
import { prefetchDarkSvgs } from "@/lib/svg-dark-transform";

/**
 * Déclenche un prefetch batch de tous les SVGs dark pour les URLs données.
 * Appelé par PictoGrid avec les URLs des pictos visibles.
 * Remplit le darkSvgCache avant que les PictoCard ne se montent,
 * ce qui permet à usePictogramUrl de trouver le cache déjà prêt → pas de flash light.
 */
export function useDarkPrefetch(urls: string[]): void {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  useEffect(() => {
    if (!isDark || urls.length === 0) return;
    prefetchDarkSvgs(urls);
  }, [isDark, urls]);
}
