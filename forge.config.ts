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
    extraResource: ["./node_modules/better-sqlite3"],
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

      // __dirname isn't accessible from here
      const dirnamePath: string = ".";
      const sourceNodeModulesPath = resolve(dirnamePath, "node_modules");
      const destNodeModulesPath = resolve(buildPath, "node_modules");

      // Copy all asked packages in /node_modules directory inside the asar archive
      await Promise.all(
        requiredNativePackages.map(async (packageName) => {
          const sourcePath = join(sourceNodeModulesPath, packageName);
          const destPath = join(destNodeModulesPath, packageName);

          await mkdirs(dirname(destPath));
          await copy(sourcePath, destPath, {
            // recursive: true,
            preserveTimestamps: true,
          });
        }),
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
