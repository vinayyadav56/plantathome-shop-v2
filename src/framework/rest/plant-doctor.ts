import { useMutation, useQuery, useQueryClient } from 'react-query';
import { useAtom } from 'jotai';
import { HttpClient } from '@/framework/client/http-client';
import { authorizationAtom } from '@/store/authorization-atom';

export type Severity = 'low' | 'medium' | 'high' | 'critical';

export interface DiagnosisResult {
  condition: string;
  severity: Severity;
  confidence: number;
  description: string;
  causes: string[];
  solutions: string[];
  preventive_measures: string[];
  products_recommended?: string[];
  vet_consultation_needed?: boolean;
}

export type ImageQuality = 'ok' | 'blurry' | 'dark' | 'partial' | 'no_plant';

export interface PlantIdentification {
  common_name: string;
  scientific_name: string;
  confidence: number;
}

export interface DiagnosisResponse {
  // Trust gate: when is_plant is false the UI must show `rejection_reason`, NOT a diagnosis.
  is_plant?: boolean;
  image_quality?: ImageQuality;
  rejection_reason?: string;
  identification?: PlantIdentification;
  plant_name: string;
  diagnosis: DiagnosisResult[];
  overall_health_score: number;
  immediate_action: string;
  long_term_care: string;
}

export interface DiagnoseInput {
  image_base64?: string;
  image_url?: string;
  symptoms?: string;
  plant_name?: string;
  session_id?: string;
  /** ISO 639 code so the diagnosis text comes back in the shopper's language. */
  language?: string;
}

/** Storefront feature flag — is Plant Doctor switched on in admin? */
export function usePlantDoctorEnabled() {
  return useQuery(
    ['plant-doctor-enabled'],
    () => HttpClient.get<{ data: { enabled: boolean } }>('plant-doctor/settings'),
    { staleTime: 60_000 },
  );
}

/** Submit a photo and/or symptoms; returns a structured diagnosis. */
export function useDiagnose() {
  return useMutation((input: DiagnoseInput) =>
    HttpClient.post<{ data: DiagnosisResponse }>('plant-doctor/diagnose', input),
  );
}

/* ── Server-side consultation history (logged-in users) ─────────────────── */

const CONSULTATIONS_ENDPOINT = 'plant-doctor/consultations';

/** One saved consultation row as the API returns it. */
export interface ConsultationRecord {
  id: number;
  plant_name: string | null;
  /** Small data-URI jpeg thumbnail for the history rail. */
  thumb: string | null;
  /** Full diagnose response as saved at diagnosis time. */
  diagnosis: DiagnosisResponse;
  /** 0–100. */
  health_score: number | null;
  worst_severity: Severity | null;
  created_at: string;
}

export interface SaveConsultationInput {
  plant_name?: string;
  thumb?: string;
  diagnosis: DiagnosisResponse;
  health_score?: number;
  worst_severity?: Severity;
}

/** The current user's saved consultations (newest first). Auth-gated — only fetches when signed in. */
export function usePlantDoctorHistory() {
  const [isAuthorized] = useAtom(authorizationAtom);
  return useQuery(
    [CONSULTATIONS_ENDPOINT],
    () => HttpClient.get<{ data: ConsultationRecord[] }>(CONSULTATIONS_ENDPOINT),
    { enabled: isAuthorized },
  );
}

/** Save a diagnosis to the signed-in user's server-side history. */
export function useSaveConsultation() {
  const queryClient = useQueryClient();
  return useMutation(
    (input: SaveConsultationInput) =>
      HttpClient.post<{ data: ConsultationRecord }>(CONSULTATIONS_ENDPOINT, input),
    { onSuccess: () => queryClient.invalidateQueries([CONSULTATIONS_ENDPOINT]) },
  );
}

/** Delete one of the signed-in user's saved consultations. */
export function useDeleteConsultation() {
  const queryClient = useQueryClient();
  return useMutation(
    (id: number) => HttpClient.delete(`${CONSULTATIONS_ENDPOINT}/${id}`),
    { onSuccess: () => queryClient.invalidateQueries([CONSULTATIONS_ENDPOINT]) },
  );
}
