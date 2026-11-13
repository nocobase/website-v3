---
title: Multi-instance deployment
description: Review shared state and background tasks, add distributed plugins as needed, and run multiple instances with PM2 or Docker Compose.
---

To use more CPU cores, distribute requests, or keep serving users when one instance stops, you can run multiple instances of the same application behind a reverse proxy. These instances share a business database and a public URL; they are not separate, unrelated applications.

Starting more processes is only part of the work. If login state, background tasks, and real-time notifications remain local to each process, a user's next request may behave differently when it reaches another instance. Set up the state that needs to be shared before increasing the instance count.

The examples below start with two instances. Both the PM2 and Docker Compose examples run on a single server. They can use multiple CPU cores, but do not protect against failure of the entire server. Deploying across servers also requires planning for shared-service availability and load balancing. For the basic steps to build and deploy an existing application, see [Deploy with PM2](../tutorials/deploy-with-app-installer.md) and [Deploy with Docker](../tutorials/deploy-with-docker.md).

## Identify what the application needs to share before scaling

Do not decide what to change based only on installed packages. Check the application's dependencies, `server/plugins.ts`, `server/config/`, production configuration, and the services its business logic actually calls. Even if the business code does not use a capability directly, it may use it through authentication, mail, or notification plugins.

| Capability | Common uses | What happens if multiple instances keep using local implementations |
| --- | --- | --- |
| **Jobs** | Send notifications, process documents, synchronize mail outside a request, or run scheduled tasks | Pending tasks belong to one process and cannot be picked up by another instance. Each instance may trigger the same schedule independently. An abnormal exit may also lose tasks that have not been persisted. |
| **Queue** | Handle work that needs delays, priorities, rate limits, or message distribution | Instances do not share messages, deduplication records, or rate-limit counters, so they cannot consume from a shared queue. |
| **Caching** | Cache query results, temporary authentication state, and shared counters | State written or cleared by one instance is invisible to another. Login-related operations, cache refreshes, and usage limits may behave inconsistently. |
| **Realtime** | Notify users about new messages, task progress, or lists that need refreshing | Events reach only browsers connected to the same instance. Users connected to other instances do not receive the updates. |
| **Concurrency** | Prevent requests from handling the same resource simultaneously, such as updating the same inventory summary | A local lock protects only its own process. Two instances can each acquire a lock and still operate on the same resource at the same time. |
| **ID Generator (Snowflake)** | Generate numeric record IDs | Processes using the same `workerId` may generate duplicate IDs, causing failed writes or data conflicts. |

For example, an application with the authentication plugin needs its Caching configuration checked. Notifications, mail, Scheduler, and knowledge indexing may use Jobs; in-app messages and task progress may depend on Realtime. Queue and Jobs are separate capabilities: configuring one does not change the other.

Also check whether individual features select their own configuration. For example, `scheduler.jobs`, `notification.jobs`, `mail.jobs`, and `knowledge.jobs` can select a named Jobs backend. These features may keep using their original local backend even after you change `jobs.default`. Calls to caching, queue, and concurrency services may also select a configuration by name.

After the review, you should be able to list which features need cross-instance coordination, which backend each currently uses, and which settings need changing. Unused capabilities can remain as they are. Caches used only to optimize a single process, without holding shared state, do not all need to be migrated.

## Prepare shared services and runtime configuration

Before changing the application, prepare the resources that all instances will use:

