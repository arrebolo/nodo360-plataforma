import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // Override default ignores of eslint-config-next.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),

  // GUARDRAIL: Reglas de imports para UI components
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [
          // Prohibir default import de compound components
          {
            group: ["@/components/ui/Card"],
            importNames: ["default"],
            message: "Card es compound component. Usa: import { Card, CardHeader, ... } from '@/components/ui/Card'"
          },
          {
            group: ["@/components/ui/SortableList"],
            importNames: ["default"],
            message: "SortableList es compound component. Usa: import { SortableList, SortableItem, ... } from '@/components/ui/SortableList'"
          }
        ]
      }]
    }
  }
]);

export default eslintConfig;
