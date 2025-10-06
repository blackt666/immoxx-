import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React libraries
          'react-vendor': ['react', 'react-dom'],
          'react-router': ['react-router-dom', 'wouter'],
          
          // UI component libraries
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            '@radix-ui/react-accordion',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-avatar',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-label',
            '@radix-ui/react-popover',
            '@radix-ui/react-separator',
            '@radix-ui/react-switch',
          ],
          
          // Data management
          'query-vendor': ['@tanstack/react-query'],
          
          // Charts and visualizations
          'chart-vendor': ['recharts'],
          
          // Forms and validation
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod', 'zod-validation-error'],
          
          // Icons
          'icons-vendor': ['lucide-react', 'react-icons'],
          
          // Utilities
          'utils-vendor': ['clsx', 'tailwind-merge', 'date-fns', 'class-variance-authority'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
    // Enable source maps for production debugging (optional)
    sourcemap: false,
    // Optimize build
    minify: 'esbuild',
    target: 'es2020',
  },
  server: {
    host: "0.0.0.0",
    port: 5000,
    allowedHosts: [
      "76c90bc8-e17c-4751-b62a-d5d83d77118a-00-1kphihskyvn2i.spock.replit.dev",
      "localhost",
      "127.0.0.1",
      ".replit.dev",
      ".repl.co"
    ],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
    proxy: {
      "/api": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