- **Business database**: All instances connect to the same target database and use the same schema. Copying a single-instance example's SQLite file into two containers does not make it a shared database. If the application currently uses SQLite, first migrate to a database suitable for multi-instance access and install its driver before building. See [Database compatibility](../reference/compatibility.md) for connection settings.
- **Redis**: Provide accessible Redis services for the Jobs, Queue, Caching, Realtime, and Concurrency capabilities that need to be shared. Jobs and Queue require persistence and `maxmemory-policy noeviction` to prevent pending tasks from disappearing through memory eviction. Configure capacity, backups, and access controls as well; checking that the port is reachable is not enough.
- **File storage**: A file uploaded through instance A must be downloadable through instance B. Choose object storage or a shared filesystem supported by the application, and check which storage disk each existing file collection selects. Changing the default storage does not move existing files or change all explicitly selected disks. Attachments, import files, and other files needed by background tasks must not remain only on the instance that received the request.
- **Keys and public URL**: All instances retain the same `secrets.keys` and existing authentication and session keys, and use the same `APP_PUBLIC_ORIGIN` and `APP_BASE_PATH`. Do not initialize a separate configuration for each instance. Listening ports can differ, but the public URL remains the same, such as `https://apps.example.com/main/`.

The Redis examples below use `redis.internal:6379` to represent an address accessible to every instance. Replace it with your actual address. Inside a container, `127.0.0.1` refers to that container, not Redis on another machine or in another container.

All instances of the same application must use the same namespaces and cache prefixes. Test, staging, and production environments should each use different values. Namespaces prevent data from being mixed, but do not replace Redis account permissions or network isolation.

Throughout this guide, `config.yml` means the **production runtime configuration**. Merge the required sections into the existing file, preserving database, key, and business settings; do not replace the entire file with a snippet. Restrict read access to the service account and do not commit the file to the code repository. Environment variables may override values in the file, so run checks with the same environment as the actual processes. Writing `${REDIS_PASSWORD}` directly into the file does not automatically substitute the password. See the [Configuration reference](../reference/configuration.md) for ways to provide sensitive values.

> [!TIP]
> If the application also uses session storage from `@nocobase/session`, check `session.default` and select shared storage for sessions that need to work across instances. This is separate from the state the authentication plugin stores through Caching. Configuring Caching Redis does not change it automatically.

## Use an Agent to adapt and deploy the application

Use a development Agent in the application's source directory. Prepare access to the target server, database, Redis, file storage, and required commercial plugins in advance. Provide credentials securely, not in the prompt. The application's development and deployment Skills, together with plugin Skills synchronized after installation, provide integration instructions for the corresponding versions.

### Review the existing application

You can first ask the Agent to review the application without changing files:

```text
I want to deploy this application as two instances behind one public URL.
Please review the existing features and enabled plugins. Identify which background tasks, caches, real-time messages, and concurrent operations need to work across instances, and whether record ID generation needs changing.
Explain which features would be affected if we kept the current configuration, and which shared services and commercial plugins we need to prepare. Do not change or deploy anything yet.
```

When reviewing the results, look for coverage of actual business behavior, not just a list of packages. For example, could scheduled notifications be sent twice? Does a logged-in session still work when a request reaches another instance? Can another instance access uploaded files and task progress? If there are pending tasks or local files, clarify how they will be preserved and migrated.

### Configure and deploy multiple instances

Once the scope is agreed, provide the deployment target. The example below uses PM2. For containers, change the deployment method to Docker Compose and specify how to transfer the image, through a registry or an image file.

```text
Following the plan we agreed on, adapt this application to run as two instances and deploy it with PM2.

Server: <SSH user and address>
Deployment directory: <absolute path on the server>
Public URL: <for example, https://apps.example.com/main/>
Shared database, Redis, and file storage: <prepared services and how to obtain their credentials>
Allowed downtime: <maintenance window>

Preserve existing users, business data, files, and keys. Use the appropriate commercial plugins for the capabilities that need to be shared. Verify that the two instances work together before switching production traffic.
Check login, background processing, real-time updates, and file access. Also verify that one instance can still handle requests when the other is stopped. Tell me the results and any issues I need to address.
```

If the Agent cannot obtain compatible commercial plugins or connect to the server, it can prepare code and configuration separately, but that is not enough to add production instances. Make sure the handover includes actual verification results, not just configuration files or screenshots of running processes.

## Distributed plugins and configuration

