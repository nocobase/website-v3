---
title: Manage application templates
description: Package child applications into deployable versions and maintain templates that the main application uses to create hosted instances.
---

An application template holds deployable versions of a child application. For example, after uploading a customer management application as a template, you can create a separate instance for each team. The instances share the same business features but keep their data and configuration separate.

The main application's **Templates** page shows each template's latest version and instance count. These templates deploy existing applications; they are not the `default` project template used to create a source project.

![The template list shows published versions and the number of instances using each template](/assets/core/multi-app/template-list.png)

## Prepare a child application archive

Finish developing the child's business features and confirm that the application runs correctly before packaging it for the main application. The main application does not need the child's source, and the projects can use separate Git repositories.

**Prepare single sign-on and application switching.** The child needs platform sign-in support to use the SSO configuration that the main application supplies automatically during deployment. If the project is not yet integrated, register the plugin from the child's directory:

```bash
pnpm nocobase plugin register @nocobase/app-plugin-platform-sso --dry-run
pnpm nocobase plugin register @nocobase/app-plugin-platform-sso
```

After registration, follow the `nocobase-app-plugin-platform-sso` Skill synchronized into the project to integrate the sign-in page, business permissions, and application switcher. You can also ask an Agent from the child's directory:

```prompt
Add single sign-on through the main application to this customer management app, with a sidebar entry for switching applications and returning to the workbench.
Read-only users should be able to view customers. Editors should be able to maintain customer records, but not manage users or system settings. Keep local administrator sign-in available so we can recover access if single sign-on is unavailable.
```

For hosted deployments, the main application registers the sign-in client and supplies the instance's sign-in configuration automatically. Do not put the client secret in the source or deployment archive.

**Build the deployment archive.** Run this in the child application's root directory:

```bash
pnpm build --tar
```

The output is `storage/exports/dist.tar.gz`. The archive must match the runtime environment's operating system, CPU architecture, libc, and Node.js version. When building for another machine, specify the target parameters as described in [Build the deployment archive](../../tutorials/deploy-with-app-installer.md#build-the-deployment-archive). Keep development databases, uploaded files, and instance secrets out of the shared archive.

## Create a template and upload the archive

1. In the main application, open **Templates** and click **Create template**.
2. Enter a name and description, then select a [deployment environment](environments.md) that has passed its checks.
3. Open the new template's details and its action menu in the upper-right corner. Select **Upload archive** and upload the child's `dist.tar.gz`.

![Create a template with a name, description, and deployment environment](/assets/core/multi-app/template-create.png)

After uploading, check the detected application package name and version. Uploading only stores the archive. Publish a version before using it to create instances.

## Publish and maintain versions

Open the template's action menu, select **Publish version**, choose the uploaded archive version to publish, and confirm.

![The template action menu provides upload, publish, and retirement options](/assets/core/multi-app/template-actions.png)

Once published, the version appears under **Published versions**. Select a version to [create a hosted instance](management.md#create-an-instance-and-grant-access).

![Published versions can be used to create application instances](/assets/core/multi-app/template-versions.png)

> [!TIP]
> An **included** tag under **SSO plugin** means this version's deployment archive includes the Platform SSO plugin and supports single sign-on integration.

To update business features, change the code in the original child project, update the version in `package.json`, and build, upload, and publish again. Keep the application package name unchanged, and do not overwrite published versions.

Publishing a new version does not change existing instances. They can stay on their current version or be [upgraded individually](management.md#upgrade-archive-and-restore-instances) by an administrator.

## Retire a template

Select **Retire template** from the template's action menu, verify the target, and confirm. Retirement prevents further version publishing and new instance creation. It does not stop or delete existing instances or their data.

To stop a particular business application, manage its [instance](management.md#update-configuration-and-manage-runtime-state) instead of retiring the template.
