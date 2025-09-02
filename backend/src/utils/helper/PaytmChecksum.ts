import PaytmChecksum from "paytmchecksum";
import dotenv from "dotenv";
dotenv.config();

export const generatePaytmChecksum = async (
  body: any,
) => {

  const checksum = await PaytmChecksum.generateSignature(
    JSON.stringify(body),
    process.env.PAYTM_KEY!
  );

  const verifyChecksum = PaytmChecksum.verifySignature(
    JSON.stringify(body),
    process.env.PAYTM_KEY!,
    checksum
  );

  if (!verifyChecksum) {
    console.error("Checksum verification failed");
    return null;
  }

  return checksum;
};
