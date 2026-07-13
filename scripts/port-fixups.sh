#!/bin/bash
# Mechanical fixups applied to files ported from V1 (idempotent; re-run after any new copy).
cd "$(dirname "$0")/.."

# 1. next/router → compat shim (Next hard-errors on pages-router imports in app
#    code; bundler aliases cannot intercept it, so specifiers are rewritten).
grep -rl "from 'next/router'" src --include='*.ts' --include='*.tsx' 2>/dev/null | while read -r f; do
  sed -i '' "s|from 'next/router'|from '@/compat/next-router'|g" "$f"
done

# 2. main.css: V1 @imports three css files at its END (spec-invalid; webpack
#    tolerated it, Turbopack doesn't). app/layout.tsx imports them in the same
#    cascade position instead.
python3 - <<'PY'
p='src/assets/css/main.css'
s=open(p).read()
changed=False
for imp in ["@import './custom-plugins.css';","@import './rich-text-editor.css';","@import './plantathome-overrides.css';"]:
    if imp in s:
        s=s.replace(imp,'')
        changed=True
if changed:
    s=s.rstrip()+'\n/* trailing @imports moved to app/layout.tsx import order (Turbopack requires @import at top) */\n'
    open(p,'w').write(s)
    print('main.css trailing @imports stripped')
else:
    print('main.css already clean')
PY

echo "next/router compat specifiers: $(grep -rl "@/compat/next-router" src --include='*.ts' --include='*.tsx' | wc -l | tr -d ' ') files"
