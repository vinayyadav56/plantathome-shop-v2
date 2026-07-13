import Image, { type ImageProps } from 'next/image';
import { useState } from 'react';

/**
 * A next/image that FAILS GRACEFULLY: on a load error it swaps to `fallbackSrc` if provided,
 * otherwise it renders nothing instead of a broken-image box. Use for decorative / marketing
 * imagery whose remote host (e.g. a stock-photo CDN) could 404 or rate-limit.
 */
export default function SafeImage({
  fallbackSrc,
  ...props
}: ImageProps & { fallbackSrc?: string }) {
  const [errored, setErrored] = useState(false);

  if (errored && !fallbackSrc) return null;

  return (
    <Image
      {...props}
      src={errored && fallbackSrc ? fallbackSrc : props.src}
      onError={() => setErrored(true)}
    />
  );
}
