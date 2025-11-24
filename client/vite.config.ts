import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
  ],
  resolve: {
    alias: {
      // CORREÇÃO: src agora está na mesma pasta deste arquivo
      "@": path.resolve(import.meta.dirname, "src"),
      // CORREÇÃO: shared está um nível acima (..)
      "@shared": path.resolve(import.meta.dirname, "../shared"),
      // CORREÇÃO: assets está um nível acima (..)
      "@assets": path.resolve(import.meta.dirname, "../attached_assets"),
    },
  },
  // REMOVIDO: root: path.resolve(import.meta.dirname, "client"), 
  // (Não é mais necessário pois o arquivo já está dentro de client)
  
  build: {
    // CORREÇÃO: Ajustado para sair da pasta client e criar a dist na raiz
    outDir: path.resolve(import.meta.dirname, "../dist/public"),
    emptyOutDir: true,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
