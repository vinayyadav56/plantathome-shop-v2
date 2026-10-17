'use client';

import { forwardRef, useSyncExternalStore, type ReactNode, type SelectHTMLAttributes } from 'react';
import { Controller, useWatch, type UseFormReturn } from 'react-hook-form';
import Input from '@/components/ui/forms/input';
import TextArea from '@/components/ui/forms/text-area';
import PhoneInput from '@/components/ui/forms/phone-input';
import { CalendarDays, Gift, MapPin, Package, Wallet, type LucideIcon } from '@/components/ui/icon';
import PlantPreferenceCards from './plant-preference-cards';
import { BUDGETS, FORM, OCCASIONS, QUANTITIES } from './content';
import { todayISO, type EnquiryValues } from './enquiry-section';

/** Required-field marker, as checkout/deliver-to and register-form draw it. */
const Req = () => (
  <span className="ms-0.5 text-red-500" aria-hidden>
    *
  </span>
);

const LABEL = 'mb-3 block text-sm font-semibold leading-none text-body-dark';

/** The mock's numbered step heading. (`h3 *` is 500 by the site rule; the disc follows.) */
function Step({ n, title, id }: { n: number; title: string; id?: string }) {
  return (
    <h3 id={id} className="flex items-center gap-3 font-heading text-[18px] text-forest-900">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ds-btn text-[13px] text-white">{n}</span>
      {title}
    </h3>
  );
}

/** A leading glyph over a 48px field; the field pads for it (`pl-11`). Anchored to the
 *  field's top rather than the wrapper's middle so an error line below never shifts it. */
function IconSlot({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span aria-hidden className="pointer-events-none absolute left-4 top-6 -translate-y-1/2 text-forest-700">
      <Icon size={18} />
    </span>
  );
}

type Opt = string | { value: string; label: string };

/** Native select (the global field rule styles its radius/border/focus), with a leading icon. */
const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & {
    name: string;
    label: ReactNode;
    icon: LucideIcon;
    placeholder: string;
    options: readonly Opt[];
    error?: string;
  }
>(function Select({ name, label, icon, placeholder, options, error, ...rest }, ref) {
  return (
    <div>
      <label htmlFor={name} className={LABEL}>
        {label}
      </label>
      <div className="relative">
        <IconSlot icon={icon} />
        <select
          id={name}
          name={name}
          ref={ref}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${name}-error` : undefined}
          className="h-12 w-full rounded-control border border-border-base bg-field pl-11 pr-10 text-sm text-heading focus:outline-0 focus:ring-0"
          {...rest}
        >
          <option value="">{placeholder}</option>
          {options.map((o) => {
            const value = typeof o === 'string' ? o : o.value;
            return (
              <option key={value} value={value}>
                {typeof o === 'string' ? o : o.label}
              </option>
            );
          })}
        </select>
      </div>
      {error && (
        <p id={`${name}-error`} role="alert" className="mt-2 text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
});

const noSubscribe = () => () => {};

/** Steps 1–4 of the enquiry form, from the owner's `useForm`. */
export default function EnquiryFields({ form }: { form: UseFormReturn<EnquiryValues> }) {
  const {
    register,
    control,
    formState: { errors },
  } = form;
  const message = useWatch({ control, name: 'message' }) ?? '';
  // The date floor is the CLIENT's today: rendered on the server (ISR, UTC) it would be a
  // stale attribute and a hydration mismatch, so it is empty until hydration.
  const today = useSyncExternalStore(noSubscribe, todayISO, () => undefined);
  const field = 'bg-field';

  return (
    <div className="space-y-8">
      <div>
        <Step n={1} title={FORM.steps[0]} />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Input
            label={<>Company name<Req /></>}
            {...register('company')}
            autoComplete="organization"
            variant="outline"
            inputClassName={field}
            error={errors.company?.message}
          />
          <Input
            label={<>Contact person<Req /></>}
            {...register('name')}
            autoComplete="name"
            variant="outline"
            inputClassName={field}
            error={errors.name?.message}
          />
          <Input
            label={<>Business email<Req /></>}
            {...register('email')}
            type="email"
            autoComplete="email"
            variant="outline"
            inputClassName={field}
            error={errors.email?.message}
          />
          <div>
            <label htmlFor="phone" className={LABEL}>
              Mobile number<Req />
            </label>
            <Controller
              name="phone"
              control={control}
              render={({ field: f }) => (
                <PhoneInput
                  country="in"
                  onlyCountries={['in']}
                  countryCodeEditable={false}
                  value={f.value}
                  onChange={f.onChange}
                  onBlur={f.onBlur}
                  inputProps={{
                    id: 'phone',
                    autoComplete: 'tel',
                    inputMode: 'tel',
                    'aria-invalid': errors.phone ? 'true' : 'false',
                    'aria-describedby': errors.phone ? 'phone-error' : undefined,
                  }}
                  inputClass="!h-12 !w-full !text-sm"
                />
              )}
            />
            {errors.phone?.message && (
              <p id="phone-error" role="alert" className="mt-2 text-xs text-red-500">
                {errors.phone.message}
              </p>
            )}
          </div>
        </div>
      </div>

      <div>
        <Step n={2} title={FORM.steps[1]} />
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Select
            label={<>Gifting occasion<Req /></>}
            icon={Gift}
            placeholder="Select occasion"
            options={OCCASIONS}
            {...register('occasion')}
            error={errors.occasion?.message}
          />
          <Select
            label={<>Approximate quantity<Req /></>}
            icon={Package}
            placeholder="Select quantity"
            options={QUANTITIES}
            {...register('quantity')}
            error={errors.quantity?.message}
          />
          <Select
            label="Budget per gift"
            icon={Wallet}
            placeholder="Select budget"
            options={BUDGETS}
            {...register('budget_range')}
            error={errors.budget_range?.message}
          />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="preferred_date" className={LABEL}>
              Preferred delivery date
            </label>
            <div className="relative">
              <IconSlot icon={CalendarDays} />
              {/* iOS needs the explicit height and `appearance-none` on a date input. */}
              <Input
                {...register('preferred_date')}
                type="date"
                min={today}
                variant="outline"
                inputClassName={`${field} appearance-none pl-11`}
                error={errors.preferred_date?.message}
              />
            </div>
          </div>
          <div>
            <label htmlFor="city" className={LABEL}>
              Delivery city or PIN code<Req />
            </label>
            <div className="relative">
              <IconSlot icon={MapPin} />
              <Input
                {...register('city')}
                autoComplete="address-level2"
                placeholder="e.g. Gurugram or 122001"
                variant="outline"
                inputClassName={`${field} pl-11`}
                error={errors.city?.message}
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <Step n={3} title={FORM.steps[2]} />
        <div className="mt-4">
          <PlantPreferenceCards register={register} error={errors.plant_preferences?.message} />
        </div>
      </div>

      <div>
        <Step n={4} title={FORM.steps[3]} id="enquiry-step-4" />
        <TextArea
          {...register('message')}
          aria-labelledby="enquiry-step-4"
          className="mt-4"
          variant="outline"
          inputClassName={field}
          rows={4}
          maxLength={FORM.messageMax}
          placeholder={FORM.messagePlaceholder}
          error={errors.message?.message}
        />
        <p className="mt-1 text-right text-[12px] text-stone-500">
          {message.length}/{FORM.messageMax}
        </p>
      </div>
    </div>
  );
}
