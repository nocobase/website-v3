import { permissionWorkspaceCatalog } from '../../client/pages/settings/permission-workspace.js';
import type { AuthorizationOptionsResponse } from '@nocobase/app-plugin-authorization/client';
import { randomUUID } from 'node:crypto';
import { expect } from 'vitest';
import { createAppTest } from '@nocobase/app-testing/server';
import {
  signIn,
  DEFAULT_ADMIN_CREDENTIALS,
} from '@nocobase/app-plugin-authentication/testing';
import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication/server';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { selection } from '@nocobase/authorization/core';
import { databaseManagerToken } from '@nocobase/db';
import { projectPermissions } from '../../server/providers/tutorial-projects.js';
import { taskPermissions } from '../../server/providers/tutorial-tasks.js';
import { createStandaloneServer } from '../../server/standalone.js';

const test = createAppTest({
  createServer: createStandaloneServer,
  connections: ['main'],
  config: {
    app: { publicOrigin: 'http://localhost' },
    auth: {
      secret: 'project-api-test-secret-at-least-32-characters',
      advanced: { disableOriginCheck: false, disableCSRFCheck: false },
    },
    users: { initialAdmin: DEFAULT_ADMIN_CREDENTIALS },
    logging: { enabled: false },
  },
});
const json = (method: string, value: unknown) => ({
  method,
  headers: { 'content-type': 'application/json', origin: 'http://localhost' },
  body: JSON.stringify(value),
});

// Every case uses the real application, authentication and authorization services.
test('rejects anonymous and ungranted callers before validating their input', async ({
  testApp,
  request,
}) => {
  for (const [path, init] of [
    ['/tutorialProjects', undefined],
    ['/tutorialProjects', json('POST', { name: '' })],
    ['/tutorialTasks/not-an-id/project', json('PATCH', {})],
  ] as const)
    expect((await request(path, init)).status).toBe(401);
  const users = testApp.application.container.resolve(
    userAdministrationServiceToken,
  );
  const credentials = {
    email: 'ungranted-project@example.test',
    password: 'project-test-password',
  };
  await users.create({ name: 'No project grants', ...credentials });
  const member = await signIn(testApp, credentials);
  expect((await member.fetch('/tutorialProjects')).status).toBe(403);
  expect(
    (await member.fetch('/tutorialProjects', json('POST', { name: '' })))
      .status,
  ).toBe(403);
  expect(
    (await member.fetch('/tutorialTasks/not-an-id/project', json('PATCH', {})))
      .status,
  ).toBe(403);
});

test('creates validated projects and returns stable paged DTOs', async ({
  testApp,
}) => {
  const admin = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
  const db = testApp.application.container.resolve(databaseManagerToken);
  const before = await db.repository('tutorialProjects').count();
  for (const input of [
    { name: '' },
    { name: '   ' },
    { name: 'x'.repeat(121) },
    { name: 'Injected', id: randomUUID() },
  ]) {
    const response = await admin.fetch(
      '/tutorialProjects',
      json('POST', input),
    );
    expect(response.status).toBe(400);
  }
  expect(await db.repository('tutorialProjects').count()).toBe(before);
  const response = await admin.fetch(
    '/tutorialProjects',
    json('POST', { name: '  Product launch  ' }),
  );
  expect(response.status).toBe(201);
  const { data } = (await response.json()) as {
    data: { id: string; name: string; createdAt: string };
  };
  expect(data.name).toBe('Product launch');
  expect(Object.keys(data).sort()).toEqual(['createdAt', 'id', 'name']);
  expect(new Date(data.createdAt).toISOString()).toBe(data.createdAt);
  expect(
    await db
      .repository('tutorialProjects')
      .findOne({ filter: { id: data.id } }),
  ).toMatchObject({ name: data.name });
  const page = await admin.fetch('/tutorialProjects?page=1&pageSize=1');
  expect(await page.json()).toMatchObject({
    data: [data],
    meta: { page: 1, pageSize: 1, total: before + 1 },
  });
  for (const query of ['page=0', 'pageSize=101', 'pageSize=abc'])
    expect((await admin.fetch(`/tutorialProjects?${query}`)).status).toBe(400);
});

