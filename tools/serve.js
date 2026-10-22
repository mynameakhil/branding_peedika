#!/usr/bin/env node
/**
 * Minimal zero-dependency static dev server for the Branding Peedika site.
 *
 *   node tools/serve.js            # http://localhost:8080
 *   node tools/serve.js -p 3000    # custom port
 *   node tools/serve.js -p 8080 -d ./
 *
 * It mirrors the behaviour of a production static host as closely as a plain
 * Node file server can:
 *   - serves /page/ by resolving /page/index.html
 *   - serves /404.html (with HTTP 404) for unknown paths
 *   - sets correct Content-Type for html/css/js/svg/webp/avif/woff2/json/xml/txt
 *   - compresses text responses with Brotli or gzip, like a real host
 *   - answers conditional requests with 304, so edits show up on reload
 *
 * This is a development convenience only. It is not part of the deployed site.
 */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const zlib = require('zlib');

const args = process.argv.slice(2);
function argValue(flag, fallback) {
  const i = args.indexOf(flag);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
}

const PORT = Number(argValue('-p', argValue('--port', 8080)));
const ROOT = path.resolve(argValue('-d', argValue('--dir', path.join(__dirname, '..'))));

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.map': 'application/json; charset=utf-8'
};

/* Text formats are compressed on the fly, the same way a production host
   does it. Binary formats (images, fonts) are already compressed. */
const COMPRESSIBLE = new Set([
  '.html', '.css', '.js', '.mjs', '.json', '.webmanifest', '.xml', '.txt', '.svg'
]);

function pickEncoding(req) {
  const accept = String(req.headers['accept-encoding'] || '');
  if (/\bbr\b/.test(accept)) return 'br';
  if (/\bgzip\b/.test(accept)) return 'gzip';
  return null;
}

function compress(encoding, buf) {
  return encoding === 'br'
    ? zlib.brotliCompressSync(buf, {
        params: {
          [zlib.constants.BROTLI_PARAM_QUALITY]: 5,
          [zlib.constants.BROTLI_PARAM_SIZE_HINT]: buf.length
        }
      })
    : zlib.gzipSync(buf, { level: 6 });
}

function send(res, status, body, headers) {
  res.writeHead(status, Object.assign({ 'Cache-Control': 'no-cache' }, headers || {}));
  res.end(body);
}

function sendFile(req, res, status, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const type = MIME[ext] || 'application/octet-stream';

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      send(res, 500, 'Internal Server Error', { 'Content-Type': 'text/plain; charset=utf-8' });
      return;
    }

    const etag = 'W/"' + stat.size.toString(16) + '-' + stat.mtimeMs.toString(16) + '"';
    const headers = { 'Content-Type': type, ETag: etag, 'Last-Modified': stat.mtime.toUTCString() };

    if (req.headers['if-none-match'] === etag) {
      res.writeHead(304, { ETag: etag, 'Cache-Control': 'no-cache' });
      res.end();
      return;
    }

    fs.readFile(filePath, (readErr, buf) => {
      if (readErr) {
        send(res, 500, 'Internal Server Error', { 'Content-Type': 'text/plain; charset=utf-8' });
        return;
      }

      const encoding = COMPRESSIBLE.has(ext) ? pickEncoding(req) : null;
      if (!encoding) {
        headers['Content-Length'] = buf.length;
        send(res, status, buf, headers);
        return;
      }

      const body = compress(encoding, buf);
      headers['Content-Encoding'] = encoding;
      headers['Content-Length'] = body.length;
      headers.Vary = 'Accept-Encoding';
      send(res, status, body, headers);
    });
  });
}

const server = http.createServer((req, res) => {
  let pathname;
  try {
    pathname = decodeURIComponent(url.parse(req.url).pathname || '/');
  } catch (e) {
    send(res, 400, 'Bad Request', { 'Content-Type': 'text/plain; charset=utf-8' });
    return;
  }

  // Block path traversal outside the served root.
  const target = path.resolve(path.join(ROOT, pathname));
  if (target !== ROOT && !target.startsWith(ROOT + path.sep)) {
    send(res, 403, 'Forbidden', { 'Content-Type': 'text/plain; charset=utf-8' });
    return;
  }

  fs.stat(target, (err, stat) => {
    if (!err && stat.isDirectory()) {
      const index = path.join(target, 'index.html');
      if (fs.existsSync(index)) {
        sendFile(req, res, 200, index);
      } else {
        notFound(req, res);
      }
      return;
    }
    if (!err && stat.isFile()) {
      sendFile(req, res, 200, target);
      return;
    }
    notFound(req, res);
  });
});

function notFound(req, res) {
  const custom = path.join(ROOT, '404.html');
  if (fs.existsSync(custom)) {
    sendFile(req, res, 404, custom);
  } else {
    send(res, 404, 'Not Found', { 'Content-Type': 'text/plain; charset=utf-8' });
  }
}

server.listen(PORT, () => {
  console.log('Branding Peedika — dev server');
  console.log('  root : ' + ROOT);
  console.log('  url  : http://localhost:' + PORT + '/');
  console.log('  stop : Ctrl+C');
});
