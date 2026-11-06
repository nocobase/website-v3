---
title: "Can I deploy and run my application independently?"
---

Yes. Business applications built on Core can be deployed to your own servers and run independently after release. Everyday business requests do not pass through Studio. Your organization owns the code and data; using Studio for development does not require running the production application inside Studio.

The application still needs its own runtime configuration, database, and any external services its features use. For example, a feature that calls a model service needs the corresponding configuration and access in production. Independent operation does not remove those service dependencies.

For production, choose Docker or install a deployment archive with app-installer and manage the process with PM2. See [Choose a deployment method](../core/deployment/choose-a-deployment-method.md). Build artifacts do not automatically include the development database, uploaded files, or runtime secrets. Plan production configuration, data migration, and backups separately.

After changing business features, test, rebuild, and update the deployment. See [Publish a new application release](../core/deployment/publish-app-release.md).
