import { useMutation, useQuery, useQueryClient } from 'react-query';
import { HttpClient } from '@/framework/client/http-client';

export interface GardenTemplate {
  id: number;
  name: string;
  tagline?: string;
  badge?: string | null;
  description?: string;
  items?: Array<{ category: string; name: string; qty?: number; note?: string }>;
  suggested_visits: number;
  suggested_price: number;
  duration_days: number;
}

export interface GardenVisit {
  id: number;
  scheduled_date?: string;
  completed_at?: string;
  gardener_name?: string;
  notes?: string;
  status: string;
}

export interface GardenPackage {
  id: number;
  name: string;
  description?: string;
  items?: Array<{ category: string; name: string; qty?: number; note?: string }>;
  total_visits: number;
  visits_used: number;
  visits_left: number;
  price: number;
  duration_days: number;
  start_date?: string;
  end_date?: string;
  status: string;
  payment_status: string;
  razorpay_link_url?: string;
  visits?: GardenVisit[];
}

export interface GardenLeadInput {
  name: string;
  phone: string;
  email?: string;
  city?: string;
  state?: string;
  garden_type?: string;
  space_size?: string;
  budget_range?: string;
  message?: string;
  // corporate-leads only (the garden route ignores them)
  company?: string;
  occasion?: string;
  quantity?: string;
  meta?: { preferred_date?: string; plant_preferences?: string[] };
}

export function useGardenTemplates() {
  return useQuery(['garden-templates'], () =>
    HttpClient.get<{ data: GardenTemplate[] }>('garden-package-templates')
  );
}

export function useGiftingTemplates() {
  return useQuery(['gifting-templates'], () =>
    HttpClient.get<{ data: GardenTemplate[] }>('garden-package-templates', { service: 'gifting' })
  );
}

export function useSubmitCorporateLead() {
  return useMutation((input: GardenLeadInput) =>
    HttpClient.post<{ data: { id: number }; message: string }>('corporate-leads', { ...input, source: 'corporate' })
  );
}

export function useGiftingCheckout() {
  return useMutation((templateId: number) =>
    HttpClient.post<{ data: { url: string | null; package_id: number } }>('gifting/checkout', { template_id: templateId })
  );
}

export function useSubmitGardenLead() {
  return useMutation((input: GardenLeadInput) =>
    HttpClient.post<{ data: { id: number }; message: string }>('garden-leads', input)
  );
}

export function useMyGardenPackages() {
  return useQuery(['my-garden-packages'], () =>
    HttpClient.get<{ data: GardenPackage[] }>('my-garden-packages')
  );
}

export function usePayGardenPackage() {
  const qc = useQueryClient();
  return useMutation(
    (id: number) => HttpClient.post<{ data: { url: string | null } }>(`garden-packages/${id}/pay`, {}),
    {
      onSuccess: (res) => {
        qc.invalidateQueries(['my-garden-packages']);
        const url = res?.data?.url;
        if (url && typeof window !== 'undefined') window.location.href = url;
      },
    }
  );
}
