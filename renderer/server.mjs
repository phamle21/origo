import http from 'node:http';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { createNetworkGuard } from './network-guard.mjs';
import { parseRenderRequest, RequestError } from './render-request.mjs';

const PORT = Number(process.env.PORT ?? 3000);
// Ten megabytes of upload grow by a third when base64 encoded, plus the JSON around it.
const MAX_BODY_BYTES = 16 * 1_024 * 1_024;
const NAVIGATION_TIMEOUT_MS = 20_000;
const SETTLE_DELAY_MS = 600;
const VIEWPORT_HEIGHT = 900;
const MAX_PAGE_HEIGHT = 8_000;
const MAX_CONCURRENT_RENDERS = 2;
const MAX_WAITING_RENDERS = 6;

const guard = createNetworkGuard({ allowedPrivateHosts: (process.env.ALLOWED_PRIVATE_HOSTS ?? '').split(',') });

let browserPromise = null;
let running = 0;
const waiting = [];

function getBrowser() {
  if (!browserPromise) {
    browserPromise = chromium.launch().then((browser) => {
      browser.on('disconnected', () => {
        browserPromise = null;
      });

      return browser;
    });
  }

  return browserPromise;
}

async function withRenderSlot(task) {
  if (running >= MAX_CONCURRENT_RENDERS) {
    if (waiting.length >= MAX_WAITING_RENDERS) {
      throw new RequestError(429, 'renderer is busy');
    }

    await new Promise((resolve) => waiting.push(resolve));
  }

  running += 1;

  try {
    return await task();
  } finally {
    running -= 1;
    waiting.shift()?.();
  }
}

async function writeUpload(job) {
  const directory = await mkdtemp(path.join(tmpdir(), 'origo-render-'));

  for (const file of job.files) {
    const target = path.join(directory, file.relativePath);

    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, file.content);
  }

  return directory;
}

async function render(job) {
  const browser = await getBrowser();
  const context = await browser.newContext({
    viewport: { width: job.width, height: VIEWPORT_HEIGHT },
    deviceScaleFactor: 1,
    acceptDownloads: false,
    serviceWorkers: 'block',
  });
  let uploadDirectory = null;

  try {
    const page = await context.newPage();
    let target = job.url;

    if (job.kind === 'html') {
      uploadDirectory = await writeUpload(job);
      target = pathToFileURL(path.join(uploadDirectory, job.entry)).href;
    }

    // Uploaded files may load each other; anything on the network goes through the guard.
    await page.route('**/*', async (route) => {
      const url = route.request().url();
      const isOwnFile = uploadDirectory !== null && url.startsWith(pathToFileURL(uploadDirectory).href);

      if (isOwnFile || (await guard.isAllowedUrl(url))) {
        await route.continue();
      } else {
        await route.abort('blockedbyclient');
      }
    });

    if (job.kind === 'url' && !(await guard.isAllowedUrl(job.url))) {
      throw new RequestError(422, 'this address cannot be captured');
    }

    try {
      await page.goto(target, { waitUntil: 'networkidle', timeout: NAVIGATION_TIMEOUT_MS });
    } catch (cause) {
      // A page that keeps polling never becomes idle; whatever loaded by then is captured.
      if (!String(cause?.message).includes('Timeout')) {
        throw new RequestError(422, 'the page could not be opened');
      }
    }

    await page.waitForTimeout(SETTLE_DELAY_MS);

    const pageHeight = await page.evaluate(() => Math.ceil(document.documentElement.scrollHeight));
    const height = Math.min(Math.max(pageHeight, 1), MAX_PAGE_HEIGHT);

    return await page.screenshot({ type: 'png', fullPage: true, clip: { x: 0, y: 0, width: job.width, height } });
  } finally {
    await context.close();

    if (uploadDirectory) {
      await rm(uploadDirectory, { recursive: true, force: true });
    }
  }
}

async function readJsonBody(request) {
  const chunks = [];
  let size = 0;

  for await (const chunk of request) {
    size += chunk.length;

    if (size > MAX_BODY_BYTES) {
      throw new RequestError(413, 'body too large');
    }

    chunks.push(chunk);
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new RequestError(400, 'body must be JSON');
  }
}

function sendJson(response, status, body) {
  response.writeHead(status, { 'content-type': 'application/json' });
  response.end(JSON.stringify(body));
}

const server = http.createServer(async (request, response) => {
  if (request.method === 'GET' && request.url === '/health') {
    sendJson(response, 200, { ok: true });
    return;
  }

  if (request.method !== 'POST' || request.url !== '/render') {
    sendJson(response, 404, { error: 'not found' });
    return;
  }

  try {
    const job = parseRenderRequest(await readJsonBody(request));
    const png = await withRenderSlot(() => render(job));

    response.writeHead(200, { 'content-type': 'image/png', 'content-length': png.length });
    response.end(png);
  } catch (cause) {
    const status = cause instanceof RequestError ? cause.status : 500;

    if (status === 500) {
      console.error('render failed', cause);
    }

    sendJson(response, status, { error: status === 500 ? 'render failed' : cause.message });
  }
});

server.requestTimeout = 60_000;
server.listen(PORT, () => console.log(`origo-renderer listening on ${PORT}`));
