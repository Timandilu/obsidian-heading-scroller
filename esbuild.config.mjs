import esbuild from "esbuild";
import { builtinModules } from "node:module";

await esbuild.build({
  entryPoints: ["src/main.ts"],
  bundle: true,
  external: ["obsidian", "electron", ...builtinModules],
  format: "cjs",
  target: "es2018",
  logLevel: "info",
  minify: true,
  sourcemap: false,
  outfile: "main.js",
});
