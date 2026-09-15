import { brandEnvSuffix, type Brand } from "../../constants/brands";

export const gatewayEnvName = (key: string, brand: Brand): string =>
  `${key}_${brandEnvSuffix(brand)}`;

export const readGatewayEnv = (key: string, brand: Brand): string | undefined =>
  process.env[gatewayEnvName(key, brand)]?.trim() || undefined;
