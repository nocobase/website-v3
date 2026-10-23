# Sound effects: sources and licences

The house mix uses eight roles. The team chose these files from an audition reel on 2026-09-25 (the NocoBase 3 brand
film). The music is code-original (`score.mjs`) and uses none of them.

| Role | Used for | File | Source |
|---|---|---|---|
| key / enter | typing a prompt, Enter | `kenney/click4.ogg` | Kenney UI Audio · CC0 (ships with the skill) |
| click | a cursor click on a real control | `mixkit/mixkit-2997.wav` (first 0.1 s) | Mixkit 2997 "Clear mouse clicks" |
| pop | a message or request arriving | `kenney/toggle_002.ogg` | Kenney Interface Sounds · CC0 (ships) |
| ok | a confirmation: approved, deployed, 7/7 | `kenney/confirmation_001.ogg` | Kenney Interface Sounds · CC0 (ships) |
| alert | a warning, an incident | `mixkit/mixkit-2569.wav` (first 0.45 s) | Mixkit 2569 "Negative tone interface tap" |
| whoosh | a structural move: dive, whip pan, page slide | `mixkit/mixkit-166.wav` | Mixkit 166 "Fast small sweep transition" |
| impact | weight under a chapter or logo arrival | `mixkit/mixkit-2299.wav` | Mixkit 2299 "Short bass hit" |
| clack / lock | something lands on a base; a lock | `mixkit/mixkit-2857.wav` | Mixkit 2857 "Gear fast lock tap" |

## Kenney (`kenney/`, shipped)

Creative Commons Zero (CC0 1.0), public domain: https://kenney.nl/assets/interface-sounds · https://kenney.nl/assets/ui-audio

## Mixkit (`mixkit/`, fetched per project)

Mixkit Sound Effects Free License: https://mixkit.co/license/#sfxFree

- Allowed: free use in commercial and non-commercial projects, including films, online video and ads. No attribution.
- Not allowed: redistributing the files on their own (as stock, in a tool or template, or with source files); claiming
  them as your own; registering them with a rights-management service.

So the skill does not include them: `scripts/fetch-sfx.sh <project>` downloads them into the project from
`https://assets.mixkit.co/active_storage/sfx/<id>/<id>.wav`. Keep them inside the project; do not commit them to a shared
kit or template repo.

## Changing a sound

Audition candidates side by side (the user picks by ear; the agent cannot listen), record the choice here, and change
the role's file and level in `mix.mjs`. A new role needs a row in the mixer's role table (file, sync point, peak level) and
in its ducking table (sound-and-mix.md).
