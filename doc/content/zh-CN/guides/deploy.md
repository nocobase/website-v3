---
title: 部署上线
metaDescription: 让 Agent 用应用自带的 Dockerfile 构建 itam-lite 镜像，在服务器上用 Docker Compose 运行；配置、数据和镜像分开保存，上线后应用独立运行。
---

开发时 itam-lite 跑在 `pnpm dev` 里，用的是开发数据库。这一篇把它用 Docker 部署到服务器，独立运行。应用自带 `Dockerfile` 和部署技能 `nocobase-deployment`，Agent 照着做。Docker 和 PM2 两种方式怎样选，见 [选择部署方式](../core/deployment/choose-a-deployment-method.md)。

## 1. 准备服务器

一台装好 Docker 和 Docker Compose 插件的 Linux 服务器，开发机能用 SSH 登录。定好部署目录、访问地址和管理员密码。域名、HTTPS 和反向代理在服务器上配置。

## 2. 让 Agent 部署

在 `itam-lite` 目录开启新会话，替换尖括号里的内容：

```prompt
用 Docker 把这个应用部署到服务器 <用户>@<服务器地址>，目录 <路径>/itam-lite，访问地址 https://<域名>/itam/，数据库用新的空库。
配置和数据放在部署目录里，重建容器不能丢。管理员密码我单独给你，不要写进代码和报告。
部署后登录、新建一台设备、重建容器，确认设备还在。最后告诉我还有哪些没配好，例如 HTTPS。
```

Agent 的做法：

| 步骤 | 做什么 |
| --- | --- |
| 构建 | 在开发机按服务器平台构建 `dist/`，用 `Dockerfile` 打成镜像 `itam-lite:1`，传到服务器 |
| 配置 | 在部署目录用镜像里的命令生成 `config/config.yml`（含应用密钥），设置管理员密码 |
| 运行 | 写 `compose.yml`：配置只读挂载到 `/app/config.yml`，`storage/` 挂载到 `/app/storage`，`APP_BASE_PATH` 设为 `/itam` |
| 检查 | `config check --connect` 检查配置和数据库连接，`up -d --wait` 等到健康检查通过 |

每条命令和完整的 Compose 文件见 [使用 Docker 部署](../core/tutorials/deploy-with-docker.md#不使用-agent)。

## 3. 配置、数据和镜像分开

| | 在哪里 | 怎样保管 |
| --- | --- | --- |
| 镜像 | 服务器上的 `itam-lite:1`，或镜像仓库 | 每个版本一个标签，随时可以从代码重新构建 |
| 配置 | 部署目录的 `config/config.yml` | 含密钥，不进代码仓库、不进镜像；和数据库一起备份，不要重新生成 |
| 数据 | 部署目录的 `storage/`：SQLite 数据库、上传的文件 | 定期备份，升级前先备份 |

新数据库里只有迁移建好的表、初始管理员和三个角色。开发环境里的 Alice、Ben、Cathy 以及设备和申请都不会带过去，上线后在「系统设置 › 用户管理」里新建真实用户并分配角色。

## 4. 验证

打开 `https://<域名>/itam/`，用管理员登录，新建一台设备：

![部署后的设备台账](https://static-docs.nocobase.com/20261030-itam-lite-deploy-docker-devices.webp)

Agent 重建容器后，这台设备还在，登录状态也还在。之后开发机关机、`pnpm dev` 停掉，服务器上的 itam-lite 照常使用。

发布新版本时，构建新标签的镜像，先备份部署目录，再保留原配置和数据换镜像，见 [部署新版本](../core/tutorials/deploy-with-docker.md#部署新版本)。

## 5. 提交

部署不改代码。把部署方式和验证结果记进 README，提交：

```bash
git add -A && git commit -m "docs: record the Docker deployment"
```

**完成的标志**：访问地址能打开，管理员能登录；重建容器后新建的设备还在；`config.yml` 和数据库在服务器的部署目录里，不在镜像和代码仓库里。
