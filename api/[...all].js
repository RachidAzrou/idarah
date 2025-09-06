// api/[...all].js
import express from "express";
import path from "path";
import { pathToFileURL, fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

async function loadServer() {
  try {
    // Absoluut pad naar jouw gebundelde Express app
    const distIndex = path.join(process.cwd(), "dist", "index.js");
    const mod = await import(pathToFileURL(distIndex).href);

    if (typeof mod?.default !== "function") {
      throw new Error("dist/index.js mist default export (Express app).");
    }
    return mod.default; // <- jouw Express app met ALLE /api routes
  } catch (err) {
    console.error("Kon dist/index.js niet importeren:", err);
    return null;
  }
}

const realApp = await loadServer();

if (realApp) {
  // Laat de echte app alle requests afhandelen (incl. /api/auth/login)
  app.use((req, res, next) => realApp(req, res, next));
} else {
  // Fallback zodat je duidelijk ziet als dist/index.js niet geladen werd
  app.get("/api/health", (_req, res) => {
    res.status(503).json({ ok: false, message: "Server module niet geladen" });
  });
  app.all("*", (_req, res) => {
    res.status(500).send("Server niet volledig geladen (fallback).");
  });
}

export default app;
