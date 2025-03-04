import { Request, Response, NextFunction } from "express";

export const verifyServiceAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const serviceAuthHeader = req.headers["service-auth"];
  const validServiceSecret =
    process.env.INTER_SERVICE_SECRET || "your-inter-service-secret";

  if (!serviceAuthHeader || serviceAuthHeader !== validServiceSecret) {
    return res.status(403).json({ error: "Unauthorized service access" });
  }

  next();
};
