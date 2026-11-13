---
title: 多实例部署
description: 检查应用的共享状态与后台任务，按需接入分布式插件，并使用 PM2 或 Docker Compose 运行多个实例。
---

当一个应用需要利用更多 CPU 核心、分担请求，或在停止一个实例时继续提供服务，可以让同一份应用运行多个实例，由反向代理把请求分配给它们。这些实例使用同一个业务数据库和访问地址，不是几套互不相关的应用。

多启动几个进程只是其中一步。登录状态、后台任务和实时通知如果仍各自保存在进程内，用户的下一次请求落到另一个实例时，就可能得到不同的结果。先处理需要共享的状态，再增加实例数量。

下面以两个实例为例。PM2 和 Docker Compose 示例都运行在一台服务器上，可以利用多个 CPU 核心，但不能抵御整台服务器故障；跨服务器部署时，仍需安排共享服务的可用性和负载均衡。已有应用的基本构建与部署步骤见[使用 PM2 部署](../tutorials/deploy-with-app-installer.md)和[使用 Docker 部署](../tutorials/deploy-with-docker.md)。

## 扩容前，检查应用需要共享哪些能力

不要仅凭已安装的包决定改造范围。先检查应用的依赖、`server/plugins.ts`、`server/config/`、生产配置，以及业务实际调用的服务。业务代码没有直接使用某项能力，也可能通过认证、邮件或通知插件间接使用了它。

| 能力 | 常见用途 | 多实例仍使用本地实现时会怎样 |
| --- | --- | --- |
| **Jobs** | 在请求之外发送通知、处理文档、同步邮件，或按时间执行任务 | 待处理任务只属于某个进程，其他实例不能接手；各实例可能分别触发同一条定时规则。异常退出还可能丢失尚未持久化的任务。 |
| **Queue** | 处理需要延迟、优先级、限速或消息分发的工作 | 实例之间不共享消息、去重记录和限速计数，无法组成共同消费的队列。 |
| **Caching** | 缓存查询结果、认证临时状态，以及共享计数 | 一个实例写入或清除的状态，另一个实例看不到；登录相关操作、缓存刷新和次数限制可能表现不一致。 |
| **Realtime** | 通知用户有新消息、任务进度变化或列表需要刷新 | 事件只能到达连接在同一个实例上的浏览器；连接在其他实例上的用户收不到更新。 |
| **Concurrency** | 防止多个请求同时处理同一资源，例如同时更新同一份库存汇总 | 本地锁只能约束本进程。两个实例各自取得锁后，仍可能同时操作同一资源。 |
| **ID Generator（Snowflake）** | 为记录生成数值 ID | 多个进程使用相同的 `workerId` 时可能生成重复 ID，导致写入失败或数据冲突。 |

例如，应用启用了认证插件，就要检查它使用的 Caching；通知、邮件、Scheduler 和知识索引可能使用 Jobs；站内消息和任务进度可能依赖 Realtime。Queue 与 Jobs 是两项独立能力，配置了其中一项不会改变另一项。

还要检查业务是否指定了单独的配置。例如，`scheduler.jobs`、`notification.jobs`、`mail.jobs` 和 `knowledge.jobs` 可以选择某个命名的 Jobs 后端。即使改了 `jobs.default`，这些业务仍可能继续使用原来的本地后端。缓存、队列和并发控制的业务调用也可能明确选择了某个配置名。

检查完成后，应能列出“哪些业务需要跨实例协作、当前用了哪个后端、要改哪项配置”。不使用的能力可以保持不变；只用于本进程优化、不承载共享状态的缓存也不必全部迁移。

## 准备共享服务和运行配置

在改动应用之前，先准备好各实例共同使用的资源：

