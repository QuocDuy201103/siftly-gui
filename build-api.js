import { build } from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { mkdir } from 'fs/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Simple plugin to resolve @shared alias
const aliasPlugin = {
  name: 'alias',
  setup(build) {
    // Resolve @shared/* to shared/*
    build.onResolve({ filter: /^@shared\// }, (args) => {
      return {
        path: resolve(__dirname, 'shared', args.path.replace('@shared/', '')),
      };
    });
  },
};

// Ensure output directory exists
await mkdir(resolve(__dirname, '.vercel/output/functions/api'), { recursive: true });

await build({
  entryPoints: [resolve(__dirname, 'api/index.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: resolve(__dirname, '.vercel/output/functions/api/index.js'),
  packages: 'external',
  external: ['express', 'passport', 'mongoose', 'dotenv', 'express-session', 'passport-google-oauth20'],
  plugins: [aliasPlugin],
  resolveExtensions: ['.ts', '.js', '.json'],
  absWorkingDir: __dirname,
});
