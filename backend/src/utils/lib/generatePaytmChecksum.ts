import PaytmChecksum from "paytmchecksum";

export const generatePaytmChecksum = async (body: any) => {
  if (!process.env.PAYTM_KEY) {
    throw new Error("PAYTM_KEY is not set");
  }

  const checksum = await PaytmChecksum.generateSignature(
    JSON.stringify(body),
    process.env.PAYTM_KEY
  );

  const verifyChecksum = PaytmChecksum.verifySignature(
    JSON.stringify(body),
    process.env.PAYTM_KEY,
    checksum
  );

  if (!verifyChecksum) {
    console.error("Checksum verification failed");
    return null;
  }

  return checksum;
};
