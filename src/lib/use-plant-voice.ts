import { useCallback, useRef, useState } from 'react';
import { useRouter } from '@/compat/next-router';

interface PlantVoiceState {
  listening: boolean;
  processing: boolean;
  transcript: string;
  error: string | null;
}

// Confidence below this from the browser recognizer → fall back to Whisper.
const CONFIDENCE_THRESHOLD = 0.6;
const MAX_RECORD_MS = 7000;
// Hard safety net: if nothing resolves by this point, reset so the mic/loader
// can never get stuck (covers browsers where onend/onstop never fire).
const WATCHDOG_MS = 15000;

function getSpeechRecognition(): any {
  if (typeof window === 'undefined') return null;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
}

function canRecord(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof (window as any).MediaRecorder !== 'undefined' &&
    !!navigator?.mediaDevices?.getUserMedia
  );
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function usePlantVoice() {
  const router = useRouter();
  const [state, setState] = useState<PlantVoiceState>({
    listening: false,
    processing: false,
    transcript: '',
    error: null,
  });

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const activeRef = useRef(false); // guard against re-entry
  const watchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const patch = (p: Partial<PlantVoiceState>) => setState((prev) => ({ ...prev, ...p }));

  // Release the mic + recorder. Idempotent — safe to call on every exit path.
  const cleanupStream = useCallback(() => {
    try {
      const mr = recorderRef.current;
      if (mr && mr.state !== 'inactive') mr.stop();
    } catch {
      /* ignore */
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    recorderRef.current = null;
    chunksRef.current = [];
  }, []);

  const finish = useCallback(
    (patchState: Partial<PlantVoiceState>) => {
      activeRef.current = false;
      if (watchdogRef.current) clearTimeout(watchdogRef.current);
      watchdogRef.current = null;
      cleanupStream();
      patch(patchState);
    },
    [cleanupStream]
  );

  // transcript (any source) → classify → navigate. Always ends cleanly.
  const resolveAndGo = useCallback(
    async (transcript: string) => {
      const text = transcript.trim();
      cleanupStream(); // we have a transcript; release the mic now
      if (!text) {
        finish({ listening: false, processing: false, error: 'No speech detected — try again.' });
        return;
      }
      patch({ transcript: text, processing: true, listening: false });
      try {
        const res = await fetch('/api/plant-suggest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript: text }),
        });
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const data = await res.json();
        const query: Record<string, string> = data.category
          ? { category: data.category }
          : { text: data.text || text };
        await router.push({ pathname: '/plants/search', query });
        finish({ processing: false });
      } catch (err) {
        finish({
          processing: false,
          error: err instanceof Error ? err.message : 'Failed to process voice',
        });
      }
    },
    [router, cleanupStream, finish]
  );

  // Stop the recorder and wait for the final `dataavailable`/`onstop` flush, then
  // return the complete audio blob. Critical: reading `chunksRef` while the
  // recorder is still running yields an EMPTY buffer (data only flushes on stop),
  // which silently broke the Whisper fallback → "sometimes works, sometimes not".
  const stopAndCollect = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const mr = recorderRef.current;
      const mime = mr?.mimeType || 'audio/webm';
      const collect = () => {
        const chunks = chunksRef.current.slice();
        resolve(chunks.length ? new Blob(chunks, { type: mime }) : null);
      };
      if (!mr || mr.state === 'inactive') {
        collect();
        return;
      }
      mr.onstop = collect;
      try {
        mr.requestData?.(); // flush buffered audio before stopping
        mr.stop();
      } catch {
        collect();
      }
    });
  }, []);

  // Fallback: send the recorded audio to Whisper, then classify.
  const transcribeViaWhisper = useCallback(async () => {
    patch({ processing: true, listening: false });
    try {
      const blob = await stopAndCollect(); // stops recorder + flushes before read
      if (!blob || !blob.size) {
        finish({ listening: false, processing: false, error: 'No speech detected — try again.' });
        return;
      }
      const audio = await blobToBase64(blob);
      cleanupStream(); // recorder already stopped; release the mic stream
      const res = await fetch('/api/voice-transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio, mimeType: blob.type }),
      });
      if (!res.ok) throw new Error(`Transcribe error: ${res.status}`);
      const { transcript } = await res.json();
      await resolveAndGo(transcript || '');
    } catch (err) {
      finish({
        processing: false,
        error: err instanceof Error ? err.message : 'Could not transcribe audio',
      });
    }
  }, [resolveAndGo, cleanupStream, finish, stopAndCollect]);

  const startListening = useCallback(async () => {
    if (activeRef.current) return; // already capturing
    const SpeechRecognition = getSpeechRecognition();
    const recordable = canRecord();

    if (!SpeechRecognition && !recordable) {
      patch({ error: 'Voice search needs Chrome, Edge, or Safari.' });
      return;
    }

    activeRef.current = true;
    patch({ listening: true, error: null, transcript: '' });

    // Watchdog: never let the mic/loader hang.
    if (watchdogRef.current) clearTimeout(watchdogRef.current);
    watchdogRef.current = setTimeout(() => {
      finish({ listening: false, processing: false, error: 'Timed out — please try again.' });
    }, WATCHDOG_MS);

    // Record the utterance in parallel (graceful if it fails) so we can fall
    // back to Whisper for non-English / low-confidence / unsupported cases.
    if (recordable) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        chunksRef.current = [];
        const mr = new MediaRecorder(stream);
        mr.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
        recorderRef.current = mr;
        // Timeslice so `ondataavailable` fires *during* recording → chunks
        // accumulate and the Whisper fallback always has audio (not just on stop).
        mr.start(250);
      } catch {
        recorderRef.current = null; // mic/record unavailable — recognizer alone
      }
    }

    // No browser recognizer → record for a bit, then Whisper.
    if (!SpeechRecognition) {
      if (!recorderRef.current) {
        finish({ listening: false, error: 'Voice search needs Chrome, Edge, or Safari.' });
        return;
      }
      setTimeout(() => transcribeViaWhisper(), MAX_RECORD_MS);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-IN';
    recognition.maxAlternatives = 3;

    let best = '';
    let confidence = 0;
    let recognizerErr = false;

    recognition.onresult = (event: any) => {
      const r = event.results?.[0];
      if (r && r[0]) {
        best = r[0].transcript || '';
        confidence = typeof r[0].confidence === 'number' ? r[0].confidence : 1;
      }
    };
    recognition.onerror = () => {
      recognizerErr = true;
    };
    recognition.onend = () => {
      const haveAudio = chunksRef.current.length > 0;
      const useBrowser = best && !recognizerErr && confidence >= CONFIDENCE_THRESHOLD;
      if (useBrowser) {
        resolveAndGo(best); // cleans up the (discarded) audio internally
      } else if (haveAudio) {
        transcribeViaWhisper();
      } else if (best) {
        resolveAndGo(best); // low confidence but it's all we have
      } else {
        finish({ listening: false, error: 'No speech detected — try again.' });
      }
    };

    try {
      recognition.start();
    } catch {
      // start can throw if invoked twice; fall back to audio if we have it
      if (chunksRef.current.length || recorderRef.current) transcribeViaWhisper();
      else finish({ listening: false, error: 'Could not start voice search — try again.' });
    }
  }, [resolveAndGo, transcribeViaWhisper, finish]);

  return { ...state, startListening };
}
