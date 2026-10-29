# AutoTrampa public landing — design QA

Date: 2026-10-29
Target: first displayed "Jasna zamena" ImageGen landing selected by the owner.
Scope: signed-out home page; real owner listings; existing auth and navigation.

## Evidence and normalization

Source: generated image `exec-495b5f5c-bc1b-4d90-aa27-e04827839f3b.png`, 948 × 1659.
Implementation: cloud browser, desktop about 1348–1363 × 936, normal pixel density.
Full-page comparison: `/workspace/scratch/autotrampa-landing-comparison-final.jpg`.
Focused hero comparison: `/workspace/scratch/autotrampa-landing-hero-comparison.jpg`.
Accepted hero: `/workspace/scratch/autotrampa-landing-hero-final.jpg`.
Mobile hero: `/workspace/scratch/autotrampa-landing-mobile-frame.jpg`.
Mobile footer: `/workspace/scratch/autotrampa-landing-mobile-bottom-final.jpg`.
Tablet: `/workspace/scratch/autotrampa-landing-tablet-final.jpg`.

Source and implementation were placed together in the same comparison image,
normalized to equal widths. The full-page browser capture contained 47px of
sticky-header capture displacement; that margin was removed only in the
comparison copy. The focused hero was captured again at scroll position zero.
Mobile/tablet were tested in same-origin viewport frames (390/768px outer
width, 375/753px content width with desktop scrollbars), not device emulation.
There is no mobile source mock: responsive layouts are intentional adaptations.

## Iterations and fixes

- P2: desktop display typography was too small against the target. Increased
  hero to a responsive 48–76px scale and section headings to 30–50px; rechecked
  full-page and focused hero comparisons. Resolved.
- P2: mobile hero cropped both vehicles. Added a separately optimized crop and
  stacked the hero; rechecked that both cars and their wheels remain visible.
  Resolved.
- P1: white mobile closing copy crossed the bright sunset. Darkened the photo
  on mobile only and inspected the final footer capture. Resolved.
- P2: tablet hero cropped the second car, then contained its image too narrowly.
  Used the responsive crop with a full-width bottom-aligned photographic area.
  Rechecked tablet capture: complete cars, readable copy, no horizontal overflow.
  Resolved.

## Required fidelity surfaces

- Typography: scoped Inter for marketing content, strong headline hierarchy,
  Serbian diacritics, readable text and intentional responsive wrapping.
  Existing shared wordmark and owner-listing cards remain intact.
- Spacing/layout: same section order, split hero, three-step process, owner
  listing grid, full-width photographic conversion banner, graphite footer.
  3 desktop / 2 tablet / 1 mobile listing columns; consistent app container.
- Colors/tokens: exact #FAEB00 accent, graphite navigation/footer, light canvas.
  Light marketing tokens are scoped locally and do not change app theme state.
- Image quality: two clean photographic assets recreated from the selected
  reference; WebP, intrinsic dimensions, hero eager/high priority and closing
  image lazy. All displayed image requests were verified loaded. Real listing
  photos and data are preserved, including any existing owner-uploaded content.
- Copy/content: selected Serbian headings and action labels retained. No fake
  testimonials, verification badges, counts, valuation estimates or demo cards
  were added. Source mock listings are deliberately replaced by real owner data.

## Functional verification

- Hero Add Car opens the existing auth dialog with the add-car intent. Closing
  it returns to the landing; credentials and account creation were not exercised.
- Browse Listings opens `/search`, showing its existing real/demo search feed.
- Mobile menu opens/closes; shared keyboard Escape/focus behavior is preserved.
- Owner listing links and shared card actions retain their existing components.
- Desktop and mobile content widths checked: no horizontal overflow.
- Production build, TypeScript and ESLint passed. Existing Supabase dependency
  warnings remain unrelated to this visual change.
- No app-origin runtime error was observed in browser logs; extension metadata
  errors were excluded from app findings.
- Static accessibility review: named sections, single app-owned main landmark,
  semantic ordered steps, decorative photos with empty alt, accessible link
  labels, visible focus styles and reduced-motion handling. Not a full WCAG audit.

## Accepted differences / follow-up polish

- P3: photography is faithfully recreated rather than pixel-identical to the
  generated mock; the decorative exchange arc is simplified to a library icon.
- Existing original listing cards intentionally retain their current design and
  owner-uploaded images. Content quality/moderation is outside this change.
- Logged-in feed and other pages keep their previous layout and palette.

No unresolved P0/P1/P2 findings in the implemented landing scope.

final result: passed
