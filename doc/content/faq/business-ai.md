---
title: "How do I add an AI assistant to my app? Can I reuse AI employees?"
---

The Agents plugin adds AI conversations, model connections, Skills, and tool calls to a business application. It serves application users, a different purpose from a Coding Agent modifying source code in your development directory. See the [Agents plugin](../core/using-plugins/agents-and-knowledge/agents.md).

Register the plugin, connect chat and administration interfaces, configure an available model, and decide which business tools the assistant may call. To query orders, for example, connect an order-query tool and restrict its data scope using the actual caller's identity. Connecting a model does not automatically expose business data. Add the [knowledge base plugin](../core/using-plugins/agents-and-knowledge/knowledge.md) when you need to retrieve knowledge documents.

An AI employee configuration from NocoBase 2 cannot simply be enabled as a V3 plugin. Reuse its responsibilities and prompts as requirements, but reconnect and verify tools, knowledge, and permissions through V3 interfaces. Do not assume existing configurations or conversations can be imported directly.

After deployment, business AI still needs access to its model service and the corresponding configuration. The development agent's account does not automatically configure models for the production application.
