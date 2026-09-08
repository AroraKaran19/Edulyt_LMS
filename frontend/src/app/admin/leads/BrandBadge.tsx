/**
 * Which site a lead came from. Rows written before two brands existed carry no
 * brand, and those are all Airkrit — so an absent value reads as Airkrit
 * rather than as unknown.
 */
const BrandBadge = ({ brand }: { brand?: "airkrit" | "edulyt" }) => {
  const isEdulyt = brand === "edulyt";

  return (
    <span
      className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase ${
        isEdulyt
          ? "bg-orange-100 text-orange-800"
          : "bg-slate-100 text-slate-600"
      }`}
    >
      {isEdulyt ? "Edulyt" : "Airkrit"}
    </span>
  );
};

export default BrandBadge;
