import type { MetadataRoute } from 'next';
import { brand } from '@/lib/brand';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'LayeredFX', short_name: 'LayeredFX', start_url: '/admin',
    display: 'standalone', background_color: '#F7F9FB', theme_color: '#19202E',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: brand.app, sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    ],
  };
}
