import { useRouter } from '@/compat/next-router';

export function useIsHomePage() {
  const router = useRouter();
  return router.pathname === '/[[...pages]]';
}
