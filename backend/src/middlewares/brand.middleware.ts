import { NextFunction, Request, Response } from "express";
import { brandFromHeaders } from "../lib/brandRequest";

export const resolveBrand = (req: Request, _res: Response, next: NextFunction) => {
  req.brand = brandFromHeaders(req.headers);
  next();
};
