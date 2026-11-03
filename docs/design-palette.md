# AutoTrampa — Navy / Orange palette

The approved HTML palette preview defines deep navy surfaces and warm orange actions. Prefer semantic tokens over hard-coded colors so listings, details, forms and messages share the same palette.

## Dark mode

| Role | HEX | CSS token |
| --- | --- | --- |
| Canvas | `#0B1628` | `--surface-base` |
| Cards, dialogs | `#13233A` | `--surface-card` |
| Input / secondary panel | `#192C46` | `--surface-elevated` |
| Hover surface | `#213650` | `--surface-hover` |
| Border | `#2A3B53` | `--surface-border` |
| Primary text | `#F8FAFC` | `--text-primary` |
| Supporting text | `#A8B5C8` | `--text-secondary` |
| Muted text | `#91A1B7` | `--text-muted` |

Card containers retain a subtle navy gradient from `#162840` to `#13233A`.

## Light mode

| Role | HEX | CSS token |
| --- | --- | --- |
| Canvas | `#F4F6FA` | `--surface-base` |
| Cards, dialogs | `#FFFFFF` | `--surface-card` |
| Input / secondary panel | `#F6F8FC` | `--surface-elevated` |
| Hover surface | `#EDF1F7` | `--surface-hover` |
| Border | `#DCE3EC` | `--surface-border` |
| Primary text | `#0B1628` | `--text-primary` |
| Supporting text | `#52647C` | `--text-secondary` |
| Muted text | `#5C6F88` | `--text-muted` |

Muted labels use a slightly deeper blue than the prototype so small text also remains readable on hover surfaces. The marketing landing canvas stays light around the supplied photographs.

## Brand and navigation

- Primary orange: `#F97316`; hover: `#EA580C`; pressed: `#E0520B`.
- Solid orange controls always use navy `#0B1628` labels through `text-on-accent` or `--primary-foreground`, including selected states in dark mode.
- Inline orange text on light surfaces uses `#C2410C` through `text-brand-text`; dark surfaces use `#F97316`.
- Light accent surfaces: `#FFF2E7`; borders: `#FED7AA`.
- Header, footer, bottom navigation and browser/PWA theme color use navy `#0B1628` in both themes, with `#F8FAFC` primary text and `#A8B5C8` supporting text.
- The vector logo and app icon use orange arrows and domain suffix, with navy or light foregrounds according to their surface.
- Semantic success, warning, error and trade direction colors retain their meanings.
- Light mode remains the default; the existing theme toggle and saved preference continue to work.
- Keep the existing radius scale and Manrope/Inter typography.

## Selection controls

| Role | HEX | CSS token |
| --- | --- | --- |
| Selected filter / active switch | `#3F6DB5` | `--control` |
| Selected control hover | `#345D9D` | `--control-hover` |
| Text on blue controls | `#F8FAFC` | `--control-foreground` |
| Switch thumb | `#F8FAFC` | `--control-thumb` |
| Focus on light surfaces | `#3D648C` | `--control-ring` |

Use denim blue with light labels for quick trade filters, filter chips, sort selection, Grid/Swipe selection and preference switches. Selected controls use the same blue in both themes; unselected controls use neutral surfaces. Dark-mode focus uses `#6B91B8`. Icons inside light switch thumbs use navy; check marks inside light badges use denim blue. Primary submit and offer actions use the orange brand tokens.

Verified text contrast ratios, rounded: navy on orange **6.46:1**, navy on hover orange **5.09:1**, navy on pressed orange **4.64:1**, light text on denim blue **4.94:1**, light text on blue hover **6.27:1**, light muted text on its hover surface **4.54:1**, dark muted text on its hover surface **4.67:1**. The light switch thumb has **4.94:1** contrast against the denim track.
