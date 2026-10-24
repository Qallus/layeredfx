import 'server-only';
// Lead Finder page fetches. Every connection is checked at DNS time, so a public name that resolves to a private
// or metadata address is refused even after a redirect or a DNS change between checks. robots.txt is honoured.
import dns from 'node:dns';
import http from 'node:http';
import https from 'node:https';
import zlib from 'node:zlib';
import type {LookupFunction} from 'node:net';
import {OperationError} from '@/lib/operations/engine.mjs';
import {checkTarget, htmlToText, isBlockedAddress, pageTitle, robotsAllows, USER_AGENT} from './extract.mjs';

export type FetchedPage = {url: string; title: string; html: string; text: string};
type Raw = {status: number; location: string; type: string; body: string};

const PAGE_LIMIT = 2_000_000;
const ROBOTS_LIMIT = 500_000;
const TIMEOUT = 15000;
const MAX_REDIRECTS = 4;
const robotsCache = new Map<string, {at: number; text: string}>();

const safeLookup: LookupFunction = (hostname, options, callback) => {
  dns.lookup(hostname, {all: true}, (error, addresses) => {
    if (error) return callback(error, '', 4);
    if (!addresses.length || addresses.some(entry => isBlockedAddress(entry.address))) {
      return callback(Object.assign(new Error('Blocked address'), {code: 'LFX_BLOCKED'}), '', 4);
    }
    if (options.all) return (callback as unknown as (e: null, a: dns.LookupAddress[]) => void)(null, addresses);
    callback(null, addresses[0].address, addresses[0].family);
  });
};

function decoder(type: string) {
  const charset = type.match(/charset=["']?([\w-]+)/i)?.[1] || 'utf-8';
  try { return new TextDecoder(charset); } catch { return new TextDecoder('utf-8'); }
}

/** One GET with no redirect following, a size cap after decompression and an overall timeout. */
function get(url: URL, limit: number): Promise<Raw> {
  return new Promise((resolve, reject) => {
    const client = url.protocol === 'https:' ? https : http;
    const request = client.get(url, {
      lookup: safeLookup, timeout: TIMEOUT,
      headers: {'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml,text/plain;q=0.8', 'Accept-Encoding': 'gzip, deflate, br'},
    }, response => {
      const status = response.statusCode || 0, type = String(response.headers['content-type'] || '');
      const location = String(response.headers.location || '');
      if (status >= 300 && status < 400) { response.resume(); return resolve({status, location, type, body: ''}); }
      const encoding = String(response.headers['content-encoding'] || '').toLowerCase();
      const stream = encoding === 'gzip' ? response.pipe(zlib.createGunzip()) : encoding === 'deflate' ? response.pipe(zlib.createInflate())
        : encoding === 'br' ? response.pipe(zlib.createBrotliDecompress()) : response;
      const chunks: Buffer[] = [];
      let size = 0;
      stream.on('data', (chunk: Buffer) => {
        size += chunk.length;
        if (size > limit) { request.destroy(); stream.destroy(); reject(new OperationError('That page is larger than 2 MB, so it was not read.', 422)); return; }
        chunks.push(chunk);
      });
      stream.on('end', () => resolve({status, location, type, body: decoder(type).decode(Buffer.concat(chunks))}));
      stream.on('error', () => reject(new OperationError('The page could not be read.', 502)));
    });
    const deadline = setTimeout(() => request.destroy(new Error('timeout')), TIMEOUT);
    request.on('close', () => clearTimeout(deadline));
    request.on('timeout', () => request.destroy(new Error('timeout')));
    request.on('error', (error: NodeJS.ErrnoException) => {
      if (error instanceof OperationError) return reject(error);
      if (error.code === 'LFX_BLOCKED') return reject(new OperationError('Only public websites can be scraped.', 400));
      if (error.code === 'ENOTFOUND') return reject(new OperationError(`${url.hostname} could not be found.`, 422));
      reject(new OperationError(error.message === 'timeout' ? `${url.hostname} did not respond within ${TIMEOUT / 1000} seconds.` : `${url.hostname} could not be reached.`, 502));
    });
  });
}

async function allowedByRobots(url: URL) {
  const cached = robotsCache.get(url.origin);
  let text = cached && Date.now() - cached.at < 600000 ? cached.text : null;
  if (text === null) {
    // A missing, unreadable or non-text robots.txt places no restriction.
    text = await get(new URL('/robots.txt', url.origin), ROBOTS_LIMIT)
      .then(raw => raw.status === 200 && /text\/plain/i.test(raw.type) ? raw.body : '').catch(() => '');
    if (robotsCache.size > 500) robotsCache.clear();
    robotsCache.set(url.origin, {at: Date.now(), text});
  }
  return robotsAllows(text, url.pathname + url.search);
}

export async function fetchPage(raw: unknown): Promise<FetchedPage> {
  let url: URL;
  try { url = checkTarget(raw); } catch (e) { throw new OperationError(e instanceof Error ? e.message : 'Enter a valid web address.', 400); }
  for (let hop = 0; ; hop++) {
    if (!await allowedByRobots(url)) throw new OperationError(`${url.hostname} asks automated tools not to read ${url.pathname} (robots.txt), so it was skipped.`, 422);
    const response = await get(url, PAGE_LIMIT);
    if (response.status >= 300 && response.status < 400 && response.location) {
      if (hop >= MAX_REDIRECTS) throw new OperationError('The page redirected too many times.', 422);
      try { url = checkTarget(new URL(response.location, url).href); } catch { throw new OperationError('The page redirected to an address that cannot be scraped.', 422); }
      continue;
    }
    if (response.status === 401 || response.status === 403) throw new OperationError(`${url.hostname} refused access (HTTP ${response.status}). Only public pages can be scraped.`, 422);
    if (response.status === 429) throw new OperationError(`${url.hostname} is limiting requests. Try again later.`, 429);
    if (response.status < 200 || response.status >= 300) throw new OperationError(`${url.hostname} answered HTTP ${response.status}.`, 422);
    if (!/text\/html|application\/xhtml|text\/plain/i.test(response.type)) throw new OperationError('That address is not a web page (for example, it is a PDF or image).', 422);
    const html = response.body;
    return {url: url.href, title: pageTitle(html), html, text: /text\/plain/i.test(response.type) ? html.slice(0, 40000) : htmlToText(html)};
  }
}
