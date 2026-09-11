import type { MetadataRoute } from 'next';
import { brand } from '@/lib/brand';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'LayeredFX', short_name: 'LayeredFX', start_url: '/admin',
    display: 'standalone', background_color: '#f4f5f0', theme_color: '#19212d',
    icons: [{ src: brand.app, sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
  };
}
