/**
 * Arena engine configuration smoke test.
 *
 * Verifies that your Arena image engine configuration is wired up correctly
 * by requesting one real image through the same client the Frame Generator
 * uses at runtime.
 *
 * Usage:
 *   bun run scripts/verify-arena-config.ts
 *   node --experimental-strip-types scripts/verify-arena-config.ts
 *
 * Configuration is read from the environment and/or a `.env` file next to
 * package.json (bun loads `.env` automatically; this script emulates that
 * for node).
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Minimal .env loader (bun does this natively; node does not).
const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const envPath = join(projectRoot, '.env');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separator = trimmed.indexOf('=');
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

const { arenaEngine, getArenaEngineStatus } = await import('../services/arena/arenaEngine.ts');

const status = getArenaEngineStatus();
console.log('Arena engine status');
console.log(JSON.stringify(status, null, 2));

if (!status.hasApiKey) {
  console.log('\nNo ARENA_API_KEY configured — the app runs in LOCAL SIMULATION mode.');
  console.log('Set ARENA_API_KEY (and optionally ARENA_API_BASE_URL) in .env to enable live models.');
  process.exit(0);
}

console.log('\nRequesting one live test image...');
try {
  const result = await arenaEngine.generateImage({
    model: status.imageModel,
    prompt: 'A small glowing neon cube on a black reflective surface, product shot',
    aspectRatio: '1:1',
  });
  const approximateBytes = result.image.startsWith('data:')
    ? Math.round((result.image.length - result.image.indexOf(',') - 1) * 0.75)
    : -1;
  console.log(`OK  mode=${result.mode} model=${result.model} approx_bytes=${approximateBytes}`);
} catch (error) {
  console.error(`FAIL  ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}

console.log('\nTesting prompt enhancement...');
try {
  const enhancement = await arenaEngine.enhancePrompt({ prompt: 'a lone samurai on a rainy rooftop' });
  console.log(`OK  mode=${enhancement.mode}`);
  console.log(`     "${enhancement.prompt}"`);
} catch (error) {
  console.error(`FAIL  ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}

console.log('\nAll Arena engine checks passed.');
