import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import fs from 'node:fs';
import path from 'node:path';

const serveTranslatorPlugin = {
  name: 'serve-translator-plugin',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const pathname = req.url ? req.url.split('?')[0] : '';
      if (pathname === '/translator') {
        const query = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
        res.writeHead(301, { Location: `/translator/${query}` });
        res.end();
        return;
      }
      if (pathname.startsWith('/translator/')) {
        const relPath = pathname === '/translator/' ? '/translator/index.html' : pathname;
        const filePath = path.join(process.cwd(), 'public', relPath);
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
          const mimeTypes = {
            '.html': 'text/html; charset=utf-8',
            '.js': 'application/javascript; charset=utf-8',
            '.css': 'text/css; charset=utf-8',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml'
          };
          const ext = path.extname(filePath).toLowerCase();
          const contentType = mimeTypes[ext] || 'application/octet-stream';
          res.writeHead(200, { 'Content-Type': contentType });
          fs.createReadStream(filePath).pipe(res);
          return;
        }
      }
      next();
    });
  }
};

export default defineConfig({site:'https://kang-zhaoyuan.github.io', integrations:[sitemap()], vite:{plugins:[tailwindcss(), serveTranslatorPlugin]}, fonts:[
{provider:fontProviders.google(),name:'Fraunces',cssVariable:'--ff-display',weights:['400','500','600'],styles:['normal','italic'],subsets:['latin']},
{provider:fontProviders.google(),name:'Inter',cssVariable:'--ff-body',weights:['400','500','600'],subsets:['latin']},
{provider:fontProviders.google(),name:'Space Mono',cssVariable:'--ff-mono',weights:['400','700'],subsets:['latin']}
]});
