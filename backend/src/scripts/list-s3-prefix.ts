/**
 * List actual S3 object keys under a given prefix so we can compare what's
 * really stored in S3 vs what the DB thinks the URL should be.
 *
 *   npx ts-node src/scripts/list-s3-prefix.ts "courses/advanced_data_manipulation_in_sas__base_sas___2_/content/"
 */

import dotenv from "dotenv";
import path from "path";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const prefix = process.argv[2] || "courses/advanced_data_manipulation_in_sas__base_sas___2_/content/";

async function main() {
  const { getS3Client, getBucketName } = await import("../config/s3");
  const s3 = await getS3Client();
  const bucket = getBucketName();

  console.log(`Bucket: ${bucket}`);
  console.log(`Prefix: "${prefix}"\n`);

  let continuationToken: string | undefined;
  let total = 0;
  do {
    const out = await s3.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
        MaxKeys: 1000,
      }),
    );
    const contents = out.Contents ?? [];
    for (const obj of contents) {
      total += 1;
      console.log(`  ${obj.Key}`);
    }
    continuationToken = out.IsTruncated ? out.NextContinuationToken : undefined;
  } while (continuationToken);

  console.log(`\nTotal objects under prefix: ${total}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
