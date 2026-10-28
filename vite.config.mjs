import { defineConfig } from "vite";
import { readFileSync } from "node:fs";
let release = { version: "0.1", commit: null };
try {
  release = JSON.parse(readFileSync(".netlify/build-version.json", "utf8"));
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
export default defineConfig({
  esbuild: { jsx: "automatic" },
  define: { __APP_VERSION__: JSON.stringify(release.version) },
  plugins: [
    {
      name: "bridges-release-manifest",
      transformIndexHtml(html) {
        return html.replace(
          /(<meta name="application-version" content=")[^"]+(")/,
          (_, before, after) => before + release.version + after,
        );
      },
      generateBundle() {
        this.emitFile({
          type: "asset",
          fileName: "version.json",
          source: JSON.stringify(release, null, 2) + "\n",
        });
      },
    },
  ],
});
