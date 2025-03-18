import { defineConfig } from "vite";

export default defineConfig({
  base: "/portfolio",
  // Include .gltf and .bin files in the build
  files: ['**/*.{gltf,bin}'],
});