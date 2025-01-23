import type { MetadataRoute } from 'next';

import content from '@/content';

const sitemap = (): MetadataRoute.Sitemap => [
  {
    url: content.domain,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 1
  }
];

export default sitemap;
