import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function serveStaticFixed(app: Express) {
  const distPath = path.resolve(__dirname, "..", "dist", "public");
  const indexPath = path.resolve(distPath, "index.html");

  console.log(`[Static] Attempting to serve from: ${distPath}`);
  console.log(`[Static] Index path: ${indexPath}`);
  console.log(`[Static] Dist path exists: ${fs.existsSync(distPath)}`);
  console.log(`[Static] Index.html exists: ${fs.existsSync(indexPath)}`);

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  if (!fs.existsSync(indexPath)) {
    throw new Error(
      `Could not find index.html at: ${indexPath}`,
    );
  }

  app.use(express.static(distPath, {
    index: 'index.html',
    maxAge: '1h',
    etag: false
  }));

  app.use("*", (_req, res, next) => {
    console.log(`[Static] Serving index.html for: ${_req.path}`);
    res.sendFile(indexPath);
  });
}
