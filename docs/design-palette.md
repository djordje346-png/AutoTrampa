# AutoTrampa — Pearl / Graphite / Volt palette

The AutoTrampa palette uses neutral graphite surfaces inspired by premium automotive photography. It keeps the existing Volt accent **#FAEB00**. Prefer semantic tokens instead of hard-coded colors.

## Dark mode — Graphite Night

| Role | HEX | CSS token |
| --- | --- | --- |
| Canvas | `#101115` | `--surface-base` |
| Cards, dialogs | `#191A1E` | `--surface-card` |
| Input / inset / secondary panel | `#232429` | `--surface-elevated` |
| Hover | `#303137` | `--surface-hover` |
| Hairline border | `#35373D` | `--surface-border` |
| Heading / principal text | `#F5F5F3` | `--text-primary` |
| Supporting text | `#B6B9BE` | `--text-secondary` |
| Muted labels | `#989DA4` | `--text-muted` |

## Light mode — Pearl Neutral

| Role | HEX | CSS token |
| --- | --- | --- |
| Canvas | `#F5F5F3` | `--surface-base` |
| Cards, dialogs | `#FFFFFF` | `--surface-card` |
| Input / inset / secondary panel | `#EFEFED` | `--surface-elevated` |
| Hover | `#E5E6E3` | `--surface-hover` |
| Hairline border | `#D9DADC` | `--surface-border` |
| Heading / principal text | `#1E2024` | `--text-primary` |
| Supporting text | `#565B61` | `--text-secondary` |
| Muted labels | `#686C72` | `--text-muted` |

## Consistent dark navigation and Volt brand

- Header, dark footer, and bottom navigation always use `#101115`, including in light mode.
- Secondary navigation labels: `#AFB2B8`; primary navigation: `#F5F5F3`.
- The brand yellow remains exactly `#FAEB00`. Hover `#EADD00`, pressed `#D9CC00`. Text on yellow: `#101115`.
- Avoid yellow-tinted card surfaces or giant yellow shadows. Reserve Volt for actions, highlights, selected states and focus.
- Semantic status colors (success, warning, error) intentionally remain distinct; these convey meaning, not brand decoration.
- Shadows and micro-movements should be subtle. Use existing radius scale and Manrope/Inter typography.
- Light mode remains the default; the existing theme toggle and saved preference must continue to work.

Text-pair contrast ratios (WCAG, rounded): `#989DA4` over `#191A1E` ~6.4:1; `#686C72` over `#F5F5F3` ~4.8:1; `#101115` on Volt yellow ~15.2:1.
