import Button from '@/components/ui/button';
import Input from '@/components/ui/forms/input';
import Label from '@/components/ui/forms/label';
import Radio from '@/components/ui/forms/radio/radio';
import Checkbox from '@/components/ui/forms/checkbox/checkbox';
import { Controller } from 'react-hook-form';
import TextArea from '@/components/ui/forms/text-area';
import { useTranslation } from 'next-i18next';
import * as yup from 'yup';
import { useEffect } from 'react';
import { useModalState } from '@/components/ui/modal/modal.context';
import { Form } from '@/components/ui/forms/form';
import { AddressType } from '@/framework/utils/constants';
import { GoogleMapLocation } from '@/types';
import { useCreateAddress, useUpdateAddressMutation } from '@/framework/user';
import { isAddressComplete } from '@/lib/address-complete';
import GooglePlacesAutocomplete from '@/components/form/google-places-autocomplete';
import StateCitySelect from '@/components/location/state-city-select';
import AddressMapPicker, { type PinResult } from '@/components/address/address-map-picker';
import { useSettings } from '@/framework/settings';

type FormValues = {
  title: string;
  type: AddressType;
  address_type?: 'home' | 'office' | 'other';
  default?: boolean;
  address: {
    country: string;
    city: string;
    /** Administrative slice of the city (South Delhi within Delhi). Auto-filled from the
     *  geocoder, never asked for — it exists so `city` can stay the canonical one. */
    district?: string;
    state: string;
    zip: string;
    house_no: string;
    street_address: string;
    street_address2?: string;
    landmark?: string;
    delivery_instructions?: string;
  };
  location: GoogleMapLocation;
};

const addressSchema = yup.object().shape({
  type: yup
    .string()
    .oneOf([AddressType.Billing, AddressType.Shipping])
    .required('error-type-required'),
  title: yup.string().required('error-title-required'),
  address: yup.object().shape({
    country: yup.string().required('error-country-required'),
    city: yup.string().required('error-city-required'),
    state: yup.string().required('error-state-required'),
    zip: yup
      .string()
      .required('error-zip-required')
      .matches(/^\d{6}$/, 'error-zip-invalid'),
    house_no: yup.string().required('House / flat / building no. is required'),
    street_address: yup.string().required('error-street-required'),
    delivery_instructions: yup.string().max(500, 'Max 500 characters'),
  }),
});

