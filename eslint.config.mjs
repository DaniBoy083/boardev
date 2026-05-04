import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const domainBoundaryRule = {
  "no-restricted-imports": [
    "error",
    {
      patterns: [
        {
          group: [
            "@/src/application/**",
            "@/src/infrastructure/**",
            "@/src/app/**",
            "@/src/components/**",
          ],
          message: "A camada de dominio deve permanecer isolada das camadas externas.",
        },
      ],
    },
  ],
};

const applicationBoundaryRule = {
  "no-restricted-imports": [
    "error",
    {
      patterns: [
        {
          group: [
            "@/src/infrastructure/**",
            "@/src/app/**",
            "@/src/components/**",
          ],
          message: "A camada de aplicacao deve depender de portas e dominio, nao de infraestrutura ou UI.",
        },
      ],
    },
  ],
};

const infrastructureBoundaryRule = {
  "no-restricted-imports": [
    "error",
    {
      patterns: [
        {
          group: [
            "@/src/app/**",
            "@/src/components/**",
          ],
          message: "A camada de infraestrutura nao deve importar codigo de UI ou rotas.",
        },
      ],
    },
  ],
};

const uiBoundaryRule = {
  "no-restricted-imports": [
    "error",
    {
      patterns: [
        {
          group: [
            "firebase/app",
            "firebase/firestore",
            "firebase-admin/**",
            "@/src/app/services/**",
          ],
          message: "UI e rotas devem consumir casos de uso ou adaptadores, sem acessar SDKs do Firebase diretamente.",
        },
      ],
    },
  ],
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/domain/**/*.{ts,tsx}"],
    rules: domainBoundaryRule,
  },
  {
    files: ["src/application/**/*.{ts,tsx}"],
    rules: applicationBoundaryRule,
  },
  {
    files: ["src/infrastructure/**/*.{ts,tsx}"],
    rules: infrastructureBoundaryRule,
  },
  {
    files: ["src/app/**/*.{ts,tsx}", "src/components/**/*.{ts,tsx}"],
    rules: uiBoundaryRule,
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
