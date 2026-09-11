/** Supplied artwork; dark/light describe the intended background. */
export const brand = {
  frontend: { light: '/brand/layeredfx_logo_light_outline.svg', dark: '/brand/layeredfx_logo_dark_outline.svg' },
  dashboard: { light: '/brand/layeredfx_logo_light_simple.svg', dark: '/brand/layeredfx_logo_dark_simple.svg' },
  favicon: { light: '/brand/LayeredFX_favicon_light.png', dark: '/brand/LayeredFX_favicon_dark.png' },
  app: '/brand/layeredfx_app_icon.svg',
  email: { light: '/brand/LayeredFX_logo_light_outline_email.png', dark: '/brand/LayeredFX_logo_dark_outline_email.png' },
} as const;

/** Email templates need an absolute, publicly accessible asset URL. */
export function emailLogoUrl(siteUrl: string, background: 'light' | 'dark' = 'light') {
  return new URL(brand.email[background], siteUrl).href;
}