- **业务数据库**：所有实例连接同一个目标数据库，并使用一致的表结构。不要把单实例示例中的 SQLite 文件复制到两个容器后当作共享数据库。若现有应用使用 SQLite，先完成到适合多实例访问的数据库的迁移，并在构建前安装对应驱动；连接参数见[数据库兼容性](../reference/compatibility.md)。
- **Redis**：为需要共享的 Jobs、Queue、Caching、Realtime 和 Concurrency 准备可访问的 Redis。Jobs 和 Queue 需要持久化，并使用 `maxmemory-policy noeviction`，避免待处理任务因为内存淘汰而消失。容量、备份和访问控制也需要配置，不能只确认端口可连。
- **文件存储**：用户经由实例 A 上传的文件，必须能从实例 B 下载。选择应用支持的对象存储或共享文件系统，并检查已有文件表实际选择的存储盘。仅修改默认存储不会搬走旧文件，也不会改变所有显式指定的存储盘。后台任务需要读取的附件、导入文件等，同样不能只留在提交请求的实例本地。
- **密钥和访问地址**：各实例沿用同一套 `secrets.keys` 及已有的认证、会话密钥，使用相同的 `APP_PUBLIC_ORIGIN` 和 `APP_BASE_PATH`。不要为每个实例重新初始化一套配置。监听端口可以不同，但对外仍是同一个地址，例如 `https://apps.example.com/main/`。

下面的 Redis 示例使用 `redis.internal:6379`，表示实例都能访问的 Redis 地址；请替换为实际地址。容器里的 `127.0.0.1` 是容器自己，不能用它连接另一台机器或另一个容器中的 Redis。

同一应用的所有实例要使用相同的命名空间和缓存前缀；测试、预发布、生产环境则应分别设置。命名空间用于避免数据混用，不代替 Redis 账号权限和网络隔离。

下文中的 `config.yml` 均指**生产运行配置**。在原配置中合并所需部分，保留数据库、密钥和业务设置，不用片段覆盖整个文件。配置文件限制为服务账号可读，不提交到代码仓库。环境变量可能覆盖文件中的值，检查时要使用与实际进程相同的环境；直接写入 `${REDIS_PASSWORD}` 不会自动替换成密码。敏感值的输入方式见[配置项参考](../reference/configuration.md)。

> [!TIP]
> 如果应用另外使用了 `@nocobase/session` 的会话存储，也要检查 `session.default`，为需要跨实例共享的会话选择共享存储。它与认证插件通过 Caching 使用的状态不是同一项配置，设置了 Caching Redis 并不会自动修改它。

## 使用 Agent 完成改造与部署

在应用源码目录中使用开发 Agent。提前准备目标服务器、数据库、Redis、文件存储和所需商业插件的访问权限，凭据通过安全方式提供，不放进提示词。应用自身的开发、部署 Skills，以及安装后同步的插件 Skills，提供对应版本的接入说明。

### 检查现有应用

可以先只让 Agent 检查，不改文件：

```text
我准备把这个应用部署为两个实例，共用一个访问地址。
请先检查现有业务和已启用的插件，看看哪些后台任务、缓存、实时消息和并发操作需要跨实例共享，记录 ID 是否也需要调整。
说明保持当前配置会影响哪些功能，以及需要准备哪些共享服务和商业插件。先不要修改或部署。
```

查看结果时，重点确认实际业务是否被覆盖，而不只是得到一份包名列表。例如，定时通知是否会重复发送，登录后请求换到另一个实例是否仍有效，上传文件和任务进度是否能被另一实例读取。已有待处理任务或本地文件的，还应明确如何保留和迁移。

### 配置并部署多个实例

确认改造范围后，再给出部署目标。下面以 PM2 为例；使用容器时，将部署方式改为 Docker Compose，并提供镜像仓库或镜像文件传输方式。

```text
请按刚才确认的方案，把这个应用改为两个实例运行，并使用 PM2 部署。

服务器：<SSH 用户和地址>
部署目录：<服务器上的绝对路径>
访问地址：<例如 https://apps.example.com/main/>
共享数据库、Redis 和文件存储：<已准备的服务及凭据获取方式>
允许停机时间：<维护时间段>

保留现有用户、业务数据、文件和密钥。把需要共享的能力接入相应商业插件，先验证两个实例能协作，再切换正式访问。
请检查登录、后台处理、实时更新和文件访问，并验证停掉一个实例后另一个仍能处理请求。告诉我检查结果和需要我处理的问题。
```

Agent 无法获取兼容的商业插件，或无法连接服务器时，可以先完成独立的代码与配置准备，但还不能据此增加生产实例。确认交付的是实际验证结果，而不是只有配置文件或进程启动截图。

## 分布式插件与配置

### 安装并注册所需的商业插件

在**应用源码目录**完成依赖和注册修改，再重新构建。不要进入生产容器或安装器的 release 目录临时安装插件。

