import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { resolve } from "node:path";
import fs from "node:fs";

function copyExtensionStaticAssets() {
  return {
    name: "copy-extension-static-assets",
    closeBundle() {
      const outDir = resolve(__dirname, "dist-extension");
      const extDir = resolve(__dirname, "extension");

      // Copy manifest.json
      const manifestSrc = resolve(extDir, "manifest.json");
      const manifestDest = resolve(outDir, "manifest.json");
      if (fs.existsSync(manifestSrc)) {
        fs.copyFileSync(manifestSrc, manifestDest);
        console.log("[Vite Extension] Copied manifest.json to dist-extension");
      }

      // Copy icons
      const iconsSrc = resolve(extDir, "icons");
      const iconsDest = resolve(outDir, "icons");
      if (fs.existsSync(iconsSrc)) {
        fs.mkdirSync(iconsDest, { recursive: true });
        for (const file of fs.readdirSync(iconsSrc)) {
          fs.copyFileSync(resolve(iconsSrc, file), resolve(iconsDest, file));
        }
        console.log("[Vite Extension] Copied icons to dist-extension/icons");
      }

      // Move popup.html from dist-extension/extension/popup.html to dist-extension/popup.html and fix asset paths
      const nestedPopup = resolve(outDir, "extension", "popup.html");
      const rootPopup = resolve(outDir, "popup.html");
      if (fs.existsSync(nestedPopup)) {
        let html = fs.readFileSync(nestedPopup, "utf-8");
        html = html.replace(/\.\.\/assets\//g, "./assets/");
        fs.writeFileSync(rootPopup, html, "utf-8");
        fs.rmSync(resolve(outDir, "extension"), { recursive: true, force: true });
        console.log("[Vite Extension] Fixed popup.html asset paths at dist-extension root");
      }
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    tsconfigPaths(),
    copyExtensionStaticAssets(),
  ],
  base: "./",
  build: {
    outDir: "dist-extension",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "extension/popup.html"),
        background: resolve(__dirname, "src/extension/background.ts"),
        "content-script": resolve(__dirname, "src/extension/content-script.ts"),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === "background" || chunkInfo.name === "content-script") {
            return "[name].js";
          }
          return "assets/[name]-[hash].js";
        },
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
  },
});
