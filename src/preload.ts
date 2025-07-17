import { contextBridge, ipcRenderer } from "electron";
import exposeContexts from "./helpers/ipc/context-exposer";

// 首先暴露基础上下文
exposeContexts();
export interface HostGroup {
  id: string;
  name: string;
  description?: string;
  content: string;
  enabled: boolean;
  isSystem: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  syncStatus: "local" | "synced" | "conflict" | "pending";
  lastSyncAt?: string;
  shareToken?: string;
  createdBy?: string;
}

export interface HostEntry {
  ip: string;
  domain: string;
  comment?: string;
  enabled: boolean;
}

export interface BackupInfo {
  id: string;
  filePath: string;
  createdAt: string;
  size: number;
}

export interface DataInfo {
  dataDirectory: string;
  backupDirectory: string;
  databasePath: string;
  dataSize: {
    total: number;
    database: number;
    backups: number;
  };
}

const electronAPI = {
  // validateAdminPassword: (password: string) => {
  //   return ipcRenderer.invoke("host:validate-admin-password", password);
  // },
  // // 权限管理
  // checkPermissions: (): Promise<boolean> =>
  //   ipcRenderer.invoke("host:check-permissions"),
  // requestAdmin: (): Promise<boolean> => {
  //   console.log("aa");
  //   // 请求管理员权限
  //   return ipcRenderer.invoke("host:request-admin");
  // },

  // 系统hosts操作
  readSystemHosts: (): Promise<string> =>
    ipcRenderer.invoke("host:read-system"),
  // 读取原始系统hosts文件（未经解析的完整内容）
  readRawSystemHosts: (): Promise<string> =>
    ipcRenderer.invoke("host:read-raw-system"),

  // 获取系统hosts内容
  parseSystemHostsContent: (content: string): Promise<string> =>
    ipcRenderer.invoke("host:parseSystemHostsContent", content),

  // 分组管理
  getGroups: (): Promise<HostGroup[]> => ipcRenderer.invoke("host:get-groups"),
  createGroup: (data: {
    name: string;
    description?: string;
    content?: string;
    enabled?: boolean;
  }): Promise<string> => ipcRenderer.invoke("host:create-group", data),
  updateGroup: (
    id: string,
    data: {
      name?: string;
      description?: string;
      content?: string;
      enabled?: boolean;
    },
  ): Promise<boolean> => ipcRenderer.invoke("host:update-group", id, data),
  deleteGroup: (id: string): Promise<boolean> =>
    ipcRenderer.invoke("host:delete-group", id),
  toggleGroup: (id: string): Promise<boolean> =>
    ipcRenderer.invoke("host:toggle-group", id),

  // 应用配置
  applyHosts: (): Promise<void> => ipcRenderer.invoke("host:apply"),

  // 内容解析
  parseHosts: (content: string): Promise<HostEntry[]> =>
    ipcRenderer.invoke("host:parse", content),
  formatHosts: (entries: HostEntry[]): Promise<string> =>
    ipcRenderer.invoke("host:format", entries),

  // 历史记录
  getHistory: (groupId: string): Promise<any[]> =>
    ipcRenderer.invoke("host:get-history", groupId),

  // 备份管理
  createBackup: (): Promise<BackupInfo> =>
    ipcRenderer.invoke("host:create-backup"),
  getBackups: (): Promise<BackupInfo[]> =>
    ipcRenderer.invoke("host:get-backups"),
  restoreBackup: (backupId: string): Promise<void> =>
    ipcRenderer.invoke("host:restore-backup", backupId),

  // 导入导出
  exportGroup: (groupId: string): Promise<string> =>
    ipcRenderer.invoke("host:export-group", groupId),
  importGroup: (configJson: string): Promise<string> =>
    ipcRenderer.invoke("host:import-group", configJson),

  // 数据管理
  getDataInfo: (): Promise<DataInfo> =>
    ipcRenderer.invoke("host:get-data-info"),
  cleanBackups: (keepDays?: number): Promise<number> =>
    ipcRenderer.invoke("host:clean-backups", keepDays),
  openDataDirectory: (): Promise<void> =>
    ipcRenderer.invoke("host:open-data-directory"),

  // 设置相关
  loadSettings: (): Promise<any> => ipcRenderer.invoke("settings:load"),
  saveSettings: (settings: any): Promise<void> =>
    ipcRenderer.invoke("settings:save", settings),

  // 文件导入导出相关
  importHostsFile: (filePath: string): Promise<boolean> =>
    ipcRenderer.invoke("host:import-hosts-file", filePath),
  importSwitchHostsFile: (filePath: string): Promise<boolean> =>
    ipcRenderer.invoke("host:import-switchhosts-file", filePath),
  parseHostsGroups: (
    content: string,
  ): Promise<Array<{ name: string; content: string; enabled: boolean }>> =>
    ipcRenderer.invoke("host:parse-hosts-groups", content),
  parseSwitchHostsGroups: (
    content: string,
  ): Promise<Array<{ name: string; content: string; enabled: boolean }>> =>
    ipcRenderer.invoke("host:parse-switchhosts-groups", content),
  generateSwitchHostsContent: (): Promise<string> =>
    ipcRenderer.invoke("host:generate-switchhosts-content"),
  generateHostGeniusContent: (): Promise<string> =>
    ipcRenderer.invoke("host:generate-hostgenius-content"),

  // 环境信息
  getPlatform: (): Promise<string> => ipcRenderer.invoke("app:get-platform"),
  isDevelopment: (): Promise<boolean> =>
    ipcRenderer.invoke("app:is-development"),
  getVersion: (): Promise<string> => ipcRenderer.invoke("app:get-version"),
};

contextBridge.exposeInMainWorld("electronAPI", electronAPI);

declare global {
  interface Window {
    electronAPI: typeof electronAPI;
  }
}
