import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";
const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });
const config = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  // Next.js regenerates this declaration file; application source remains linted.
  { ignores: ["next-env.d.ts", ".next/**", ".review/**", "node_modules/**", "preview/**", "out/**"] },
];
export default config;
