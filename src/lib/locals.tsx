import { useRouter } from '@/compat/next-router';

// PlantAtHome: English + the 22 scheduled Indian languages. RTL for Urdu, Kashmiri, Sindhi.
const localeRTLList = ['ur', 'ks', 'sd'];

export function useIsRTL() {
  const { locale } = useRouter();
  if (locale && localeRTLList.includes(locale)) {
    return { isRTL: true, alignLeft: 'right', alignRight: 'left' };
  }
  return { isRTL: false, alignLeft: 'left', alignRight: 'right' };
}

// id/value = ISO 639 code, name = native script name, short = 1–2 char badge shown in the switcher.
const LANGS: { id: string; name: string; short: string }[] = [
  { id: 'en', name: 'English', short: 'EN' },
  { id: 'hi', name: 'हिन्दी', short: 'हि' },
  { id: 'bn', name: 'বাংলা', short: 'বা' },
  { id: 'ta', name: 'தமிழ்', short: 'த' },
  { id: 'te', name: 'తెలుగు', short: 'తె' },
  { id: 'mr', name: 'मराठी', short: 'म' },
  { id: 'gu', name: 'ગુજરાતી', short: 'ગુ' },
  { id: 'kn', name: 'ಕನ್ನಡ', short: 'ಕ' },
  { id: 'ml', name: 'മലയാളം', short: 'മ' },
  { id: 'pa', name: 'ਪੰਜਾਬੀ', short: 'ਪੰ' },
  { id: 'or', name: 'ଓଡ଼ିଆ', short: 'ଓ' },
  { id: 'as', name: 'অসমীয়া', short: 'অ' },
  { id: 'ur', name: 'اردو', short: 'اُ' },
  { id: 'sa', name: 'संस्कृतम्', short: 'सं' },
  { id: 'ne', name: 'नेपाली', short: 'ने' },
  { id: 'kok', name: 'कोंकणी', short: 'को' },
  { id: 'mai', name: 'मैथिली', short: 'मै' },
  { id: 'doi', name: 'डोगरी', short: 'डो' },
  { id: 'ks', name: 'کٲشُر', short: 'كٲ' },
  { id: 'sd', name: 'سنڌي', short: 'سن' },
  { id: 'sat', name: 'ᱥᱟᱱᱛᱟᱲᱤ', short: 'ᱥᱟ' },
  { id: 'mni', name: 'ꯃꯩꯇꯩꯂꯣꯟ', short: 'ꯃ' },
  { id: 'brx', name: 'बड़ो', short: 'ब' },
];

function LangBadge({ short }: { short: string }) {
  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-[11px] font-semibold text-gray-700">
      {short}
    </span>
  );
}

export let languageMenu = LANGS.map((l) => ({
  id: l.id,
  name: l.name,
  value: l.id,
  icon: <LangBadge short={l.short} />,
  iconMobile: <LangBadge short={l.short} />,
}));
