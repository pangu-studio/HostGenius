import type { ForgeConfig } from "@electron-forge/shared-types";
import { MakerSquirrel } from "@electron-forge/maker-squirrel";
import { MakerZIP } from "@electron-forge/maker-zip";
import { MakerDeb } from "@electron-forge/maker-deb";
import { MakerRpm } from "@electron-forge/maker-rpm";
import { VitePlugin } from "@electron-forge/plugin-vite";
import { FusesPlugin } from "@electron-forge/plugin-fuses";
import { FuseV1Options, FuseVersion } from "@electron/fuses";
import { resolve, join, dirname } from "path";
import { copy, mkdirs } from "fs-extra";

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    name: "Host Genius",
    extraResource: [
      "./node_modules/better-sqlite3",
      "./node_modules/@tailwindcss/oxide*",
      "./node_modules/lightningcss*",
    ],
  },
  rebuildConfig: {},
  hooks: {
    // The call to this hook is mandatory for better-sqlite3 to work once the app built
    async packageAfterCopy(_forgeConfig, buildPath) {
      const requiredNativePackages = [
        "better-sqlite3",
        "bindings",
        "file-uri-to-path",
      ];

      // Copy platform-specific packages if they exist
      const platformPackages = [
        "@tailwindcss/oxide-darwin-arm64",
        "@tailwindcss/oxide-darwin-x64",
        "@tailwindcss/oxide-win32-x64-msvc",
        "@tailwindcss/oxide-linux-x64-gnu",
        "@tailwindcss/oxide-linux-arm64-gnu",
        "lightningcss-darwin-arm64",
        "lightningcss-darwin-x64",
        "lightningcss-win32-x64-msvc",
        "lightningcss-linux-x64-gnu",
        "lightningcss-linux-arm64-gnu",
      ];

      // __dirname isn't accessible from here
      const dirnamePath: string = ".";
      const sourceNodeModulesPath = resolve(dirnamePath, "node_modules");
      const destNodeModulesPath = resolve(buildPath, "node_modules");

      // Copy all required packages
      await Promise.all(
        [...requiredNativePackages, ...platformPackages].map(
          async (packageName) => {
            const sourcePath = join(sourceNodeModulesPath, packageName);
            const destPath = join(destNodeModulesPath, packageName);

            try {
              await mkdirs(dirname(destPath));
              await copy(sourcePath, destPath, {
                preserveTimestamps: true,
              });
            } catch (error) {
              // Ignore errors for optional platform-specific packages
              if (!platformPackages.includes(packageName)) {
                throw error;
              }
              console.warn(
                `Optional package ${packageName} not found, skipping...`,
              );
            }
          },
        ),
      );
    },
  },
  makers: [
    new MakerSquirrel({}),
    new MakerZIP({}, ["darwin"]),
    new MakerRpm({}),
    new MakerDeb({}),
  ],
  plugins: [
    new VitePlugin({
      build: [
        {
          entry: "src/main.ts",
          config: "vite.main.config.ts",
          target: "main",
        },
        {
          entry: "src/preload.ts",
          config: "vite.preload.config.ts",
          target: "preload",
        },
      ],
      renderer: [
        {
          name: "main_window",
          config: "vite.renderer.config.mts",
        },
      ],
    }),

    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};

export default config;
