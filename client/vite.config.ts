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
          // Vendor chunks - separate large libraries
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            '@radix-ui/react-accordion',
            '@radix-ui/react-tooltip',
          ],
          'query-vendor': ['@tanstack/react-query'],
          'chart-vendor': ['recharts'],
          // Admin pages - lazy loaded
          'admin-crm': [
            './src/pages/admin/crm-appointments.tsx',
            './src/pages/admin/crm-customers.tsx',
            './src/pages/admin/crm-leads.tsx',
          ],
        },
      },
    },
    chunkSizeWarningLimit: 600, // Increase limit to 600kb
  },
});