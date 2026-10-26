import fs from 'node:fs';
import { build } from 'esbuild';

const result = await build({
  entryPoints: ['src/widget.js'],
  bundle: true,
  format: 'iife',
  write: false,
  target: ['es2022'],
  minify: true,
});

const js = result.outputFiles[0].text;
const html = fs.readFileSync('index.html', 'utf8');
const withoutLegacyScript = html.replace(/<script>[\s\S]*?<\/script>\s*<\/body>/i, '</body>');
const output = withoutLegacyScript.replace('</body>', `<script>${js}</script></body>`);
fs.mkdirSync('public', { recursive: true });
fs.writeFileSync('public/widget.html', output);
console.log('Built public/widget.html');
