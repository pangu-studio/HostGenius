import type { ForgeConfig } from "@electron-forge/shared-types";
import { VitePlugin } from "@electron-forge/plugin-vite";
import { FusesPlugin } from "@electron-forge/plugin-fuses";
import { FuseV1Options, FuseVersion } from "@electron/fuses";
import { resolve, join, dirname } from "path";
import { copy, mkdirs } from "fs-extra";

// 检查是否为生产构建
const isProduction = process.env.NODE_ENV === "production";
const isRelease = process.env.BUILD_TYPE === "release";
const shouldSign = isProduction && isRelease;

const config: ForgeConfig = {
  packagerConfig: {
    // 只在生产发布时启用签名
    ...(shouldSign && {
      osxSign: {},
      osxNotarize: {
        appleId: process.env.APPLE_ID!,
        appleIdPassword: process.env.APPLE_ID_PASSWORD!,
        teamId: process.env.APPLE_TEAM_ID!,
      },
    }),
    appBundleId: "studio.pangu.hostgenius",
    asar: true,
    name: "Host Genius",
    extraResource: ["./node_modules/better-sqlite3"],
    icon: "./src/assets/icon/icon.icns",
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

      // Copy all required packages
      await Promise.all(
        [...requiredNativePackages].map(async (packageName) => {
          const sourcePath = join(sourceNodeModulesPath, packageName);
          const destPath = join(destNodeModulesPath, packageName);

          try {
            await mkdirs(dirname(destPath));
            await copy(sourcePath, destPath, {
              preserveTimestamps: true,
            });
          } catch (error) {
            console.error(
              `Failed to copy package ${packageName} from ${sourcePath} to ${destPath}`,
              error,
            );

            console.warn(
              `Optional package ${packageName} not found, skipping...`,
            );
          }
        }),
      );
    },
  },
  makers: [
    {
      name: "@electron-forge/maker-zip",
      config: (arch: string) => ({
        // 只在启用签名时提供更新清单URL
        ...(shouldSign && {
          macUpdateManifestBaseUrl: `https://pangu-updater.oss-cn-hongkong.aliyuncs.com/host-genius/darwin/${arch}`,
        }),
      }),
      platforms: ["darwin"],
    },
    {
      name: "@electron-forge/maker-squirrel",
      config: (arch: string) => ({
        // 只在启用签名时提供远程发布URL
        ...(shouldSign && {
          remoteReleases: `https://pangu-updater.oss-cn-hongkong.aliyuncs.com/host-genius/win32/${arch}`,
        }),
      }),
      platforms: ["win32"],
    },
    // 在开发/测试环境中启用 DMG maker
    ...(!shouldSign
      ? [
          {
            name: "@electron-forge/maker-dmg",
            config: {
              background: "./src/assets/dmg-background.png",
              format: "ULFO",
            },
          },
        ]
      : []),
  ],
  // 只在生产发布时启用发布器
  ...(shouldSign && {
    publishers: [
      {
        name: "@electron-forge/publisher-s3",
        config: {
          endpoint: "https://oss-cn-hongkong.aliyuncs.com",
          bucket: "pangu-updater",
          public: true,
          accessKeyId: process.env.S3_ACCESS_KEY_ID,
          secretAccessKey: process.env.S3_ACCESS_KEY_SECRET,
          region: "cn-hongkong",
          folder: "host-genius",
        },
      },
    ],
  }),
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
