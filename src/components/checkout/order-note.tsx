import React from 'react';
import TextArea from '@/components/ui/forms/text-area';
import { orderNoteAtom } from '@/store/checkout';
import { useAtom } from 'jotai';

function OrderNote({ count, label }: { count: number; label: string }) {
  const [note, setNote] = useAtom(orderNoteAtom);

  return (
    <div className="pa-checkout-step">
      <div className="pa-checkout-step-header">
        <span className="pa-checkout-step-num">{count}</span>
        <span className="pa-checkout-step-label">{label}</span>
      </div>
      <div className="block">
        <TextArea
          //@ts-ignore
          value={note}
          name="orderNote"
          onChange={(e) => setNote(e.target.value)}
          variant="outline"
          placeholder="Any special delivery instructions? (optional)"
        />
      </div>
    </div>
  );
}

export default OrderNote;
