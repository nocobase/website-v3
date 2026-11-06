---
title: Sign in and personal settings
description: Accept an invitation, sign in, and manage your profile, notifications, and Git identity.
---

## Accept an invitation

Open the invitation email or link from your administrator. Invitations are valid for seven days.

1. Check the email address and enter your name and a password of at least eight characters.
2. Select **Create account and join**.
3. Open your assigned project from **My issues**.

If the email already has an account, sign in to that account. Sign out first if the browser is using another account. Ask the administrator to resend expired or revoked invitations.

## Sign in

Open the address your administrator provides, such as `https://studio.example.com/main/`. Use your username or email and password.

For a forgotten password, select **Forgot password?** and follow the email instructions. If the option is missing or no email arrives, ask an administrator to check [password reset email](../admin/notifications.md). An authorized owner can also reset your password.

## Personal settings

Open the avatar menu and select **Account settings**.

| Page | Settings |
| --- | --- |
| Profile | Display name and username. Contact an owner to change your email |
| Account and security | Change your password; this signs out other devices |
| Preferences | Language, theme, density, sounds, desktop notifications, and commit attribution |
| API keys | Create keys that call Studio as you |
| Git | Connect your personal code host account |

![Set interface preferences, notifications, and commit attribution](https://static-docs.nocobase.com/studio-en-guide-preferences-20261031.png)

Interface preferences follow your account. Push subscriptions are per device and require HTTPS. On iPhone, open Studio from the Home Screen. See [Notifications and push](../admin/notifications.md).

Commit attribution follows the project setting by default. You can choose whether to list the Agent as a co-author.

## Connect your own Git account

In **Account settings › Git**, connect GitHub or another configured platform and follow the authorization steps.

Agents use your identity to push code and open PRs. Merges you make in Studio also use that identity. Without a personal connection, Studio uses the workspace connection. Your account needs access to the repository.

![A personal Git connection provides the identity for code changes and merges](https://static-docs.nocobase.com/studio-en-guide-personal-git-20261031.png)

If browser authorization is unavailable, **Other methods** offers device codes or personal tokens. Administrators control these options in [Code platforms](../configure/git.md). Tokens are encrypted and are not shown again.

Continue with [your first request](../../getting-started/collaborate-with-studio.md).
