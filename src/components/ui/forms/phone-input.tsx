import 'react-phone-input-2/lib/bootstrap.css';
import PhoneInput, { type PhoneInputProps } from 'react-phone-input-2';

// India-first defaults for every mount (checkout contact, OTP form, profile):
// the library's own placeholder is a US number ("1 (702) 123-4567").
export default function PhoneInputIn(props: PhoneInputProps) {
  return <PhoneInput country="in" placeholder="+91 98765 43210" {...props} />;
}
