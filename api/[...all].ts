// api/[...all].ts
import express, { type Request, type Response, type NextFunction } from "express";
import path from "path";
import { registerRoutes } from "../server/routes";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// alleen nodig als je uploads serveert
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// jouw echte API-routes registreren (incl. /api/auth/login)
await registerRoutes(app);

// uniforme error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});

export default app;
