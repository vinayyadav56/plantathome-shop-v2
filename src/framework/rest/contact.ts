import { useAtom } from 'jotai';
import { useTranslation } from 'next-i18next';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { HttpClient } from '@/framework/client/http-client';
import { API_ENDPOINTS } from '@/framework/client/api-endpoints';
import { authorizationAtom } from '@/store/authorization-atom';

/** A saved phone number on the account (up to 2). */
export interface ContactPhone {
  number: string;
  primary: boolean;
}

/** A saved email on the account (up to 2). */
export interface ContactEmail {
  email: string;
  primary: boolean;
  verified: boolean;
}

/** The `me/contacts` payload shared by every contact endpoint. */
export interface ContactData {
  phones: ContactPhone[];
  emails: ContactEmail[];
}

interface ContactResponse {
  data: ContactData;
}

/** PUT body — bare phone strings; the API stores them (no verification). */
export interface UpdateContactsInput {
  contact?: string | null;
  contact_2?: string | null;
}

/** Pull the message off an axios error (mirrors the profile hooks' 422 handling). */
function errorMessage(error: unknown): string | undefined {
  const { response: { data } = {} }: any = (error as any) ?? {};
  return data?.message;
}

/** The signed-in user's saved phones + emails. */
export function useContacts() {
  const [isAuthorized] = useAtom(authorizationAtom);
  return useQuery(
    ['me-contacts'],
    () => HttpClient.get<ContactResponse>(API_ENDPOINTS.CONTACTS),
    { enabled: isAuthorized, staleTime: 30_000 },
  );
}

/** Save up to two phone numbers to the account. */
export function useUpdateContacts() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('common');
  return useMutation(
    (input: UpdateContactsInput) =>
      HttpClient.put<ContactResponse>(API_ENDPOINTS.CONTACTS, input),
    {
      onSuccess: () => {
        toast.success(t('profile-update-successful'));
      },
      onError: (error) => {
        toast.error(errorMessage(error) ?? t('error-something-wrong'));
      },
      onSettled: () => {
        queryClient.invalidateQueries(['me-contacts']);
      },
    },
  );
}

/** Email a 6-digit verification code to the given address. */
export function useSendEmailOtp() {
  const { t } = useTranslation('common');
  return useMutation(
    (input: { email: string }) =>
      HttpClient.post<{ data: { sent: boolean; slot: 'primary' | 'secondary' } }>(
        API_ENDPOINTS.EMAIL_OTP_SEND,
        input,
      ),
    {
      onError: (error) => {
        toast.error(errorMessage(error) ?? t('error-something-wrong'));
      },
    },
  );
}

/** Confirm an emailed code; on success the email flips to verified. */
export function useVerifyEmailOtp() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('common');
  return useMutation(
    (input: { email: string; code: string }) =>
      HttpClient.post<ContactResponse>(API_ENDPOINTS.EMAIL_OTP_VERIFY, input),
    {
      onError: (error) => {
        toast.error(errorMessage(error) ?? t('error-something-wrong'));
      },
      onSettled: () => {
        queryClient.invalidateQueries(['me-contacts']);
      },
    },
  );
}
