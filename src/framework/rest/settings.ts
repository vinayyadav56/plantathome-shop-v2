import type { Settings } from '@/types';
import { useMutation, useQuery } from 'react-query';
import client from './client';
import { API_ENDPOINTS } from './client/api-endpoints';
import { useEffect, useState } from 'react';
import { FileWithPath } from 'react-dropzone';
import { getPreviewImage } from '@/lib/get-preview-image';
import { useAtom } from 'jotai';
import { couponAtom } from '@/store/checkout';
import { toast } from 'react-toastify';
import { useTranslation } from 'next-i18next';
import { useRouter } from '@/compat/next-router';
import { setMaintenanceDetails } from './utils/maintenance-utils';

export function useSettings() {
  const { locale } = useRouter();

  const formattedOptions = {
    language: locale,
  };

  const { data, isLoading, error, isFetching } = useQuery<Settings, Error>(
    [API_ENDPOINTS.SETTINGS, formattedOptions],
    ({ queryKey, pageParam }) =>
      client.settings.all(Object.assign({}, queryKey[1], pageParam)),
    // Always re-pull settings on mount so admin toggles (homepage banners / options) reflect
    // promptly — the SSR-dehydrated value would otherwise stay cached for staleTime (~60s).
    { refetchOnMount: 'always' }
  );
  const { isUnderMaintenance = false, maintenance = {} } = data?.options! ?? {};
  // Cookie write moved out of the render body (V1 wrote it every render).
  useEffect(() => {
    setMaintenanceDetails(isUnderMaintenance, maintenance);
  }, [isUnderMaintenance, maintenance]);
  return {
    settings: data?.options ?? {},
    isLoading,
    error,
    isFetching,
  };
}

export const useUploads = ({ onChange, defaultFiles }: any) => {
  const [files, setFiles] = useState<FileWithPath[]>(
    getPreviewImage(defaultFiles)
  );
  const [error, setError] = useState<string | null>(null);

  const { mutate: upload, isLoading } = useMutation(client.settings.upload, {
    onSuccess: (data) => {
      setError(null);
      if (onChange) {
        const dataAfterRemoveTypename = data?.map(
          ({ __typename, ...rest }: any) => rest
        );
        onChange(dataAfterRemoveTypename);
        setFiles(getPreviewImage(dataAfterRemoveTypename));
      }
    },
    // A rejected upload (413, 422 — wrong type, too large) used to vanish: no onError existed,
    // so the spinner stopped and nothing said why the photo never appeared.
    onError: (err: any) => {
      const firstFieldError = (
        Object.values(err?.response?.data?.errors ?? {})[0] as string[] | undefined
      )?.[0];
      setError(
        err?.response?.data?.message ??
          firstFieldError ??
          'Upload failed — check the file type and size.'
      );
    },
  });

  function handleSubmit(data: File[]) {
    upload(data);
  }

  /** Drop one uploaded file and tell the form. The uploader had no remove at all — a wrong
   *  photo could only be fixed by re-uploading a full replacement set. */
  function removeFile(index: number) {
    const remaining = files.filter((_, i) => i !== index);
    setFiles(remaining);
    if (onChange) {
      onChange(remaining.map(({ preview, ...rest }: any) => rest));
    }
  }

  return { mutate: handleSubmit, isLoading, files, error, removeFile };
};

export function useSubscription() {
  let [isSubscribed, setIsSubscribed] = useState(false);

  const subscription = useMutation(client.users.subscribe, {
    onSuccess: () => {
      setIsSubscribed(true);
    },
    onError: () => {
      setIsSubscribed(false);
    },
  });

  return {
    ...subscription,
    isSubscribed,
  };
}

export function useVerifyCoupon() {
  const { t } = useTranslation();
  const [_, applyCoupon] = useAtom(couponAtom);
  let [formError, setFormError] = useState<any>(null);
  const { mutate, isLoading } = useMutation(client.coupons.verify, {
    onSuccess: (data: any) => {
      if (!data.is_valid) {
        // Invalid code → error ONLY. applyCoupon used to run unconditionally here,
        // writing `undefined` over a coupon the customer had already applied (D13).
        setFormError({
          code: t(`common:${data?.message}`),
        });
        return;
      }
      setFormError(null);
      applyCoupon(data?.coupon);
      toast.success(t('common:text-coupon-applied') ?? 'Coupon applied');
    },
    onError: (error: any) => {
      // Safe access — the destructure threw on network errors with no response.
      toast.error(
        error?.response?.data?.message ?? 'Could not verify the coupon — please try again.',
      );
    },
  });

  return { mutate, isLoading, formError, setFormError };
}
