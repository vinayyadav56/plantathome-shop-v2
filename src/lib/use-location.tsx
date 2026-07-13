import { GoogleMapLocation } from '@/types';
import { useJsApiLoader } from '@react-google-maps/api';
import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { atom } from 'jotai';
import { GMAPS_LOADER_OPTIONS } from '@/lib/gmaps-loader';
import { extractCorrectCity } from '@/lib/extract-address';

export const locationAtom = atom<GoogleMapLocation | null>(null);

interface Component {
  long_name: string;
  short_name: string;
  types: string[];
}

export const fullAddressAtom = atom((get) => {
  const location = get(locationAtom);
  return location ? `${location.street_address}, ${location.city}, ${location.state}, ${location.zip}, ${location.country}` : '';
});


function getLocation(placeOrResult: any) {
  // Declare the location variable with the Location interface
  const location: GoogleMapLocation = {
    lat: placeOrResult?.geometry?.location.lat(),
    lng: placeOrResult?.geometry?.location.lng(),
    formattedAddress: placeOrResult.formatted_address,
  };

  // Define an object that maps component types to location properties
  const componentMap: Record<string, keyof GoogleMapLocation> = {
    postal_code: 'zip',
    postal_code_suffix: 'zip',
    state_name: 'street_address',
    route: 'street_address',
    sublocality_level_1: 'street_address',
    locality: 'city',
    administrative_area_level_1: 'state',
    country: 'country',
  };

  for (const component of placeOrResult?.address_components as Component[]) {
    const [componentType] = component.types;
    const { long_name, short_name } = component;

    // Check if the component type is in the map
    if (componentMap[componentType]) {
      // Assign the component value to the location property
      location[componentMap[componentType]] ??= long_name;
      // If the component type is postal_code_suffix, append it to the zip
      componentType === 'postal_code_suffix' ?
        location['zip'] = `${location?.zip}-${long_name}` :
        null;
      // If the component type is administrative_area_level_1, use the short name
      componentType === 'administrative_area_level_1' ?
        location['state'] = short_name :
        null;
    }
  }

  // Robust city: resolve via strict priority (locality → postal_town → district
  // → state) checking ALL types on each component, so a village / sublocality
  // never lands in the City field. Overrides the loop's first-type guess.
  const correctCity = extractCorrectCity(placeOrResult?.address_components ?? []);
  if (correctCity) location.city = correctCity;

  // Return the location object
  return location;
}

interface UseLocationProps { 
  onChange?: any;
  onChangeCurrentLocation?: any;
  setInputValue?: any;
}

export default function useLocation({ onChange, onChangeCurrentLocation, setInputValue }: UseLocationProps) {
  const { t } = useTranslation();
  const [autocomplete, setAutocomplete] = useState<any>(null);
  // Shared loader config — must match the courier-tracking-map loader, else
  // @react-google-maps/api throws "Loader must not be called again with
  // different options" and crashes any page that mounts both (e.g. order page).
  const { isLoaded, loadError } = useJsApiLoader(GMAPS_LOADER_OPTIONS);

  const onLoad = useCallback((autocompleteInstance: any) => {
    setAutocomplete(autocompleteInstance);
  }, []);

  const onUnmount = useCallback(() => {
    setAutocomplete(null);
  }, []);

  const onPlaceChanged = () => {
    const place = autocomplete?.getPlace();

    if (!place?.geometry?.location) {
      return;
    }
    const location = getLocation(place);

    if (onChange) {
      onChange(location);
    }

    if (setInputValue) {
      setInputValue(place?.formatted_address);
    }
  };

  const getCurrentLocation = () => {
    if (navigator?.geolocation) {
      navigator?.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const geocoder = new google.maps.Geocoder();
          const latlng = { lat: latitude, lng: longitude };

          geocoder.geocode({ location: latlng }, (results, status) => {
            if (status === "OK" && results?.[0]) {
              const location = getLocation(results?.[0]);
              onChangeCurrentLocation?.(location)
            }
          });
        },
        (error) => {
          console.error("Error getting current location:", error);
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  };

  return [
    onLoad,
    onUnmount,
    onPlaceChanged,
    getCurrentLocation,
    isLoaded,
    loadError && t(loadError),
  ] as [typeof onLoad, typeof onUnmount, typeof onPlaceChanged, typeof getCurrentLocation, typeof isLoaded, string | false | undefined];
}