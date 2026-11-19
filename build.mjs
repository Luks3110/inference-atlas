import { build, context } from 'esbuild';
import { compile } from 'svelte/compiler';
import { dirname } from 'node:path';
import { cp, mkdir, readFile, writeFile, watch } from 'node:fs/promises';

const serve = process.argv.includes('--serve');
const output = serve ? '.dev' : 'dist';
const options = {
  entryPoints: ['app.js'],
  bundle: true,
  conditions: ['svelte', 'browser'],
  plugins: [
    {
      name: 'svelte',
      setup(builder) {
        builder.onLoad({ filter: /\.svelte$/ }, async ({ path }) => {
          const source = await readFile(path, 'utf8');
          const component = compile(source, { filename: path, generate: 'client', css: 'injected' });
          return { contents: component.js.code, loader: 'js', resolveDir: dirname(path), watchFiles: [path] };
        });
      },
    },
  ],
  outdir: output,
  format: 'esm',
  minify: !serve,
  assetNames: 'assets/[name]-[hash]',
  loader: { '.woff2': 'file' },
  logLevel: 'info',
};

async function copyShell() {
  const html = (await readFile('index.html', 'utf8')).replace(
    '</head>',
    '<link rel="stylesheet" href="/app.css">\n  </head>',
  );
  await Promise.all([writeFile(output + '/index.html', html), cp('public', output, { recursive: true })]);
}

await mkdir(output, { recursive: true });
await copyShell();
if (serve) {
  const project = await context(options);
  await project.watch();
  const portArg = process.argv.indexOf('--port');
  const port = Number(portArg > -1 ? process.argv[portArg + 1] : process.env.PORT || 5173);
  const server = await project.serve({ servedir: output, host: '127.0.0.1', port });
  console.log('Inference Atlas em http://localhost:' + server.port);
  await Promise.all(
    ['index.html', 'public'].map(async (file) => {
      for await (const _ of watch(file)) await copyShell();
    }),
  );
} else {
  await build(options);
}
