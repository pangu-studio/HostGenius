declare global {
  interface Window {
    platform: {
      isMac: boolean;
      isWindows: boolean;
      isLinux: boolean;
      platform: string;
    };
    electronAPI: any;
    electronWindow: any;
  }
}

export {};
