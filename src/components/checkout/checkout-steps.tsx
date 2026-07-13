import { useAtom } from 'jotai';
import isEmpty from 'lodash/isEmpty';
import {
  customerContactAtom,
  billingAddressAtom,
  shippingAddressAtom,
  deliveryTimeAtom,
  verifiedResponseAtom,
} from '@/store/checkout';

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export const CHECKOUT_STEPS = ['Contact', 'Address', 'Delivery', 'Review'];

/**
 * Clickable checkout progress bar. Derives done state from the checkout atoms;
 * `current` + `onStepClick` make it navigate the wizard (back/visited freely,
 * forward only once the previous steps are complete).
 */
export default function CheckoutSteps({
  current = 0,
  onStepClick,
}: {
  current?: number;
  onStepClick?: (index: number) => void;
}) {
  const [contact] = useAtom(customerContactAtom);
  const [billing] = useAtom(billingAddressAtom);
  const [shipping] = useAtom(shippingAddressAtom);
  const [deliveryTime] = useAtom(deliveryTimeAtom);
  const [verified] = useAtom(verifiedResponseAtom);

  const steps = [
    { label: 'Contact', done: !!contact },
    { label: 'Address', done: !!billing && !!shipping },
    { label: 'Delivery', done: !!deliveryTime },
    { label: 'Review', done: !isEmpty(verified) },
  ];

  const progress = Math.min(100, (current / (steps.length - 1)) * 100);
  const prevDone = (i: number) => steps.slice(0, i).every((s) => s.done);

  return (
    <div className="pa-steps" aria-label="Checkout progress">
      <div className="pa-steps-track" aria-hidden>
        <div className="pa-steps-fill" style={{ width: `${progress}%` }} />
      </div>
      {steps.map((s, i) => {
        const state = i === current ? 'active' : s.done ? 'done' : 'upcoming';
        const clickable = !!onStepClick && (i <= current || prevDone(i));
        return (
          <button
            type="button"
            key={s.label}
            className={`pa-step pa-step--${state}`}
            disabled={!clickable}
            onClick={() => clickable && onStepClick?.(i)}
            style={{ background: 'none', border: 'none', padding: 0, cursor: clickable ? 'pointer' : 'default' }}
          >
            <span className="pa-step-dot">
              {s.done && i !== current ? <CheckIcon /> : <span>{i + 1}</span>}
            </span>
            <span className="pa-step-label">{s.label}</span>
          </button>
        );
      })}
    </div>
  );
}
