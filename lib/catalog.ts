import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { api, API_BASE } from "./api";

export type AksaraCatalogEntry = {
  id: string;
  name: string;
  glyph: string;
  latin: string | null;
  category: string;
  order: number;
  is_premium: boolean;
  svg_url: string | null;
  image_url: string | null;
  target_stroke_count: number;
  audio_url: string | null;
  notes: string | null;
};

type CatalogResponse = {
  aksara: AksaraCatalogEntry[];
};

const CATALOG_KEY = ["catalog", "aksara"] as const;
const STALE_MS = 5 * 60 * 1000;

export function useAksaraCatalog() {
  return useQuery({
    queryKey: CATALOG_KEY,
    queryFn: () => api<CatalogResponse>("/catalog/aksara", { auth: false }),
    staleTime: STALE_MS,
    gcTime: STALE_MS * 6
  });
}

export function useGlyphMap(): Map<string, AksaraCatalogEntry> {
  const { data } = useAksaraCatalog();
  return useMemo(() => {
    const map = new Map<string, AksaraCatalogEntry>();
    for (const entry of data?.aksara ?? []) {
      if (entry.glyph) map.set(entry.glyph, entry);
    }
    return map;
  }, [data]);
}

export function resolveAssetUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
}