| 需要调整的能力 | 商业插件 |
| --- | --- |
| Jobs | `@nocobase/app-plugin-jobs-redis` |
| Queue | `@nocobase/app-plugin-queue-redis` |
| Caching | `@nocobase/app-plugin-caching-redis` |
| Realtime | `@nocobase/app-plugin-realtime-redis` |
| Concurrency | `@nocobase/app-plugin-concurrency-redis` |
| Snowflake worker 自动分配 | `@nocobase/app-plugin-snowflake-worker` |

使用有权下载对应包的账号登录商业包仓库，已有有效配置可跳过：

```bash
pnpm login --registry=https://pkg-v3.nocobase.com/ --scope=@nocobase
```

按检查结果逐个注册需要的插件。以 Jobs 为例，先查看可用版本及其依赖要求，再把 `<兼容版本>` 替换为与当前应用匹配的版本：

```bash
pnpm view @nocobase/app-plugin-jobs-redis versions --json
pnpm view '@nocobase/app-plugin-jobs-redis@<兼容版本>' peerDependencies --json
pnpm nocobase plugin register @nocobase/app-plugin-jobs-redis --version '<兼容版本>'
```

其他插件使用表中的完整包名执行同样的操作。不要假设各插件版本号相同，也不要仅凭下载成功判断兼容。应用框架、商业插件和下文的配置结构必须匹配；较旧应用先按[升级 NocoBase Core](../developing-apps/upgrade-nocobase-core.md)处理兼容性。

这里替换的是**业务所使用的后端**，通常不是卸载原来的开源服务：

- 保留 `server/app.ts` 中原有的 Caching、Jobs、Queue 和 ID Generator 等服务提供者。
- 保留开源的 `@nocobase/app-plugin-concurrency`，在它之后注册 `app-plugin-concurrency-redis`。
- 检查 `server/plugins.ts` 的顺序，让商业后端插件位于使用它们的业务插件之前。尤其要把 Caching Redis 放在认证等启动时就访问缓存的插件之前。
- 前五个商业插件只需要 Server 注册；Snowflake worker 还需要 `cli/plugins.ts` 中的 CLI 注册。检查注册命令的结果，完成它提示的手动修改。

注册完成后同步 Skills，并检查依赖、锁文件和注册文件的改动：

```bash
pnpm nocobase skills sync
pnpm nocobase plugin inspect @nocobase/app-plugin-jobs-redis --json
```

`plugin inspect` 同样按需换成其他包名。下面再分别选择后端；**安装和注册并不会自动把内存配置改成 Redis**。


### Jobs：让后台任务和定时任务协同运行

Jobs 用于通知发送、文档处理等一次性后台工作，也承载周期任务。接入共享后端后，多个实例可以从同一组待处理任务中领取工作，而不是每个实例维护自己的任务列表。

在生产配置中新增 `shared` 后端并选择它：

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

`concurrency: 2` 是每个执行器在每个实例上的并行数，不是整个应用最多同时运行两个任务。增加实例数量时，也要重新评估数据库、邮件服务等下游能承受的工作量。

检查 `scheduler.jobs`、`notification.jobs`、`mail.jobs` 和 `knowledge.jobs`：未指定时可以使用 `jobs.default`；如果原来明确指向 `memory`，就需要调整为 `shared`，或为它们配置专门的 Redis 后端。只修改默认值不会覆盖显式选择。

Scheduler 继续保留原插件，不需要另装一个 Redis Scheduler。用于 Scheduler 的 Jobs 配置将 `attempts` 保持为 `1`；其他业务的重试策略按其要求配置。任务在故障恢复时仍可能再次执行，业务逻辑应避免重复扣款、发货等后果。

### Queue：让多个实例共同处理队列消息

需要延迟执行、优先级或统一限速时，应用可能使用 Queue。例如，将待发送消息放入队列，再控制发送速度。它不与 Jobs 共用配置，只有实际使用 Queue 的应用才需要这一项。

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

多个实例竞争处理同一队列的消息，不是让每个实例都执行一遍。各实例需要运行兼容的代码和处理逻辑，不能让新版本投递的消息被不认识它的旧版本领取。

