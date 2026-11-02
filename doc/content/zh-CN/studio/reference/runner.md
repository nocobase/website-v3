---
title: nocobase-runner 命令
description: 注册和维护执行机，查看日志，管理工具、环境变量、更新和工作目录。
---

`nocobase-runner` 在运行环境中接收 Studio 的工作，调用编码工具执行。管理项目和任务使用 [nb-studio](cli.md)；维护执行机使用本页命令。

在执行机上，以运行服务的系统用户执行命令。使用 `nocobase-runner --help` 或命令后的 `--help` 查看当前版本的参数。除日志等持续输出的命令外，可以加 `--json` 获取结构化结果。

## 安装与注册

首次安装从 Studio「Agent 管理 › 运行环境」生成安装命令，见[接入运行环境](../setup/shared-runtimes.md)。建议使用独立容器或虚拟机。执行机以当前系统用户的权限运行编码工具。

已有执行机需要连接另一个 Studio，或凭证吊销后重新接入时，使用新生成的一次性凭证：

```bash
nocobase-runner register --server https://studio.example.com/main --token '<registration-token>'
```

| 参数 | 用途 |
| --- | --- |
| `--server` | Studio 地址，包含应用路径，例如 `/main` |
| `--token` | 从「添加运行环境」获取的一次性凭证 |
| `--name` | 执行机名称，默认为主机名 |
| `--force` | 替换同一 Studio 的有效注册；已吊销的注册无需此参数 |

注册后启动执行机。若执行机已在运行，需要停止后重新启动，才能加载新连接。同一执行机可以连接多个 Studio，各自的并发数和工具限制在对应 Studio 的运行环境页面配置。

## 启动、停止与状态

```bash
nocobase-runner start
nocobase-runner status
nocobase-runner stop
```

`start` 默认在后台运行；`start --foreground` 在当前终端运行。`status` 显示已连接的 Studio、进程、运行记录和各连接的并发配置。回到 Studio 确认运行环境显示「在线」。

`stop` 会停止正在执行的工作，并向 Studio 报告，由 Studio 后续调度。默认等待 30 秒，可以用 `stop --timeout 60` 延长等待时间。

## 查看日志

| 命令 | 用途 |
| --- | --- |
| `nocobase-runner logs` | 最近 100 行执行机日志 |
| `nocobase-runner logs --lines 200` | 指定行数 |
| `nocobase-runner logs --follow` | 持续查看新日志 |
| `nocobase-runner logs --run '<run-id>'` | 查看一次运行的日志，ID 可从 `status` 获取 |

默认执行机日志位于 `~/.nocobase-runner/logs/runner.log`。

## 配置工具与模型

执行机默认向 Agent 提供自带的 Node.js 和 pnpm。需要使用机器 PATH 中的版本时，运行：

```bash
nocobase-runner config set agent-tools system
```

用 `config set agent-tools runner` 恢复默认。修改对之后启动的工作生效，不负责安装或登录 Claude Code、Codex 等编码工具。

模型通常由编码工具自动检测。需要调整上报列表时，使用以下命令；将 `codex` 和模型 ID 替换为实际使用的工具与模型：

| 命令 | 用途 |
| --- | --- |
| `nocobase-runner config models codex show` | 查看手动调整和内置备用列表 |
| `nocobase-runner config models codex add '<model-id>'` | 补充模型 |
| `nocobase-runner config models codex remove '<model-id>'` | 不再上报该模型 |
| `nocobase-runner config models codex reset` | 清除该工具的手动调整 |

调整会在下一次心跳上报。添加模型只改变上报列表，使用的账号仍需有该模型的访问权限。

## 环境变量

将变量保存在执行机上，供请求该变量的工作使用：

```bash
nocobase-runner env set API_BASE_URL https://api.example.com --server https://studio.example.com/main
nocobase-runner env list --server https://studio.example.com/main
nocobase-runner env unset API_BASE_URL --server https://studio.example.com/main
```

省略 `--server` 时作用于所有已注册连接。变量值保存在本机，Studio 只接收名称；`env list` 也不显示值。新增和修改在下一次心跳及后续工作中生效。

