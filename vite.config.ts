import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [
    react(),
    // Removidos plugins replit para produção
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/client"),
    emptyOutDir: true,
    copyPublicDir: true,
    // Otimizações de build
    rollupOptions: {
      output: {
        // Nomes fixos para evitar erros de cache no iOS (404 em arquivos antigos)
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom', 'wouter', '@tanstack/react-query'],
          'ui': ['@radix-ui/react-dialog', '@radix-ui/react-toast', '@radix-ui/react-tabs', 'lucide-react'],
          'native': ['@capacitor/core', '@capacitor/app', '@capacitor/preferences', '@capacitor/status-bar']
        }
      }
    },
    // Otimização de assets
    assetsInlineLimit: 4096, // Inline assets menores que 4kb
    chunkSizeWarningLimit: 1000 // Aviso para chunks maiores que 1MB
  },
  publicDir: path.resolve(__dirname, "public"),
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
    hmr: {
      port: parseInt(process.env.PORT || '8080', 10),
      host: 'localhost',
    },
  },
});
