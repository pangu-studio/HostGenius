import { ipcMain, IpcMainInvokeEvent, shell } from "electron";
import { hostManagerService } from "../../services/host-manager";
import { databaseService } from "@/services/database";

export function registerHostListeners() {
  // 检查权限
  // ipcMain.handle("host:check-permissions", async (): Promise<boolean> => {
  //   return await hostManagerService.checkPermissions();
  // });

  // // 请求管理员权限
  // ipcMain.handle("host:request-admin", async (): Promise<boolean> => {
  //   console.log("请求管理员权限");
  //   return await hostManagerService.requestAdminPermissions();
  // });

  // // 验证管理员密码
  // ipcMain.handle(
  //   "host:validate-admin-password",
  //   async (event: IpcMainInvokeEvent, password: string) => {
  //     return await hostManagerService.validateAdminPassword(password);
  //   },
  // );

  // // 清除管理员密码
  // ipcMain.handle("host:clear-admin-password", async (): Promise<void> => {
  //   hostManagerService.clearValidatedPassword();
  // });

  // 读取系统hosts文件
  ipcMain.handle("host:read-system", async (): Promise<string> => {
    return await hostManagerService.readSystemHosts();
  });

  // 读取原始系统hosts文件（完整内容，未经解析）
  ipcMain.handle("host:read-raw-system", async (): Promise<string> => {
    return await hostManagerService.readRawSystemHosts();
  });

  // 获取所有分组
  ipcMain.handle("host:get-groups", async () => {
    return hostManagerService.getAllGroups();
  });

  // 创建分组
  ipcMain.handle(
    "host:create-group",
    async (
      event: IpcMainInvokeEvent,
      data: {
        name: string;
        description?: string;
        content?: string;
        enabled?: boolean;
      },
    ): Promise<string> => {
      return hostManagerService.createGroup(data);
    },
  );

  // 更新分组
  ipcMain.handle(
    "host:update-group",
    async (
      event: IpcMainInvokeEvent,
      id: string,
      data: {
        name?: string;
        description?: string;
        content?: string;
        enabled?: boolean;
      },
    ): Promise<boolean> => {
      return hostManagerService.updateGroup(id, data);
    },
  );

  // 删除分组
  ipcMain.handle(
    "host:delete-group",
    async (event: IpcMainInvokeEvent, id: string): Promise<boolean> => {
      return hostManagerService.deleteGroup(id);
    },
  );

  // 切换分组状态
  ipcMain.handle(
    "host:toggle-group",
    async (event: IpcMainInvokeEvent, id: string): Promise<boolean> => {
      return hostManagerService.toggleGroup(id);
    },
  );

  // 应用配置到系统
  ipcMain.handle("host:apply", async (): Promise<void> => {
    return await hostManagerService.applyHosts();
  });

  // 解析hosts内容
  ipcMain.handle(
    "host:parse",
    async (event: IpcMainInvokeEvent, content: string) => {
      return hostManagerService.parseHosts(content);
    },
  );

  // 格式化hosts内容
  ipcMain.handle(
    "host:format",
    async (event: IpcMainInvokeEvent, entries: any[]) => {
      return hostManagerService.formatHosts(entries);
    },
  );

  // 获取分组历史
  ipcMain.handle(
    "host:get-history",
    async (event: IpcMainInvokeEvent, groupId: string) => {
      return hostManagerService.getGroupHistory(groupId);
    },
  );

  // 创建备份
  ipcMain.handle("host:create-backup", async () => {
    return await hostManagerService.createBackup();
  });

  // 获取备份列表
  ipcMain.handle("host:get-backups", async () => {
    return await hostManagerService.getBackups();
  });

  // 从备份恢复
  ipcMain.handle(
    "host:restore-backup",
    async (event: IpcMainInvokeEvent, backupId: string): Promise<void> => {
      return await hostManagerService.restoreFromBackup(backupId);
    },
  );

  // 导出分组
  ipcMain.handle(
    "host:export-group",
    async (event: IpcMainInvokeEvent, groupId: string): Promise<string> => {
      return await hostManagerService.exportGroup(groupId);
    },
  );

  // 导入分组
  ipcMain.handle(
    "host:import-group",
    async (event: IpcMainInvokeEvent, configJson: string): Promise<string> => {
      return hostManagerService.importGroup(configJson);
    },
  );

  // 获取数据目录信息
  ipcMain.handle("host:get-data-info", async () => {
    return {
      dataDirectory: hostManagerService.getDataDirectory(),
      backupDirectory: hostManagerService.getBackupDirectory(),
      databasePath: databaseService.getDatabasePath(),
      dataSize: await hostManagerService.getDataSize(),
    };
  });

  // 清理旧备份
  ipcMain.handle(
    "host:clean-backups",
    async (event: IpcMainInvokeEvent, keepDays?: number): Promise<number> => {
      return await hostManagerService.cleanOldBackups(keepDays);
    },
  );

  // 导出应用数据
  ipcMain.handle("host:export-data", async (): Promise<string> => {
    return await hostManagerService.exportAppData();
  });

  // 导入应用数据
  ipcMain.handle(
    "host:import-data",
    async (event: IpcMainInvokeEvent, zipPath: string): Promise<void> => {
      return await hostManagerService.importAppData(zipPath);
    },
  );

  // 打开数据目录
  ipcMain.handle("host:open-data-directory", async (): Promise<void> => {
    await shell.openPath(hostManagerService.getDataDirectory());
  });

  //
  ipcMain.handle(
    "host:parseSystemHostsContent",
    async (event: IpcMainInvokeEvent, content: string): Promise<string> => {
      return await hostManagerService.parseSystemHostsContent(content);
    },
  );
}
