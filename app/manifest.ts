import type { MetadataRoute } from 'next';

import content from '@/content';

const manifest = (): MetadataRoute.Manifest => ({
  name: content.shortname,
  short_name: content.name,
  description: content.description,
  start_url: '/',
  display: 'standalone',
  background_color: '#FCD41E',
  theme_color: '#FCD41E'
});

export default manifest;