队列的并行数也按实例计算；如果业务使用 `rateLimit`，该限制才是同一共享队列各实例共同遵守的限速。已有 Redis 队列应保留原连接、命名空间和队列名称，避免新实例进入一条空队列。不要为“重新初始化”而清空历史队列。

> [!TIP]
> Jobs 和 Queue 的内存状态文件都不能通过挂载同一个目录变成共享队列。切换到 Redis 也不会自动导入这些文件；先停止新的任务提交，再等待已有任务完成，或按业务设计安排迁移和补偿。

### Caching：共享缓存、登录状态和计数

缓存不一定只是加速查询。认证插件还会使用它保存认证相关状态和计数，因此“页面能打开”并不能说明各实例之间的登录流程已经一致。

新增一个 Redis provider，不直接把原 `memory` 项的 `driver` 改掉，以免把 `maxSize`、`useClone` 等内存专用配置带入 Redis：

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

各实例使用相同的 `keyPrefix`，其他环境使用不同前缀。业务如果明确选择了 `memory` provider，需要逐项判断是否改为 `shared`。只把配置写在 `providers` 下而不选择它，不会改变默认缓存。

Redis 缓存保存的是 JSON 数据。原来在内存中缓存 `Date`、`Buffer` 或类实例的业务，需要先转换为适合存储的数据，并在读取时恢复所需的数据类型。缓存失效时间也要按业务设置，不把整个应用的缓存都当作永久数据。

> [!TIP]
> 共享缓存不等于分布式锁：缓存加载方法在本进程合并重复请求，并不阻止另一实例同时加载。需要跨实例互斥的操作仍使用 Concurrency。


### Realtime：让连接到不同实例的用户收到更新

如果后台任务在实例 A 完成，而浏览器连接在实例 B，Realtime 的 Redis 后端负责把更新传递过去。原有页面订阅和业务消息不需要改成另一套接口。

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

较旧应用如果没有 `server/config/realtime.ts`，添加配置工厂，并在 `server/config/index.ts` 中引入和登记 `realtime`：

```ts title="server/config/realtime.ts"
import { defineRealtimeConfig } from '@nocobase/app-server/realtime';

export default defineRealtimeConfig();
```

所有实例使用同一个 `realtime.namespace`。Redis Pub/Sub 不按数据库编号隔离消息，即使测试和生产分别使用 `db: 0`、`db: 1`，仍需要不同命名空间。

> [!TIP]
> 实时消息不是离线消息存储。浏览器断线期间的更新不会自动重放，页面重连后应重新读取业务数据。部署和停止实例时 WebSocket 也会断开，应检查重连和数据刷新是否正常。

### Concurrency：避免多个实例同时处理同一项操作

例如，应用用锁保护同一份库存汇总：实例 A 正在更新时，实例 B 应等待或返回忙碌，而不是各自取得一把本地锁后同时修改。

保留原来的 Concurrency 插件与业务调用，只切换实际选择的后端：

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

各实例必须使用相同的 Redis 数据库、命名空间和业务锁名称，才会竞争同一把锁。如果业务显式选择了其他配置名，也要调整对应配置。

`ttl` 的单位是毫秒，表示锁的有效期，插件会自动续期；它不是“业务最多运行多久”，也不会到时强行终止业务。网络故障时不能只靠锁保证数据正确，重要写入仍应有数据库约束、事务和防重复处理。

### Snowflake：为每个实例分配不同的 ID 生成编号

Snowflake 在本地生成 ID，其中包含区分生成进程的 `workerId`。开源实现也能用于多实例，但需要为所有同时生成 ID 的进程手工分配互不重复的编号，并正确处理重启和编号复用。PM2 的进程序号、容器名称不会自动成为 Snowflake 的编号。

需要自动分配时，注册 `app-plugin-snowflake-worker` 的 Server 和 CLI 入口，并把原 `server/config/snowflake.ts` **替换**为：

```ts title="server/config/snowflake.ts"
import { defineSnowflakeWorkerConfig } from '@nocobase/app-plugin-snowflake-worker/config';

export default defineSnowflakeWorkerConfig();
```

保留 `server/config/index.ts` 中已有的 `snowflake` 配置项，以及 `server/app.ts` 中原来的 `IdGeneratorProvider`。不要再叠加一份旧的 Snowflake 配置工厂。

然后开启自动分配：

```yaml
snowflake:
  mode: auto
  releasePolicy:
    strategy: manual
```

