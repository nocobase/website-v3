# The website's other languages

Chinese and English are written directly in the page sources (`<t-zh>` / `<t-en>`, and `L()` / `M()` in the home page script). The translations into Spanish, French, German, Portuguese (Brazil), Russian, Indonesian, Vietnamese, Traditional Chinese, Japanese and Korean are in this directory; the build (`pnpm homepage:build`) writes them straight into each language's pages, so pages no longer load translations in the browser. When a translation is missing the page shows English; nothing breaks.

## Files

All files are YAML, one set per group. The groups are the home page `home`, the header, footer and form messages `site`, and the sub-pages `core`, `studio`, `solutions`, `crm`, `itam`, `pricing`, `partner`, `find-partner` and `contact` (the mapping between groups and pages is `PAGE_GROUPS` in `src/lib/i18n.mjs`):

- `<group>.keys.yaml`: the entries to translate, extracted from the pages by `pnpm homepage:i18n:extract`; do not edit it by hand. `meta` holds the Chinese and English page title and description; `items` lists, by number, each entry's English source `en`, Chinese source `zh` and location `where`. An entry that is no longer on the page is marked `unused: true`, and when the same English text means something different on a page it gets a separate key `k` (written `<t-en data-k="…">` in the body).
- `<group>.<language>.yaml`: the translations of one language; people edit this file directly. `notes` holds how this language is written and its fixed terms (for example German uses Sie and translates foundation as Fundament), `title` and `description` are the page title and description (the `site` group has none), and `strings` holds the translations by number. The Traditional Chinese files also have `ui`: Simplified Chinese → Traditional Chinese for the text in the product interface illustrations.

```yaml
notes: |-
  Deutsch（Sie）
  术语：foundation = Fundament；building blocks = Bausteine
title: NocoBase Core — Ihre Agenten kümmern sich um die Geschäftslogik
description: NocoBase Core ist das Open-Source-Anwendungsfundament …
strings:
  "000": Ihre Agenten kümmern sich um die Geschäftslogik. <span class="m">Das Fundament steht bereit.</span>
  "002": Schnellstart
```

Translations are keyed by number rather than by the English source: the English text is often long and carries HTML markup, so numbered files are easier to read; and when the English changes it becomes a new entry with a new number, so an old translation is never silently applied to a new source, and the missing one shows up in the check. To find which number belongs to which source, look at `<group>.keys.yaml`.

YAML notes: a translation that contains a colon followed by a space, `#` or a quote, or that starts with a special character, must be quoted (`pnpm homepage:i18n:extract` adds the quotes automatically when it writes a file back); always write the numbers as quoted three-digit strings (`"000"`). Run `pnpm homepage:i18n:check` after editing; it reports a format error.

## After changing the copy of a page

1. Run `pnpm homepage:i18n:extract` at the repository root (inside `homepage/` it is `pnpm i18n:extract`). Existing numbers stay; an entry whose English changed or that is new is appended at the end, and an entry that has been removed from the page is marked `unused: true`. It also updates the Traditional Chinese interface texts: new ones are written with an empty value into the `ui` of `<group>.zh-TW.yaml` and listed as "to fill in", and ones that are no longer on the page are removed.
2. Add the translations for the new numbers to `strings` in each language's `<group>.<language>.yaml`; for Traditional Chinese, fill the empty values in `ui` with Traditional Chinese (Taiwan usage, see `ui-terms.md`).
3. Run `pnpm homepage:i18n:check`: it lists the missing translations, and a format error makes it fail (the build checks this too). After `pnpm homepage:build`, look through the result with `pnpm homepage:preview`.

`i18n:extract` and `i18n:check` use only Node, so they also run on Linux. Traditional Chinese is no longer converted from Simplified automatically; people write it directly. At build time a Traditional Chinese interface text that is missing shows Simplified Chinese and prints a warning; it does not fail the build.

## What is translated and what is not

- **Translated**: marketing copy, the header, footer and forms, and the captions on the structure diagrams (the Core diagram, the Core capability strip under the hero, the hero closing card, the app descriptions on the left of the Solution section).
- **Not translated**: the product interface illustrations (the content of `.fit-in`, the interfaces in the home page `<template>`s, and `L()` in the home page script). Simplified Chinese shows the Chinese interface, Traditional Chinese shows the Traditional Chinese interface (`ui`), and every other language shows the English interface; an interface language that does not exist is never shown. Names in the product interface follow `ui-terms.md`: languages other than Chinese write them as in the English interface (for example Studio's My issues, My sessions, Runtimes), and Traditional Chinese writes Traditional characters; on the NocoCRM and NocoITAM pages only the character forms change (線索, 審批). People's names are converted to Traditional characters, amounts use NT$, and numbers do not change.
- **Chinese-only content**: use `.zh-only` (for example the Xinchuang database row of the pricing page, and the WeChat and domestic address of the contact page); languages other than Chinese do not show it, and it does not contain `<t-en>`.
- **Forms**: the forms of the Contact and Partner pages are submitted to NocoBase 2's Chinese form for Simplified Chinese and to the English form for every other language. Labels use `<t-en>`; input placeholders, option texts and the success message are written in `data-ph-en`, `data-text-en` and `data-ok-en` and extracted along with the rest; the messages in `src/scripts/public-form.js` are written as `T(zh, en)` and belong to the `site` group; the options of the two multiple-choice questions on the Contact page come from the fields of the English form and are listed in `FORM_OPTIONS` in `scripts/i18n.mjs` (inside `homepage/`), so change them when the form fields change. The country list stays in English. The translations the form needs in the browser are inlined into the page by the build.
- Prices: other languages write US dollars and format numbers by each language's convention (see `notes` in `pricing.<language>.yaml`).

## Writing standard

The same standard as the English "NocoBase Product Definition and Messaging" (in the [nocobase/nocobase-v3-standard](https://github.com/nocobase/nocobase-v3-standard) repository):

- Write the way comparable products in that language are written; do not translate word for word, and do not change the meaning. Traditional Chinese is rewritten from the Simplified Chinese source into Taiwan usage, not translated from English.
- Use one term for a concept across the whole page; see the terms in each file's `notes`. For example, foundation: French socle, German Fundament, Vietnamese nền móng (distinct from nền tảng, which means "platform"), Japanese 基盤.
- Control the length by position. The hero headline is not wrapped, so it has to be short; each cell of the Core capability strip under the hero is about 72px, roughly 11 letters in Western languages or 5 characters in Chinese, Japanese and Korean; keep card titles within a line and a half.
- "AI + NocoBase" is a brand combination and is not translated in any language; in the body, AI follows local usage (German KI, French and Spanish IA, Russian ИИ).
- When the English source has `<br>` or `<span class="...">`, the translation keeps the same markup (Chinese, Japanese and Korean may drop the `<br>` as the Chinese source does); keep the placeholders in the home page entries (such as `{app}`).
- The no-break spaces before `? ! : ;` in French and between a number and `%` are added by the build; write ordinary spaces in the translation.

After changing, build and check in a browser at widths 1440, 1180, 768 and 390: the headline and the capability strip must not overflow.
