import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const base = process.env.GITHUB_PAGES === "true" ? "/DigitalBazaar_Ecom/" : "/";

export default defineConfig({
  base,
  plugins: [react()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
