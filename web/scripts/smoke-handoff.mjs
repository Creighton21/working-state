import assert from 'node:assert/strict'
import { execFile, spawn } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { chromium } from 'playwright'

const java = process.env.JAVA_HOME ? join(process.env.JAVA_HOME, 'bin', 'java') : 'java'
const jar = process.argv[2] ? resolve(process.argv[2])
  : fileURLToPath(new URL('../../backend/target/working-state-0.1.0-SNAPSHOT.jar', import.meta.url))
const directory = await mkdtemp(join(tmpdir(), 'working-state-handoff-'))
const username = 'smoke-owner'
const password = 'disposable handoff workspace'
const env = {
  ...process.env,
  SPRING_APPLICATION_JSON: JSON.stringify({
    'workspace.data-dir': directory,
    'workspace.owner.username': username,
    'workspace.owner.password': password,
    'server.servlet.session.cookie.secure': false,
  }),
}
const javaArgs = ['-jar', jar]
const server = spawn(java, [...javaArgs, '--server.address=127.0.0.1', '--server.port=0'], { env })
let logs = ''
server.stdout.on('data', chunk => { logs += chunk })
server.stderr.on('data', chunk => { logs += chunk })
const stopped = new Promise(resolve => server.once('close', resolve))
let launchError
server.on('error', error => { launchError = error })
let browser

try {
  let port
  for (let attempt = 0; attempt < 300 && !port; attempt++) {
    if (launchError) throw launchError
    if (server.exitCode !== null) break
    port = logs.match(/Tomcat started on port (\d+)/)?.[1]
    if (!port) await delay(100)
  }
  assert(port, 'Workspace did not start:\n' + logs)
  const origin = 'http://127.0.0.1:' + port
  const installation = 'Handoff smoke agent'
  const { stdout } = await promisify(execFile)(java, [...javaArgs, 'agent', 'issue', installation], { env, timeout: 30_000 })
  const token = stdout.match(/^Token: (\S+)$/m)?.[1]
  assert(token, 'Credential command did not issue a token')

  async function agent(path, method, payload, status) {
    const response = await fetch(origin + '/api/v1' + path, {
      method,
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    })
    assert.equal(response.status, status, method + ' ' + path)
    return response.json()
  }

  browser = await chromium.launch()
  const page = await browser.newPage()
  const title = 'Verify the handoff'
  await page.goto(origin)
  await page.getByLabel('Username').fill(username)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.getByRole('button', { name: 'New task' }).click()
  await page.getByLabel('Title', { exact: true }).fill(title)
  await page.getByRole('button', { name: 'Create task' }).click()
  await page.getByRole('heading', { name: title }).waitFor()
  const path = new URL(page.url()).pathname
  assert.match(path, /^\/tasks\/[^/]+$/)

  const task = await agent(path, 'GET', undefined, 200)
  assert.equal(task.status, 'todo')
  const updated = await agent(path, 'PATCH', { status: 'in_progress', expectedVersion: task.version }, 200)
  assert.equal(updated.status, 'in_progress')
  assert.equal(updated.version, task.version + 1)
  const older = await agent(path + '/activity', 'POST', { body: 'Started the handoff.' }, 201)
  const newer = await agent(path + '/activity', 'POST', { body: 'Ready for the next step.' }, 201)
  assert.notEqual(older.id, newer.id)

  await page.getByRole('button', { name: 'Close task' }).click()
  const updates = page.getByRole('region', { name: 'Latest updates' }).getByRole('link')
  await updates.nth(1).waitFor()
  assert.equal(await updates.nth(0).getAttribute('href'), path + '?activity=' + newer.id)
  assert.equal(await updates.nth(1).getAttribute('href'), path + '?activity=' + older.id)
  await updates.nth(1).click()
  const selected = page.locator('.note[aria-current=true]')
  await selected.waitFor()
  assert.equal(await selected.count(), 1)
  assert.equal(await selected.getAttribute('id'), 'note-' + older.id)
  assert.equal(await selected.locator('p').textContent(), older.body)
  assert.equal(await selected.locator('strong').textContent(), installation)
  await page.getByText('In progress', { exact: true }).waitFor()
  console.log('Handoff passed: browser task, agent status and notes, and exact older note from Home.')
} finally {
  try {
    await browser?.close()
  } finally {
    server.kill()
    await stopped
    await rm(directory, { recursive: true, force: true })
  }
}
