import type {MetadataRoute} from 'next';
import {servicePages} from '@/lib/layeredfx/service-pages';

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://layeredfx.com').replace(/\/$/, '');
// Public marketing pages only. Dashboards, portals, business cards and labs pages stay out of search.
const PAGES: {path: string; priority: number; changeFrequency: 'weekly' | 'monthly' | 'yearly'}[] = [
  {path: '/', priority: 1, changeFrequency: 'weekly'},
  {path: '/services', priority: 0.9, changeFrequency: 'monthly'},
  {path: '/book', priority: 0.8, changeFrequency: 'monthly'},
  {path: '/contact', priority: 0.8, changeFrequency: 'monthly'},
  {path: '/about', priority: 0.7, changeFrequency: 'monthly'},
  {path: '/inspiration', priority: 0.6, changeFrequency: 'monthly'},
  {path: '/studio', priority: 0.6, changeFrequency: 'monthly'},
  {path: '/privacy', priority: 0.2, changeFrequency: 'yearly'},
  {path: '/terms', priority: 0.2, changeFrequency: 'yearly'},
];

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...PAGES.map(page => ({url: `${siteUrl}${page.path}`, changeFrequency: page.changeFrequency, priority: page.priority})),
    ...servicePages.map(service => ({url: `${siteUrl}/services/${service.slug}`, changeFrequency: 'monthly' as const, priority: 0.8})),
  ];
}
