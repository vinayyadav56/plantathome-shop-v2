import { useState, useEffect } from 'react';
import PlacesSearch from '@/components/form/places-search';
import { Autocomplete as GoogleAutocomplete } from '@react-google-maps/api';
// React 19 children-prop typing workaround for the class component
const Autocomplete = GoogleAutocomplete as any;
import { GoogleMapLocation } from '@/types';
import { useTranslation } from 'next-i18next';
import { SpinnerLoader } from '@/components/ui/loaders/spinner/spinner';
import { MapPin } from '@/components/icons/map-pin';
import useLocation, { locationAtom } from '@/lib/use-location';
import CurrentLocation from '../icons/current-location';
import { useAtom } from 'jotai';

export default function GooglePlacesAutocomplete({
  register,
  onChange,
  onChangeCurrentLocation,
  data,
  disabled = false,
  biasTo,
}: {
  register: any;
  // Typed zero-arg but always CALLED with the resolved location — useLocation passes it through
  // on the legacy path too. Widened so both paths type-check honestly.
  onChange?: (location?: GoogleMapLocation) => void;
  onChangeCurrentLocation?: () => void;
  data?: GoogleMapLocation;
  disabled?: boolean;
  /** Rank predictions near a pin the form already has. */
  biasTo?: { lat: number; lng: number } | null;
}) {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState('');
  // The legacy widget is only reached when the new Places API is genuinely absent — see
  // PlacesSearch. Google stopped activating the legacy API for new Cloud projects, and on such a
  // project it fails SILENTLY: the input works, no prediction ever appears.
  const [legacyFallback, setLegacyFallback] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [
    onLoad,
    onUnmount,
    onPlaceChanged,
    getCurrentLocation,
    isLoaded,
    loadError,
  ] = useLocation({ onChange, onChangeCurrentLocation, setInputValue });
  const [location] = useAtom(locationAtom);

  useEffect(() => {
    const getLocation = data?.formattedAddress;
    setInputValue(getLocation!);
  }, [data]);

  if (loadError) {
    return <div>{t('common:text-map-cant-load')}</div>;
  }
  if (isLoaded && !legacyFallback) {
    return (
      <div className="relative">
        <PlacesSearch
          className="[&>*]:h-12 [&>*]:w-full"
          placeholder={t('common:placeholder-search-location') ?? ''}
          defaultValue={inputValue}
          disabled={disabled}
          biasTo={biasTo}
          onUnavailable={() => setLegacyFallback(true)}
          onError={setSearchError}
          onPick={(location, raw) => {
            setSearchError(null);
            onChange?.(location as any);
            const label = raw?.formatted_address ?? '';
            const name = raw?.name ?? '';
            setInputValue(
              name && !label.toLowerCase().startsWith(name.toLowerCase())
                ? `${name}, ${label}`
                : label,
            );
          }}
        />
        {/* "Use my current location" belongs on BOTH paths — it is the fastest route to a correct
            pin and has nothing to do with which autocomplete API is in play. */}
        <div className="absolute top-0 right-0 flex h-12 w-12 items-center justify-center text-accent">
          <CurrentLocation
            className="h-5 w-5 cursor-pointer hover:text-accent"
            onClick={() => {
              setSearchError(null);
              getCurrentLocation();
              setInputValue(location?.formattedAddress!);
            }}
          />
        </div>
        {searchError && (
          <p className="mt-1 text-xs text-red-500" role="alert">
            {searchError}
          </p>
        )}
      </div>
    );
  }
  return isLoaded ? (
    <div className="relative">
      {/* <div className="absolute top-0 left-0 flex h-12 w-10 items-center justify-center text-gray-400">
        <MapPin className="w-[18px]" />
      </div> */}
      <Autocomplete
        onLoad={onLoad}
        onPlaceChanged={onPlaceChanged}
        onUnmount={onUnmount}
        fields={[
          'address_components',
          'geometry.location',
          'formatted_address',
          // Establishments return their name here and nowhere else — without it a shopper who
          // picks "DLF Cyber City" gets a blank box back.
          'name',
        ]}
        // NO `types` filter on purpose. It used to be `['address']`, which restricts predictions to
        // precise street addresses and drops establishments, landmarks, sublocalities and plain
        // geocodes — so searching "Saket Metro", "DLF Cyber City" or "Sector 44" returned nothing,
        // which is how most people here describe where they live. Omitting it returns every type;
        // the legacy widget only accepts ONE type from its list, so there is no way to ask for
        // addresses AND establishments together.
        restrictions={{ country: 'in' }}
      >
        <input
          type="text"
          placeholder={t('common:placeholder-search-location')}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className={`line-clamp-1 flex h-12 w-full appearance-none items-center rounded border border-border-base p-4 pr-9 text-sm font-medium text-heading transition duration-300 ease-in-out invalid:border-red-500 focus:border-accent focus:outline-0 focus:ring-0 ${
            disabled ? 'cursor-not-allowed border-[#D4D8DD] bg-[#EEF1F4]' : ''
          }`}
          disabled={disabled}
        />
      </Autocomplete>
      <div className="absolute top-0 right-0 flex h-12 w-12 items-center justify-center text-accent">
        <CurrentLocation
          className="h-5 w-5 cursor-pointer hover:text-accent"
          onClick={() => {
            getCurrentLocation();
            setInputValue(location?.formattedAddress!);
          }}
        />
      </div>
    </div>
  ) : (
    <SpinnerLoader />
  );
}
