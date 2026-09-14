import Image from "next/image";
import { BRAND_LABEL, isBrand, type Brand } from "@/constants/brands";

/**
 * Wordmarks rasterised to 64px tall — 4x the rendered height, so they stay
 * sharp on a 3x display. The source SVGs are traced outlines (295KB the pair);
 * as WebP they are 9KB and cost the browser no path rasterisation per row.
 */
const MARK: Record<Brand, { src: string; width: number; height: number }> = {
  airkrit: { src: "/brands/airkrit.webp", width: 224, height: 64 },
  edulyt: { src: "/brands/edulyt.webp", width: 233, height: 64 },
};

const BrandMark = ({ brand }: { brand?: unknown }) => {
  if (!isBrand(brand)) return null;
  const mark = MARK[brand];

  return (
    <Image
      src={mark.src}
      alt={BRAND_LABEL[brand]}
      title={BRAND_LABEL[brand]}
      width={mark.width}
      height={mark.height}
      className="h-4 w-auto object-contain select-none"
      unoptimized
      draggable={false}
    />
  );
};

export default BrandMark;
