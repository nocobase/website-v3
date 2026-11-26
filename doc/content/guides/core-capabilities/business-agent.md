---
title: "Connect a business Agent"
metaDescription: Add a permission-aware sales assistant to CRM customer details that combines customer records and product knowledge to produce cited, editable follow-up drafts saved only after human review.
---

Add an in-app sales assistant to CRM customer details: when a salesperson requests a draft, the assistant reads authorized customer records, opportunities, and product knowledge on the signed-in user's behalf, returns a summary, suggested next step, cited sources, and missing-evidence gaps, and populates an editable follow-up draft that is saved only after human review.

Keep two kinds of Agents distinct in this guide: your **development Agent** (Coding Agent) builds the tools and UI in the repository, while the **in-app business Agent** (sales assistant) runs inside the CRM app under each user's runtime permissions.

When trying the complete example, prepare:

- Separate administrator, salesperson Alex and Taylor, and manager Morgan accounts (see [account and role setup](roles-and-permissions.md#configure-users-and-roles)).
- Existing customer, follow-up, and opportunity data (such as **Northstar Manufacturing** owned by Alex with **Regional CRM rollout**).
- Product documentation in **Product knowledge** (see [Build a knowledge base](ai-assistant.md)).
- A chat model service and API key (such as DeepSeek, OpenAI, or an OpenAI-compatible endpoint).

**Modules covered**

- [Agents](../../core/using-plugins/agents-and-knowledge/agents.md)
- [Knowledge](../../core/using-plugins/agents-and-knowledge/knowledge.md)

## Define sales assistant capabilities and permission boundaries

The sales assistant uses **read-only tools** and generates drafts for review rather than taking autonomous business actions:

- **Customer data scope**: Every tool call re-evaluates customer access for the signed-in user. Inaccessible customers are rejected before any model call, and model input cannot switch users or broaden the selected customer.
- **Knowledge retrieval scope**: Product knowledge searches run under the current user's knowledge permissions, so restricted manager-only documents (such as **Internal Discount Margin Floor**) never enter model context or citations.
- **Grounded citations and explicit gaps**: Product schedules, pricing, and policy statements must come from retrieved documents citing exact titles and versions. Uncovered commitments (such as custom uptime penalty clauses) must be listed under **Missing evidence** rather than fabricated.
- **Human confirmation before saving**: Generation never sends email, edits quotations, or writes follow-up records automatically. Salespeople review and edit the draft before saving through the existing follow-up endpoint; read-only shared users can review drafts but cannot save follow-ups.

## Configure a model service and register business tools

The [Agents plugin](../../core/using-plugins/agents-and-knowledge/agents.md) manages model services, encrypted API keys, and `OnlineAgent` orchestration; the CRM application provides the permission-checked tools and customer detail UI.

### Build with your development Agent

Send the permission boundaries above together with this request to your development Agent:

```prompt
Add a Sales assistant tab to CRM customer details and expose AI model management in System settings:
- When generating a follow-up draft, read only the selected customer's details, contacts, follow-ups, opportunities, and quotes that the signed-in user can access, along with authorized Product knowledge articles.
- Return a customer summary, suggested next step, cited knowledge articles with version numbers, explicit missing-evidence gaps, and an editable follow-up draft.
- Never send email, modify quotes, or save follow-ups automatically. Let the salesperson edit and save manually, and block saving for read-only shared users.
- Show clear guidance if no chat model is enabled yet.
```

### Understand the wiring

In the complete example, the [assistant provider](https://github.com/nocobase/doc-demo-crm/blob/main/server/providers/crm-assistant.ts) registers two read-only tools and a named scope `crm-follow-up`:

- `crm_customer_context`: rebuilds a fresh authorization policy from the signed-in identity and reads the selected customer, contacts, latest follow-ups, opportunities, and quotes.
- `crm_product_knowledge`: re-verifies customer access, then calls `knowledgeToken.docs.search` as the current user against `crm-products` and returns matched document IDs, titles, versions, and excerpts.

The [assistant route](https://github.com/nocobase/doc-demo-crm/blob/main/server/routes/crm-assistant.ts) verifies customer view access and enabled chat model availability before starting a schema-constrained `agents.onlineAgent.background(...)` execution, without performing any writes:

```ts
const session = await agents.onlineAgent.background(
  {
    user: { id: authCtx.user.id },
    authorization: authzCtx,
    credentials: authCtx,
    business: { customerId },
  },
  {
    scope: ['crm-follow-up'],
    selectedModel: resolvedModel,
    source: 'crm-follow-up-draft',
    title: `Follow-up draft: ${customerName}`,
  },
);
await session.run(
  [{ role: 'user', content: userPrompt }],
  FOLLOW_UP_DRAFT_JSON_SCHEMA,
);
const draft = FollowUpDraftResult.parse(await session.get());
```

### Configure a model service in System settings

Storing model keys requires `secrets.keys` in your private `config.yml` (never commit real keys). Sign in as an administrator:

1. Open **System settings → AI → AI models** and click **+ Add service**.
2. Choose a provider (such as **DeepSeek**, **OpenAI**, or **OpenAI-compatible**), enter a service name and Base URL, and paste your real key into the write-only **API key** field. Never put API keys in prompts or screenshots.
3. Click **Fetch models** or add a `chat` model manually, then run **Test connection**.
4. Turn on **Enabled** and save.

![Configuring a model service and write-only API key in System settings](/assets/guides/crm-assistant-models.png)

Until at least one `chat` model is enabled, the **Sales assistant** tab shows setup guidance instead of issuing failed requests.

## Generate evidence-backed follow-up drafts in customer details

With an enabled chat model in place, test the end-to-end salesperson workflow:

1. As Alex, open **Northstar Manufacturing → Sales assistant**.
2. Confirm an enabled chat model is selected and enter an optional focus in **Focus for this follow-up** (for example: `Summarize recent progress, explain our 4-week implementation schedule and discount approval policy for the 15% quote, and note whether custom SLA penalties are covered.`).
3. Click **Generate follow-up draft**. The assistant invokes the customer context and product knowledge tools and returns a structured brief and draft.
4. Review the left card:
   - Check that **Customer summary** and **Suggested next step** match the customer's real follow-ups, opportunity, and quote.
   - Confirm **Product knowledge sources** lists matched articles and versions (such as **Enterprise Implementation Guide** `v1` and **Quotation Discount Policy** `v2`).
   - Check **Missing evidence** for explicit gaps (such as custom SLA penalties not being covered in Product knowledge).
5. Edit the channel, summary, and next step under **Editable follow-up draft**, then click **Save as follow-up**.
6. Click **View follow-ups** in the confirmation alert to verify the saved record appears under **Follow-up records**.

![Alex reviewing an evidence-backed summary, cited sources, and editable follow-up draft in customer details](/assets/guides/crm-assistant-draft.png)

## Verify source citations, permission isolation, and human confirmation

Use separate accounts to verify permissions and boundaries:

| Action | Expected result |
| --- | --- |
| Generate a draft as Alex without clicking save, then open **Follow-up records** | No new record is created; generation performs no writes |
| Ask about discount rules as Alex | Cites only **Quotation Discount Policy** (`v2`); never leaks the manager-only **Internal Discount Margin Floor** |
| Call the draft endpoint for Alex's customer as unrelated salesperson Taylor | Rejected with `404` before calling any model |
| Share the customer read-only with Taylor, then open **Sales assistant** as Taylor | Draft can be reviewed, but read-only notice is shown, saving is disabled, and direct follow-up writes are rejected |
| Transfer ownership from Alex to Taylor, then retry generation as Alex | Access is immediately denied |

Automated verification covers two layers: the example's [server integration test](https://github.com/nocobase/doc-demo-crm/blob/main/tests/server/crm-assistant.test.ts) and [client component test](https://github.com/nocobase/doc-demo-crm/blob/main/tests/client/crm-assistant.test.tsx) verify missing-model handling, tool authorization, knowledge isolation, read-only sharing, and post-transfer revocation against isolated SQLite and a local OpenAI-compatible test fixture; the draft screenshot above was captured from a live running CRM instance calling local Codex through a local OpenAI-compatible bridge, with manual draft saving verified end to end. When connecting an external commercial model provider (such as DeepSeek or OpenAI) with your own API key, verify connectivity with **Test connection** and live generation in your own environment.

**Done when**: An enabled chat model is configured under **AI models**, salespeople can generate follow-up drafts with accurate document version citations and missing-evidence callouts, generation writes no CRM data on its own, edited drafts save cleanly to **Follow-up records**, and unauthorized, read-only shared, and revoked-access boundaries hold in real time.

Return to [Topic tutorials](index.md) to explore other Core capabilities, or read the [Agents plugin guide](../../core/using-plugins/agents-and-knowledge/agents.md) to add live chat panels, business Skills, or machine coding agents.
