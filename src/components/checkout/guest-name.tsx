import React, { useState } from 'react';
import { guestEmailAtom, guestNameAtom } from '@/store/checkout';
import { useAtom } from 'jotai';
import Input from '@/components/ui/forms/input';
function GuestName({ count, label }: { count: number; label: string }) {
    const [name, setName] = useAtom(guestNameAtom);
    const [touched, setTouched] = useState(false);
    const invalid = touched && !name?.trim();
    const [email, setEmail] = useAtom(guestEmailAtom);
    const [emailTouched, setEmailTouched] = useState(false);
    const emailInvalid =
        emailTouched && !!email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim());
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
                    onBlur={() => {
                        setTouched(true);
                        // Persist the trimmed value (the order payload sends it as-is).
                        if (name !== name?.trim()) setName((name ?? '').trim());
                    }}
                    variant="outline"
                    placeholder="Enter your full name"
                    error={invalid ? 'Your name is required' : undefined}
                />
                <Input
                    value={email}
                    name="guestEmail"
                    type="email"
                    label="Email (optional — for your order confirmation)"
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => {
                        setEmailTouched(true);
                        if (email !== email.trim()) setEmail(email.trim());
                    }}
                    variant="outline"
                    placeholder="you@example.com"
                    className="mt-4"
                    error={emailInvalid ? 'Enter a valid email address' : undefined}
                />
            </div>
        </div>
    );
}
export default GuestName;
