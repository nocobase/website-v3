# 质量文档重组记录（2026-11-23）

<strong style="color: #b91c1c">内部维护记录：本文件位于 doc/notes/，不在公开文档内容目录中，不加入站点导航。当前为本地预览稿，尚未发布；实现状态来自参考文档，没有新做 Studio 源码或运行验证。</strong>

## 来源

- 原网站版本：`21551ba`，三种语言各七篇质量文档。
- 用户指定的参考：[quality/overview.md](https://github.com/nocobase/studio/blob/d80afa435517ad595f09b42f07d26d6ebfaffb58/quality/overview.md)。
- 冲突时使用参考文档明确指定的上位方案：[quality/solution.md](https://github.com/nocobase/studio/blob/d80afa435517ad595f09b42f07d26d6ebfaffb58/quality/solution.md)。
- 中文图：[quality-flow.svg](https://github.com/nocobase/studio/blob/d80afa435517ad595f09b42f07d26d6ebfaffb58/quality/images/quality-flow.svg)，保留原 SVG；英文、日文仅翻译文字并调整文字宽度。

## 内容归属

| 原页面 | 新归属 |
| --- | --- |
| overview | overview：原概览全部内容，加四个核心、全景图和维度介绍 |
| runs | runs：发起、范围、进度、阻塞、取消 |
| reports | runs：报告、证据、单项结果、验收与退回；metrics 解释维度汇总结论 |
| scenarios | overview：场景定义；runs：覆盖与结果；settings：维护、稳定标识、快照更新和原图 |
| follow-ups | runs：任务关联、证据、负责人、去重、修复与复测、历史保留 |
| metrics | metrics：保留来源表、原图、空值含义、范围与趋势比较，补维度标准表 |
| settings | settings：保留前提、触发、时区、语言、Skill 与冻结版本；维度介绍表移至 overview |

## 有依据的口径更新

<strong style="color: #b91c1c">维护注意：以下旧表述没有原样重复到公开正文，相关业务内容已保留并按参考方案更新；回溯原文可使用 Git 基线，不能把这里的历史表述重新当作当前能力。</strong>

- 原 follow-ups 中“补自动化用例、补场景任务”和 scenarios 中对应跟进方式：按 solution 5.4 改为开发维护，场景缺口进入功能维度的待更新说明。缺少环境与数据的处理仍保留。
- 原 reports 中测试为用例或场景资产创建 PR：按 solution 6.4 改为开发任务提交，仍保留资产 PR 与业务修复分开、测试验收不等于修复完成的边界。
- 原 metrics 的任务来源列表保留对已有历史关联记录的解释；新测试的登记规则以运行指南为准。
- 原单项结果表继续保留，并明确与维度四种汇总结论的区别，不把“失败”和“有问题”直接互换。
- 场景覆盖率、通过率、自动化率按 solution 6.6 只作趋势，不照搬 overview 中 XX 占位符。
- 性能预算保留 2 MB、500 KB、20 条，以及 500 ms/50 ms 的诊断参考值。按 solution 7.4、11 区分机器无关预算与共享 Runner 耗时波动，不把 Lighthouse 分数或单次耗时写成通用达标门槛。
- 默认中危数量、复杂度 > 15 的函数数量、未使用导出数量和覆盖率阈值未定；三种语言指标页均有红色加粗维护提示，发布前需人工确认。
- 冒烟、UX 及尚未完成的性能/权限检查明确标注范围，没有写成已上线能力。未采用工具的内部评估记录不迁入公开操作指南。

## 配图与链接

各语言原有九张 CDN 截图均原样保留；中文使用中文截图，英文和日文继续使用相同英文截图。清单见 quality-reorganization-20261123.json。新增 SVG 放在 doc/public/assets/studio/quality/，不重新制作产品截图。

旧 reports、follow-ups、scenarios 页面在三种语言中均生成静态 HTML 跳转，分别指向 runs/#reports、runs/#follow-ups、settings/#scenarios。现有 overview、runs、metrics、settings 地址保持不变。

## 本地验证

- 三语言菜单均为四篇，构建通过，生成 691 个页面以及搜索索引。
- 每种语言原九张截图引用逐项比对通过，未删除或替换。浏览器实测中文四页的原九张截图与新增 SVG 全部加载成功，无页面横向溢出。
- 指标页维护提示实测为红色 rgb(185, 28, 28)，字重 600。
- 英文、日文 SVG 完成翻译；三种语言均保留 SVG 与 1800 × 960 PNG 导出。
- 文档测试 115/116 通过；未改动的 src/lib/ai-proxy.test.mjs 的 is opt-in and cannot proxy arbitrary paths 在本机 5000 ms 超时，两次复核相同。最初沙箱内两项代理测试因端口权限失败，提升权限后流式代理测试通过，仅余上述超时。本次没有改动代理实现或测试以回避失败。
- 尚未发布、提交或推送；当前用于人工预览审阅。
