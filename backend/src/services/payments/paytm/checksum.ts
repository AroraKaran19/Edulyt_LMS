import PaytmChecksum from "paytmchecksum";

export const generatePaytmChecksum = async (body: any, key: string) => {
  const checksum = await PaytmChecksum.generateSignature(JSON.stringify(body), key);

  const verifyChecksum = PaytmChecksum.verifySignature(JSON.stringify(body), key, checksum);

  if (!verifyChecksum) {
    console.error("Checksum verification failed");
    return null;
  }

  return checksum;
};
