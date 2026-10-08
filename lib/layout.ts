/**
 * The one horizontal container rule for the whole app.
 *
 * Content and header share it so a page's title lines up with the cards below
 * it. The header keeps its full-bleed background (border + colour) and applies
 * this to an inner wrapper instead, which is why the class string only carries
 * width, centring and padding.
 *
 * Cards in a grid additionally add `gap-*`, and sections add vertical padding —
 * never horizontal, or the columns stop lining up with the header.
 */
export const CONTAINER = 'mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8';

/** Same container with the app's standard bottom breathing room. */
export const CONTAINER_PADDED = `${CONTAINER} pb-6`;
