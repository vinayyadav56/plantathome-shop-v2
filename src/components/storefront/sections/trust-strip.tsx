import { Icon } from '../icons';
import { Marquee } from '../motion';
import { TRUST_ITEMS } from '../verticals';

export function TrustStrip() {
  return (
    <div className="border-y border-forest/10 bg-forest py-4 text-white">
      <Marquee duration={26}>
        <div className="flex items-center gap-10 pr-10 text-sm font-medium uppercase tracking-[0.2em] text-sage">
          {TRUST_ITEMS.map((t, i) => (
            <span key={i} className="flex items-center gap-10">
              <Icon.leaf className="h-4 w-4 text-gold" />
              {t}
            </span>
          ))}
        </div>
      </Marquee>
    </div>
  );
}
