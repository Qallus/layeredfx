import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {builtInLeads, builtInProfile, checkTarget, enrichmentChanges, enrichmentDetails, htmlToText, isBlockedAddress, normalizeLead, parseAiLeads, parseAiProfile, relatedLinks, robotsAllows, websiteFor} from '../lib/scraper/extract.mjs';

test('only public http(s) targets on standard ports are accepted', () => {
  assert.equal(checkTarget('https://example.com/list#top').href, 'https://example.com/list');
  for (const bad of ['ftp://example.com', 'file:///etc/passwd', 'http://localhost:3000', 'http://127.0.0.1/', 'http://169.254.169.254/latest', 'http://10.0.0.5/',
    'http://[::1]/', 'https://user:pw@example.com', 'https://example.com:8443/', 'http://intranet/', 'http://printer.local/', 'not a url'])
    assert.throws(() => checkTarget(bad), bad);
});

test('private, loopback, metadata and mapped addresses are blocked at DNS time', () => {
  for (const ip of ['127.0.0.1', '10.1.2.3', '172.16.0.1', '172.31.255.255', '192.168.1.1', '169.254.169.254', '100.64.0.1', '0.0.0.0', '224.0.0.1',
    '::1', '::', 'fd00::1', 'fe80::1', '::ffff:127.0.0.1', '::ffff:10.0.0.1', '64:ff9b::a00:1', '2002:a00:1::'])
    assert.equal(isBlockedAddress(ip), true, ip);
  for (const ip of ['93.184.216.34', '8.8.8.8', '172.32.0.1', '2606:4700::6810:85e5', '::ffff:8.8.8.8'])
    assert.equal(isBlockedAddress(ip), false, ip);
});

test('robots.txt: specific agent group wins, longest rule wins, wildcards and anchors work', () => {
  const robots = 'User-agent: *\nDisallow: /private\nAllow: /private/public\n\nUser-agent: LayeredFXLeadFinder\nDisallow: /members\nDisallow: /*.pdf$';
  assert.equal(robotsAllows(robots, '/private/x'), true, 'our own group replaces the * group');
  assert.equal(robotsAllows(robots, '/members/list'), false);
  assert.equal(robotsAllows(robots, '/files/a.pdf'), false);
  assert.equal(robotsAllows(robots, '/files/a.pdf?x=1'), true);
  const generic = 'User-agent: *\nDisallow: /private\nAllow: /private/public';
  assert.equal(robotsAllows(generic, '/private/secret'), false);
  assert.equal(robotsAllows(generic, '/private/public/page'), true);
  assert.equal(robotsAllows('User-agent: *\nDisallow:', '/anything'), true);
  assert.equal(robotsAllows('', '/anything'), true);
});

