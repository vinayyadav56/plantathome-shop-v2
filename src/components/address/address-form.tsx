import Button from '@/components/ui/button';
import Input from '@/components/ui/forms/input';
import Label from '@/components/ui/forms/label';
import Radio from '@/components/ui/forms/radio/radio';
import { Controller } from 'react-hook-form';
import TextArea from '@/components/ui/forms/text-area';
import { useTranslation } from 'next-i18next';
import * as yup from 'yup';
import { useModalState } from '@/components/ui/modal/modal.context';
import { Form } from '@/components/ui/forms/form';
import { AddressType } from '@/framework/utils/constants';
import { GoogleMapLocation } from '@/types';
import { useUpdateUser } from '@/framework/user';
import GooglePlacesAutocomplete from '@/components/form/google-places-autocomplete';
import StateCitySelect from '@/components/location/state-city-select';
import { useSettings } from '@/framework/settings';

type FormValues = {
  title: string;
  type: AddressType;
  address: {
    country: string;
    city: string;
    state: string;
    zip: string;
    street_address: string;
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
    street_address: yup.string().required('error-street-required'),
  }),
});

export const AddressForm: React.FC<any> = ({
  onSubmit,
  defaultValues,
  isLoading,
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
      {({ register, control, getValues, setValue, watch, formState: { errors } }) => {
        return (
          <>
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

            <TextArea
              label={t('text-street-address')}
              {...register('address.street_address')}
              error={t(errors.address?.street_address?.message!)}
              variant="outline"
              className="col-span-2"
            />

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
    data: { customerId, address, type },
  } = useModalState();

  const { mutate: updateProfile } = useUpdateUser();

  const onSubmit = (values: FormValues) => {
    const formattedInput = {
      id: address?.id,
      // customer_id: customerId,
      title: values.title,
      type: values.type,
      address: {
        ...values.address,
      },
      location: values.location,
    };
    updateProfile({
      id: customerId,
      address: [formattedInput],
    });
  };

  return (
    <div className="min-h-screen p-5 bg-light sm:p-8 md:min-h-0 md:rounded-xl">
      <h1 className="mb-4 text-lg font-semibold text-center text-heading sm:mb-6">
        {address ? t('text-update') : t('text-add-new')} {t('text-address')}
      </h1>
      <AddressForm
        onSubmit={onSubmit}
        defaultValues={{
          title: address?.title ?? '',
          type: address?.type ?? type,
          address: {
            city: address?.address?.city ?? '',
            country: address?.address?.country ?? 'India',
            state: address?.address?.state ?? '',
            zip: address?.address?.zip ?? '',
            street_address: address?.address?.street_address ?? '',
            ...address?.address,
          },
          location: address?.location ?? '',
        }}
      />
    </div>
  );
}
