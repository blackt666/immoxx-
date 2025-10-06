import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@shared": path.resolve(__dirname, "../shared"),
      "@assets": path.resolve(__dirname, "../attached_assets"),
    },
  },
  build: {
    outDir: path.resolve(__dirname, "../dist/public"),
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
    sourcemap: false,
    minify: 'esbuild',
    target: 'es2020',
  },
});