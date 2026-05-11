import { useQuery } from "@tanstack/react-query";
import { resolveAssetUrl } from "../catalog";

export type SvgReference = {
  viewBox: { width: number; height: number };
  paths: string[];
};

const VIEWBOX_RE = /viewBox\s*=\s*"([^"]+)"/i;
const PATH_D_RE = /<path[^>]*\sd\s*=\s*"([^"]+)"/gi;

export function parseSvgReference(svgText: string): SvgReference {
  const vbMatch = svgText.match(VIEWBOX_RE);
  let width = 109;
  let height = 109;
  if (vbMatch) {
    const parts = vbMatch[1].trim().split(/[\s,]+/).map(Number);
    if (parts.length === 4 && parts.every((n) => Number.isFinite(n))) {
      width = parts[2];
      height = parts[3];
    }
  }

  const paths: string[] = [];
  let match: RegExpExecArray | null;
  PATH_D_RE.lastIndex = 0;
  while ((match = PATH_D_RE.exec(svgText)) !== null) {
    paths.push(match[1].trim());
  }

  return { viewBox: { width, height }, paths };
}

export function useSvgReference(svgUrl: string | null | undefined) {
  const url = resolveAssetUrl(svgUrl);
  return useQuery({
    queryKey: ["svg-ref", url],
    enabled: Boolean(url),
    staleTime: 60 * 60 * 1000,
    queryFn: async () => {
      if (!url) throw new Error("URL kosong");
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Gagal load pola stroke (${response.status})`);
      const text = await response.text();
      return parseSvgReference(text);
    }
  });
}
