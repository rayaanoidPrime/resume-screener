import * as esbuild from "esbuild";
import * as fs from "fs";
import * as path from "path";

// Copy package.json to build directory
async function copyPackageJson() {
  const pkg = JSON.parse(fs.readFileSync("package.json", "utf-8"));

  // Only keep production dependencies
  const prodPkg = {
    name: pkg.name,
    version: pkg.version,
    dependencies: pkg.dependencies,
    type: pkg.type,
  };

  // Create build directory if it doesn't exist
  if (!fs.existsSync("build")) {
    fs.mkdirSync("build");
  }

  // Write the modified package.json to build directory
  fs.writeFileSync(
    path.join("build", "package.json"),
    JSON.stringify(prodPkg, null, 2)
  );
}

async function build() {
  try {
    // Build the TypeScript code
    await esbuild.build({
      entryPoints: ["src/index.ts"],
      bundle: true,
      platform: "node",
      target: "node16",
      outfile: "build/index.js",
      sourcemap: true,
      minify: true,
      external: [
        // External dependencies that should not be bundled
        ...Object.keys(
          JSON.parse(fs.readFileSync("package.json", "utf-8")).dependencies ||
            {}
        ),
        "pg-native",
      ],
    });

    // Copy package.json
    await copyPackageJson();

    console.log("Build complete!");
  } catch (error) {
    console.error("Build failed:", error);
    process.exit(1);
  }
}

build();
