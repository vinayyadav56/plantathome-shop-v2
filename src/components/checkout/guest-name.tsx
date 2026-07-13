import React from 'react';
import { guestNameAtom } from '@/store/checkout';
import { useAtom } from 'jotai';
import Input from '@/components/ui/forms/input';
function GuestName({ count, label }: { count: number; label: string }) {
    const [name, setName] = useAtom(guestNameAtom);
    return (
        <div className="pa-checkout-step">
            <div className="pa-checkout-step-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span className="pa-checkout-step-num">{count}</span>
                    <span className="pa-checkout-step-label">{label}</span>
                </div>
            </div>
            <div className="block">
                <Input
                    //@ts-ignore
                    value={name}
                    name="guestName"
                    onChange={(e) => setName(e.target.value)}
                    variant="outline"
                    placeholder="Enter your full name"
                />
            </div>
        </div>
    );
}
export default GuestName;