设置 `mode: auto` 后，插件通过应用的默认数据库为每个进程分配不同的 `workerId`（进程编号），记录 ID 仍由各进程在本地生成。所有实例必须连接同一个用于分配编号的数据库。SQLite 不支持自动分配，会退回手工模式。

部署时需要注意：

- **编号数量**：共有 32 个编号（`0`～`31`）。运行中的实例、滚动更新时尚未退出的旧实例，以及需要生成 ID 的管理命令进程，都需要占用编号。
- **编号释放**：正常退出会归还编号；示例中的 `manual` 策略不会自动释放异常退出进程的占用。可用 `snowflake-worker list` 查看占用，`snowflake-worker inspect <编号>` 查看详情。确认对应进程已永久停止、不会自动重启后，再使用 `snowflake-worker release <编号>` 释放；该命令默认预览，带上必要的确认参数和 `--apply` 才会执行。
- **时钟同步**：各服务器应保持时钟同步，避免时间回退影响 ID 生成。

## 启动多个实例

多实例部署运行的是同一套应用的多个进程或容器。用户访问统一入口，由反向代理分配请求；所有实例连接同一个业务数据库、按需使用同一组 Redis 后端，并访问同一份业务文件。PM2 和 Docker Compose 只改变进程的管理方式，不改变这套共享架构。

下面以一台服务器上的两个实例为例，对外地址为 `https://apps.example.com/main/`。部署前，按以下方式区分共享内容和实例独立的内容：

| 内容 | 多个实例之间的关系 |
| --- | --- |
| 应用代码 | 运行同一版本，使用相同的插件和业务逻辑。 |
| 数据库 | 连接同一个业务数据库，不为每个实例复制一份。 |
| Redis | 使用前文选定的共享后端；同一项业务的连接、命名空间或缓存前缀保持一致。 |
| 业务文件 | 使用同一个对象存储或共享文件系统，确保任何实例都能访问上传文件和任务附件。 |
| 生产配置 | 共用 `config.yml` 中的数据库、Redis、文件存储、密钥和业务设置；对外域名和应用路径也一致。 |
| 实例运行参数 | 实例标识和本地数据空间相互独立；使用宿主机端口时避免冲突。Snowflake 编号按前文采用自动分配或独立的手工编号。 |

> [!TIP]
> 各实例的本地数据目录**不是共享上传目录**。业务文件仍使用上表中的共享存储；配置文件相同也不意味着实例本地文件会自动同步。

**统一的发布流程**

无论选择哪种部署方式，都按这个顺序操作：

1. 准备同一版本的部署产物、生产配置和实例目录，确认所有实例都能访问共享服务。
2. 完成备份，并在首次切换时停止旧实例接收新工作，处理已有待办任务。
3. **只执行一次数据库更新**，完成新建表、添加字段及所需的数据变更。不要让每个实例启动时各执行一遍。
4. 数据库更新成功后，启动所有实例，检查健康状态，再接入统一入口并验证业务。

为了把数据库更新从实例启动中分离，在生产配置里为每个需要更新的数据库连接关闭自动执行。下面以 `main` 连接为例，在现有连接配置中合并这些字段，不要覆盖连接地址和账号：

```yaml
database:
  connections:
    main:
      migrations:
        autoRun: false
      seeds:
        autoRun: false
```

数据库更新由发布流程统一执行，具体操作见下方所选的部署方式。示例中的 `main` 是数据库连接名；应用还负责维护其他数据库的表结构时，对各连接分别执行一次。更新失败时不要启动新实例；备份、变更检查和回退要求见[发布应用新版本](publish-app-release.md)。

### 使用 PM2

服务器需要安装 Node.js 24 和全局 PM2，以下命令均由同一服务账号执行。下面使用 PM2 的 cluster 模式运行应用：一份应用定义可以启动多个 worker（工作进程），所有 worker 共用 `13000` 端口，由 PM2 分配连接。通过 `pm2 scale` 可以调整运行数量。

所有 worker 读取同一份生产配置，并使用前文准备的共享服务和 Snowflake 自动分配。反向代理连接 `127.0.0.1:13000`，worker 数量变化时，访问地址保持不变。

**1. 准备部署目录**

