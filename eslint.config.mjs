import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // Override default ignores
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "scripts/**",  // Scripts de desarrollo no necesitan lint estricto
    "src/**",      // Código legacy/ejemplo
    "nodo360-community-widget/**", // Widget externo
  ]),

  // Reglas personalizadas
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      // ═══════════════════════════════════════════════════════════
      // SUPRIMIDOS TEMPORALMENTE (no críticos para producción)
      // ═══════════════════════════════════════════════════════════
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-require-imports": "off",
      "prefer-const": "off",

      // Warnings de Next.js (mejoras de performance, no bloqueantes)
      "@next/next/no-img-element": "warn",

      // React hooks (algunos patrones válidos causan falsos positivos)
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/purity": "warn",

      // Entidades HTML en JSX
      "react/no-unescaped-entities": "off",

      // ═══════════════════════════════════════════════════════════
      // GUARDRAILS: Reglas de imports para UI components
      // ═══════════════════════════════════════════════════════════
      "no-restricted-imports": ["error", {
        patterns: [
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