### Install and register the required commercial plugins

Change dependencies and plugin registrations in the **application's source directory**, then rebuild. Do not install plugins directly inside a production container or an installer's release directory.

| Capability to change | Commercial plugin |
| --- | --- |
| Jobs | `@nocobase/app-plugin-jobs-redis` |
| Queue | `@nocobase/app-plugin-queue-redis` |
| Caching | `@nocobase/app-plugin-caching-redis` |
| Realtime | `@nocobase/app-plugin-realtime-redis` |
| Concurrency | `@nocobase/app-plugin-concurrency-redis` |
| Automatic Snowflake worker allocation | `@nocobase/app-plugin-snowflake-worker` |

Sign in to the commercial package registry with an account authorized to download the required packages. Skip this step if valid credentials are already configured:

```bash
pnpm login --registry=https://pkg-v3.nocobase.com/ --scope=@nocobase
```

Register the required plugins one by one based on the review. For Jobs, first check the available versions and their dependency requirements, then replace `<compatible-version>` with a version that matches the application:

```bash
pnpm view @nocobase/app-plugin-jobs-redis versions --json
pnpm view '@nocobase/app-plugin-jobs-redis@<compatible-version>' peerDependencies --json
pnpm nocobase plugin register @nocobase/app-plugin-jobs-redis --version '<compatible-version>'
```

Repeat the operation for other plugins using their full package names from the table. Do not assume that all plugins share the same version number or that a successful download proves compatibility. The application framework, commercial plugins, and configuration structures below must be compatible. For older applications, first follow [Upgrade NocoBase Core](../developing-apps/upgrade-nocobase-core.md).

You are replacing **the backends used by business features**, usually not uninstalling the existing open-source services:

- Keep the existing service providers for Caching, Jobs, Queue, ID Generator, and other services in `server/app.ts`.
- Keep the open-source `@nocobase/app-plugin-concurrency` and register `app-plugin-concurrency-redis` after it.
- Check the order in `server/plugins.ts`. Commercial backend plugins must precede the business plugins that use them. In particular, place Caching Redis before authentication and other plugins that access the cache during startup.
- The first five commercial plugins need only Server registration. Snowflake worker also needs CLI registration in `cli/plugins.ts`. Review the registration command's output and complete any manual changes it requests.

After registration, synchronize Skills and review changes to dependencies, the lockfile, and registration files:

```bash
pnpm nocobase skills sync
pnpm nocobase plugin inspect @nocobase/app-plugin-jobs-redis --json
```

Use other package names with `plugin inspect` as needed. Next, select each backend as described below. **Installing and registering plugins does not automatically switch in-memory configuration to Redis.**


### Jobs: coordinate background and scheduled tasks

Jobs handles one-off background work such as sending notifications and processing documents, as well as recurring tasks. With a shared backend, multiple instances can claim work from the same set of pending tasks instead of each maintaining its own task list.

Add a `shared` backend to the production configuration and select it:

```yaml
jobs:
  default: shared
  backends:
    shared:
      adapter: redis
      namespace: my-app-production
      connection:
        host: redis.internal
        port: 6379
        db: 0
      concurrency: 2
      attempts: 1
```

`concurrency: 2` is the concurrency of each executor on each instance, not a limit of two tasks across the whole application. When adding instances, reassess the workload that downstream systems such as the database and mail service can handle.

Check `scheduler.jobs`, `notification.jobs`, `mail.jobs`, and `knowledge.jobs`. When unspecified, they can use `jobs.default`. If they explicitly select `memory`, change them to `shared` or configure dedicated Redis backends for them. Changing the default does not override explicit selections.

Keep the existing Scheduler plugin; a separate Redis Scheduler is not needed. Keep `attempts` at `1` for the Jobs configuration used by Scheduler, and configure retries for other features according to their requirements. Tasks may still run again during failure recovery, so business logic must prevent duplicate charges, shipments, and similar effects.

### Queue: process messages across multiple instances

