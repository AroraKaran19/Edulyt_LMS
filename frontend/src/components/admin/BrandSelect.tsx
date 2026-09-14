import { BRANDS, BRAND_LABEL, type BrandFilter } from "@/constants/brands";

interface BrandSelectProps {
  value: BrandFilter | "";
  onChange: (value: BrandFilter) => void;
  /** Adds "All brands", for list filters. Pickers leave it off. */
  includeAll?: boolean;
  label?: string;
  required?: boolean;
  /** Shown as a disabled first option while nothing is chosen. */
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const BrandSelect = ({
  value,
  onChange,
  includeAll = false,
  label = "Brand",
  required = false,
  placeholder,
  disabled = false,
  className = "",
}: BrandSelectProps) => (
  <div className={className}>
    {label && (
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
    )}
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as BrandFilter)}
      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-50 transition-all"
    >
      {placeholder !== undefined && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {includeAll && <option value="all">All brands</option>}
      {BRANDS.map((brand) => (
        <option key={brand} value={brand}>
          {BRAND_LABEL[brand]}
        </option>
      ))}
    </select>
  </div>
);

export default BrandSelect;
