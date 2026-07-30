import React from 'react';
import ContentLoader from 'react-content-loader';
import { skeletonTint } from '@/components/ui/loaders/skeleton-tint';

const NotifyHeaderContentLoader = (props: any) => (
  <ContentLoader
    speed={2}
    {...skeletonTint}
    {...props}
  >
    <rect x="0" y="0" rx="3" ry="3" width="100%" height="5" />
    <rect x="0" y="10" rx="3" ry="3" width="80%" height="5" />
  </ContentLoader>
);

export default NotifyHeaderContentLoader;
