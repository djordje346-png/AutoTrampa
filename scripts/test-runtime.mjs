// Test-only native PostgreSQL. Dependencies live in an explicitly supplied
// external directory and never enter the production application bundle.
import { createRequire } from 'node:module';
import { randomBytes, randomUUID } from 'node:crypto';
import { execFile, execFileSync } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { createServer } from 'node:net';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

const runFile = promisify(execFile);
export async function startTestDb(runtimeDirectory) {
  const runtime = resolve(runtimeDirectory);
  const requireRuntime = createRequire(join(runtime, 'package.json'));
  const { default: EmbeddedPostgres } = await import(pathToFileURL(requireRuntime.resolve('embedded-postgres')));
  const { Client } = requireRuntime('pg');
  const server = createServer();
  await new Promise((done, fail) => { server.once('error', fail); server.listen(0, '127.0.0.1', done); });
  const port = server.address().port;
  await new Promise((done, fail) => server.close(error => error ? fail(error) : done()));
  const password = randomBytes(32).toString('hex');
  const databaseDir = join(runtime, `db-${randomUUID()}`);
  await mkdir(databaseDir, { recursive: true });
  const instance = new EmbeddedPostgres({
    databaseDir, user: 'postgres', password, port, persistent: true,
    createPostgresUser: false, authMethod: 'scram-sha-256',
    initdbFlags: ['--encoding=UTF8', '--locale=C'],
    postgresFlags: ['-c', 'listen_addresses=127.0.0.1'],
    onLog() {}, onError() {},
  });
  await instance.initialise();
  let pgCtl;
  if (process.platform === 'win32') {
    ({ pg_ctl: pgCtl } = await import(pathToFileURL(requireRuntime.resolve('@embedded-postgres/windows-x64'))));
    // pg_ctl restricts the Windows administrator token; no service/user setup.
    await runFile(pgCtl, ['-D', databaseDir, '-l', join(databaseDir, 'server.log'),
      '-o', `-p ${port} -h 127.0.0.1`, '-w', '-t', '30', 'start'], { windowsHide: true, timeout: 40000 });
  } else { await instance.start(); }
  let closed = false;
  const stopArgs = ['-D', databaseDir, '-w', '-t', '15', '-m', 'fast', 'stop'];
  const stopAtExit = () => {
    if (!closed && pgCtl) {
      try { execFileSync(pgCtl, stopArgs, { windowsHide: true, timeout: 20000, stdio: 'ignore' }); } catch {}
    }
  };
  process.once('exit', stopAtExit);
  return {
    connectionString: `postgresql://postgres:${password}@127.0.0.1:${port}/postgres`, Client,
    async close() {
      if (closed) return;
      if (pgCtl) await runFile(pgCtl, stopArgs, { windowsHide: true, timeout: 20000 });
      else await instance.stop();
      closed = true;
      process.removeListener('exit', stopAtExit);
    },
  };
}