test('changes and clears a task project without changing other task fields', async ({
  testApp,
}) => {
  const admin = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
  const created = await admin.fetch(
    '/tutorialProjects',
    json('POST', { name: 'Assignment project' }),
  );
  const projectId = ((await created.json()) as { data: { id: string } }).data
    .id;
  const task = await admin.fetch(
    '/tutorialTasks',
    json('POST', { title: 'Prepare materials', dueDate: '2026-11-01' }),
  );
  const taskId = ((await task.json()) as { data: { id: string } }).data.id;
  const db = testApp.application.container.resolve(databaseManagerToken);
  const path = `/tutorialTasks/${taskId}/project`;
  for (const id of [projectId, null]) {
    const response = await admin.fetch(path, json('PATCH', { projectId: id }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      data: { id: taskId, projectId: id },
    });
    const listing = await admin.fetch('/tutorialTasks?q=Prepare%20materials');
    expect(await listing.json()).toMatchObject({
      data: [expect.objectContaining({ id: taskId, projectId: id })],
    });
    expect(
      await db.repository('tutorialTasks').findOne({ filter: { id: taskId } }),
    ).toMatchObject({
      title: 'Prepare materials',
      completed: false,
      dueDate: '2026-11-01',
      projectId: id,
    });
  }
  const missing = await admin.fetch(
    path,
    json('PATCH', { projectId: randomUUID() }),
  );
  expect(missing.status).toBe(400);
  expect(await missing.json()).toMatchObject({
    error: {
      reason: 'PROJECT_UNAVAILABLE',
      fieldViolations: [{ field: 'projectId' }],
    },
  });
  expect(
    (
      await admin.fetch(
        `/tutorialTasks/${randomUUID()}/project`,
        json('PATCH', { projectId }),
      )
    ).status,
  ).toBe(404);
  for (const input of [
    {},
    { projectId: 'invalid' },
    { projectId, completed: true },
  ])
    expect((await admin.fetch(path, json('PATCH', input))).status).toBe(400);
  expect(
    await db.repository('tutorialTasks').findOne({ filter: { id: taskId } }),
  ).toMatchObject({ projectId: null, completed: false });
});

test('applies separate task and project scopes without borrowing broader read grants', async ({
  testApp,
}) => {
  const users = testApp.application.container.resolve(
    userAdministrationServiceToken,
  );
  const credentials = {
    email: 'scoped-project@example.test',
    password: 'project-test-password',
  };
  const user = await users.create({ name: 'Project operator', ...credentials });
  const member = await signIn(testApp, credentials);
  const db = testApp.application.container.resolve(databaseManagerToken);
  const projectIds = [randomUUID(), randomUUID()];
  const taskIds = [randomUUID(), randomUUID()];
  for (const id of projectIds)
    await db
      .repository('tutorialProjects')
      .createOne({ values: { id, name: id, createdAt: new Date() } });
  for (const id of taskIds)
    await db.repository('tutorialTasks').createOne({
      values: {
        id,
        title: 'Scoped task',
        completed: false,
        updatedAt: new Date(),
      },
    });
  const authz = testApp.application.container.resolve(authorizationToken);
  await authz.permissionSets.create({
    key: 'project-operator',
    grants: [
      projectPermissions.reference().grant({
        read: { projects: selection.records(projectIds) },
        assignTask: {
          projects: selection.records([projectIds[0]]),
          tasks: selection.records([taskIds[0]]),
        },
      }),
    ],
  });
  await authz.permissionSets.assign({
    id: 'project-operator-user',
    permissionSet: 'project-operator',
    subject: { type: 'user', id: user.id },
  });
  const list = await member.fetch('/tutorialProjects?pageSize=1');
  const body = (await list.json()) as {
    data: unknown[];
    meta: { total: number };
  };
  expect(list.status).toBe(200);
  expect(body.data).toHaveLength(1);
  expect(body.meta.total).toBe(2);
  expect(
    (
      await member.fetch(
        '/tutorialProjects',
        json('POST', { name: 'Forbidden' }),
      )
    ).status,
  ).toBe(403);
  const assign = (taskId: string, projectId: string) =>
    member.fetch(
      `/tutorialTasks/${taskId}/project`,
      json('PATCH', { projectId }),
    );
  expect((await assign(taskIds[0], projectIds[0])).status).toBe(200);
  const hidden = await assign(taskIds[0], projectIds[1]);
  expect(hidden.status).toBe(400);
  expect(await hidden.json()).toMatchObject({
    error: {
      reason: 'PROJECT_UNAVAILABLE',
      fieldViolations: [{ field: 'projectId' }],
    },
  });
  expect((await assign(taskIds[1], projectIds[0])).status).toBe(404);
  expect(
    await db
      .repository('tutorialTasks')
      .findOne({ filter: { id: taskIds[0] } }),
  ).toMatchObject({ projectId: projectIds[0] });
  expect(
    await db
      .repository('tutorialTasks')
      .findOne({ filter: { id: taskIds[1] } }),
  ).toMatchObject({ projectId: null });
  await authz.permissionSets.delete('project-operator');
  expect((await assign(taskIds[0], projectIds[0])).status).toBe(403);
});