按[构建和上传部署包的方法](../tutorials/deploy-with-app-installer.md)，准备匹配服务器平台的完整产物。在服务账号有写入权限的位置创建部署目录，例如 `/srv/my-app`，再解压部署包：

```bash
mkdir -p /srv/my-app
cd /srv/my-app
tar -xzf /tmp/my-app.tar.gz
mkdir -p storage/cli logs
```

将准备好的生产配置放入 `config.yml`，并限制为服务账号可读。目录中的文件用途如下，两个 `.cjs` 文件在下一步创建：

| 路径（相对 `/srv/my-app/`） | 用途 |
| --- | --- |
| `dist/` | 所有 worker 共用的构建产物和生产依赖。 |
| `config.yml` | 所有 worker 共用的生产配置。 |
| `pm2-entry.cjs` | PM2 启动应用的入口。 |
| `ecosystem.config.cjs` | 应用名称、运行模式、worker 数量和环境变量。 |
| `storage/` | 各 worker 的本地工作目录，以及管理命令使用的 `cli/` 目录。 |
| `logs/` | PM2 保存的进程日志。 |

**2. 配置启动入口和进程管理**

创建 `pm2-entry.cjs`。它根据 PM2 分配的 `NODE_APP_INSTANCE` 为每个 worker 准备本地目录，再调用构建产物导出的 `startServer()` 启动应用：

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

创建 `ecosystem.config.cjs`，将域名和应用路径替换为实际值：

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

`exec_mode: 'cluster'` 启用集群模式，`instances: 2` 指定初始 worker 数量。所有 worker 使用相同的配置文件、对外地址和监听端口，本地目录由启动入口分别设置。PM2 的 worker 编号用于区分这些目录，记录 ID 仍由 Snowflake 服务生成。

**3. 检查配置并执行数据库更新**

在部署目录的终端中设置与应用一致的环境，再检查配置：

```bash
export NODE_ENV=production
export APP_CONFIG_FILE="$PWD/config.yml"
export APP_STORAGE_DIR="$PWD/storage/cli"
export APP_PUBLIC_ORIGIN=https://apps.example.com
export APP_BASE_PATH=/main
export APP_SAMPLE_DATA=false

node dist/cli/index.js config check --connect
```

检查通过并完成备份后，在维护窗口停止旧部署，在同一终端执行数据库更新：

```bash
node dist/cli/index.js db apply --connection main --json
```

**4. 启动应用并调整 worker 数量**

数据库更新成功后，启动应用并检查状态：

```bash
pm2 start ecosystem.config.cjs
pm2 status
```

`pm2 status` 应显示两个名称为 `my-app`、状态为 `online` 的 worker。等待各 worker 的日志显示启动完成，再检查健康接口：

```bash
curl --fail http://127.0.0.1:13000/main/api/healthz
```

健康检查通过后，通过统一入口验证业务访问，并执行 `pm2 save` 保存当前进程列表。

需要四个 worker 时执行：

```bash
pm2 scale my-app 4
pm2 status
```

缩回两个 worker 时，执行 `pm2 scale my-app 2`。调整后，检查各 worker 的日志和业务访问，将 `ecosystem.config.cjs` 中的 `instances` 同步为目标数量，作为后续部署的配置，再执行 `pm2 save` 保存当前进程列表。

首次配置开机恢复时，运行 `pm2 startup`，执行它输出的系统配置命令后再保存进程列表。缩容会断开被停止 worker 上的 WebSocket 连接，客户端应能重新连接。

### 使用 Docker Compose

服务器需要安装 Docker 和 Docker Compose。下面将应用定义为 `app` 服务，从同一镜像启动两个副本，并通过 `--scale` 调整副本数量。

所有副本读取同一份生产配置。按前文配置共享服务和 Snowflake 自动分配后，各副本可以协同处理业务，并获得不同的 Snowflake 进程编号。

**1. 准备镜像和部署目录**

在开发机或构建环境中，使用有权下载商业插件的账号构建应用，再制作镜像。以下命令适用于 Linux x64、Node.js 24，其他平台按目标服务器调整：

```bash
pnpm build --target linux-x64 --node-version 24
docker build --platform linux/amd64 --build-arg DIST=prebuilt -t my-app:multi-instance .
```

