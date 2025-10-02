import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import {
  createServer as createViteServer,
  createLogger,
  ViteDevServer,
} from "vite";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express) {
  const clientDistPath = path.join(process.cwd(), "client", "dist");

  // Always try static files first (more reliable in Replit)
  if (fs.existsSync(clientDistPath)) {
    console.log("✅ Serving built client files from:", clientDistPath);

    // Serve static assets
    app.use(
      express.static(clientDistPath, {
        maxAge: "1h",
        setHeaders: (res, path) => {
          if (path.endsWith(".html")) {
            res.setHeader("Cache-Control", "no-cache");
          }
        },
      }),
    );

    // SPA fallback - serve index.html for all non-API routes
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api/") || req.path.startsWith("/uploads/")) {
        return next();
      }

      const indexPath = path.join(clientDistPath, "index.html");
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res
          .status(404)
          .send("Frontend build not found. Run: cd client && npm run build");
      }
    });

    return undefined;
  }

  // If no built files, try Vite dev server as fallback
  if (process.env.NODE_ENV === "development") {
    try {
      const vite = await createViteServer({
        server: {
          middlewareMode: true,
          host: "0.0.0.0",
        },
        appType: "spa",
        root: path.join(process.cwd(), "client"),
        base: "/",
      });

      app.use("/", vite.middlewares);
      console.log("✅ Vite dev server configured as fallback");
      return vite;
    } catch (error) {
      console.error("❌ Vite dev server failed:", error);
    }
  }

  // Final fallback: serve a simple message
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/") || req.path.startsWith("/uploads/")) {
      return next();
    }
    res.status(503).send(`
      <html>
        <body style="font-family: system-ui; padding: 40px; text-align: center;">
          <h1>🔧 Frontend wird vorbereitet...</h1>
          <p>Bitte führe aus: <code>cd client && npm run build</code></p>
          <p>Server läuft auf: <a href="/api/health">/api/health</a></p>
        </body>
      </html>
    `);
  });

  return undefined;
}

export function serveStatic(app: Express) {
  const distPath = path.resolve("dist", "public");
  const fallbackPath = path.resolve("client", "dist");

  let staticPath = distPath;
  if (!fs.existsSync(distPath)) {
    if (fs.existsSync(fallbackPath)) {
      staticPath = fallbackPath;
      console.log("📁 Using fallback static path:", fallbackPath);
    } else {
      console.error(
        "❌ No frontend build found at:",
        distPath,
        "or",
        fallbackPath,
      );
      throw new Error(
        `Could not find the frontend build! Expected at ${distPath} or ${fallbackPath}`,
      );
    }
  }

  console.log("🌐 Serving static files from:", staticPath);

  // Serve static assets
  app.use(
    express.static(staticPath, {
      maxAge: "1d",
      setHeaders: (res, path) => {
        if (path.endsWith(".html")) {
          res.setHeader("Cache-Control", "no-cache");
        }
      },
    }),
  );

  // SPA fallback - serve index.html for all non-API routes
  app.get("*", (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) {
      return next();
    }

    const indexPath = path.resolve(staticPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send("Frontend not built. Run: npm run build");
    }
  });
}
