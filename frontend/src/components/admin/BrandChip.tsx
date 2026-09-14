import { BRAND_LABEL, isBrand } from "@/constants/brands";

const STYLES = {
  airkrit: "bg-orange-50 text-orange-700 border-orange-200",
  edulyt: "bg-indigo-50 text-indigo-700 border-indigo-200",
} as const;

const BrandChip = ({ brand }: { brand?: unknown }) => {
  if (!isBrand(brand)) return null;
  return (
    <span
      className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full border ${STYLES[brand]}`}
    >
      {BRAND_LABEL[brand]}
    </span>
  );
};

export default BrandChip;