/** Complete-on-use: validate immediately so the missing fields highlight. */
function TriggerValidationOnMount({ trigger }: { trigger: () => void }) {
  useEffect(() => {
    trigger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

export const AddressForm: React.FC<any> = ({
  onSubmit,
  defaultValues,
  isLoading,
  incomplete,
  // 'guest' hides the address_type label + default checkbox — both are inert
  // without an account (nothing server-side stores them for guests).
  variant,
}) => {
  const { t } = useTranslation('common');
  const { settings } = useSettings();
  return (
    <Form<FormValues>
      onSubmit={onSubmit}
      className="grid h-full grid-cols-2 gap-5"
      //@ts-ignore
      validationSchema={addressSchema}
      useFormProps={{
        shouldUnregister: true,
        defaultValues,
      }}
      resetValues={defaultValues}
    >
      {({ register, control, getValues, setValue, watch, trigger, formState: { errors } }) => {
        return (
          <>
            {incomplete ? (
              <>
                <TriggerValidationOnMount trigger={trigger} />
                <div className="col-span-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] leading-relaxed text-amber-800">
                  This address is missing a few details — fill the highlighted
                  fields to use it.
                </div>
              </>
            ) : null}
            <div>
              <Label>{t('text-type')}</Label>
              <div className="flex items-center space-x-4 rtl:space-x-reverse">
                <Radio
                  id="billing"
                  {...register('type')}
                  type="radio"
                  value={AddressType.Billing}
                  label={t('text-billing')}
                />
                <Radio
                  id="shipping"
                  {...register('type')}
                  type="radio"
                  value={AddressType.Shipping}
                  label={t('text-shipping')}
                />
              </div>
            </div>

            <Input
              label={t('text-title')}
              {...register('title')}
              error={t(errors.title?.message!)}
              variant="outline"
              className="col-span-2"
            />
            {
              // Render the Places search whenever a Maps key is configured, so it
              // works regardless of the backend `useGoogleMap` toggle.
              //@ts-ignore
              (settings?.useGoogleMap ||
                process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY) && (
                <div className="col-span-2">
                  <Label>{t('text-location')}</Label>
                  <Controller
                    control={control}
                    name="location"
                    render={({ field: { onChange } }) => {
                      // Auto-fill the address fields from a selected place OR from
                      // "use current location" (both call this).
                      const fill = (location: any) => {
                        onChange(location);
                        setValue('address.country', location?.country);
                        setValue('address.city', location?.city);
                        // Google answers "which city?" with an administrative district
                        // ("South Delhi"). Send it separately so the server can keep the canonical
                        // city AND the detail, instead of having to pick one.
                        setValue('address.district', (location as any)?.district);
                        setValue('address.state', location?.state);
                        setValue('address.zip', location?.zip);
                        setValue(
                          'address.street_address',
                          location?.street_address,
                        );
                      };
                      return (
                        <GooglePlacesAutocomplete
                          register={register}
                          // @ts-ignore
                          onChange={fill}
                          // @ts-ignore
                          onChangeCurrentLocation={fill}
                          data={getValues('location')!}
                        />
                      );
                    }}
                  />
                </div>
              )
            }

            {/* Draggable delivery pin (Shopping-City redesign): search only positions
                the pin; the PIN decides lat/lng, and the server reverse-geocodes it
                into city/district/state/pincode (typed values are never trusted). */}
            {process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY ? (
              <div className="col-span-2">
                <AddressMapPicker
                  lat={(watch('location') as any)?.lat}
                  lng={(watch('location') as any)?.lng}
                  onPin={(r: PinResult) => {
                    const prev: any = getValues('location') ?? {};
                    setValue('location', { ...prev, lat: r.lat, lng: r.lng } as any);
                    if (r.geo?.city) setValue('address.city', r.geo.city, { shouldValidate: true });
                    // The pin's reverse-geocode already returns city and district split apart.
                    if ((r.geo as any)?.district)
                      setValue('address.district', (r.geo as any).district, { shouldValidate: true });
                    if (r.geo?.state) setValue('address.state', r.geo.state, { shouldValidate: true });
                    if (r.geo?.pincode) setValue('address.zip', r.geo.pincode, { shouldValidate: true });
                  }}
                />
              </div>
            ) : null}

            <Input
              label={t('text-country')}
              {...register('address.country')}
              error={t(errors.address?.country?.message!)}
              variant="outline"
            />

            {/* Standardised State (dropdown) + City (autocomplete). Hidden
                registered inputs keep RHF + validation; Google Places autofill
                still writes address.city/state, reflected by the selector.
                City accepts ANY value so an un-seeded city never blocks checkout. */}
            <input type="hidden" {...register('address.city')} />
            <input type="hidden" {...register('address.state')} />
            <StateCitySelect
              state={watch('address.state')}
              city={watch('address.city')}
              onChange={({ state, city }) => {
                setValue('address.state', state, { shouldValidate: true });
                setValue('address.city', city, { shouldValidate: true });
              }}
            />
            {errors.address?.city || errors.address?.state ? (
              <p className="-mt-2 text-xs text-red-500">
                {t(errors.address?.state?.message! || errors.address?.city?.message!)}
              </p>
            ) : null}

            <Input
              label={t('text-zip')}
              {...register('address.zip')}
              error={t(errors.address?.zip?.message!)}
              variant="outline"
            />

            <Input
              label="House / flat / building no."
              placeholder="e.g. B-42, 2nd floor"
              {...register('address.house_no')}
              error={t(errors.address?.house_no?.message!)}
              variant="outline"
              className="col-span-2"
            />

            <TextArea
              label={t('text-street-address')}
              {...register('address.street_address')}
              error={t(errors.address?.street_address?.message!)}
              variant="outline"
              className="col-span-2"
            />

            <Input
              label="Apartment / floor (optional)"
              {...register('address.street_address2')}
              variant="outline"
            />
            <Input
              label="Landmark (optional)"
              {...register('address.landmark')}
              variant="outline"
            />

            <TextArea
              label="Delivery instructions (optional)"
              {...register('address.delivery_instructions')}
              error={t(errors.address?.delivery_instructions?.message!)}
              maxLength={500}
              variant="outline"
              className="col-span-2"
            />

            {variant !== 'guest' && (
              <>
                <div className="col-span-2">
                  <Label>Address label</Label>
                  <div className="flex items-center gap-4">
                    {(['home', 'office', 'other'] as const).map((v) => (
                      <Radio
                        key={v}
                        id={`address-type-${v}`}
                        {...register('address_type')}
                        type="radio"
                        value={v}
                        label={v.charAt(0).toUpperCase() + v.slice(1)}
                      />
                    ))}
                  </div>
                </div>

                <Checkbox
                  {...register('default')}
                  label="Set as default address"
                  className="col-span-2"
                />
              </>
            )}

            <Button
              className="w-full col-span-2"
              loading={isLoading}
              disabled={isLoading}
            >
              {Boolean(defaultValues) ? t('text-update') : t('text-save')}{' '}
              {t('text-address')}
            </Button>
          </>
        );
      }}
    </Form>
  );
};

export default function CreateOrUpdateAddressForm() {
  const { t } = useTranslation('common');
  const {
    data: { address, type },
  } = useModalState();

  // Routed address endpoints (POST /address, PUT /address/{id}) replace the
  // legacy PUT /users/:id address-array save path.
  const { mutate: createAddress, isLoading: isCreating } = useCreateAddress();
  const { mutate: updateAddress, isLoading: isUpdating } =
    useUpdateAddressMutation();
  const isLoading = isCreating || isUpdating;

  // Complete-on-use: an existing address opened with required fields missing.
  const incomplete = Boolean(address) && !isAddressComplete(address);

  const onSubmit = (values: FormValues) => {
    const loc: any = values.location ?? {};
    const formattedInput = {
      title: values.title,
      type: values.type,
      address_type: values.address_type ?? 'home',
      default: Boolean(values.default),
      address: {
        ...values.address,
      },
      location: values.location,
      // Pin coordinates (source of truth) — the server reverse-geocodes these
      // into rg_city/rg_district/rg_state/rg_pincode on save.
      ...(Number(loc.lat) && Number(loc.lng)
        ? { latitude: Number(loc.lat), longitude: Number(loc.lng) }
        : {}),
      ...(loc.google_place_id || loc.place_id
        ? { google_place_id: loc.google_place_id ?? loc.place_id }
        : {}),
    };
    if (address?.id) {
      updateAddress({ id: address.id, ...formattedInput });
    } else {
      createAddress(formattedInput);
    }
  };

  return (
    <div className="min-h-screen p-5 bg-light sm:p-8 md:min-h-0 md:rounded-xl">
      <h1 className="mb-4 text-lg font-medium text-center text-heading sm:mb-6">
        {address ? t('text-update') : t('text-add-new')} {t('text-address')}
      </h1>
      <AddressForm
        onSubmit={onSubmit}
        isLoading={isLoading}
        incomplete={incomplete}
        defaultValues={{
          title: address?.title ?? '',
          type: address?.type ?? type,
          address_type: address?.address_type ?? 'home',
          default: Boolean(address?.default),
          address: {
            city: address?.address?.city ?? '',
            country: address?.address?.country ?? 'India',
            state: address?.address?.state ?? '',
            zip: address?.address?.zip ?? '',
            house_no: address?.address?.house_no ?? '',
            street_address: address?.address?.street_address ?? '',
            ...address?.address,
          },
          location: address?.location ?? '',
        }}
      />
    </div>
  );
}
