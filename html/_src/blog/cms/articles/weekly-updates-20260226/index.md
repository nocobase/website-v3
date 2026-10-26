Summarize the weekly product update logs, and the latest releases can be checked on [our blog](https://www.nocobase.com/en/blog/timeline).

**NocoBase is currently updated with three branches: `main` , `next` and `develop`.**

![version.png](https://static-docs.nocobase.com/ba5f04e27e99c625cb3822da5df07860.png)

* `main`：The most stable version to date, recommended for installation;
* `next`：Beta version, contains upcoming new features and has been preliminarily tested. There might be some known or unknown issues. It's mainly for test users to collect feedback and optimize functions further. Ideal for test users who want to experience new features early and give feedback;
* `develop`：Alpha version, contains the latest feature code, may be incomplete or unstable, mainly for internal dev and rapid iteration. Suited for tech users interested in product's cutting-edge, but with potential issues and incomplete functions. Not for production use.

## main

![main.png](https://static-docs.nocobase.com/47a3c71734c1d0f908b51f9ebd53c0ac.png)

### [v2.0.5](https://www.nocobase.com/en/blog/v2.0.5)

*Release date:2026-02-26*

### 🐛 Bug Fixes

- **[client]** In mobile, close the menu first and then perform the page jump ([#8699](https://github.com/nocobase/nocobase/pull/8699)) by @zhangzhonghe
- **[AI LLM: GigaChat]** Fixed GigaChat plugin not working in version 2.0. ([#8707](https://github.com/nocobase/nocobase/pull/8707)) by @cgyrock
- **[AI employees]**

  - Unify file input for chatGPT APIs using ContentBlock ([#8696](https://github.com/nocobase/nocobase/pull/8696)) by @cgyrock
  - Fix ai agent error when user sends new message without confirming tool execution ([#8697](https://github.com/nocobase/nocobase/pull/8697)) by @cgyrock
- **[AI: Knowledge base]** Fixed AI knowledge base plugin startup error. by @cgyrock
- **[Email manager]** Image rendering error by @jiannx

### [v2.0.3](https://www.nocobase.com/en/blog/v2.0.3)

*Release date:2026-02-25*

### 🎉 New Features

- **[undefined]**

  - Add an experimental "Reference block" plugin, which allows reusing existing blocks by referencing or copying. ([#7584](https://github.com/nocobase/nocobase/pull/7584)) by @gchust
  - Form drafts by @chenos
- **[acl]** Open source commercial plugins and update license from AGPL-3.0 to Apache-2.0 ([#8682](https://github.com/nocobase/nocobase/pull/8682)) by @chenos
- **[client]**

  - Support configuring browser tab titles for pages, page tabs, popups, and popup tabs ([#8590](https://github.com/nocobase/nocobase/pull/8590)) by @zhangzhonghe
  - support configuring fields of the association collection field in form block ([#8578](https://github.com/nocobase/nocobase/pull/8578)) by @katherinehhh
  - Support configuring data loading mode ([#8551](https://github.com/nocobase/nocobase/pull/8551)) by @zhangzhonghe
  - add subtable (popup editing) field component ([#8280](https://github.com/nocobase/nocobase/pull/8280)) by @katherinehhh
  - When creating colletion, the preset id field type can be changed ([#8129](https://github.com/nocobase/nocobase/pull/8129)) by @cgyrock
  - add support for add/select/disassociate settings in to-many subform ([#8099](https://github.com/nocobase/nocobase/pull/8099)) by @katherinehhh
  - Support customizing global styles in the theme editor ([#7960](https://github.com/nocobase/nocobase/pull/7960)) by @ljmiaoo
  - support setting default sorting rule in detail block ([#8070](https://github.com/nocobase/nocobase/pull/8070)) by @katherinehhh
  - Support setting data type for Number field (options: double, float, decimal) ([#8058](https://github.com/nocobase/nocobase/pull/8058)) by @chenos
  - support column field sorting in table ([#7900](https://github.com/nocobase/nocobase/pull/7900)) by @katherinehhh
  - add quick-create support to association field select ([#7887](https://github.com/nocobase/nocobase/pull/7887)) by @katherinehhh
  - support cascade selector for tree collection association field ([#7846](https://github.com/nocobase/nocobase/pull/7846)) by @katherinehhh
  - Support dragging for table column actions ([#7842](https://github.com/nocobase/nocobase/pull/7842)) by @zhangzhonghe
  - add pagination support to sub table ([#7754](https://github.com/nocobase/nocobase/pull/7754)) by @katherinehhh
  - Event Flow: Introduced new predefined actions to enhance customization options for event handling, allowing users to streamline workflows and improve efficiency ([#7672](https://github.com/nocobase/nocobase/pull/7672)) by @zhangzhonghe
  - Add 2.0 markdown block ([#7613](https://github.com/nocobase/nocobase/pull/7613)) by @katherinehhh
  - Support for setting linkage rules for sub-forms ([#7640](https://github.com/nocobase/nocobase/pull/7640)) by @zhangzhonghe
  - Added support for table row click event listeners, enabling users to execute specific actions when a row in the table is clicked ([#7622](https://github.com/nocobase/nocobase/pull/7622)) by @zhangzhonghe
  - Add support for custom variables ([#7585](https://github.com/nocobase/nocobase/pull/7585)) by @zhangzhonghe
  - Add "Current device type" variable ([#7576](https://github.com/nocobase/nocobase/pull/7576)) by @zhangzhonghe
- **[flow-engine]** support env.ESM_CDN_BASE_URL ([#8529](https://github.com/nocobase/nocobase/pull/8529)) by @chenos
- **[server]** Refactor the app supervisor to support multi-app management across different scenarios ([#8043](https://github.com/nocobase/nocobase/pull/8043)) by @2013xile
- **[test]** add process level concurrency control for base task manager ([#8343](https://github.com/nocobase/nocobase/pull/8343)) by @cgyrock
- **[Action: Batch edit]** bulk edit 2.0 ([#8526](https://github.com/nocobase/nocobase/pull/8526)) by @jiannx
- **[Block: GridCard]**

  - support configurable block height ([#8583](https://github.com/nocobase/nocobase/pull/8583)) by @katherinehhh
  - Add 2.0 grid card block ([#7579](https://github.com/nocobase/nocobase/pull/7579)) by @katherinehhh
- **[Action: Duplicate record]** add 2.0 duplicate action ([#8580](https://github.com/nocobase/nocobase/pull/8580)) by @katherinehhh
-


Due to space limitations, please refer to the link below for the full release notes.

[https://www.nocobase.com/en/blog/v2.0.3](https://www.nocobase.com/en/blog/v2.0.3)

### [v1.9.48](https://www.nocobase.com/en/blog/v1.9.48)

*Release date:2026-02-24*

### 🚀 Improvements

- **[Access control]** Provide sanitize API to filter association values in action ([#8601](https://github.com/nocobase/nocobase/pull/8601)) by @2013xile

### 🐛 Bug Fixes

- **[Workflow: Approval]** Sanitize association values in approval actions, to avoid any data manipulation beyond permission by @mytharcher

### [v2.0.2](https://www.nocobase.com/en/blog/v2.0.2])

*Release date:2026-02-22*

### 🐛 Bug Fixes

- **[Calendar]** Fix calendar localization and date formatting issues ([#8498](https://github.com/nocobase/nocobase/pull/8498)) by @sembaev-a-a

### [v2.0.1](https://www.nocobase.com/en/blog/v2.0.1)

*Release date:2026-02-16*

### 🐛 Bug Fixes

- **[AI employees]** Fix browser OOM when using AI employee ([#8653](https://github.com/nocobase/nocobase/pull/8653)) by @mytharcher

### [v1.9.47](https://www.nocobase.com/en/blog/v1.9.47)

*Release date:2026-02-13*

### 🐛 Bug Fixes

- **[client]** Fix issue where cleared association attachment field is not saved after submit in edit form ([#8616](https://github.com/nocobase/nocobase/pull/8616)) by @katherinehhh
- **[utils]** Fix security issue of `formula.js` evaluator engine ([#8416](https://github.com/nocobase/nocobase/pull/8416)) by @mytharcher
- **[Workflow: Approval]** Fix the issue where approval data not showing in record detail popup if workflow mode is set to "Before save" by @mytharcher


## next

![next.png](https://static-docs.nocobase.com/8ed17a0f08cc585018f6de6c8b13947d.png)

### [v2.1.0-beta.2](https://www.nocobase.com/en/blog/v2.1.0-beta.2)

*Release date:2026-02-22*

### 🐛 Bug Fixes

- **[Calendar]** Fix calendar localization and date formatting issues ([#8498](https://github.com/nocobase/nocobase/pull/8498)) by @sembaev-a-a
- **[AI employees]** Fix browser OOM when using AI employee ([#8653](https://github.com/nocobase/nocobase/pull/8653)) by @mytharcher

### [v2.1.0-beta.1](https://www.nocobase.com/en/blog/v2.1.0-beta.1)

*Release date:2026-02-14*

### 🎉 New Features

- **[server]** Refactor the app supervisor to support multi-app management across different scenarios ([#8043](https://github.com/nocobase/nocobase/pull/8043)) by @2013xile

### 🚀 Improvements

- **[client]**
  - Improve the date/time field assignment UI to support selecting relative dates/times. ([#8630](https://github.com/nocobase/nocobase/pull/8630)) by @gchust
  - Support specify title field for association fields when assigning field. ([#8624](https://github.com/nocobase/nocobase/pull/8624)) by @gchust

### 🐛 Bug Fixes

- **[flow-engine]**

  - Fix an issue where the filter field submenu could not be expanded when a search keyword was present. ([#8604](https://github.com/nocobase/nocobase/pull/8604)) by @gchust
  - fix column delete action not working in popup sub-table edit when createModelOptions is configured ([#8560](https://github.com/nocobase/nocobase/pull/8560)) by @katherinehhh
- **[client]**

  - Fix an issue where assigning a single record to a many-to-many relation field produced incorrect results. ([#8652](https://github.com/nocobase/nocobase/pull/8652)) by @gchust
  - parse date using date picker and add password strength validation, etc ([#8647](https://github.com/nocobase/nocobase/pull/8647)) by @jiannx
  - Fix the spacing issue caused by hidden linked actions in table action column ([#8646](https://github.com/nocobase/nocobase/pull/8646)) by @zhangzhonghe
  - Fix the issue where `Action.Modal` could not be closed after some interaction ([#8642](https://github.com/nocobase/nocobase/pull/8642)) by @mytharcher
  - fix resolve syntax error when markdown item renders invalid Liquid ([#8637](https://github.com/nocobase/nocobase/pull/8637)) by @katherinehhh
  - Fix unnecessary backend parsing requests for to-many field properties in form block. ([#8636](https://github.com/nocobase/nocobase/pull/8636)) by @gchust
  - fix missing number format for number formula fields and date format settings for date formula fields ([#8625](https://github.com/nocobase/nocobase/pull/8625)) by @katherinehhh
  - fix incomplete top border rendering on first form item ([#8623](https://github.com/nocobase/nocobase/pull/8623)) by @katherinehhh
  - fix: hide "Enable tree table" and "Expand all rows by default" for non-tree collections ([#8566](https://github.com/nocobase/nocobase/pull/8566)) by @katherinehhh
- **[utils]** Fix security issue of `formula.js` evaluator engine ([#8416](https://github.com/nocobase/nocobase/pull/8416)) by @mytharcher
- **[AI employees]**

  - Fixes an issue where citation links from AI web searches were not displayed in the chatbox ([#8651](https://github.com/nocobase/nocobase/pull/8651)) by @cgyrock
  - fix openai API parameters error ([#8633](https://github.com/nocobase/nocobase/pull/8633)) by @cgyrock
- **[Template print]** fix fields with the same key lead to rendering errors by @jiannx
- **[Workflow: Approval]**

  - Fix the issue where error thrown when approving record deleted by @mytharcher
  - Fix the issue where approval data not showing in record detail popup if workflow mode is set to "Before save" by @mytharcher

## develop

![develop.png](https://static-docs.nocobase.com/7fcdd9456a17286d8a439eee52bcb8d2.png)

### [v2.1.0-alpha.6](https://www.nocobase.com/en/blog/v2.1.0-alpha.6)

*Release date:2026-02-25*

### 🎉 New Features

- **[acl]** Open source commercial plugins and update license from AGPL-3.0 to Apache-2.0 ([#8682](https://github.com/nocobase/nocobase/pull/8682)) by @chenos

### 🚀 Improvements

- **[undefined]** Update ai employee docs ([#8690](https://github.com/nocobase/nocobase/pull/8690)) by @heziqiang

### 🐛 Bug Fixes

- **[client]**

  - Unify mobile pagination behavior for table and grid card ([#8691](https://github.com/nocobase/nocobase/pull/8691)) by @zhangzhonghe
  - chart block filter not working ([#8671](https://github.com/nocobase/nocobase/pull/8671)) by @chenos
- **[AI employees]** aiTools:list API returns 403 ([#8672](https://github.com/nocobase/nocobase/pull/8672)) by @chenos
- **[Localization]** improve handling of missing i18n keys ([#8673](https://github.com/nocobase/nocobase/pull/8673)) by @chenos

### [v2.1.0-alpha.3](https://www.nocobase.com/en/blog/v2.1.0-alpha.3)

*Release date:2026-02-16*

### 🐛 Bug Fixes

- **[AI employees]** Fix browser OOM when using AI employee ([#8653](https://github.com/nocobase/nocobase/pull/8653)) by @mytharcher

### [v2.1.0-alpha.2](https://www.nocobase.com/en/blog/v2.1.0-alpha.2)

*Release date:2026-02-15*

### 🎉 New Features

- **[Workflow: Approval]** Add ACL control for approval APIs by @mytharcher
- **[Auth: DingTalk]** Allows to bind user with `unionId` by @2013xile

### 🚀 Improvements

- **[AI: Knowledge base]** Optimized the build output to reduce the package size of plugin-ai-knowledge-base. by @cgyrock
- **[Multi-space]** multi-space permission control access acl by @jiannx
- **[Action: Export records Pro]** Improve export action data scope based on selected records or resource filters by @katherinehhh
- **[Workflow: Approval]**

  - Remove support for JS fields by @zhangzhonghe
  - Simplify parameters in query, and improve performance by @mytharcher
  - Implement access control for APIs to prevent unauthorized data operations by @mytharcher
  - Add repair logic for sync audiences after migration by @mytharcher
- **[Auth: DingTalk]** Use `userid` as the default key for user association, while preserving compatibility with existing authenticators that rely on mobile by @2013xile

### 🐛 Bug Fixes

- **[Multi-space]**

  - add migration script to remove x-ready-pretty in space field by @jiannx
  - Related space when adding associated data by @jiannx
  - Space selector color follows theme by @jiannx
  - remove the read-pretty attribute for space field by @jiannx
- **[Field component: mask]** Fix an issue where the mask field settings popup could not load all user roles correctly. by @gchust
- **[Action: Import records Pro]**

  - Fix the issue where workflow triggered by async import delayed to execute by @mytharcher
  - Fix count numbers in import result and message translation by @mytharcher
- **[AI: Knowledge base]** Fix the issue where the system cannot start after building by @cgyrock
- **[Data source: REST API]** Add fault-tolerant for request context, to avoid error thrown when method is not in context by @mytharcher
- **[Workflow: Custom action event]** Fix the issue where parameters and payload are incorrect when trigger custom workflow by @mytharcher
- **[Action: Export records Pro]** Fix error when sub-applications execute async import/export tasks while the main application does not enable the import/export pro plugin by @cgyrock
- **[Workflow: Webhook]**

  - Fix the issue where 404 error thrown when post to webhook URL in sub-app by @mytharcher
  - Fix the issue where body data is missing when body parsing not configured by @mytharcher
- **[Workflow: Subflow]** Fix route path of workflow link by @mytharcher
- **[Template print]**

  - fix field list display issue in  template print action configuration by @katherinehhh
  - fix fields with the same key lead to rendering errors by @jiannx
  - Fix obscured configuration template pop-up issue by @zhangzhonghe
  - remove footer buttons from print template configuration by @katherinehhh
  - Fixed incorrect print button permission logic when roles were unioned. by @jiannx
  - support space field by @jiannx
  - display space fields in version 2.0 by @jiannx
- **[File storage: S3(Pro)]** Fix the issue where file renaming mode not works by @mytharcher
- **[Data visualization: ECharts]** Fix ECharts spelling error by @heziqiang
- **[Workflow: Approval]**

  - Fix the issue where error thrown when approving record deleted by @mytharcher
  - Fix error thrown when execute on before save mode by @mytharcher
  - Fix the issue where approval data not showing in record detail popup if workflow mode is set to "Before save" by @mytharcher
  - Add fault-tolerant on workflow deleted, to avoid load error in tasks list by @mytharcher
  - Fix the issue where values missing from detail popup of "My application" by @mytharcher
  - Fix the issue where error thrown in 1.x approval record popup by @mytharcher
  - Fix performance issue caused by JSON field in list loading (MySQL) by @mytharcher
  - Fix incorrect id to load detail record by @mytharcher
  - Fix the issue where concurrency makes execution repeatedly resumed by @mytharcher
  - Fix build error caused by missed dependencies by @mytharcher
  - Fix the issue where incorrect record was loaded caused by wrong parameters by @mytharcher
  - Fix the issue where return an approval to previous node but returned to start by @mytharcher
  - Fix error thrown when add role to user if workflow of audiences is disabled by @mytharcher
  - Fix value block not displays caused by missing `ValueBlock.Result` component by @mytharcher
  - Fix the issue where fields are not displayed on approval task cards by @zhangzhonghe
  - Fix the issue where filter fields not work correctly in tasks center by @mytharcher
- **[Email manager]**

  - fix conversation chain by @jiannx
  - Fix Outlook reply link occasionally disconnected by @jiannx
  - body does not collapse when text is selected.  fix download attachment failed by @jiannx
  - Fixed the problem of emails in the same mailbox between multiple users and optimized performance by @jiannx
  - add filters to the management by @jiannx
  - show reply all button and data scope supports filtering child messages. by @jiannx
  - Fix the issue where the email configuration popup is obscured by @zhangzhonghe
- **[WeCom]** Fix an issue where users cannot be auto-registered when mobile is missing by @2013xile
- **[Migration manager]** Fixed a potential process freeze caused by logging excessively large SQL statements included in migration error exceptions by @cgyrock

### [v2.1.0-alpha.1](https://www.nocobase.com/en/blog/v2.1.0-alpha.1)

*Release date:2026-02-14*

### 🎉 New Features

- **[Action: Batch edit]** bulk edit 2.0 ([#8526](https://github.com/nocobase/nocobase/pull/8526)) by @jiannx

### 🚀 Improvements

- **[client]**

  - Improve the date/time field assignment UI to support selecting relative dates/times. ([#8630](https://github.com/nocobase/nocobase/pull/8630)) by @gchust
  - Support specify title field for association fields when assigning field. ([#8624](https://github.com/nocobase/nocobase/pull/8624)) by @gchust
  - Table 2.0 supports drag and drop sorting ([#8540](https://github.com/nocobase/nocobase/pull/8540)) by @jiannx
  - Move field assignment and default value settings to form-level configuration. ([#8596](https://github.com/nocobase/nocobase/pull/8596)) by @chenos
- **[Localization]** automatically create missing i18n keys ([#8588](https://github.com/nocobase/nocobase/pull/8588)) by @jiannx

### 🐛 Bug Fixes

- **[flow-engine]** Fix an issue where the filter field submenu could not be expanded when a search keyword was present. ([#8604](https://github.com/nocobase/nocobase/pull/8604)) by @gchust
- **[client]**

  - Fix an issue where assigning a single record to a many-to-many relation field produced incorrect results. ([#8652](https://github.com/nocobase/nocobase/pull/8652)) by @gchust
  - parse date using date picker and add password strength validation, etc ([#8647](https://github.com/nocobase/nocobase/pull/8647)) by @jiannx
  - Fix the spacing issue caused by hidden linked actions in table action column ([#8646](https://github.com/nocobase/nocobase/pull/8646)) by @zhangzhonghe
  - fix resolve syntax error when markdown item renders invalid Liquid ([#8637](https://github.com/nocobase/nocobase/pull/8637)) by @katherinehhh
  - Fix unnecessary backend parsing requests for to-many field properties in form block. ([#8636](https://github.com/nocobase/nocobase/pull/8636)) by @gchust
  - Fix the issue where `Action.Modal` could not be closed after some interaction ([#8642](https://github.com/nocobase/nocobase/pull/8642)) by @mytharcher
  - fix missing number format for number formula fields and date format settings for date formula fields ([#8625](https://github.com/nocobase/nocobase/pull/8625)) by @katherinehhh
  - fix incomplete top border rendering on first form item ([#8623](https://github.com/nocobase/nocobase/pull/8623)) by @katherinehhh
  - Fix issue where cleared association attachment field is not saved after submit in edit form ([#8616](https://github.com/nocobase/nocobase/pull/8616)) by @katherinehhh
  - fix incorrect filtered data in association dropdown when title field is a foreign key ([#8619](https://github.com/nocobase/nocobase/pull/8619)) by @katherinehhh
  - fix unable to restore selected data in record picker field component after editing ([#8610](https://github.com/nocobase/nocobase/pull/8610)) by @katherinehhh
  - Fix field component options not refreshed in real time when association field switches pattern ([#8611](https://github.com/nocobase/nocobase/pull/8611)) by @katherinehhh
- **[utils]** Fix security issue of `formula.js` evaluator engine ([#8416](https://github.com/nocobase/nocobase/pull/8416)) by @mytharcher
- **[AI employees]**

  - Fixes an issue where citation links from AI web searches were not displayed in the chatbox ([#8651](https://github.com/nocobase/nocobase/pull/8651)) by @cgyrock
  - fix openai API parameters error ([#8633](https://github.com/nocobase/nocobase/pull/8633)) by @cgyrock
- **[File manager]** fix issue where file field component can still open selector dialog when disabled ([#8617](https://github.com/nocobase/nocobase/pull/8617)) by @katherinehhh
