---
title: Sign in and personal settings
description: Create your account from the invitation and sign in to Studio. Then use Account settings to change your profile, password, and preferences, and connect your own Git account.
---

## Accept the invitation

When an admin invites you, you get an invitation email. If Studio has no email set up yet, the admin sends you the invitation link directly. The link is valid for 7 days.

1. Open the invitation link. The page says who invited you, and your email address is already filled in.
2. Enter your name and a password of at least 8 characters.
3. Click **Create account and join**.

You land in **My issues**, signed in. If the admin chose projects when inviting you, you're already a member of them.

- If the email address already has an account, click **Go to sign in** and continue with that account.
- If the browser is already signed in to another account, sign out first, then accept the invitation.
- If the link has expired or been revoked, the page says so. Ask the person who invited you to send a new one.

## Sign in

Your admin gives you Studio's address, which looks like `https://studio.example.com/main/`. On the sign-in page, use your username or email and your password.

If the sign-in page shows **Forgot password?**, enter your email and follow the link you receive to set a new password. If it doesn't, Studio has no email set up yet. Ask an owner to reset your password in **Settings › Members**.

## Account settings

Click your avatar at the top right to open the account menu:

- **Account settings**: your profile, password, preferences, API keys, and Git account.
- **Use Studio in your agent**: give your agent setup instructions so it can work with Studio from the command line. See [Use Studio from your local coding agent](local-agent.md).
- **Language** and **Theme**: switch the interface language and color mode right there.
- **Sign out**.

**Account settings** has five pages:

| Page | What you can do |
| --- | --- |
| Profile | Change your display name and username. Your display name appears on issues and comments. Your email is read-only. To change it, ask an owner |
| Account and security | Change your password. Saving it signs you out on your other devices |
| Preferences | Interface language, color mode, and density; the sound reminder and desktop notifications; push notifications for this device; and how your agents sign the commits they make |
| API keys | Create your own keys so scripts and CI can call Studio as you. See [API keys](../admin/api-keys.md) |
| Git | Connect your own code host account. See the next section |

Preferences are saved with your account, so they follow you to any browser. Push notifications are subscribed per device and need Studio to be served over HTTPS. On an iPhone, add Studio to your Home Screen first, then open it from there to subscribe. See [Notifications and push](../admin/notifications.md).

**Commit attribution** follows the project's setting by default. Your agents always commit as you, and you choose whether to also credit the agent as a co-author.

## Connect your own Git account

Open **Account settings › Git** and click **Connect GitHub**, or the equivalent for GitLab or Gitee. Sign in on the code host and approve the authorization, and Studio shows the account as connected when you come back.

Once connected, your agents push code and open PRs as you, and the merges you make in Studio are done as you, so the code host shows whose work it is. Until then, the workspace's Git connection is used, for example the GitHub App your team installed. We recommend that everyone on the team connects their own account.

If authorizing in the browser isn't convenient, click **Other ways**:

- **Connect with a code**: open the code host's page, sign in, and enter the code Studio shows you.
- **Use a personal token**: paste a token you created on the code host. Studio verifies it, encrypts it, and never shows it again.

An admin decides which ways are available in **Settings › Integrations › Git**. If the page says **Personal accounts can’t be connected yet**, ask an admin to allow personal accounts. When a token expires, Studio goes back to the workspace's connection, so just connect again.

## Next steps

- [Make a request](../use/raise-a-request.md): hand the work to the agent team.
- [My sessions](../use/sessions.md): talk a request through with your agent first.
- [My issues](../use/my-tasks.md): start each day here, with anything waiting on you at the top.