An application may use Queue for delayed execution, priorities, or shared rate limits. For example, it can enqueue outgoing messages and control how quickly they are sent. Queue does not share configuration with Jobs; only applications that actually use Queue need this section.

```yaml
queue:
  default: shared
  backends:
    shared:
      adapter: redis
      namespace: my-app-production
      connection:
        host: redis.internal
        port: 6379
        db: 0
      concurrency: 2
      attempts: 3
      backoff:
        type: exponential
        delay: 1000
```

Instances compete to consume messages from the same queue; each instance does not process every message. All instances must run compatible code and handlers so that an older version does not claim messages it cannot understand from a newer version.

Queue concurrency is also per instance. If the application uses `rateLimit`, that limit is shared by all instances consuming the same shared queue. For an existing Redis queue, preserve the connection, namespace, and queue name so that new instances do not join an empty queue. Do not clear an existing queue to reinitialize it.

> [!TIP]
> Mounting the same directory does not turn Jobs or Queue in-memory state files into a shared queue. Switching to Redis does not import those files automatically. Stop new task submissions first, then wait for existing tasks to finish, or plan migration and recovery actions appropriate to the business.

### Caching: share caches, login state, and counters

Caching is not always just a query optimization. The authentication plugin also uses it for authentication state and counters. Being able to open a page does not prove that login flows behave consistently across instances.

Add a Redis provider instead of changing the `driver` on the existing `memory` entry. This avoids carrying memory-only options such as `maxSize` and `useClone` into Redis:

```yaml
caching:
  default: shared
  providers:
    shared:
      driver: redis
      connection:
        host: redis.internal
        port: 6379
        db: 0
      keyPrefix: my-app-production
      defaultTtl: 5m
      connectTimeoutMs: 2000
      commandTimeoutMs: 5000
      shutdownTimeoutMs: 30000
```

Use the same `keyPrefix` across instances and different prefixes for other environments. If business code explicitly selects the `memory` provider, assess each use to decide whether it should select `shared`. Adding configuration under `providers` without selecting it does not change the default cache.

Redis caching stores JSON data. Code that previously cached `Date`, `Buffer`, or class instances in memory must convert them to a suitable storage representation and restore the required data types when reading. Set expiration times according to business needs; do not treat all application caches as permanent storage.

> [!TIP]
> A shared cache is not a distributed lock. A cache loader can combine duplicate requests within its own process, but does not prevent another instance from loading the same data simultaneously. Use Concurrency for operations that require cross-instance mutual exclusion.


### Realtime: deliver updates to users on different instances

If a background task finishes on instance A while the browser is connected to instance B, the Realtime Redis backend delivers the update across instances. Existing page subscriptions and business messages do not need to switch to a different API.

```yaml
realtime:
  namespace: my-app-production
  broker:
    adapter: redis
    setupTimeoutMs: 5000
    connection:
      host: redis.internal
      port: 6379
      db: 0
```

If an older application does not have `server/config/realtime.ts`, add the configuration factory and import and register `realtime` in `server/config/index.ts`:

```ts title="server/config/realtime.ts"
import { defineRealtimeConfig } from '@nocobase/app-server/realtime';

export default defineRealtimeConfig();
```

All instances use the same `realtime.namespace`. Redis Pub/Sub does not isolate messages by database number. Test and production still need different namespaces even if they use `db: 0` and `db: 1` respectively.

> [!TIP]
> Real-time messaging is not offline message storage. Updates sent while a browser is disconnected are not replayed automatically, so the page should reload business data after reconnecting. Deploying or stopping instances also disconnects WebSockets. Check that reconnection and data refresh work correctly.

### Concurrency: prevent instances from handling the same operation simultaneously

For example, an application uses a lock to protect an inventory summary. While instance A updates it, instance B should wait or return a busy response, rather than each acquiring a local lock and updating it at the same time.

Keep the existing Concurrency plugin and business calls, and switch only the selected backend:

