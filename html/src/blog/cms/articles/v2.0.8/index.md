### 🎉 New Features

- **[AI employees]** Update AI chatbox user prompt ([#8725](https://github.com/nocobase/nocobase/pull/8725)) by @heziqiang

### 🐛 Bug Fixes

- **[server]** Resolve cache issue by appending hash to assets ([#8730](https://github.com/nocobase/nocobase/pull/8730)) by @chenos

- **[AI employees]** Fixed AI data source configuration rendering issue. ([#8731](https://github.com/nocobase/nocobase/pull/8731)) by @cgyrock

- **[Workflow: Custom action event]** Fix the issue where custom action workflow hangs when execute as sub-flow ([#8738](https://github.com/nocobase/nocobase/pull/8738)) by @mytharcher

- **[Workflow: Approval]**
  - Sanitize association values in approval actions, to avoid any data manipulation beyond permission by @mytharcher

  - Fix the issue where error throw when execute approval workflow manually by @mytharcher

  - Fix error thrown caused by value of `dataAfter` missing when added or delegated by @mytharcher

  - Fix the issue where appends parameter filtering by ACL by @mytharcher

  - Fix ACL issue where association value should not be create or update when user has no permission by @mytharcher

