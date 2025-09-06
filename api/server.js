// api/server.js
import express from "express";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// uploads: optioneel, alleen als je dit nodig hebt
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

async function loadServerApp() {
  try {
    // Gebruik absoluut pad naar dist/index.js ivm Vercel runtime
    const distIndex = path.join(process.cwd(), "dist", "index.js");
    const serverModule = await import(pathToFileURL(distIndex).href);

    if (!serverModule?.default) {
      throw new Error("dist/index.js heeft geen default export (Express app).");
    }

    // serverModule.default is jouw samengestelde Express-app met alle /api routes
    return serverModule.default;
  } catch (err) {
    console.error("Kon dist/index.js niet importeren:", err);
    return null;
  }
}

const realApp = await loadServerApp();

if (realApp) {
  // Proxy alles naar je ‘echte’ app (die al /api/* routes registreert)
  app.use((req, res, next) => realApp(req, res, next));
} else {
  // Fallback mini-app (alleen health), zodat je duidelijk ziet dat dist niet geladen is
  app.get("/api/health", (_req, res) => {
    res.status(503).json({
      ok: false,
      message: "Server module niet geladen; controleer dist/index.js packaging."
    });
  });

  app.all("*", (_req, res) => {
    res.status(500).send("Server niet volledig geladen (fallback).");
  });
}

export default app;
