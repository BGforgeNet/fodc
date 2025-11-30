import esbuild from "esbuild";

esbuild
  .build({
    entryPoints: ["src/parse-data.ts"],
    bundle: true,
    outfile: "dist/parse-data.js",
    platform: "node",
    format: "esm",
    sourcemap: true,
    external: ['fs', 'path', 'stream']  // Exclude built-in modules
  })
  .catch(() => process.exit(1));
