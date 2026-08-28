import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        // Allow the dev server to be reached through proxied preview hosts.
        allowedHosts: true,
      },
      plugins: [react(), tailwindcss()],
      define: {
        // ── Arena.ai image engine (Frame Generator) ────────────────────────
        'process.env.ARENA_API_KEY': JSON.stringify(env.ARENA_API_KEY ?? ''),
        'process.env.ARENA_API_BASE_URL': JSON.stringify(env.ARENA_API_BASE_URL ?? ''),
        'process.env.ARENA_IMAGE_MODEL': JSON.stringify(env.ARENA_IMAGE_MODEL ?? ''),
        'process.env.ARENA_IMAGE_MODEL_FAST': JSON.stringify(env.ARENA_IMAGE_MODEL_FAST ?? ''),
        'process.env.ARENA_TEXT_MODEL': JSON.stringify(env.ARENA_TEXT_MODEL ?? ''),
        // ── Legacy Gemini key ───────────────────────────────────────────────
        // Still consumed by the text-generation features in Characters, Lore
        // Keeper, Storyflow, Style Alchemist, Soundtrack Composer, Panel
        // Assembler and MainWorkspace. The image engine itself no longer
        // uses Gemini.
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
