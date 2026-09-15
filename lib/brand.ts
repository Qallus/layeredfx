/** Supplied artwork; dark/light describe the intended background. */
export const brand = {
  frontend: { light: '/brand/lfx_logo_outline_light_mode.svg', dark: '/brand/layeredfx_logo_dark_outline.svg' },
  dashboard: { light: '/brand/lfx_logo_light_mode.svg', dark: '/brand/layeredfx_logo_dark_simple.svg' },
  favicon: { light: '/brand/LayeredFX_favicon_light.png', dark: '/brand/LayeredFX_favicon_dark.png' },
  app: '/brand/layeredfx_app_icon.svg',
  email: { light: '/brand/lfx_logo_outline_light_mode.png', dark: '/brand/LayeredFX_logo_dark_outline_email.png' },
  emailSimple: { light: '/brand/lfx_logo_light_mode.png' },
} as const;

/** Email templates need an absolute, publicly accessible asset URL. */
export function emailLogoUrl(siteUrl: string, background: 'light' | 'dark' = 'light') {
  return new URL(brand.email[background], siteUrl).href;
}
