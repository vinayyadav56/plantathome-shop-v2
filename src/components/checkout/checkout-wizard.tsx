import { useAtom } from 'jotai';
import { AnimatePresence, motion } from 'framer-motion';
import {
  customerContactAtom,
  billingAddressAtom,
  shippingAddressAtom,
  deliveryTimeAtom,
} from '@/store/checkout';

export type WizardPanel = { key: string; node: React.ReactNode };

/**
 * One-step-at-a-time checkout wizard. Renders the active panel with a left→right
 * slide and Back / Continue navigation. Step gating is derived from the checkout
 * atoms (contact → address → delivery → review). The order summary lives outside
 * this component (right column) and stays visible across steps.
 */
export default function CheckoutWizard({
  step,
  setStep,
  panels,
}: {
  step: number;
  setStep: (n: number) => void;
  panels: WizardPanel[];
}) {
  const [contact] = useAtom(customerContactAtom);
  const [billing] = useAtom(billingAddressAtom);
  const [shipping] = useAtom(shippingAddressAtom);
  const [deliveryTime] = useAtom(deliveryTimeAtom);

  const canContinue = [
    !!contact,
    !!billing && !!shipping,
    !!deliveryTime,
    true,
  ][step];

  const last = panels.length - 1;
  const active = panels[step] ?? panels[0];

  return (
    <div className="pa-wizard">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={active?.key ?? step}
          initial={{ opacity: 0, x: 28 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -28 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          {active?.node}
        </motion.div>
      </AnimatePresence>

      <div className="pa-wizard-nav">
        {step > 0 ? (
          <button
            type="button"
            className="pa-wizard-back"
            onClick={() => setStep(step - 1)}
          >
            ← Back
          </button>
        ) : (
          <span />
        )}
        {step < last && (
          <button
            type="button"
            className="pa-wizard-next"
            disabled={!canContinue}
            onClick={() => canContinue && setStep(step + 1)}
          >
            Continue →
          </button>
        )}
      </div>
    </div>
  );
}
