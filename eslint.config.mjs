import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    // The icon system has one door: src/components/ui/icon.tsx. Importing the
    // library directly bypasses the ICON_STROKE knob, so those glyphs silently
    // render at Tabler's default weight instead of the house weight. Three
    // files had drifted that way before this rule existed.
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@tabler/icons-react",
              message:
                "Import glyphs from '@/components/ui/icon' instead. That barrel pins the house stroke weight and keeps concept->glyph in one place.",
            },
            {
              name: "lucide-react",
              message:
                "Lucide was replaced by Tabler. Import from '@/components/ui/icon'.",
            },
          ],
        },
      ],
    },
  },
  {
    // The barrel itself is the one place allowed to touch the library.
    files: [
      "src/components/ui/icon.tsx",
      "src/components/ui/icon-set/**",
      // DB-keyed palettes: export names are pinned by database records, so these
      // cannot be re-exported from the barrel. They still go through
      // paletteIcon(), so the house stroke applies.
      "src/components/icons/category/**",
      "src/components/icons/groups/**",
    ],
    rules: { "no-restricted-imports": "off" },
  },
]);

export default eslintConfig;