test('does not let task completion grants change a project assignment', async ({
  testApp,
}) => {
  const users = testApp.application.container.resolve(
    userAdministrationServiceToken,
  );
  const credentials = {
    email: 'task-completer@example.test',
    password: 'project-test-password',
  };
  const user = await users.create({ name: 'Task completer', ...credentials });
  const member = await signIn(testApp, credentials);
  const authz = testApp.application.container.resolve(authorizationToken);
  await authz.permissionSets.create({
    key: 'task-completer',
    grants: [
      taskPermissions.reference().grant({ update: { tasks: 'allRecords' } }),
    ],
  });
  await authz.permissionSets.assign({
    id: 'task-completer-user',
    permissionSet: 'task-completer',
    subject: { type: 'user', id: user.id },
  });
  const id = randomUUID();
  const db = testApp.application.container.resolve(databaseManagerToken);
  await db.repository('tutorialTasks').createOne({
    values: {
      id,
      title: 'Complete only',
      completed: false,
      updatedAt: new Date(),
    },
  });
  expect(
    (
      await member.fetch(
        `/tutorialTasks/${id}`,
        json('PATCH', { completed: true }),
      )
    ).status,
  ).toBe(200);
  expect(
    (
      await member.fetch(
        `/tutorialTasks/${id}/project`,
        json('PATCH', { projectId: null }),
      )
    ).status,
  ).toBe(403);
  expect(
    (
      await member.fetch(
        `/tutorialTasks/${id}`,
        json('PATCH', { projectId: randomUUID() }),
      )
    ).status,
  ).toBe(400);
});

test('publishes all endpoints and input schemas in the authenticated API document', async ({
  testApp,
}) => {
  const admin = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
  const response = await admin.fetch('/swagger');
  expect(response.status).toBe(200);
  const document = (await response.json()) as {
    paths: Record<
      string,
      Record<string, { operationId: string; requestBody?: unknown }>
    >;
  };
  const projectPath = Object.keys(document.paths).find((p) =>
    p.endsWith('/tutorialProjects'),
  )!;
  const taskPath = Object.keys(document.paths).find((p) =>
    p.endsWith('/tutorialTasks/{id}/project'),
  )!;
  expect(document.paths[projectPath].get.operationId).toBe(
    'listTutorialProjects',
  );
  expect(document.paths[projectPath].post.operationId).toBe(
    'createTutorialProject',
  );
  expect(document.paths[projectPath].post.requestBody).toBeDefined();
  expect(document.paths[taskPath].patch.operationId).toBe(
    'assignTutorialTaskProject',
  );
  expect(document.paths[taskPath].patch.requestBody).toBeDefined();
});

test('exposes project actions in the actual permission editor catalog', async ({
  testApp,
}) => {
  const admin = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
  const response = await admin.fetch('/authorization/permissionSets/options');
  expect(response.status).toBe(200);
  const { data } = (await response.json()) as {
    data: AuthorizationOptionsResponse;
  };
  const catalog = permissionWorkspaceCatalog(data, [], []);
  const project = catalog.sections
    .flatMap((section) => section.subsections)
    .flatMap((section) => section.resources ?? [])
    .find((resource) => resource.id === 'tutorial.projects');
  expect(project?.actions.map((action) => action.name)).toEqual([
    'read',
    'create',
    'assignTask',
  ]);
});