按[镜像传输步骤](../tutorials/deploy-with-docker.md#传输镜像镜像仓库或镜像文件)将镜像送到服务器。在服务账号有写入权限的位置创建部署目录，例如：

```bash
mkdir -p /srv/my-app
cd /srv/my-app
```

将准备好的生产配置放入该目录。目录中的文件如下，`compose.yml` 在下一步创建：

| 路径（相对 `/srv/my-app/`） | 用途 |
| --- | --- |
| `compose.yml` | 应用服务的定义。 |
| `config.yml` | 所有应用副本共用的生产配置。 |

容器内的 `/app/storage` 用于保存各副本的本地工作文件，这些文件会随容器重建而丢失。上传文件、任务附件等需要持久保存的内容，应使用前文准备的对象存储或共享文件系统。使用共享文件系统时，在下面的 Compose 配置中添加业务文件目录的挂载。

模板镜像使用 UID `1000` 的用户运行。在部署目录设置权限，使该用户可以读取生产配置：

```bash
sudo chown 1000:1000 config.yml
sudo chmod 600 config.yml
```

**2. 配置可扩展的应用服务**

在部署目录创建 `compose.yml`，将镜像名、域名和应用路径替换为实际值：

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

每个副本都在容器内监听 `13000`，Docker 为它们自动分配不同的宿主机端口。`host_ip: 127.0.0.1` 让这些端口仅供本机访问，便于接入同机反向代理。所有副本以只读方式挂载同一份 `config.yml`。

检查 Compose 配置：

```bash
docker compose -p my-app config --quiet
```

**3. 执行数据库更新**

在部署目录执行以下命令。Compose 会使用 `app` 的镜像和生产配置启动一个临时容器，完成数据库更新后删除该容器：

```bash
docker compose -p my-app run --rm --no-deps app \
  node dist/cli/index.js db apply --connection main --json
```

**4. 按副本数量启动和扩容**

数据库更新成功后，启动两个应用副本：

```bash
docker compose -p my-app up -d --scale app=2 --wait --wait-timeout 180
docker compose -p my-app ps
```

`--scale app=2` 指定两个副本，`--wait` 等待它们通过健康检查，最多等待 180 秒。命令成功后，`ps` 应显示两个健康的 `app` 副本，`PORTS` 列列出各自的宿主机端口。将这些地址接入已有的反向代理后，验证业务访问。

需要四个副本时，将数量设为 `4`：

```bash
docker compose -p my-app up -d --scale app=4 --wait --wait-timeout 180
```

缩回两个副本时，使用 `--scale app=2`。后续部署也保留所需的副本数量。

扩缩容或重建后，检查各副本状态和实际端口，同步反向代理的后端列表，再验证业务访问。缩容会断开被停止副本上的 WebSocket 连接，客户端应能重新连接。


## 验证跨实例访问和业务处理

配置检查通过只说明配置及其检查范围内的连接没有报错；健康接口通过只说明实例已启动。它们都不能证明任务、消息和状态已经跨实例共享。

在测试环境先用两个实例完成以下检查。有独立后端端口时，可以临时让代理只转发到 A，完成操作后再只转发到 B；PM2 cluster 共用端口时，可通过各 worker 的请求日志确认请求由不同进程处理。整个过程使用相同的访问地址和浏览器会话。

| 检查 | 应观察到的结果 |
| --- | --- |
| 登录和权限 | 在 A 登录后，请求切到 B 仍能正常访问；普通用户的限制不变，退出后其他实例也不应继续认可失效会话。 |
| 缓存和计数 | 经 A 更新或失效的共享状态，在 B 可见；需要统一限制的操作不会因切换实例获得另一份独立额度。 |
| Jobs 与 Queue | 从一个实例提交的测试工作可由另一实例处理；周期任务不会仅因有两个实例就独立触发两份。验证业务结果，而不只看“提交成功”。 |
| Realtime | 浏览器连在 B 时，A 产生的通知或进度变化能够到达；连接中断并恢复后，页面能补读最新状态。 |
| Concurrency | 两实例同时请求同一受保护资源时，不会同时进入应当互斥的操作；等待、忙碌和重试结果符合业务约定。 |
| Snowflake | 自动模式下运行实例取得不同编号，并发创建记录没有 ID 冲突。 |
| 文件 | 经 A 上传的文件可以经 B 下载，权限检查仍然有效；后台任务也能读取所需文件。 |
