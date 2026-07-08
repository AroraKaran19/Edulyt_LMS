import { User } from "./user";

declare global {
  namespace Express {
    interface Request {
      user?: User;
      /** Refresh-token family (session id) carried in the current access token. */
      currentFamily?: string;
    }
  }
}
