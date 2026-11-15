---
title: "Accept and deliver the app"
metaDescription: Accept customer follow-up features against your requirements, review the agent's checks, follow your team's review and release process, and verify the deployed workflow.
lesson: 4
---

Continue with the CRM from [Build customer follow-up](customers-and-follow-ups.md). Use the agreed requirements and prototype to judge whether the completed features meet your needs.

<div class="course-example">
<div class="table-wrap">
<table>
<caption><span class="course-example-caption"><span class="course-example-label">Example project<span class="course-example-help"><button type="button" aria-label="How to use the example project"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg></button><span class="course-example-popover"><a href="index.md#use-example-project-tags">How to use example project tags</a></span></span></span></span></caption>
<tbody>
<tr><th scope="row">Start</th><td><a href="https://github.com/nocobase/doc-demo-crm/tree/lesson-3"><code>lesson-3</code></a></td></tr>
<tr><th scope="row">Finish</th><td><a href="https://github.com/nocobase/doc-demo-crm/tree/lesson-4"><code>lesson-4</code></a></td></tr>
<tr><th scope="row">Lesson notes</th><td><a href="https://github.com/nocobase/doc-demo-crm/blob/lesson-4/docs/lesson-4.md">Installation and run instructions</a></td></tr>
<tr><th scope="row">Modules covered</th><td><a href="../core/developing-apps/testing-and-acceptance.md">App testing</a></td></tr>
</tbody>
</table>
</div>
</div>

## Accept the features

During development, the agent should add and run tests relevant to its changes, check page interactions, data persistence, and permissions, and fix problems it finds. This is part of development; you do not need to specify individual test commands. For acceptance, review which checks it actually completed, their results, and anything still unverified. A requirement to test is not evidence that checks passed.

You can open the app and work through the requirements and prototype yourself, or first ask the agent to check the documented acceptance criteria:

```prompt
Check the customer follow-up features against the acceptance criteria in our requirements document and compare the actual interactions with the prototype.
Give me an acceptance report with a link to the local test environment and screenshots of the key operations. Explain what passed, any problems, and anything still unverified so I can try it myself.
```

The report should connect specific requirements to actual operations and results. Screenshots help you review page states; the link lets you try the app. Checks that were not run or could not be completed should be identified explicitly. Screenshots alone do not establish that a feature works. Use a separate test environment and demonstration data for acceptance to avoid affecting production records.

Open the address the agent provides and follow [Lesson 3's walkthrough](customers-and-follow-ups.md#try-creating-finding-and-editing-records). Check the following against your requirements:

| What to try | What to confirm |
| --- | --- |
| Create a customer, add a contact and follow-up, then reload | Records remain and belong to the correct customer |
| Edit customer details, then search and reopen the customer | The customer is found, changes are saved, and existing details remain intact |
| Leave the customer name or follow-up blank, or enter an invalid email | The page explains the problem and allows saving after correction |
| Sign in with test accounts that have different permissions | Each account can view and operate only what it is allowed to |

For cases that are harder to reproduce manually, such as denied access, failed saves, or duplicate submissions, review the agent's checks and ask it to verify anything lacking evidence. You make the final decision about whether the features and interactions meet business needs.

If you find a problem, tell the agent the steps, actual outcome, and expected outcome, with screenshots where useful. After a fix, try the affected operations again and review the updated acceptance results.

Once accepted, follow your team's review process. A PR (pull request) lets the team review and merge the changes. If a PR already exists, add the acceptance results to it without repeating commits or opening another PR. If there is no PR yet, you can ask:

```prompt
Submit the completed customer follow-up features for team review. Describe what is included and attach the acceptance results.
```

## Publish the app

After review, publish the agreed version through your team's CI/CD process. The app supports Docker, PM2, and other deployment methods; see [Choose a deployment method](../core/deployment/choose-a-deployment-method.md).

Production uses separate configuration, a database, and file storage. Business records from development are not copied to production automatically.

After publishing, sign in to the deployed app. Confirm that customers, contacts, and follow-ups can be viewed and saved, and remain after reloading. For an update, also check existing customer details.

![Customer details showing customer information, contacts, and follow-up records.](/assets/guides/customer-detail.png)

## Back up and update

Before production use, confirm with the colleague responsible for releases that database and uploaded-file backups are arranged and that the matching app version, runtime configuration, and keys are retained. The team should verify restoration in a separate environment. You can sign in and inspect customers, contacts, and follow-ups to confirm that the restored business data is usable.

For later features or fixes, follow the same sequence: agent development and checks, business acceptance, team review, release, and verification in the deployed environment. Updates should preserve existing configuration and business data. See [Publish an app release](../core/deployment/publish-app-release.md) for instructions.

Reverting the program does not necessarily restore data, and restoring a backup loses additions or changes made after that backup. If recovery is needed, have the team establish compatible program and data versions and decide how to handle those business records.

**Done when**: Customer follow-up features have been accepted against the requirements and prototype, issues have been fixed and rechecked, and team review has passed. In the deployed app, customers, contacts, and follow-ups can be viewed and saved and remain after reloading. Backup arrangements are confirmed, and restored business data has been verified in a separate environment.

## Summary

With these steps complete, the first version of your CRM is ready, and you have followed a full development cycle: requirements, agent development, acceptance, review, and release. The following lessons build on the same app, exploring data relationships, UI components, permissions, approvals, notifications, and AI in more depth. Continue with [Model opportunities and quotes](opportunities-and-quotes.md).
