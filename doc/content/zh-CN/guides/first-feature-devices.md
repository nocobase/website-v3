---
title: 第一个功能：设备台账
metaDescription: 按设计文档让 Agent 做出设备台账，在运行的应用里试用，再提修改意见，提交一次。
---

设计文档的第一步是设备台账。需求已经写在[文档](https://github.com/nocobase/docs-examples-v3/blob/main/apps/itam-lite/docs/design.md)里，提示词只需指向它。

## 1. 提需求

```prompt
按 docs/design.md 做第 1 步：设备台账。这一步只有管理员使用，角色权限后面再做。
```

Agent 做完的内容：

| 部分 | 内容 |
| --- | --- |
| 数据表 | 一个迁移建 `devices` 表，资产编号加唯一索引 |
| 接口 | `/api/devices` 的列表、新建、修改、删除，每个操作单独授权，出现在 `/main/api/swagger` 接口文档里 |
| 页面 | 侧边栏「设备台账」：列表、搜索、新建和编辑对话框；中英文文案 |
| 系统设置 | 按应用自带的规则，同时启用了「用户管理」和「权限管理」页面 |
| 测试 | 接口测试和迁移测试；`pnpm typecheck`、`pnpm lint` 通过 |

## 2. 试用

刷新浏览器，打开「设备台账」，新建几台设备。重复的资产编号会在输入框旁提示。

![新建设备](https://static-docs.nocobase.com/20261030-itam-lite-devices-new-device.webp)

用了一会儿，发现两个问题：

- 两台显示器录成了同一个序列号，也保存成功了。
- 设备多了以后，想只看在库的设备，没有办法筛选。

## 3. 提修改意见

```prompt
设备台账有两处要改：
1. 序列号不能重复（可以不填）。已有重复的先列给我，不要自动改。
2. 列表能按状态、类别筛选，搜索也能搜序列号。
验收：填一个已有的序列号保存不了；选“在库”只显示在库的设备。
```

Agent 先查了现有数据，报告 `IT-2026-0002` 和 `IT-2026-0007` 的序列号都是 `CN0ABC123`。在台账里把其中一台改成设备上真实的序列号，告诉 Agent 继续。

Agent 新增了一个迁移给序列号加唯一索引（已经执行过的迁移不改），迁移在有重复数据时会停下并列出重复的设备。修改后：

![序列号重复时的提示](https://static-docs.nocobase.com/20261030-itam-lite-devices-duplicate-serial.webp)

![按状态筛选](https://static-docs.nocobase.com/20261030-itam-lite-devices-filter-by-status.webp)

## 4. 提交

```bash
git add -A && git commit -m "feat: add the device register"
```

**完成的标志**：能新建、编辑、删除设备；资产编号和序列号重复时在对应输入框旁提示；能按状态和类别筛选；刷新后数据还在。