```yaml
concurrency:
  default: shared
  backends:
    shared:
      adapter: redis
      namespace: my-app-production
      ttl: 10000
      connection:
        host: redis.internal
        port: 6379
        db: 0
        connectTimeout: 1000
        commandTimeout: 1000
```

Instances must use the same Redis database, namespace, and business lock name to compete for the same lock. If business code explicitly selects another configuration name, update that configuration as well.

`ttl` is the lock's validity period in milliseconds, and the plugin renews it automatically. It is not a maximum runtime for the business operation and does not forcibly stop the operation when it expires. A lock alone cannot ensure data correctness during network failures. Critical writes still need database constraints, transactions, and protection against duplicate processing.

### Snowflake: assign a distinct worker ID to each instance

Snowflake generates IDs locally and includes a `workerId` to distinguish the generating process. The open-source implementation also supports multiple instances, but you must manually assign distinct worker IDs to all processes generating IDs at the same time, and handle restarts and ID reuse correctly. PM2 process numbers and container names do not automatically become Snowflake worker IDs.

For automatic allocation, register the Server and CLI entries of `app-plugin-snowflake-worker`, and **replace** the existing `server/config/snowflake.ts` with:

```ts title="server/config/snowflake.ts"
import { defineSnowflakeWorkerConfig } from '@nocobase/app-plugin-snowflake-worker/config';

export default defineSnowflakeWorkerConfig();
```

Keep the existing `snowflake` configuration entry in `server/config/index.ts` and the original `IdGeneratorProvider` in `server/app.ts`. Do not also register the old Snowflake configuration factory.

Then enable automatic allocation:

```yaml
snowflake:
  mode: auto
  releasePolicy:
    strategy: manual
```

With `mode: auto`, the plugin uses the application's default database to allocate a distinct `workerId` to each process. Record IDs are still generated locally in each process. All instances must connect to the same allocation database. SQLite does not support automatic allocation and falls back to manual mode.

Keep the following in mind when deploying:

- **Available worker IDs**: There are 32 IDs (`0`–`31`). Running instances, old instances that have not yet exited during a rolling update, and management-command processes that need to generate record IDs all require a worker ID.
- **Releasing worker IDs**: A normal shutdown returns the worker ID. The example's `manual` policy does not automatically release allocations left by abnormal exits. Use `snowflake-worker list` to view allocations and `snowflake-worker inspect <worker-id>` for details. Once you have confirmed that a process has permanently stopped and will not restart automatically, use `snowflake-worker release <worker-id>` to release its allocation. This command previews the change by default; it requires the confirmation arguments and `--apply` to execute.
- **Clock synchronization**: Keep server clocks synchronized to prevent clock rollback from affecting ID generation.

## Start multiple instances

A multi-instance deployment runs several processes or containers of the same application. Users access one public entry point, and a reverse proxy distributes requests. All instances connect to the same business database, use the required shared Redis backends, and access the same business files. PM2 and Docker Compose change how processes are managed, not this shared architecture.

The following example uses two instances on one server, with the public URL `https://apps.example.com/main/`. Before deployment, distinguish shared resources from instance-specific settings:

| Item | Relationship between instances |
| --- | --- |
| Application code | Run the same version with the same plugins and business logic. |
| Database | Connect to the same business database instead of copying it for each instance. |
| Redis | Use the shared backends selected earlier. Keep connections, namespaces, or cache prefixes consistent for the same feature. |
| Business files | Use the same object storage or shared filesystem so that any instance can access uploads and task attachments. |
| Production configuration | Share database, Redis, file storage, key, and business settings in `config.yml`, along with the public domain and application path. |
| Instance runtime settings | Keep instance identifiers and local data directories separate, and avoid host-port conflicts. Use automatic Snowflake allocation or distinct manual worker IDs as described above. |