test('page text drops scripts and styles and keeps contact links', () => {
  const text = htmlToText('<head><title>x</title></head><style>.a{}</style><script>alert(1)</script><p>Acme&nbsp;Wraps &amp; Film</p><a href="mailto:hi@acme.com">Email us</a><a href="tel:+14805550100">Call</a>');
  assert.match(text, /Acme Wraps & Film/);
  assert.match(text, /\[mailto:hi@acme\.com\]/);
  assert.match(text, /\[tel:\+14805550100\]/);
  assert.doesNotMatch(text, /alert|\.a\{/);
});

test('built-in extraction reads JSON-LD businesses and page contact links', () => {
  const html = `<title>Desert Finishes | Home</title><script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"HomeAndConstructionBusiness","name":"Desert Finishes","telephone":"(480) 555-0101","email":"info@desertfinishes.com","url":"/","address":{"addressLocality":"Mesa","addressRegion":"AZ"}},{"@type":"WebPage","name":"Home"}]}</script>
    <a href="mailto:sales@desertfinishes.com">Sales</a><a href="tel:480-555-0199">Office</a>`;
  const leads = builtInLeads(html, 'https://www.desertfinishes.com/contact');
  assert.equal(leads.length, 2);
  assert.deepEqual([leads[0].name, leads[0].company, leads[0].city, leads[0].state, leads[0].email, leads[0].website], ['Desert Finishes', 'Desert Finishes', 'Mesa', 'AZ', 'info@desertfinishes.com', 'https://www.desertfinishes.com/']);
  assert.equal(leads[0].source, 'Lead Finder · desertfinishes.com');
  assert.equal(leads[1].email, 'sales@desertfinishes.com');
  assert.equal(leads[1].company, 'Desert Finishes');
});

test('lead records drop invalid emails, phones and websites so they cannot fail an import batch', () => {
  const lead = normalizeLead({company: 'Acme', email: 'not-an-email', phone: '12', website: 'javascript:alert(1)'}, 'https://dir.example.com/a');
  assert.deepEqual([lead.name, lead.email, lead.phone, lead.website], ['Acme', '', '', '']);
  assert.equal(normalizeLead({email: 'logo@2x.png'}, 'https://x.com').email, '');
  assert.equal(normalizeLead({name: 'Jo', website: '/about'}, 'https://dir.example.com/a').website, 'https://dir.example.com/about');
});

test('AI replies: fenced JSON, bare arrays and lists cut off mid-record are all read', () => {
  const url = 'https://dir.example.com/p1';
  assert.equal(parseAiLeads('```json\n{"leads":[{"company":"A Co","email":"a@aco.com"},{"company":"B Co"}]}\n```', url).length, 2);
  assert.equal(parseAiLeads('[{"name":"Sam Lee","company":"C Co"}]', url)[0].name, 'Sam Lee');
  const cut = parseAiLeads('{"leads":[{"company":"A Co"},{"company":"B Co"},{"company":"C C', url);
  assert.deepEqual(cut.map(l => l.company), ['A Co', 'B Co']);
  assert.deepEqual(parseAiLeads('{"leads":[]}', url), []);
  assert.throws(() => parseAiLeads('Sorry, I cannot help.', url));
});

// Route access rules, with the server, network and AI boundaries replaced.
const dataUrl = code => `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
const engine = new URL('../lib/operations/engine.mjs', import.meta.url).href;
const security = new URL('../lib/operations/security.mjs', import.meta.url).href;
const extract = new URL('../lib/scraper/extract.mjs', import.meta.url).href;
const boundary = dataUrl(`
import {OperationError} from '${engine}';
export const fixture={role:'staff',mode:'supabase',ai:true,fetched:[],prompts:[]};
export function checkOrigin(request){if(request.headers.get('origin')!=='https://layeredfx.com')throw new OperationError('This request origin is not allowed.',403);}
export async function scrapeActor(){if(fixture.role==='viewer')throw new OperationError('Reading web pages requires staff access.',403);return {id:'u_'+fixture.role,name:'User',role:fixture.role};}
export function scrapeThrottle(){}
export function errorResponse(error){return Response.json({message:error.message},{status:error.status||500});}
export function mode(){return fixture.mode;}
export function grokReady(){return fixture.ai;}
export async function grokChat(input){fixture.prompts.push(input);return {id:'g1',model:'grok',text:input.system.includes('CRM record')?'{"company":"Acme Wraps","title":"Owner","phone":"480-555-0100","people":[{"name":"Pat Doe","title":"Owner"}]}':'{"leads":[{"company":"Acme","email":"hi@acme.com"}]}'};}
export function agentFailure(e){return e;}
export async function fetchPage(url){fixture.fetched.push(url);
 if(url.endsWith('/about-us'))throw new OperationError('robots.txt',422);
 if(url.endsWith('/contact'))return {url,title:'Contact',html:'<a href="tel:480-555-0100">Call</a><a href="https://www.instagram.com/acmewraps">IG</a>',text:'Call 480-555-0100'};
 return {url,title:'Directory',html:'<a href="mailto:x@site.com">x</a><a href="/contact">Contact</a><a href="/about-us">About</a>',text:'Acme hi@acme.com'};}
`);
const {fixture} = await import(boundary);
// The real shared service runs, with only its network, AI and access boundaries replaced.
const transpile = (path, extra = {}) => Object.entries({"import 'server-only';": '', "'./fetch'": `'${boundary}'`, "'./access'": `'${boundary}'`, "'./extract.mjs'": `'${extract}'`, ...extra})
  .reduce((out, [from, to]) => out.replaceAll(from, to), ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {compilerOptions: {module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022}}).outputText)
  .replaceAll('@/lib/operations/engine.mjs', engine).replaceAll('@/lib/operations/security.mjs', security).replaceAll('@/lib/scraper/extract.mjs', extract)
  .replaceAll('@/lib/operations/server', boundary).replaceAll('@/lib/agents/client', boundary).replaceAll('@/lib/scraper/fetch', boundary).replaceAll('@/lib/scraper/access', boundary);
const service = dataUrl(transpile('../lib/scraper/service.ts'));
const route = path => import(dataUrl(transpile(path, {"'@/lib/scraper/service'": `'${service}'`})));
const enrichApi = await route('../app/api/operations/enrich/route.ts');
const enrich = (body, origin = 'https://layeredfx.com') => enrichApi.POST(new Request('https://layeredfx.com/api/operations/enrich', {method: 'POST', headers: {origin, 'content-type': 'application/json'}, body: JSON.stringify(body)}));
const api = await route('../app/api/operations/scrape/route.ts');
const post = (body, origin = 'https://layeredfx.com') => api.POST(new Request('https://layeredfx.com/api/operations/scrape', {method: 'POST', headers: {origin, 'content-type': 'application/json'}, body: JSON.stringify(body)}));
test.beforeEach(() => Object.assign(fixture, {role: 'staff', mode: 'supabase', ai: true, fetched: [], prompts: []}));

test('scrape route: viewers and foreign origins are refused before any page is read', async () => {
  fixture.role = 'viewer';
  assert.equal((await post({url: 'https://a.com'})).status, 403);
  fixture.role = 'staff';
  assert.equal((await post({url: 'https://a.com'}, 'https://evil.example')).status, 403);
  assert.deepEqual(fixture.fetched, []);
});

test('scrape route: AI mode returns drafts and passes the instructions; AI off uses built-in extraction', async () => {
  const ai = await (await post({url: 'https://a.com', instructions: 'Contractors only', ai: true})).json();
  assert.equal(ai.method, 'ai');
  assert.equal(ai.leads[0].email, 'hi@acme.com');
  assert.match(fixture.prompts[0].prompt, /Contractors only/);
  const plain = await (await post({url: 'https://a.com', ai: false})).json();
  assert.equal(plain.method, 'built-in');
  assert.equal(plain.leads[0].email, 'x@site.com');
  assert.equal(fixture.prompts.length, 1);
});

test('scrape route: requesting AI without a key fails honestly instead of falling back', async () => {
  fixture.ai = false;
  const res = await post({url: 'https://a.com', ai: true});
  assert.equal(res.status, 503);
  assert.deepEqual(fixture.fetched, []);
});

test('enrichment starts from the website, else a business email domain, never a free mail domain', () => {
  assert.equal(websiteFor({website: 'https://acme.com/', email: 'a@other.com'}), 'https://acme.com/');
  assert.equal(websiteFor({email: 'pat@acmewraps.com'}), 'https://acmewraps.com/');
  assert.equal(websiteFor({email: 'pat@gmail.com'}), '');
  assert.equal(websiteFor({}), '');
});

test('related pages: same site only, contact first, no files or off-site links', () => {
  const html = '<a href="/about">About us</a><a href="https://acme.com/contact-us">Contact</a><a href="https://other.com/contact">x</a><a href="/team.pdf">Team</a><a href="/blog">Blog</a><a href="/">Home</a><a href="mailto:a@acme.com">Contact</a><a href="/our-team">Meet the team</a>';
  assert.deepEqual(relatedLinks(html, 'https://www.acme.com/'), ['https://acme.com/contact-us', 'https://www.acme.com/about', 'https://www.acme.com/our-team']);
});

test('proposed changes fill blanks by default and only offer replacements', () => {
  const profile = parseAiProfile('{"company":"Acme Wraps LLC","title":"Owner","email":"PAT@acme.com","phone":"(480) 555-0100","city":"Mesa","socials":{"instagram":"https://instagram.com/acme","bogus":"https://x.y"},"people":[{"name":"Pat Doe","title":"Owner"}]}', 'https://acme.com/');
  const changes = enrichmentChanges({name: 'Pat', company: 'Acme', email: 'pat@acme.com', phone: '480-555-0100', city: ''}, profile);
  assert.deepEqual(changes.map(c => [c.key, c.fill]), [['company', false], ['title', true], ['website', true], ['city', true]]);
  assert.deepEqual(Object.keys(profile.socials), ['instagram']);
  const details = enrichmentDetails(profile, ['https://acme.com/'], '2026-10-23T00:00:00.000Z');
  assert.equal(details.social_instagram, 'https://instagram.com/acme');
  assert.equal(details.peopleOnSite, 'Pat Doe · Owner');
  assert.ok(Object.values(details).every(v => v.length <= 1000));
});

test('built-in profile combines contact links and social profiles across pages', () => {
  const profile = builtInProfile([{url: 'https://acme.com/', html: '<meta name="description" content="Wall wraps &amp; film."><a href="https://www.facebook.com/acme">fb</a><a href="https://www.facebook.com/sharer.php?u=x">share</a>'}, {url: 'https://acme.com/contact', html: '<a href="mailto:hello@acme.com">Email</a><a href="tel:4805550100">Call</a>'}], 'https://acme.com/');
  assert.deepEqual([profile.email, profile.phone, profile.website, profile.description, profile.socials.facebook], ['hello@acme.com', '4805550100', 'https://acme.com/', 'Wall wraps & film.', 'https://www.facebook.com/acme']);
});

test('enrich route: reads home and related pages, skips unreadable ones, and refuses viewers', async () => {
  const plain = await (await enrich({name: 'Pat', email: 'pat@acme.com', ai: false})).json();
  assert.deepEqual(fixture.fetched, ['https://acme.com/', 'https://acme.com/contact', 'https://acme.com/about-us']);
  assert.deepEqual(plain.pages, ['https://acme.com/', 'https://acme.com/contact']);
  assert.equal(plain.profile.phone, '480-555-0100');
  assert.equal(plain.profile.socials.instagram, 'https://www.instagram.com/acmewraps');
  const ai = await (await enrich({name: 'Pat Doe', website: 'https://acme.com', ai: true})).json();
  assert.equal(ai.profile.title, 'Owner');
  assert.match(fixture.prompts.at(-1).prompt, /Contact name: Pat Doe/);
  assert.equal((await enrich({name: 'Pat', email: 'pat@gmail.com'})).status, 422);
  fixture.role = 'viewer'; fixture.fetched = [];
  assert.equal((await enrich({website: 'https://acme.com'})).status, 403);
  assert.deepEqual(fixture.fetched, []);
});
