import { useEffect, useMemo, useState } from 'react';
import { useLookupCities, useLookupStates } from '@/framework/location';

const OTHER = '__other__';

/**
 * Cascading State → City dropdown. Both State and City are real <select>
 * dropdowns (the cities table is now seeded with ~1,600 addressable cities).
 * City offers an "Other…" option that reveals a text box, so a town not in the
 * list never blocks checkout. Fail-safe: if lookups error/empty, city degrades to
 * free text. Emits the chosen state + city NAMES.
 */
export default function StateCitySelect({
  state: stateName,
  city: cityName,
  onChange,
  required,
}: {
  state?: string | null;
  city?: string | null;
  onChange: (next: { state: string; city: string }) => void;
  required?: boolean;
}) {
  const { data: rawStates } = useLookupStates();
  // Defensive: a malformed/truncated API response must never crash checkout —
  // degrade to "no options yet" instead of throwing inside .map().
  const states = Array.isArray(rawStates) ? rawStates : [];
  const [stateId, setStateId] = useState<string>('');

  useEffect(() => {
    if (stateName && states.length && !stateId) {
      const match = states.find(
        (s) => s.name.toLowerCase() === String(stateName).toLowerCase(),
      );
      if (match) setStateId(String(match.id));
    }
  }, [stateName, states, stateId]);

  const { data: rawCities } = useLookupCities(stateId || undefined);
  const cities = Array.isArray(rawCities) ? rawCities : [];
  const cityNames = useMemo(() => cities.map((c) => c.name), [cities]);

  const resolvedStateName = () =>
    states.find((s) => String(s.id) === stateId)?.name ?? stateName ?? '';

  const cityInList =
    !!cityName && cityNames.some((c) => c.toLowerCase() === cityName.toLowerCase());
  const [otherManual, setOtherManual] = useState(false);
  const otherMode = otherManual || (!!cityName && cities.length > 0 && !cityInList);
  const noCityData = !!stateId && cities.length === 0;

  const cls =
    'h-12 w-full rounded border border-border-200 bg-light px-4 text-sm focus:border-accent focus:outline-none';

  return (
    <>
      <div>
        <label className="mb-2 block text-sm font-semibold text-body-dark">
          State{required ? ' *' : ''}
        </label>
        <select
          value={stateId}
          onChange={(e) => {
            const id = e.target.value;
            setStateId(id);
            setOtherManual(false);
            const name = states.find((s) => String(s.id) === id)?.name ?? '';
            onChange({ state: name, city: '' });
          }}
          className={cls}
        >
          <option value="">Select state</option>
          {states.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-body-dark">
          City{required ? ' *' : ''}
        </label>

        {noCityData ? (
          <input
            value={cityName ?? ''}
            placeholder="Type your city"
            onChange={(e) => onChange({ state: resolvedStateName(), city: e.target.value })}
            className={cls}
          />
        ) : otherMode ? (
          <div className="space-y-2">
            <input
              value={cityName ?? ''}
              placeholder="Type your city"
              autoFocus={otherManual}
              onChange={(e) => onChange({ state: resolvedStateName(), city: e.target.value })}
              className={cls}
            />
            <button
              type="button"
              onClick={() => {
                setOtherManual(false);
                onChange({ state: resolvedStateName(), city: '' });
              }}
              className="text-xs font-medium text-accent hover:underline"
            >
              ↩ Pick from the list
            </button>
          </div>
        ) : (
          <select
            value={cityInList ? (cityName as string) : ''}
            disabled={!stateId}
            onChange={(e) => {
              const val = e.target.value;
              if (val === OTHER) {
                setOtherManual(true);
                onChange({ state: resolvedStateName(), city: '' });
                return;
              }
              onChange({ state: resolvedStateName(), city: val });
            }}
            className={`${cls}${!stateId ? ' cursor-not-allowed opacity-60' : ''}`}
          >
            <option value="">{stateId ? 'Select city' : 'Select a state first'}</option>
            {cityNames.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
            {stateId && <option value={OTHER}>Other…</option>}
          </select>
        )}
      </div>
    </>
  );
}
