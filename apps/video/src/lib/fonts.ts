import { staticFile, continueRender, delayRender } from 'remotion';

/**
 * Load fonts required for video compositions.
 *
 * Remotion supports loading Google Fonts via @remotion/google-fonts,
 * or you can use local font files placed in public/.
 *
 * For now we use the Google Fonts CSS import approach.
 * Swap to @remotion/google-fonts if you want tree-shaking per weight.
 */

const GOOGLE_FONTS_URL =
  'https://fonts.googleapis.com/css2?' +
  'family=Merriweather:ital,wght@0,300;0,400;0,700;0,900;1,300;1,700' +
  '&family=DM+Mono:wght@400;500' +
  '&display=swap';

let fontsLoaded = false;

export function loadFonts(): void {
  if (fontsLoaded) return;
  fontsLoaded = true;

  const handle = delayRender('Loading fonts');

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = GOOGLE_FONTS_URL;

  link.onload = () => continueRender(handle);
  link.onerror = () => {
    console.warn('Failed to load Google Fonts, falling back to system fonts');
    continueRender(handle);
  };

  document.head.appendChild(link);
}
