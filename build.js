#!/usr/bin/env node
import esbuild from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// First, build the frontend with Vite
console.log('📦 Building frontend with Vite...');
execSync('npx vite build', { stdio: 'inherit' });

// Then, build the backend with esbuild and alias resolution
console.log('🔧 Building backend with esbuild...');

// Use relative paths that work both locally and in Docker
const alias = {
  '@shared': './shared',
  '@': './client/src',
  '@assets': './attached_assets',
};

// Plugin to prevent vite.ts from being bundled
const excludeVitePlugin = {
  name: 'exclude-vite',
  setup(build) {
    // Mark server/vite as external so it's not bundled
    build.onResolve({ filter: /^\.\/vite$/ }, () => ({
      path: 'server/vite',
      external: true,
    }));
  },
};

try {
  await esbuild.build({
    entryPoints: ['server/index.ts'],
    bundle: true,
    platform: 'node',
    format: 'esm',
    outdir: 'dist',
    packages: 'external',
    plugins: [excludeVitePlugin],
    external: [
      'express',
      'http',
      'https',
      'fs',
      'path',
      'url',
      'crypto',
      'stream',
      'util',
      'events',
      'zlib',
      'net',
      'tls',
      'os',
      'process',
      '@babel/*',
      'lightningcss',
      'postcss',
      'vite',
      '@vitejs/*',
      '@replit/vite-plugin-*',
      'react',
      'react-dom',
      '../vite.config',
      'server/vite',
    ],
    alias,
    logLevel: 'info',
  });
  console.log('✅ Build complete!');
} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
}
