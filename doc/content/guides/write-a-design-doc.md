---
title: Write a system design document first
metaDescription: Talk ITAM's design through with the agent and keep the design document in the repository, then cover five points and write acceptance criteria for every request after that.
---

Don't ask the agent to generate the whole system in one sentence. "Build an IT asset management system" leaves dozens of business questions open, and the agent can only guess for you. Talk the design through with the agent first, write it up as a document in the repository, and base every later request on it.

## 1. Talk through the design with the agent

Start a new session in the `itam-lite` directory:

```prompt
I want to build a lean IT asset management system. Don't write code yet; let's work out the design first.
Three roles: employees request devices, asset managers approve, and IT support issues them and records them in the register.
Ask me about anything I need to decide, one group of questions at a time, with your recommendation for each.
```

The agent asks one group of questions at a time. In this tutorial we decided:

| The agent asks | Decision |
| --- | --- |
| Which fields does a device have? Are asset numbers and serial numbers unique? | Asset number is required and unique; serial number is optional |
| Which requests need approval? | Laptops and phones need approval; so does any request from someone who already has 2 devices in use. Administrators can adjust both |
| Who approves, and who issues? | Any asset manager approves, but not their own requests; IT support picks an in-stock device to issue |
| What can employees see? | Only their own requests and the devices assigned to them |
| What is out of scope for this version? | Purchasing, repairs, stocktaking, disposal, returns, multi-level approval, import and export |
| Is there a company design system? | No, use the design conventions built into NocoBase 3 |

If you have a company design system (colors, fonts, component rules), put the files in the repository and tell the agent at this step.

## 2. Write it up

```prompt
Write the decided design into docs/design.md: roles, data, workflows, pages, permissions, plus a step-by-step delivery plan with acceptance criteria for each step.
Register it in AGENTS.md: read it before any business change; when a request changes the design, update it first, then change the code.
```

The document the agent wrote is [docs/design.md](https://github.com/nocobase/docs-examples-v3/blob/main/apps/itam-lite/docs/design.md) in the example repository. Its last section splits development into three steps, which are exactly the next three pages:

| Step | Delivers | Done when |
| --- | --- | --- |
| 1 Device register | Device table, APIs and pages | You can create, edit and search devices; a duplicate asset number shows a message next to the input; data is still there after a refresh |
| 2 Requests and approval | Requests, workflow, notifications, workflow management | A laptop request is approved and then issued by IT support, and the device becomes In use in the register; a monitor request goes straight to Ready to issue; the people involved get in-app messages |
| 3 Roles and permissions | Three roles and their data scopes | Signing in with each of the three accounts, what you see and can do matches the permission matrix; API calls beyond a role's permissions are rejected |

Read through the document, have the agent fix anything that's wrong, then commit:

```bash
git add -A && git commit -m "docs: add the system design"
```

For a more structured process, you can use [OpenSpec](https://github.com/Fission-AI/OpenSpec) (each change written up as a proposal, design and tasks) or [superpowers](https://github.com/obra/superpowers) (brainstorm, then plan, then execute). This tutorial just uses conversation and one `docs/design.md`.

## 3. Cover five points in every later request

The design document covers the whole system. A single request still needs to cover five points:

| Point | What it means |
| --- | --- |
| Who uses it, and where | Which role, on which page |
| What it should achieve | The result the user sees |
| Rules and limits | Business rules; what this change doesn't do; what happens to existing data |
| What happens on failure | How it behaves on invalid input, conflicting data or missing permission |
| How to tell it's done | Acceptance criteria a person can click through |

The same request, written two ways:

```prompt
Devices should be returnable.
```

```prompt
Add "Return" to the device register.
IT support clicks Return on a device that is In use and fills in the return location; the device becomes In stock and its user is cleared.
Only IT support and asset managers can return devices, not employees. Devices that are In stock, In repair or Retired can't be returned.
If someone else has changed the device meanwhile, ask the user to refresh and try again.
Acceptance: after IT support returns a device that is In use, it is In stock with no user; employees don't see Return.
```

With the first, the agent has to guess who can return devices, how the status changes and what happens to existing data. With the second, the agent follows it and a person accepts against it.

For larger requests, have the agent propose a plan first and start only after you confirm:

```prompt
Don't change code yet. List which parts this change touches, the questions I need to decide, and how you plan to verify it.
```

For how to write requests and accept the results, see [Continue developing your app](../core/getting-started/develop-with-an-agent.md#describe-requirements).

**Done when**: the repository has `docs/design.md`, it is registered in the index in `AGENTS.md`, and the document ends with a step-by-step delivery plan and acceptance criteria for each step.
