import { Logo } from './Logo';

export function Footer() {
  return (
    <footer className="mt-20 border-t border-forest/10 bg-forest-soft/40">
      <div className="container-wrap flex flex-col items-center justify-between gap-3 py-8 text-sm text-forest-ink/70 sm:flex-row">
        <Logo />
        <p>Bring nature home — plants delivered from nurseries near you.</p>
        <p className="text-forest-ink/50">© {new Date().getFullYear()} PlantAtHome</p>
      </div>
    </footer>
  );
}
