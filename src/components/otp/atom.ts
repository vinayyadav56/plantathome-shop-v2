import { atom } from 'jotai';

interface OtpState {
  step: 'PhoneNumber' | 'RegisterForm' | 'OtpForm';
  otpId: string | null;
  isContactExist: boolean;
  phoneNumber: string;
  /**
   * The channel/gateway the code was actually SENT on, as RESOLVED and echoed
   * by the server (e.g. 'whatsapp' | 'msg91' | 'twilio'). Load-bearing: the
   * server re-resolves the gateway from this on verify/login, and only the
   * issuing gateway can verify its own code (WhatsApp codes are verified
   * locally, Twilio/MSG91 remotely). Sending the raw UI intent instead would
   * break any flow that relied on the server's default gateway.
   */
  channel: string;
  /** Server-provided countdowns (seconds) for the OTP screen. */
  expiresIn: number;
  resendAfter: number;
}

export const initialOtpState: OtpState = {
  step: 'PhoneNumber',
  isContactExist: false,
  otpId: null,
  phoneNumber: '',
  channel: 'sms',
  expiresIn: 300,
  resendAfter: 45,
};

export const optAtom = atom<OtpState>(initialOtpState);
