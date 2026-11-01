// Test-only artifact contributions; never modifies the example checkout or installed packages.
// Usage: node verify-coordinated-recovery.mjs <archive> <tools-prefix> <new-private-workdir>
// Tools prefix must contain @nocobase/app-installer@0.1.0-beta.10 and pm2@6.0.14.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { createServer } from 'node:net';
import { pathToFileURL } from 'node:url';

const [archiveArg, toolsArg, workArg] = process.argv.slice(2);
assert(archiveArg && toolsArg && workArg, 'Supply archive, tools prefix and a new private working directory');
const [archive, tools, work] = [archiveArg, toolsArg, workArg].map(p => path.resolve(p));
assert(!fs.existsSync(work), 'Use a new directory; existing environments are never overwritten');
fs.mkdirSync(work, { recursive: true, mode: 0o700 });
const bin = path.join(tools, 'node_modules/.bin');
const installed = path.join(work, 'installed');
const cold = path.join(work, 'recovered');
const fixture = path.join(work, 'fixture');
const password = randomBytes(30).toString('hex');
const env = {
  PATH: `${bin}:${process.env.PATH}`,
  PM2_HOME: path.join(work, 'pm2-home'),
  TMPDIR: work,
  APP_INITIAL_PASSWORD: password,
};
const results = { schemaVersion: 1, checkedAt: new Date().toISOString(), scenarios: [] };
function check(name, evidence) {
  results.scenarios.push({ name, ...evidence });
  fs.writeFileSync(path.join(work, 'results.json'), JSON.stringify(results, null, 2) + '\n');
  console.log(JSON.stringify({ name, ...evidence }));
}
function run(label, command, args, expected = 0, options = {}) {
  const r = spawnSync(command, args, { env, cwd: work, encoding: 'utf8', timeout: 300000, maxBuffer: 20e6, ...options });
  fs.writeFileSync(path.join(work, `${label}.stderr`), r.stderr ?? '', { mode: 0o600 });
  assert.equal(r.status, expected, `${label}: unexpected exit; inspect private stderr`);
  return r.stdout;
}
function installer(label, args, expected = 0) {
  const value = JSON.parse(run(label, path.join(bin, 'app-installer'), [...args, '--json'], expected));
  assert.equal(value.ok, expected === 0, label);
  return value;
}
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
function sealMigration(file, source) {
  fs.writeFileSync(file, source + '\n// @nocobase/task-manifest v1\n');
  const manifestPath = path.join(path.dirname(file), '.manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  manifest.files[path.basename(file)] = { sourceChecksum: sha(source), artifactChecksum: sha(fs.readFileSync(file)) };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
}
function pack(name, builtAt) {
  const file = path.join(fixture, 'dist/package.json');
  const p = JSON.parse(fs.readFileSync(file, 'utf8'));
  p.nocobase.builtAt = builtAt;
  fs.writeFileSync(file, JSON.stringify(p, null, 2));
  const target = path.join(work, name);
  run('pack-' + name, 'tar', ['-czf', target, '-C', fixture, '.']);
  return target;
}
async function freePort() {
  const server = createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  await new Promise(resolve => server.close(resolve));
  return port;
}
const port = await freePort(), recoveryPort = await freePort();
let base = `http://127.0.0.1:${port}/shop`, cookie = '';
async function request(route, body, authenticated = true) {
  const multipart = body instanceof FormData;
  return fetch(base + route, {
    method: body === undefined ? 'GET' : 'POST',
    headers: {
      Connection: 'close', Origin: new URL(base).origin,
      ...(authenticated ? { Cookie: cookie } : {}),
      ...(body === undefined || multipart ? {} : { 'Content-Type': 'application/json', 'Idempotency-Key': `${Date.now()}.${randomUUID()}` }),
    },
    body: body === undefined ? undefined : multipart ? body : JSON.stringify(body),
  });
}
async function login() {
  const r = await request('/api/auth/sign-in/username', { username: 'nocobase', password }, false);
  assert.equal(r.status, 200, 'native login');
  cookie = r.headers.getSetCookie().map(v => v.split(';')[0]).join('; ');
}
async function product(name) {
  const r = await request('/api/products', { name, priceCents: 1200 });
  assert.equal(r.status, 201);
  return (await r.json()).data;
}
async function upload(contents) {
  const form = new FormData();
  form.set('file', new File([contents], 'restore-point.txt', { type: 'text/plain' }));
  const r = await request('/api/recoveryFiles/uploadOne', form);
  assert.equal(r.status, 201, 'native File Repository upload');
  return (await r.json()).data.record;
}
async function health(expectedName) {
  const r = await request('/api/healthz');
  assert.equal(r.status, 200);
  assert.equal((await r.json()).app.name, expectedName, 'restored runtime configuration');
}
async function awaitHealth() {
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    try { if ((await request('/api/healthz')).ok) return; } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error('Application did not start');
}
async function stopped() {
  for (const p of [port, recoveryPort]) {
    await assert.rejects(fetch(`http://127.0.0.1:${p}/shop/api/healthz`, { signal: AbortSignal.timeout(500) }));
  }
}
function setName(name) {
  run('set-config', process.execPath, ['--env-file=' + path.join(installed, 'app.env'), path.join(installed, 'current/dist/cli/index.js'), 'config', 'set', `app.name=${name}`]);
}

try {
  results.baselineArchiveSha256 = sha(fs.readFileSync(archive));
  const packageVersion = name => JSON.parse(fs.readFileSync(path.join(tools, 'node_modules', name, 'package.json'), 'utf8')).version;
  results.versions = { node: process.version, installer: packageVersion('@nocobase/app-installer'), pm2: packageVersion('pm2') };
  assert.equal(results.versions.installer, '0.1.0-beta.10');
  assert.equal(results.versions.pm2, '6.0.14');
  fs.mkdirSync(fixture);
  run('unpack-original', 'tar', ['-xzf', archive, '-C', fixture]);
  const baseline = JSON.parse(fs.readFileSync(path.join(fixture, 'dist/package.json'), 'utf8'));
  assert.equal(baseline.nocobase.defaultTemplateVersion, '1.0.0-beta.85');
  results.template = baseline.nocobase.defaultTemplateVersion;
  sealMigration(path.join(fixture, 'dist/database/main/migrations/202611040001_recovery_files.js'), `import {defineMigration} from '@nocobase/db';
export default defineMigration({name:'202611040001_recovery_files',async up({builder}){await builder.createCollection('recoveryFiles',c=>{c.uuid('id').primary().notNull();c.string('disk',{length:255}).notNull();c.text('key').notNull();c.text('filename').notNull();c.string('ext',{length:32}).notNull();c.string('mimeType',{length:255}).notNull();c.bigInt('size').notNull();c.datetime('createdAt').notNull();c.datetime('updatedAt').notNull();});},async down({builder}){await builder.dropCollection('recoveryFiles');}});`);
  fs.writeFileSync(path.join(fixture, 'dist/server/routes/recovery-files.js'), `import {Hono} from 'hono';
import {authenticationToken} from '@nocobase/app-plugin-authentication';
import {defineApiRoutes,defineRootRoutes} from '@nocobase/app-server/router';
import {defineFileRepositoryApiRoutes} from '@nocobase/app-plugin-file/server';
const guard=scope=>app=>{const router=new Hono();router.use(scope,app.container.resolve(authenticationToken).required({scopedKeys:false}));return router;};
export default [defineApiRoutes(guard('/recoveryFiles/*')),defineRootRoutes(guard('/uploads/recovery/*')),...defineFileRepositoryApiRoutes({repositories:[{name:'recoveryFiles',collection:'recoveryFiles',disk:'local',accessPath:'/uploads/recovery',accessMode:'stream',policy:{read:{scope:true,fields:['id','filename','ext','mimeType','size','createdAt','updatedAt']},create:{scope:true},update:false,delete:false},actions:{uploadOne:{maxSize:10000},findOne:{}}}]})];`);
  const routesPath = path.join(fixture, 'dist/server/routes/index.js');
  fs.writeFileSync(routesPath, "import recovery from './recovery-files.js';\n" + fs.readFileSync(routesPath, 'utf8').replace('const routes = [', 'const routes = [...recovery,'));
  const releaseA = pack('a.tar.gz', '2026-11-01T14:00:00.000Z');
  installer('install', ['install', installed, '--archive', releaseA, '--origin', new URL(base).origin, '--base-path', '/shop', '--host', '127.0.0.1', '--port', String(port), '--name', 'recovery-original', '--set', 'app.name=Restore-A', '--set', 'app.sampleData=false', '--set-from-env', 'users.initialAdmin.password=APP_INITIAL_PASSWORD']);
  await login();
  const schema = await request('/api/swagger');
  assert.equal(schema.status, 200);
  assert((await schema.json()).paths['/api/recoveryFiles/uploadOne']);
  const anonymous = await request('/api/recoveryFiles/findOne', {filter:{id:randomUUID()}}, false);
  assert.equal(anonymous.status, 401);
  const a = await product('Point A'), fileA = await upload('Point A upload');
  sealMigration(path.join(fixture, 'dist/database/main/migrations/202611040002_recovery_probe.js'), `import {defineMigration} from '@nocobase/db';export default defineMigration({name:'202611040002_recovery_probe',async up({builder}){await builder.createCollection('recoveryProbe',c=>{c.string('id').primary().notNull();});},async down({builder}){await builder.dropCollection('recoveryProbe');}});`);
  const releaseB = pack('b.tar.gz', '2026-11-01T14:01:00.000Z');
  results.fixtureArchiveSha256 = { a: sha(fs.readFileSync(releaseA)), b: sha(fs.readFileSync(releaseB)) };
  const before = installer('status-before', ['status', '--dir', installed]).result.current;
  installer('upgrade', ['upgrade', '--dir', installed, '--archive', releaseB, '--yes']);
  await login();
  const b = await product('Point B'), fileB = await upload('Point B upload');
  setName('Restore-B');
  run('restart-B', path.join(bin, 'pm2'), ['restart', 'recovery-original']);
  await awaitHealth(); await login(); await health('Restore-B');
  run('stop-for-selected-backup', path.join(bin, 'pm2'), ['stop', 'recovery-original']);
  await stopped();
  const backup = path.join(work, 'point-B.tar.gz');
  run('selected-backup', 'tar', ['-czf', backup, '-C', installed, 'config.yml', 'app.env', 'storage']);
  run('restart-for-C', path.join(bin, 'pm2'), ['restart', 'recovery-original']);
  await awaitHealth(); await login();
  const c = await product('Point C'), fileC = await upload('Point C upload');
  setName('Restore-C');
  run('restart-C', path.join(bin, 'pm2'), ['restart', 'recovery-original']);
  await awaitHealth(); await login(); await health('Restore-C');
  const rollback = installer('snapshot-rollback', ['rollback', '--dir', installed, '--yes']);
  assert.equal(rollback.result.current ?? installer('snapshot-status', ['status', '--dir', installed]).result.current, before);
  await login();
  assert.equal((await request('/api/products/' + a.id)).status, 200);
  assert.equal((await request('/api/products/' + b.id)).status, 404);
  await health('Restore-C');
  check('installer-snapshot-A', { sqliteReturnedToA: true, selectedPointBAbsent: true, configurationStayedAtC: true });
  run('stop-before-full-restore', path.join(bin, 'pm2'), ['stop', 'recovery-original']);
  await stopped();
  fs.mkdirSync(cold);
  run('prepare-matching-code', 'tar', ['-xzf', releaseB, '-C', cold]);
  await stopped();
  run('restore-complete-selected-backup', 'tar', ['-xzf', backup, '-C', cold]);
  // This file contains only generated test environment/path settings. Never load run credentials.
  const envPath = path.join(cold, 'app.env');
  const text = fs.readFileSync(envPath, 'utf8').replaceAll(installed, cold).replaceAll(`:${port}`, `:${recoveryPort}`).replace(`APP_SERVER_PORT=${port}`, `APP_SERVER_PORT=${recoveryPort}`);
  fs.writeFileSync(envPath, text, { mode: 0o600 });
  await stopped();
  const cli = path.join(cold, 'dist/cli/index.js');
  for (const args of [['config','check','--connect'],['db','apply','--dry-run','--json'],['db','repair','--dry-run','--json']]) {
    run('cold-check-' + args[0] + '-' + args[1], process.execPath, ['--env-file=' + envPath, cli, ...args]);
  }
  await stopped();
  const {default: Database} = await import(pathToFileURL(path.join(cold, 'dist/node_modules/better-sqlite3/lib/index.js')));
  const db = new Database(path.join(cold, 'storage/database.sqlite'), { readonly: true });
  assert(db.prepare("select name from sqlite_master where name='recovery_probe'").get());
  assert(db.prepare('select id from catalog_products where id=?').get(b.id));
  assert(!db.prepare('select id from catalog_products where id=?').get(c.id));
  assert(db.prepare('select id from recovery_files where id=?').get(fileB.id));
  assert(!db.prepare('select id from recovery_files where id=?').get(fileC.id));
  db.close();
  check('cold-selected-point-B', { codePreparedBeforeRestore: true, bothServicesStoppedThroughoutRestore: true, databaseAndUploadMetadataAtB: true, laterWritesAbsent: true, noInstallerOperationAfterRestore: true });
  run('start-recovered', path.join(bin, 'pm2'), ['start', process.execPath, '--name', 'recovery-restored', '--interpreter', 'none', '--cwd', cold, '--kill-timeout', '60000', '--', '--env-file=' + envPath, './dist/server/standalone.js']);
  base = `http://127.0.0.1:${recoveryPort}/shop`;
  await awaitHealth(); await login(); await health('Restore-B');
  for (const [record, content] of [[fileA, 'Point A upload'], [fileB, 'Point B upload']]) {
    const r = await request(record.contentUrl.replace('/shop',''));
    assert.equal(r.status, 200); assert.equal(await r.text(), content);
  }
  assert.equal((await request('/api/products/' + b.id)).status, 200);
  assert.equal((await request('/api/products/' + c.id)).status, 404);
  assert.equal((await request(fileC.contentUrl.replace('/shop',''))).status, 404);
  assert.equal((await request(fileB.contentUrl.replace('/shop',''), undefined, false)).status, 401);
  check('restored-runtime-B', { nativeLogin: true, selectedRecordRetained: true, actualUploadedBytesMatchB: true, configurationMarkerAtB: true, postBackupRecordAndUploadAbsent: true, anonymousDownloadDenied: true });
  run('restart-recovered', path.join(bin, 'pm2'), ['restart', 'recovery-restored']);
  await awaitHealth(); await login(); await health('Restore-B');
  assert.equal(await (await request(fileB.contentUrl.replace('/shop',''))).text(), 'Point B upload');
  check('recovered-restart', { configurationAndUploadedFileRetained: true });
  results.passed = true;
} catch (error) {
  results.passed = false;
  results.failure = { message: error.message };
  process.exitCode = 1;
} finally {
  run('cleanup-pm2', path.join(bin, 'pm2'), ['kill']);
  fs.writeFileSync(path.join(work, 'results.json'), JSON.stringify(results, null, 2) + '\n');
}