> [!TIP]
> An instance's local data directory is **not a shared upload directory**. Business files still use the shared storage listed above. Identical configuration files do not mean that local files are synchronized between instances.

**A single release procedure**

Follow this order with either deployment method:

1. Prepare deployment artifacts from the same version, production configuration, and instance directories. Confirm that every instance can access the shared services.
2. Complete backups. During the initial cutover, stop old instances from accepting new work and handle their pending tasks.
3. **Apply database updates once**, including new tables, fields, and required data changes. Do not run the updates separately as each instance starts.
4. After database updates succeed, start all instances, check their health, then connect them to the public entry point and verify business behavior.

To separate database updates from instance startup, disable automatic execution for every database connection that needs updates in the production configuration. The example below uses the `main` connection. Merge these fields into its existing configuration without overwriting its address or credentials:

```yaml
database:
  connections:
    main:
      migrations:
        autoRun: false
      seeds:
        autoRun: false
```

Database updates run as part of the release procedure. See the selected deployment method below for the commands. In the examples, `main` is the database connection name. If the application also manages schemas in other databases, run the updates once for each connection. Do not start new instances if an update fails. See [Release a new application version](publish-app-release.md) for backup, change review, and rollback requirements.

### Use PM2

Install Node.js 24 on the server and install PM2 globally. Run all commands below as the same service account. This example uses PM2 cluster mode: one application definition starts multiple workers that share port `13000`, with PM2 distributing connections. Use `pm2 scale` to adjust the worker count.

All workers read the same production configuration and use the shared services and automatic Snowflake allocation prepared earlier. The reverse proxy connects to `127.0.0.1:13000`, which remains unchanged when the worker count changes.

**1. Prepare the deployment directory**

Follow the instructions to [build and upload a deployment archive](../tutorials/deploy-with-app-installer.md), preparing complete artifacts for the server's platform. Create a deployment directory writable by the service account, such as `/srv/my-app`, and extract the archive:

```bash
mkdir -p /srv/my-app
cd /srv/my-app
tar -xzf /tmp/my-app.tar.gz
mkdir -p storage/cli logs
```

Place the prepared production configuration in `config.yml` and restrict read access to the service account. The directory contains the following files; create the two `.cjs` files in the next step:

| Path (relative to `/srv/my-app/`) | Purpose |
| --- | --- |
| `dist/` | Build artifacts and production dependencies shared by all workers. |
| `config.yml` | Production configuration shared by all workers. |
| `pm2-entry.cjs` | The entry point PM2 uses to start the application. |
| `ecosystem.config.cjs` | Application name, execution mode, worker count, and environment variables. |
| `storage/` | Local working directories for individual workers, plus `cli/` for management commands. |
| `logs/` | Process logs saved by PM2. |

**2. Configure the entry point and process management**

Create `pm2-entry.cjs`. It uses the `NODE_APP_INSTANCE` value assigned by PM2 to prepare a local directory for each worker, then starts the application by calling `startServer()` exported by the build output:

