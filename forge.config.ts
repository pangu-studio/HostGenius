import type { ForgeConfig } from "@electron-forge/shared-types";
import { VitePlugin } from "@electron-forge/plugin-vite";
import { MakerDeb } from "@electron-forge/maker-deb";
import { FusesPlugin } from "@electron-forge/plugin-fuses";
import { FuseV1Options, FuseVersion } from "@electron/fuses";

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
    icon: "./src/assets/icon/icon.icns",
    ignore: [/node_modules\/(?!(better-sqlite3|bindings|file-uri-to-path)\/)/],
  },
  rebuildConfig: {},
  hooks: {},
  makers: [
    new MakerDeb({}),
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
    {
      name: "@electron-forge/plugin-auto-unpack-natives",
      config: {},
    },
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
