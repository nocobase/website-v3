---
title: 运行环境
description: 管理执行资源、工具状态、并发和工作目录。
---

运行环境提供编码工具、模型登录状态和执行资源。建议使用独立容器或虚拟机，与 Studio 隔离。首次安装见[接入运行环境](../setup/shared-runtimes.md)。

![运行环境的连接状态、使用范围和执行容量](https://static-docs.nocobase.com/studio-zh-guide-runtimes-20261031.png)

## 选择使用范围

| 范围 | 谁可使用 | 谁来接入 |
| --- | --- | --- |
| 共享 | 所有成员的任务 | 管理员 |
| 个人 | 环境所有者发起的工作 | 成员本人 |

个人环境的设置见[个人运行环境](../join/personal-runtime.md)。受限为共享环境的变量，不会下发到个人环境。

## 调整工具与并发

打开环境详情，修改名称、启用的编码工具和最大并发数。按机器资源、项目构建开销和模型额度设置容量；首次接入可从 1 开始。

工具显示「需要登录」时，在执行机上用运行服务的系统用户登录，再点「重新检测」。显示「未安装」时，检查工具安装和后台服务的 PATH。

## 检查与维护

在执行机上查看状态或暂停接收工作：

```bash
nocobase-runner status
nocobase-runner stop
nocobase-runner start
```

终端能找到工具、后台服务找不到时，在该终端重新安装服务：

```bash
nocobase-runner service install
```

执行机空闲时可自动升级，也可以运行 `nocobase-runner update`。详情中的工作目录和运行记录可用于检查磁盘占用及未推送改动。清理目录前先确认需要保留的改动已提交。

## 移除运行环境

先吊销凭证，再删除运行环境；历史运行记录保留。在机器上运行 `nocobase-runner uninstall` 可移除后台服务。新机器需要重新注册，不应复制旧机器的凭证。