```js title="pm2-entry.cjs"
const { mkdirSync } = require('node:fs');
const path = require('node:path');

const worker = process.env.NODE_APP_INSTANCE ?? '0';
process.env.APP_STORAGE_DIR = path.join(__dirname, 'storage', `worker-${worker}`);
mkdirSync(process.env.APP_STORAGE_DIR, { recursive: true });

import('./dist/server/standalone.js')
  .then(({ startServer }) => startServer())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

Create `ecosystem.config.cjs`, replacing the domain and application path with your actual values:

```js title="ecosystem.config.cjs"
module.exports = {
  apps: [
    {
      name: 'my-app',
      cwd: __dirname,
      script: './pm2-entry.cjs',
      exec_mode: 'cluster',
      instances: 2,
      autorestart: true,
      kill_timeout: 60000,
      time: true,
      out_file: './logs/app.out.log',
      error_file: './logs/app.err.log',
      env: {
        NODE_ENV: 'production',
        NOCOBASE_STRICT_STARTUP: 'true',
        APP_CONFIG_FILE: `${__dirname}/config.yml`,
        APP_SERVER_HOST: '127.0.0.1',
        APP_SERVER_PORT: '13000',
        APP_PUBLIC_ORIGIN: 'https://apps.example.com',
        APP_BASE_PATH: '/main',
        APP_SAMPLE_DATA: 'false',
      },
    },
  ],
};
```

`exec_mode: 'cluster'` enables cluster mode, and `instances: 2` sets the initial worker count. All workers use the same configuration file, public URL, and listening port. The entry point sets their local directories separately. PM2 worker numbers distinguish these directories; record IDs are still generated by the Snowflake service.

**3. Check configuration and apply database updates**

In a terminal in the deployment directory, set the environment to match the application, then check the configuration:

```bash
export NODE_ENV=production
export APP_CONFIG_FILE="$PWD/config.yml"
export APP_STORAGE_DIR="$PWD/storage/cli"
export APP_PUBLIC_ORIGIN=https://apps.example.com
export APP_BASE_PATH=/main
export APP_SAMPLE_DATA=false

node dist/cli/index.js config check --connect
```

After the check passes and backups are complete, stop the old deployment during the maintenance window and apply database updates in the same terminal:

```bash
node dist/cli/index.js db apply --connection main --json
```

**4. Start the application and adjust the worker count**

Once database updates succeed, start the application and check its status:

```bash
pm2 start ecosystem.config.cjs
pm2 status
```

`pm2 status` should show two workers named `my-app` with an `online` status. Wait for each worker's logs to show that startup has completed, then check the health endpoint:

```bash
curl --fail http://127.0.0.1:13000/main/api/healthz
```

After the health check passes, verify business access through the public entry point and run `pm2 save` to save the current process list.

To run four workers:

```bash
pm2 scale my-app 4
pm2 status
```

To scale back to two workers, run `pm2 scale my-app 2`. After adjusting the count, check each worker's logs and business access. Set `instances` in `ecosystem.config.cjs` to the same target count for future deployments, then run `pm2 save` to save the current process list.

When setting up startup on boot for the first time, run `pm2 startup`, execute the system configuration command it prints, and save the process list again. Scaling down disconnects WebSocket connections on the workers being stopped; clients should be able to reconnect.

### Use Docker Compose

Install Docker and Docker Compose on the server. The example below defines one `app` service, starts two replicas from the same image, and uses `--scale` to adjust the replica count.

All replicas read the same production configuration. With the shared services and automatic Snowflake allocation configured above, they can coordinate business processing and obtain distinct Snowflake worker IDs.

**1. Prepare the image and deployment directory**

On a development machine or in a build environment, use an account authorized to download commercial plugins to build the application, then build the image. The following commands target Linux x64 with Node.js 24. Adjust them for other server platforms:

```bash
pnpm build --target linux-x64 --node-version 24
docker build --platform linux/amd64 --build-arg DIST=prebuilt -t my-app:multi-instance .
```

Follow the [image transfer steps](../tutorials/deploy-with-docker.md#transfer-the-image-through-a-registry-or-file) to send the image to the server. Create a deployment directory writable by the service account, for example:

```bash
mkdir -p /srv/my-app
cd /srv/my-app
```

Place the prepared production configuration in this directory. It contains the following files; create `compose.yml` in the next step:

| Path (relative to `/srv/my-app/`) | Purpose |
| --- | --- |
| `compose.yml` | The application service definition. |
| `config.yml` | Production configuration shared by all application replicas. |

Inside each container, `/app/storage` holds that replica's local working files. These files are lost when the container is recreated. Uploads, task attachments, and other content that must persist should use the object storage or shared filesystem prepared earlier. If using a shared filesystem, add a mount for the business-file directory to the Compose configuration below.

The template image runs as a user with UID `1000`. In the deployment directory, set permissions so that this user can read the production configuration:

```bash
sudo chown 1000:1000 config.yml
sudo chmod 600 config.yml
```

**2. Configure a scalable application service**

Create `compose.yml` in the deployment directory, replacing the image name, domain, and application path with your actual values:

```yaml title="compose.yml"
services:
  app:
    image: my-app:multi-instance
    init: true
    restart: unless-stopped
    stop_grace_period: 60s
    environment:
      APP_CONFIG_FILE: /app/config.yml
      APP_STORAGE_DIR: /app/storage
      APP_SERVER_HOST: 0.0.0.0
      APP_SERVER_PORT: '13000'
      APP_PUBLIC_ORIGIN: https://apps.example.com
      APP_BASE_PATH: /main
      APP_SAMPLE_DATA: 'false'
    ports:
      - target: 13000
        host_ip: 127.0.0.1
    volumes:
      - ./config.yml:/app/config.yml:ro
