import type { Schema } from "mongoose";
import { BRANDS, type Brand } from "../../constants/brands";

export interface BrandPluginOptions {
  /** One brand, always. A document may never carry the other one. */
  fixed?: Brand;
  /** Stamped when a write names no brand. */
  defaultBrand?: Brand;
  /** Works the brand out from the document itself when a write names none. */
  derive?: (doc: any) => Brand | Promise<Brand>;
}

export const brandPlugin = (schema: Schema, options: BrandPluginOptions = {}) => {
  const fallback = options.fixed ?? options.defaultBrand;
  const derive = options.derive;

  schema.add({
    brand: {
      type: String,
      // A derived brand is set by an async hook that `validateSync()` never runs,
      // so requiring it would fail every synchronous check. The hook always sets
      // it or throws, and `brand-zero-count` catches any document that escaped.
      required: !derive,
      enum: options.fixed ? [options.fixed] : [...BRANDS],
      ...(fallback ? { default: fallback } : {}),
    },
  });

  if (derive) {
    schema.pre("validate", async function (this: any) {
      if (!this.get("brand")) {
        this.set("brand", await derive(this));
      }
    });
  }
};
