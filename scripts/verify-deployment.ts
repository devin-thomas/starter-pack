import { lookup } from 'node:dns/promises';

const base = new URL(process.argv[2] || 'https://starter.devthomas.site');
if (base.protocol !== 'https:') throw new Error('Deployment verification requires HTTPS.');

// Use the same system resolver as ordinary clients; an IP override cannot prove reachability.
try {
  await lookup(base.hostname);
} catch (error) {
  throw new Error(`${base.hostname} does not resolve through this computer's normal DNS. Deployment is not verified.`, { cause: error });
}

async function read(route: string, expectedType: RegExp) {
  const url = new URL(route, base);
  const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  if (!expectedType.test(response.headers.get('content-type') || '')) {
    throw new Error(`${url}: unexpected content type ${response.headers.get('content-type')}`);
  }
  const body = await response.text();
  if (!body.trim()) throw new Error(`${url}: empty response`);
  return body;
}

const html = await read('/', /text\/html/);
if (!html.includes('id="site-data"') || !html.includes('Your first build')) {
  throw new Error('The response is not the rendered Starter Pack homepage.');
}
const script = html.match(/<script\b[^>]*\bsrc="([^\"]+\.js)"/);
const stylesheet = html.match(/<link\b[^>]*\bhref="([^\"]+\.css)"/);
if (!script || !stylesheet) throw new Error('The homepage is missing its application assets.');
await Promise.all([
  read(script[1], /javascript/),
  read(stylesheet[1], /text\/css/),
  read('/agent/catalog.json', /application\/json/).then(body => {
    const catalog = JSON.parse(body);
    if (!Array.isArray(catalog.resources) || catalog.resources.length < 3) throw new Error('Agent catalog is incomplete.');
  }),
]);
const start = await read('/agent/start.md', /text\/(plain|markdown)/);
if (!start.includes('Starter Pack skill')) throw new Error('The agent start resource is missing.');
console.log(`Verified ${base.origin}: normal DNS, HTTPS, rendered homepage, JS/CSS, and agent resources. Browser interaction acceptance is separate.`);
