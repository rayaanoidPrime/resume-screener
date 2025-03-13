import * as esbuild from "esbuild";

esbuild
  .build({
    entryPoints: ["src/index.ts"],
    bundle: true,
    platform: "node",
    loader: { ".html": "text" },
    target: "node16", // Match your deployment Node.js version
    outfile: "build/index.js",
    sourcemap: true, // Optional for debugging
    minify: true, // Optional for production
    external: ["pg", "bull", "aws-sdk", "mock-aws-s3", "nock"], // Exclude native modules
  })
  .then(() => console.log("Build complete"))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
