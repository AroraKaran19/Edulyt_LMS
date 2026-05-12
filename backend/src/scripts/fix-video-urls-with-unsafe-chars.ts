/**
 * Find every video Content whose stored videoUrl contains characters that
 * are unsafe in a URL path (`?`, raw spaces, `#`, `&`, etc) and rewrite the
 * URL so each path segment is percent-encoded.
 *
 *   Original key:    courses/.../content/What is a Merge?-Combining Tables/<uuid>.mp4
 *   Original URL:    https://…/content/What is a Merge?-Combining Tables/<uuid>.mp4
 *                                                     ^ browser truncates here
 *   Fixed URL:       https://…/content/What%20is%20a%20Merge%3F-Combining%20Tables/<uuid>.mp4
 *
 * The S3 object is not moved — only the stored URL changes. The object key
 * already contains the unsafe character literally, and S3 accepts it; the
 * problem is purely how that key is expressed in a URL.
 *
 * Run from backend root:
 *   # preview:
 *   npx ts-node src/scripts/fix-video-urls-with-unsafe-chars.ts
 *   # apply:
 *   npx ts-node src/scripts/fix-video-urls-with-unsafe-chars.ts --apply
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { ContentModel } from "../models/course-module.schema";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const APPLY = process.argv.includes("--apply");

/**
 * Percent-encode each path segment of an absolute URL using plain string
 * splitting. We deliberately AVOID `new URL()` here — Node's WHATWG parser
 * treats `?` as the query delimiter, which would strip the literal `?` we
 * need to keep as part of the S3 key. Spaces in pathnames also confuse the
 * parser. String ops handle malformed S3 URLs deterministically.
 */
function reEncodeUrlPath(rawUrl: string): string | null {
  // Split off "https://host" so we never touch the scheme or host.
  const match = rawUrl.match(/^(https?:\/\/[^/]+)(\/.*)$/i);
  if (!match) return null;
  const [, hostPart, pathPart] = match;
  const segments = pathPart.split("/").map((seg, i) => {
    if (i === 0 && seg === "") return seg; // leading slash → empty first segment
    try {
      return encodeURIComponent(decodeURIComponent(seg));
    } catch {
      return encodeURIComponent(seg);
    }
  });
  return `${hostPart}${segments.join("/")}`;
}

// Only `?` and `#` actually break URL routing — `?` starts the query string,
// `#` starts the fragment, both cause the browser to truncate the path before
// reaching S3. Spaces in URL paths work fine in practice (clients send them
// as `%20`) so we deliberately don't touch URLs whose only "issue" is spaces.
const UNSAFE_REGEX = /[?#]/;

async function main() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) throw new Error("MONGODB_URI not set");
  await mongoose.connect(mongoUri);
  console.log(`Mode: ${APPLY ? "APPLY" : "DRY RUN"}`);
  console.log(`Connected: ${mongoose.connection.name}\n`);

  // Only video discriminator rows have `sources`. We use the base ContentModel
  // and filter on the field's existence so the query covers all video docs.
  const candidates = await ContentModel.find({
    type: "video",
    "sources.videoUrl": { $regex: UNSAFE_REGEX },
  }).lean();

  console.log(`Video contents with unsafe-char videoUrl: ${candidates.length}`);
  if (candidates.length === 0) {
    await mongoose.disconnect();
    return;
  }

  let updated = 0;
  let processed = 0;
  for (const c of candidates) {
    processed += 1;
    if (processed % 25 === 0) {
      console.log(`  …processed ${processed}/${candidates.length}`);
    }
    const cc = c as Record<string, unknown>;
    const sources = (cc.sources ?? []) as Array<{
      quality?: string;
      videoUrl?: string;
    }>;
    const fixedSources = sources.map((s) => {
      if (!s.videoUrl || !UNSAFE_REGEX.test(s.videoUrl)) return s;
      const fixed = reEncodeUrlPath(s.videoUrl);
      if (!fixed) {
        console.warn(`  ! Could not parse URL for ${cc._id}: ${s.videoUrl}`);
        return s;
      }
      return { ...s, videoUrl: fixed };
    });

    const changed = fixedSources.some(
      (s, i) => s.videoUrl !== sources[i].videoUrl,
    );
    if (!changed) continue;

    console.log("─".repeat(70));
    console.log(`Content: ${cc._id}  ("${cc.title}")`);
    for (let i = 0; i < sources.length; i++) {
      if (sources[i].videoUrl !== fixedSources[i].videoUrl) {
        console.log(`  before: ${sources[i].videoUrl}`);
        console.log(`  after : ${fixedSources[i].videoUrl}`);
      }
    }

    if (APPLY) {
      await ContentModel.updateOne(
        { _id: cc._id },
        { $set: { sources: fixedSources } },
      );
      updated += 1;
    }
  }

  if (APPLY) console.log(`\nUpdated: ${updated}`);
  else console.log("\nDry run complete. Re-run with --apply to write.");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