```

Each replica listens on port `13000` inside its container. Docker automatically assigns a different host port to each replica. `host_ip: 127.0.0.1` restricts these ports to local access for a reverse proxy on the same host. All replicas mount the same `config.yml` as read-only.

Check the Compose configuration:

```bash
docker compose -p my-app config --quiet
```

**3. Apply database updates**

Run the following command in the deployment directory. Compose starts a temporary container using the `app` image and production configuration, then removes the container after the database updates finish:

```bash
docker compose -p my-app run --rm --no-deps app \
  node dist/cli/index.js db apply --connection main --json
```

**4. Start and scale to the required replica count**

After database updates succeed, start two application replicas:

```bash
docker compose -p my-app up -d --scale app=2 --wait --wait-timeout 180
docker compose -p my-app ps
```

`--scale app=2` specifies two replicas, and `--wait` waits up to 180 seconds for them to pass their health checks. After the command succeeds, `ps` should show two healthy `app` replicas, with their host ports in the `PORTS` column. Add these addresses to your existing reverse proxy, then verify business access.

To run four replicas, set the count to `4`:

```bash
docker compose -p my-app up -d --scale app=4 --wait --wait-timeout 180
```

To scale back to two replicas, use `--scale app=2`. Keep specifying the required replica count on subsequent deployments.

After scaling or recreating containers, check each replica's status and actual port, update the reverse proxy's backend list, and verify business access. Scaling down disconnects WebSocket connections on the replicas being stopped; clients should be able to reconnect.


## Verify cross-instance access and business processing

A passing configuration check only means that the configuration and connections within its scope reported no errors. A passing health check only shows that an instance has started. Neither proves that tasks, messages, and state are shared across instances.

Start with two instances in a test environment and perform the checks below. If the instances have separate backend ports, you can temporarily route the proxy only to A, complete an operation, then route only to B. With PM2 cluster's shared port, use each worker's request logs to confirm that different processes handle the requests. Keep the same public URL and browser session throughout.

| Check | Expected result |
| --- | --- |
| Login and permissions | Log in through A, then confirm that access still works when requests reach B. Restrictions on ordinary users remain unchanged, and other instances no longer accept an invalidated session after logout. |
| Caches and counters | Shared state updated or invalidated through A is reflected on B. Switching instances does not give an operation with a shared limit a separate allowance. |
| Jobs and Queue | Test work submitted through one instance can be processed by another. Recurring tasks do not run twice independently just because there are two instances. Verify business outcomes, not only successful submission. |
| Realtime | A browser connected to B receives notifications or progress updates produced on A. After disconnection and reconnection, the page can reload the latest state. |
| Concurrency | Simultaneous requests from both instances to the same protected resource do not enter a mutually exclusive operation at the same time. Waiting, busy responses, and retries follow the business rules. |
| Snowflake | In automatic mode, running instances obtain distinct worker IDs, and concurrent record creation produces no ID conflicts. |
| Files | A file uploaded through A can be downloaded through B, with permission checks still enforced. Background tasks can also read the files they need. |