敏感值可从标准输入传入。假设 `SERVICE_API_KEY` 已由凭据管理工具注入当前终端：

```bash
printf '%s' "$SERVICE_API_KEY" | nocobase-runner env set SERVICE_API_KEY --server https://studio.example.com/main
```

若使用当前终端已有的变量，可在 `start` 或 `service install` 时加 `--pass-env NAME`，重复该参数可传入多个变量。

| 执行机环境变量 | 用途 |
| --- | --- |
| `NOCOBASE_RUNNER_HOME` | 状态、注册、缓存和日志目录，默认 `~/.nocobase-runner` |
| `NOCOBASE_RUNNER_WORK_ROOT` | Agent 工作目录，默认 `~/.nocobase-runner-work`；自定义 HOME 后默认使用该路径加 `-work` |

状态目录与工作目录不能重叠。安装服务和后续维护命令应使用相同的目录设置。

## 后台服务

```bash
nocobase-runner service install --dry-run
nocobase-runner service install
nocobase-runner service uninstall
```

`service install` 安装并启动用户服务：macOS 使用 launchd，Linux 使用 systemd 用户服务。`--dry-run` 只预览操作；`--label` 可指定服务名称。Windows 在 WSL 中执行 Linux 命令。

服务会记录安装时终端的 PATH、代理、CA 和 `--pass-env` 指定的变量值。终端能找到工具但后台服务找不到，或这些变量发生变化时，在正确的终端重新运行 `service install`。

`service uninstall` 停止并移除服务定义，保留执行机程序和数据。

## 更新与清理

```bash
nocobase-runner update --check
nocobase-runner update
```

更新使用已连接 Studio 提供的版本，并重启执行机，可能中断当前工作。连接多个 Studio 时，用 `--server` 指定更新来源。通过安装脚本安装的执行机默认开启自动更新；`update --auto off` 关闭，`update --auto on` 开启，修改后重启生效。

查看工作目录及待清理内容，再执行清理：

```bash
nocobase-runner gc
nocobase-runner gc --ended --apply
```

`gc` 默认只预览。`--apply` 执行删除；`--ended` 筛选 Studio 判定已结束的工作；`--older-than 14d` 按闲置时间筛选；`--subject '<task-key>'` 按任务筛选。多个条件同时使用时，需要全部满足。

> [!WARNING] 清理会删除工作目录
> 已结束工作的目录即使有未提交文件或未推送提交，也会被删除。其他目录含有未推送改动时，需要 `--force` 才会删除。正在使用的目录不会被清理。执行前先检查预览，并将需要保留的改动推送到远程仓库。

自动清理可通过 `nocobase-runner config set <key> <value>` 调整：

| 配置项 | 默认值 | 用途 |
| --- | --- | --- |
| `min-free-disk` | `5G` | 保留的可用磁盘空间，支持 `20G`、`10%` 或 `off`。清理后仍不足时暂停接收新工作 |
| `artifact-ttl` | `24h` | 工作目录闲置多久后清理可再生成的文件，支持 `30m`、`2d` 或 `off` |
| `artifact-patterns` | `node_modules,.next,.turbo` | 要清理的目录名，逗号分隔；`default` 恢复默认 |

`artifact-ttl` 清理保留代码检出目录，只移除匹配的目录。这些磁盘与清理设置无需重启。

## 注销与卸载

只断开一个 Studio：

```bash
nocobase-runner stop
nocobase-runner unregister --server https://studio.example.com/main
```

`unregister` 删除本机的连接记录和凭证，不删除 Studio 中的运行环境。若还连接其他 Studio，完成后运行 `start` 恢复工作。不再使用的运行环境应在 Studio 中吊销凭证并删除。

卸载整台执行机前，先查看将移除的内容：

```bash
nocobase-runner uninstall --dry-run
nocobase-runner uninstall
```

`uninstall` 停止执行机，移除服务和安装脚本安装的程序，保留注册、缓存、日志和工作目录。加 `--purge` 会一并删除这些数据和 Agent 的工作目录，可先用 `uninstall --purge --dry-run` 查看范围。
