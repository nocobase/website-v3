汇总一周产品更新日志，最新发布可以[前往我们的博客查看](https://www.nocobase.com/cn/blog/timeline)。

**NocoBase 目前更新包括的版本更新包括三个分支：`main` ，`next`和 `develop`。**

![version.png](https://static-docs.nocobase.com/ba5f04e27e99c625cb3822da5df07860.png)

`main` ：截止目前最稳定的版本，推荐安装此版本。

`next`：包含即将发布的新功能，经过初步测试的版本，可能存在部分已知或未知问题。主要面向测试用户，用于收集反馈和进一步优化功能。适合愿意提前体验新功能并提供反馈的测试用户。

`develop`：开发中的版本，包含最新的功能代码，可能尚未完成或存在较多不稳定因素，主要用于内部开发和快速迭代。适合对产品功能前沿发展感兴趣的技术用户，但可能存在较多问题或不完整功能，不建议在生产环境中使用。

## main

![main.png](https://static-docs.nocobase.com/47a3c71734c1d0f908b51f9ebd53c0ac.png)

### [v2.0.5](https://www.nocobase.com/cn/blog/v2.0.5)

*发布时间：2026-02-26*

### 🐛 修复

- **[client]** 移动端中，先关闭菜单再执行页面跳转 ([#8699](https://github.com/nocobase/nocobase/pull/8699)) by @zhangzhonghe
- **[AI LLM：GigaChat]** 修复 GigaChat 插件在 2.0 中无法使用的问题 ([#8707](https://github.com/nocobase/nocobase/pull/8707)) by @cgyrock
- **[AI 员工]**

  - 使用 ContentBlock 对象统一 chatGPT API 文件输入 ([#8696](https://github.com/nocobase/nocobase/pull/8696)) by @cgyrock
  - 修复用户忽略 ai agent 工具执行确认请求直接发送新消息导致的接口错误 ([#8697](https://github.com/nocobase/nocobase/pull/8697)) by @cgyrock
- **[AI: 知识库]** 修复 AI 知识库启动报错问题 by @cgyrock
- **[邮件管理]** 图像查看错误 by @jiannx

### [v2.0.3](https://www.nocobase.com/cn/blog/v2.0.3)

*发布时间：2026-02-25*

### 🎉 新特性

- **[undefined]**

  - 新增实验性质的"引用区块"插件，支持以引用和复制的方式复用已有的区块。 ([#7584](https://github.com/nocobase/nocobase/pull/7584)) by @gchust
  - 表单草稿 by @chenos
- **[acl]** 将多个商业插件开源，并将协议由 AGPL-3.0 调整为 Apache-2.0 ([#8682](https://github.com/nocobase/nocobase/pull/8682)) by @chenos
- **[client]**

  - 支持在页面、页面标签、弹窗、弹窗标签配置浏览器页签标题 ([#8590](https://github.com/nocobase/nocobase/pull/8590)) by @zhangzhonghe
  - 支持在表单中配置关系字段的字段 ([#8578](https://github.com/nocobase/nocobase/pull/8578)) by @katherinehhh
  - 支持配置数据加载方式 ([#8551](https://github.com/nocobase/nocobase/pull/8551)) by @zhangzhonghe
  - 新增子表格（弹窗编辑）字段组件 ([#8280](https://github.com/nocobase/nocobase/pull/8280)) by @katherinehhh
  - 创建数据表时可以更改预设id字段类型 ([#8129](https://github.com/nocobase/nocobase/pull/8129)) by @cgyrock
  - 为对多子表单增加允许添加数据、选择已有数据及解除关联的设置项支持 ([#8099](https://github.com/nocobase/nocobase/pull/8099)) by @katherinehhh
  - 支持在主题编辑器中自定义全局样式 ([#7960](https://github.com/nocobase/nocobase/pull/7960)) by @ljmiaoo
  - 支持在详情区块中配置默认排序规则 ([#8070](https://github.com/nocobase/nocobase/pull/8070)) by @katherinehhh
  - 支持设置数字字段的数据类型，可选项包括 double、float 和 decimal ([#8058](https://github.com/nocobase/nocobase/pull/8058)) by @chenos
  - 支持表格列字段开启排序 ([#7900](https://github.com/nocobase/nocobase/pull/7900)) by @katherinehhh
  - 为关系字段下拉选择器增加快捷新增能力 ([#7887](https://github.com/nocobase/nocobase/pull/7887)) by @katherinehhh
  - 支持树表关系字段使用级联选择器 ([#7846](https://github.com/nocobase/nocobase/pull/7846)) by @katherinehhh
  - 支持表格列操作的拖动 ([#7842](https://github.com/nocobase/nocobase/pull/7842)) by @zhangzhonghe
  - 子表格支持分页展示数据 ([#7754](https://github.com/nocobase/nocobase/pull/7754)) by @katherinehhh
  - 事件流： 添加了新的预定义操作，增强了事件处理的自定义选项，使用户可以简化工作流程并提高效率 ([#7672](https://github.com/nocobase/nocobase/pull/7672)) by @zhangzhonghe
  - 增加 2.0 Markdown 区块 ([#7613](https://github.com/nocobase/nocobase/pull/7613)) by @katherinehhh
  - 支持为子表单设置联动规则 ([#7640](https://github.com/nocobase/nocobase/pull/7640)) by @zhangzhonghe
  - 增加对表格行点击事件监听的支持，使用户可以在点击表格中的某一行时执行特定操作 ([#7622](https://github.com/nocobase/nocobase/pull/7622)) by @zhangzhonghe
  - 添加对自定义变量的支持 ([#7585](https://github.com/nocobase/nocobase/pull/7585)) by @zhangzhonghe
  - 新增“当前设备类型”变量 ([#7576](https://github.com/nocobase/nocobase/pull/7576)) by @zhangzhonghe
- **[flow-engine]** 支持配置 ESM_CDN_BASE_URL 环境变量 ([#8529](https://github.com/nocobase/nocobase/pull/8529)) by @chenos
- **[server]** 重构应用监管器以适配不同场景下的多应用管理需求 ([#8043](https://github.com/nocobase/nocobase/pull/8043)) by @2013xile
- **[test]** 为默认任务管理器添加进程级并发控制 ([#8343](https://github.com/nocobase/nocobase/pull/8343)) by @cgyrock
- **[操作：批量编辑]** 批量编辑 2.0 ([#8526](https://github.com/nocobase/nocobase/pull/8526)) by @jiannx
- **[区块：网格卡片]**

  - 区块支持高度设置 ([#8583](https://github.com/nocobase/nocobase/pull/8583)) by @katherinehhh
  - 新增 2.0 网格卡片区块 ([#7579](https://github.com/nocobase/nocobase/pull/7579)) by @katherinehhh
- **[操作：复制记录]** 新增 2.0 复制操作 ([#8580](https://github.com/nocobase/nocobase/pull/8580)) by @katherinehhh

受篇幅限制，完整版本更新说明请参阅下方链接。

[https://www.nocobase.com/cn/blog/v2.0.3](https://www.nocobase.com/cn/blog/v2.0.3)

### [v1.9.48](https://www.nocobase.com/cn/blog/v1.9.48)

*发布时间：2026-02-24*

### 🚀 优化

- **[权限控制]** 权限插件提供过滤关系字段值的 API ([#8601](https://github.com/nocobase/nocobase/pull/8601)) by @2013xile

### 🐛 修复

- **[工作流：审批]** 在审批操作中过滤关系字段的值，以避免越权的数据操作 by @mytharcher

### [v2.0.2](https://www.nocobase.com/cn/blog/v2.0.2])

*发布时间：2026-02-22*

### 🐛 修复

- **[日历]** 修复了日历本地化及日期显示格式相关的问题 ([#8498](https://github.com/nocobase/nocobase/pull/8498)) by @sembaev-a-a

### [v2.0.1](https://www.nocobase.com/cn/blog/v2.0.1)

*发布时间：2026-02-16*

### 🐛 修复

- **[AI 员工]** 修复使用 AI 员工时，浏览器内存占满崩溃的问题 ([#8653](https://github.com/nocobase/nocobase/pull/8653)) by @mytharcher

### [v1.9.47](https://www.nocobase.com/cn/blog/v1.9.47)

*发布时间：2026-02-13*

### 🐛 修复

- **[client]** 修复编辑表单中关系附件字段清空后提交保存无效的问题 ([#8616](https://github.com/nocobase/nocobase/pull/8616)) by @katherinehhh
- **[utils]** 修复 `formula.js` 表达式引擎的安全问题 ([#8416](https://github.com/nocobase/nocobase/pull/8416)) by @mytharcher
- **[工作流：审批]** 修复“数据保存前”模式下，审批记录弹窗中审批数据的关系字段不展示的问题 by @mytharcher

## next

![next.png](https://static-docs.nocobase.com/8ed17a0f08cc585018f6de6c8b13947d.png)

### [v2.1.0-beta.2](https://www.nocobase.com/cn/blog/v2.1.0-beta.2)

*发布时间：2026-02-22*

### 🐛 修复

- **[日历]** 修复了日历本地化及日期显示格式相关的问题 ([#8498](https://github.com/nocobase/nocobase/pull/8498)) by @sembaev-a-a
- **[AI 员工]** 修复使用 AI 员工时，浏览器内存占满崩溃的问题 ([#8653](https://github.com/nocobase/nocobase/pull/8653)) by @mytharcher

### [v2.1.0-beta.1](https://www.nocobase.com/cn/blog/v2.1.0-beta.1)

*发布时间：2026-02-14*

### 🎉 新特性

- **[server]** 重构应用监管器以适配不同场景下的多应用管理需求 ([#8043](https://github.com/nocobase/nocobase/pull/8043)) by @2013xile

### 🚀 优化

- **[client]**
  - 优化时间日期相关字段赋值界面，使其可选相对时间日期。 ([#8630](https://github.com/nocobase/nocobase/pull/8630)) by @gchust
  - 支持在字段赋值界面中为关系字段指定标题字段。 ([#8624](https://github.com/nocobase/nocobase/pull/8624)) by @gchust

### 🐛 修复

- **[flow-engine]**

  - 修复筛选字段子菜单存在搜索字符时无法被展开的问题。 ([#8604](https://github.com/nocobase/nocobase/pull/8604)) by @gchust
  - 修复子表格（弹窗编辑）中配置 createModelOptions 后列操作删除失效的问题 ([#8560](https://github.com/nocobase/nocobase/pull/8560)) by @katherinehhh
- **[client]**

  - 修复关系字段赋值时将对多的关系字段赋值为单一记录时不正确的问题。 ([#8652](https://github.com/nocobase/nocobase/pull/8652)) by @gchust
  - 使用日期选择器解析日期，并添加密码强度验证等 ([#8647](https://github.com/nocobase/nocobase/pull/8647)) by @jiannx
  - 修复表格操作列联动隐藏按钮后出现间隙的问题 ([#8646](https://github.com/nocobase/nocobase/pull/8646)) by @zhangzhonghe
  - 修复 `Action.Modal`（操作弹窗）在某些交互后无法关闭的问题 ([#8642](https://github.com/nocobase/nocobase/pull/8642)) by @mytharcher
  - 修复 markdown item 渲染非法 Liquid 时未正确处理异常的问题 ([#8637](https://github.com/nocobase/nocobase/pull/8637)) by @katherinehhh
  - 修复表单中对多字段属性永远会发起后端解析请求的问题。 ([#8636](https://github.com/nocobase/nocobase/pull/8636)) by @gchust
  - 修复公式字段数值类型未显示数值格式化、日期类型未显示日期格式化配置项的问题 ([#8625](https://github.com/nocobase/nocobase/pull/8625)) by @katherinehhh
  - 修复表单第一项上边框显示不完整的问题 ([#8623](https://github.com/nocobase/nocobase/pull/8623)) by @katherinehhh
  - 非树结构表隐藏表格区块 属性里的「启用树表格」和「默认展开所有行」 ([#8566](https://github.com/nocobase/nocobase/pull/8566)) by @katherinehhh
- **[utils]** 修复 `formula.js` 表达式引擎的安全问题 ([#8416](https://github.com/nocobase/nocobase/pull/8416)) by @mytharcher
- **[AI 员工]**

  - 修复 AI 员工联网搜索后对话框不展示搜索参考链接的问题 ([#8651](https://github.com/nocobase/nocobase/pull/8651)) by @cgyrock
  - 修复 openai 接口调用传参报错问题 ([#8633](https://github.com/nocobase/nocobase/pull/8633)) by @cgyrock
- **[模板打印]** 字段相同 key 导致渲染错误 by @jiannx
- **[工作流：审批]**

  - 修复审批中的数据被删除后导致的接口报错 by @mytharcher
  - 修复“数据保存前”模式下，审批记录弹窗中审批数据的关系字段不展示的问题 by @mytharcher

## develop

![develop.png](https://static-docs.nocobase.com/7fcdd9456a17286d8a439eee52bcb8d2.png)

### [v2.1.0-alpha.6](https://www.nocobase.com/cn/blog/v2.1.0-alpha.6)

*发布时间：2026-02-25*

### 🎉 新特性

- **[acl]** 将多个商业插件开源，并将协议由 AGPL-3.0 调整为 Apache-2.0 ([#8682](https://github.com/nocobase/nocobase/pull/8682)) by @chenos

### 🚀 优化

- **[undefined]** 更新 AI 员工手册文档 ([#8690](https://github.com/nocobase/nocobase/pull/8690)) by @heziqiang

### 🐛 修复

- **[client]**

  - 统一表格与网格卡片的移动端分页行为 ([#8691](https://github.com/nocobase/nocobase/pull/8691)) by @zhangzhonghe
  - 修复图表区块筛选失效问题 ([#8671](https://github.com/nocobase/nocobase/pull/8671)) by @chenos
- **[AI 员工]** aiTools:list 接口返回 403 ([#8672](https://github.com/nocobase/nocobase/pull/8672)) by @chenos
- **[本地化]** 优化 i18n 缺失 key 的处理逻辑 ([#8673](https://github.com/nocobase/nocobase/pull/8673)) by @chenos

### [v2.1.0-alpha.3](https://www.nocobase.com/cn/blog/v2.1.0-alpha.3)

*发布时间：2026-02-16*

### 🐛 修复

- **[AI 员工]** 修复使用 AI 员工时，浏览器内存占满崩溃的问题 ([#8653](https://github.com/nocobase/nocobase/pull/8653)) by @mytharcher

### [v2.1.0-alpha.2](https://www.nocobase.com/cn/blog/v2.1.0-alpha.2)

*发布时间：2026-02-15*

### 🎉 新特性

- **[工作流：审批]** 为审批相关 API 增加权限控制 by @mytharcher
- **[认证：钉钉]** 支持通过 `unionId` 绑定用户 by @2013xile

### 🚀 优化

- **[AI: 知识库]** 优化构建产物，缩小 AI 知识库插件的包体积 by @cgyrock
- **[多空间]** 多空间权限控制接入 acl by @jiannx
- **[操作：导出记录 Pro]** 改进导出按钮数据范围：优先按选中记录，其次按前端筛选范围 by @katherinehhh
- **[工作流：审批]**

  - 移除对 JS Field 的支持 by @zhangzhonghe
  - 简化查询参数，并提升查询性能 by @mytharcher
  - 增加对 API 的访问控制，以避免通过 API 越权操作数据 by @mytharcher
  - 为发起人数据范围增加迁移后的修复逻辑 by @mytharcher
- **[认证：钉钉]** 默认使用 `userid` 关联用户，并保持已有认证器使用手机号的兼容性 by @2013xile

### 🐛 修复

- **[多空间]**

  - 添加迁移脚本移除空间字段中 x-ready-pretty by @jiannx
  - 关联数据添加时关联空间 by @jiannx
  - 空间选择器颜色跟着主题 by @jiannx
  - 空间字段删除 read-pretty 属性 by @jiannx
- **[字段组件：掩码]** 修复掩码字段配置弹窗里面无法正确加载全部用户角色的问题。 by @gchust
- **[操作：导入记录 Pro]**

  - 修复异步导入触发的工作流事件延迟执行的问题 by @mytharcher
  - 修复导入结果的统计数字和消息翻译 by @mytharcher
- **[AI: 知识库]** 修复构建后系统无法启动问题 by @cgyrock
- **[数据源：REST API]** 为请求上下文增加容错，避免方法不存在时的报错 by @mytharcher
- **[工作流：自定义操作事件]** 修复触发自定义操作工作流时参数和载荷数据不正确的问题 by @mytharcher
- **[操作：导出记录 Pro]** 修复主应用未启用导入/导出专业版插件时，子应用执行异步导入/导出任务报错问题 by @cgyrock
- **[工作流：Webhook 触发器]**

  - 修复子应用中 webhook 请求返回 404 错误的问题 by @mytharcher
  - 修复未配置请求体解析时触发器数据中该数据缺失的问题 by @mytharcher
- **[工作流：子流程]** 修复工作流链接的路由路径 by @mytharcher
- **[模板打印]**

  - 修复模板打印按钮模板配置页字段列表显示异常的问题 by @katherinehhh
  - 字段相同 key 导致渲染错误 by @jiannx
  - 修复配置模板弹窗被遮挡的问题 by @zhangzhonghe
  - 模板打印的配置模板弹窗移除底部按钮 by @katherinehhh
  - 复了联合角色时打印按钮权限逻辑错误 by @jiannx
  - 支持空间字段 by @jiannx
  - 2.0 版本里显示空间字段 by @jiannx
- **[文件存储：S3 (Pro)]** 修复文件重命名模式不起作用的问题 by @mytharcher
- **[数据可视化：ECharts]** 修复 ECharts 拼写错误 by @heziqiang
- **[工作流：审批]**

  - 修复审批中的数据被删除后导致的接口报错 by @mytharcher
  - 修复保存前模式下手动执行报错的问题 by @mytharcher
  - 修复“数据保存前”模式下，审批记录弹窗中审批数据的关系字段不展示的问题 by @mytharcher
  - 为删除的工作流增加容错，避免待办列表加载报错 by @mytharcher
  - 修复“我的申请”详情弹窗中字段值丢失的问题 by @mytharcher
  - 修复 1.x 审批记录弹窗报错的问题 by @mytharcher
  - 修复列表 API 加载时由于追加 JSON 字段导致的性能问题（MySQL） by @mytharcher
  - 修复加载详情数据时使用了错误的 id 参数 by @mytharcher
  - 修复并发提交导致流程被重复恢复执行的问题 by @mytharcher
  - 修复由于缺失依赖导致的构建错误 by @mytharcher
  - 修复错误的参数导致的加载数据错误问题 by @mytharcher
  - 修复分支模式的审批未能正确退回至指定节点的问题 by @mytharcher
  - 修复已有人员范围的工作流禁用后，对用户增加角色时的报错问题 by @mytharcher
  - 修复由于缺失 `ValueBlock.Result` 组件注入导致的值区块内容不展示的问题 by @mytharcher
  - 修复审批任务卡片字段不显示的问题 by @zhangzhonghe
  - 修复筛选字段在待办中心无法正常使用的问题 by @mytharcher
- **[邮件管理]**

  - 修复会话链 by @jiannx
  - 修复 Outlook 回复链路偶尔断开 by @jiannx
  - 选中文本时正文不折叠。修复附件下载失败 by @jiannx
  - 修复多个用户间相同邮箱邮件问题，性能优化 by @jiannx
  - 管理页面添加筛选 by @jiannx
  - 显示回复全部按钮和数据范围支持筛选子邮件 by @jiannx
  - 修复邮箱配置弹窗被遮挡的问题 by @zhangzhonghe
- **[企业微信]** 修复用户缺少手机号时不能自动注册的问题 by @2013xile
- **[迁移管理]** 修复迁移异常后打印异常对象所包含 SQL 过大容易卡死进程的问题 by @cgyrock

### [v2.1.0-alpha.1](https://www.nocobase.com/cn/blog/v2.1.0-alpha.1)

*发布时间：2026-02-14*

### 🎉 新特性

- **[操作：批量编辑]** 批量编辑 2.0 ([#8526](https://github.com/nocobase/nocobase/pull/8526)) by @jiannx

### 🚀 优化

- **[client]**

  - 优化时间日期相关字段赋值界面，使其可选相对时间日期。 ([#8630](https://github.com/nocobase/nocobase/pull/8630)) by @gchust
  - 支持在字段赋值界面中为关系字段指定标题字段。 ([#8624](https://github.com/nocobase/nocobase/pull/8624)) by @gchust
  - 表格 2.0 支持拖拽排序 ([#8540](https://github.com/nocobase/nocobase/pull/8540)) by @jiannx
  - 将字段赋值和默认值相关配置重构为表单级别配置。 ([#8596](https://github.com/nocobase/nocobase/pull/8596)) by @chenos
- **[本地化]** 自动创建 i18n 缺失的词条 ([#8588](https://github.com/nocobase/nocobase/pull/8588)) by @jiannx

### 🐛 修复

- **[flow-engine]** 修复筛选字段子菜单存在搜索字符时无法被展开的问题。 ([#8604](https://github.com/nocobase/nocobase/pull/8604)) by @gchust
- **[client]**

  - 修复关系字段赋值时将对多的关系字段赋值为单一记录时不正确的问题。 ([#8652](https://github.com/nocobase/nocobase/pull/8652)) by @gchust
  - 使用日期选择器解析日期，并添加密码强度验证等 ([#8647](https://github.com/nocobase/nocobase/pull/8647)) by @jiannx
  - 修复表格操作列联动隐藏按钮后出现间隙的问题 ([#8646](https://github.com/nocobase/nocobase/pull/8646)) by @zhangzhonghe
  - 修复 markdown item 渲染非法 Liquid 时未正确处理异常的问题 ([#8637](https://github.com/nocobase/nocobase/pull/8637)) by @katherinehhh
  - 修复表单中对多字段属性永远会发起后端解析请求的问题。 ([#8636](https://github.com/nocobase/nocobase/pull/8636)) by @gchust
  - 修复 `Action.Modal`（操作弹窗）在某些交互后无法关闭的问题 ([#8642](https://github.com/nocobase/nocobase/pull/8642)) by @mytharcher
  - 修复公式字段数值类型未显示数值格式化、日期类型未显示日期格式化配置项的问题 ([#8625](https://github.com/nocobase/nocobase/pull/8625)) by @katherinehhh
  - 修复表单第一项上边框显示不完整的问题 ([#8623](https://github.com/nocobase/nocobase/pull/8623)) by @katherinehhh
  - 修复编辑表单中关系附件字段清空后提交保存无效的问题 ([#8616](https://github.com/nocobase/nocobase/pull/8616)) by @katherinehhh
  - 修复表单关系字段组件中标题字段使用外键字段时下拉列表数据展示异常的问题 ([#8619](https://github.com/nocobase/nocobase/pull/8619)) by @katherinehhh
  - 修复编辑表单关系字段数据选择器已选数据修改后无法恢复的问题 ([#8610](https://github.com/nocobase/nocobase/pull/8610)) by @katherinehhh
  - 修复编辑表单关系字段从可编辑切换到只读模式时字段组件可选项未实时刷新的问题 ([#8611](https://github.com/nocobase/nocobase/pull/8611)) by @katherinehhh
- **[utils]** 修复 `formula.js` 表达式引擎的安全问题 ([#8416](https://github.com/nocobase/nocobase/pull/8416)) by @mytharcher
- **[AI 员工]**

  - 修复 AI 员工联网搜索后对话框不展示搜索参考链接的问题 ([#8651](https://github.com/nocobase/nocobase/pull/8651)) by @cgyrock
  - 修复 openai 接口调用传参报错问题 ([#8633](https://github.com/nocobase/nocobase/pull/8633)) by @cgyrock
- **[文件管理器]** 修复表单中文件类型字段禁用后仍可打开选择弹窗的问题 ([#8617](https://github.com/nocobase/nocobase/pull/8617)) by @katherinehhh
