import { createServer as createViteServer, type ViteDevServer } from "vite";
import express, { type Express } from "express";
import { readFileSync } from "fs";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

let vite: ViteDevServer;

export async function setupVite(app: Express, server: any) {
  const root = resolve(__dirname, "..", "client");

  vite = await createViteServer({
    root,
    server: { middlewareMode: true },
  });
  app.use(vite.middlewares);

  app.use("*", async (req, res) => {
    const url = req.originalUrl;

    try {
      let html = readFileSync(resolve(root, "public", "index.html"), "utf-8");

      html = await vite.transformIndexHtml(url, html);
      res.status(200).set({ "Content-Type": "text/html" }).send(html);
    } catch (e: any) {
      log(`[HMR ERR] ${e.message}`);
      vite.ssrFixStacktrace(e);
      res.status(500).end(e.message);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = resolve(__dirname, "..", "dist", "public");
  app.use(express.static(distPath));

  app.use("*", (_req, res) => {
    res.sendFile(resolve(distPath, "index.html"));
  });
}

export function log(message: string) {
  const timestamp = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${timestamp} ${message}`);
}
