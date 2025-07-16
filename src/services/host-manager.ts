import fs from "fs-extra";
import path from "path";
import os from "os";
import { exec } from "child_process";
import { promisify } from "util";
import { databaseService, HostGroup, HostEntry } from "./database";
import log from "electron-log/main";

const execAsync = promisify(exec);

export interface BackupInfo {
  id: string;
  filePath: string;
  createdAt: string;
  size: number;
}

export interface AdminAuthResult {
  success: boolean;
  message?: string;
}

export class HostManagerService {
  private hostFilePath: string;
  private backupDir: string;
  private dataDir: string;
  private validatedPassword: string | null = null;
  private passwordValidTime: number = 0;
  private readonly PASSWORD_VALID_DURATION = 5 * 60 * 1000; // 5分钟有效期

  constructor() {
    this.hostFilePath = this.getSystemHostsPath();

    // 获取用户家目录下的.HostGenius目录
    const homeDir = os.homedir();
    this.dataDir = path.join(homeDir, ".HostGenius");
    this.backupDir = path.join(this.dataDir, "backups");

    // 确保数据目录和备份目录存在
    fs.ensureDirSync(this.dataDir);
    fs.ensureDirSync(this.backupDir);
  }

  private getSystemHostsPath(): string {
    switch (process.platform) {
      case "win32":
        return path.join(
          process.env.WINDIR || "C:\\Windows",
          "System32",
          "drivers",
          "etc",
          "hosts",
        );
      case "darwin":
      case "linux":
      default:
        return "/etc/hosts";
    }
  }

  // 验证管理员密码
  async validateAdminPassword(password: string): Promise<AdminAuthResult> {
    log.info("Validating admin password");
    if (process.platform === "win32") {
      return await this.validateWindowsPassword(password);
    } else {
      log.info("valid");
      return await this.validateUnixPassword(password);
    }
  }

  private async validateWindowsPassword(
    password: string,
  ): Promise<AdminAuthResult> {
    try {
      // Windows: 使用PowerShell验证当前用户是否为管理员
      const { stdout } = await execAsync(
        'powershell -Command "([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)"',
      );

      if (stdout.trim() === "True") {
        this.validatedPassword = password;
        this.passwordValidTime = Date.now();
        return { success: true, message: "管理员权限验证成功" };
      } else {
        return { success: false, message: "当前用户不具备管理员权限" };
      }
    } catch (error) {
      log.error("Windows admin validation failed:", error);
      return { success: false, message: "权限验证失败" };
    }
  }

  private async validateUnixPassword(
    password: string,
  ): Promise<AdminAuthResult> {
    try {
      // Unix: 使用sudo -S验证密码
      const child = exec("sudo -S whoami", { timeout: 10000 });

      return new Promise((resolve) => {
        let output = "";
        let errorOutput = "";

        child.stdout?.on("data", (data) => {
          output += data.toString();
        });

        child.stderr?.on("data", (data) => {
          errorOutput += data.toString();
          // 如果检测到密码提示，发送密码
          if (
            data.toString().includes("Password:") ||
            data.toString().includes("password")
          ) {
            child.stdin?.write(password + "\n");
          }
        });

        child.on("close", (code) => {
          if (code === 0 && output.includes("root")) {
            this.validatedPassword = password;
            this.passwordValidTime = Date.now();
            resolve({ success: true, message: "管理员权限验证成功" });
          } else {
            resolve({ success: false, message: "密码错误或权限不足" });
          }
        });

        child.on("error", (error) => {
          log.error("Unix admin validation failed:", error);
          resolve({ success: false, message: "权限验证失败" });
        });

        // 发送密码
        child.stdin?.write(password + "\n");
      });
    } catch (error) {
      log.error("Unix admin validation failed:", error);
      return { success: false, message: "权限验证失败" };
    }
  }

  // 检查密码是否仍然有效
  private isPasswordValid(): boolean {
    if (!this.validatedPassword) return false;

    const now = Date.now();
    return now - this.passwordValidTime < this.PASSWORD_VALID_DURATION;
  }

  // 清除已验证的密码
  clearValidatedPassword(): void {
    this.validatedPassword = null;
    this.passwordValidTime = 0;
  }

  // 检查是否有管理员权限
  async checkPermissions(): Promise<boolean> {
    let result = false
    try {
      await fs.access(this.hostFilePath, fs.constants.R_OK | fs.constants.W_OK);
      result = true;
    } catch (err) {
      log.error(err)
    }
    log.info("Checking permissions for hosts file:", this.hostFilePath,result);
    return result;
  }

  // 请求管理员权限 - 已废弃，改用UI方式
  async requestAdminPermissions(): Promise<boolean> {
    log.warn(
      "requestAdminPermissions is deprecated, use validateAdminPassword instead",
    );
    return false;
  }

  // 读取系统hosts文件
  async readSystemHosts(): Promise<string> {
    try {
      const content = await fs.readFile(this.hostFilePath, "utf-8");

      // 更新数据库中的系统hosts
      const systemGroup = databaseService.getGroupByName("系统Hosts");
      if (systemGroup && systemGroup.content !== content) {
        databaseService.updateGroup(systemGroup.id, { content });
      }
      log.info("host:",content);

      return content;
    } catch (error) {
      console.error("读取系统hosts文件失败:", error);
      throw new Error("无法读取系统hosts文件，请检查权限");
    }
  }

  // 备份当前hosts文件
  async createBackup(): Promise<BackupInfo> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupId = `backup_${timestamp}`;
    const backupPath = path.join(this.backupDir, `hosts_${timestamp}.txt`);

    try {
      await fs.copyFile(this.hostFilePath, backupPath);
      const stats = await fs.stat(backupPath);

      return {
        id: backupId,
        filePath: backupPath,
        createdAt: new Date().toISOString(),
        size: stats.size,
      };
    } catch (error) {
      console.error("创建备份失败:", error);
      throw new Error("创建备份失败");
    }
  }

  // 写入系统hosts文件
  async writeSystemHosts(content: string): Promise<void> {
    try {
      // 先创建备份
      await this.createBackup();

      // 写入新内容
      if (process.platform === "win32") {
        await this.writeHostsWindows(content);
      } else {
        await this.writeHostsUnix(content);
      }

      // 刷新DNS缓存
      await this.flushDNS();

      console.log("系统hosts文件更新成功");
    } catch (error) {
      console.error("写入系统hosts文件失败:", error);
      throw new Error("写入hosts文件失败，请检查管理员权限");
    }
  }

  private async writeHostsWindows(content: string): Promise<void> {
    if (!this.isPasswordValid()) {
      throw new Error("管理员权限已过期，请重新验证");
    }

    // Windows 需要特殊处理权限
    const tempFile = path.join(
      process.env.TEMP || "C:\\temp",
      "hosts_temp.txt",
    );
    await fs.writeFile(tempFile, content, "utf-8");

    try {
      // 使用RunAs以管理员权限执行
      await execAsync(
        `powershell -Command "Start-Process copy -ArgumentList '\\"${tempFile}\\" \\"${this.hostFilePath}\\"' -Verb RunAs -Wait"`,
      );
    } finally {
      await fs.remove(tempFile);
    }
  }

  private async writeHostsUnix(content: string): Promise<void> {
    if (!this.isPasswordValid()) {
      throw new Error("管理员权限已过期，请重新验证");
    }

    // Unix 系统使用已验证的密码
    const tempFile = "/tmp/hosts_temp.txt";
    await fs.writeFile(tempFile, content, "utf-8");

    try {
      const child = exec(`sudo -S cp "${tempFile}" "${this.hostFilePath}"`);

      return new Promise((resolve, reject) => {
        child.stderr?.on("data", (data) => {
          if (
            data.toString().includes("Password:") ||
            data.toString().includes("password")
          ) {
            child.stdin?.write(this.validatedPassword + "\n");
          }
        });

        child.on("close", (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error("写入hosts文件失败"));
          }
        });

        child.on("error", (error) => {
          reject(error);
        });

        // 发送密码
        child.stdin?.write(this.validatedPassword + "\n");
      });
    } finally {
      await fs.remove(tempFile);
    }
  }

  // 刷新DNS缓存
  private async flushDNS(): Promise<void> {
    try {
      switch (process.platform) {
        case "win32":
          await execAsync("ipconfig /flushdns");
          break;
        case "darwin":
          await execAsync("sudo dscacheutil -flushcache");
          break;
        case "linux":
          await execAsync("sudo systemctl restart systemd-resolved");
          break;
      }
    } catch (error) {
      console.warn("刷新DNS缓存失败:", error);
      // 不抛出错误，因为这不是关键操作
    }
  }

  // 应用所有启用的分组到系统hosts
  async applyHosts(): Promise<void> {
    const mergedContent = databaseService.getMergedHosts();
    await this.writeSystemHosts(mergedContent);
  }

  // 获取所有分组
  getAllGroups(): HostGroup[] {
    return databaseService.getAllGroups();
  }

  // 创建新分组
  createGroup(data: {
    name: string;
    description?: string;
    content?: string;
    enabled?: boolean;
  }): string {
    return databaseService.createGroup({
      name: data.name,
      description: data.description,
      content: data.content || "",
      enabled: data.enabled ?? true,
      isSystem: false,
    });
  }

  // 更新分组
  updateGroup(
    id: string,
    data: {
      name?: string;
      description?: string;
      content?: string;
      enabled?: boolean;
    },
  ): boolean {
    return databaseService.updateGroup(id, data);
  }

  // 删除分组
  deleteGroup(id: string): boolean {
    return databaseService.deleteGroup(id);
  }

  // 切换分组启用状态
  toggleGroup(id: string): boolean {
    const group = databaseService.getGroupById(id);
    if (!group) return false;

    return databaseService.updateGroup(id, { enabled: !group.enabled });
  }

  // 解析hosts内容
  parseHosts(content: string): HostEntry[] {
    return databaseService.parseHostsContent(content);
  }

  // 格式化hosts内容
  formatHosts(entries: HostEntry[]): string {
    return databaseService.formatHostsContent(entries);
  }

  // 获取分组历史
  getGroupHistory(groupId: string): any[] {
    return databaseService.getHistory(groupId);
  }

  // 获取备份列表
  async getBackups(): Promise<BackupInfo[]> {
    try {
      const files = await fs.readdir(this.backupDir);
      const backups: BackupInfo[] = [];

      for (const file of files) {
        if (file.startsWith("hosts_") && file.endsWith(".txt")) {
          const filePath = path.join(this.backupDir, file);
          const stats = await fs.stat(filePath);
          const match = file.match(/hosts_(.+)\.txt/);

          if (match) {
            backups.push({
              id: `backup_${match[1]}`,
              filePath,
              createdAt: stats.birthtime.toISOString(),
              size: stats.size,
            });
          }
        }
      }

      return backups.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    } catch (error) {
      console.error("获取备份列表失败:", error);
      return [];
    }
  }

  // 从备份恢复
  async restoreFromBackup(backupId: string): Promise<void> {
    const backups = await this.getBackups();
    const backup = backups.find((b) => b.id === backupId);

    if (!backup) {
      throw new Error("备份文件不存在");
    }

    try {
      const content = await fs.readFile(backup.filePath, "utf-8");
      await this.writeSystemHosts(content);
    } catch (error) {
      console.error("从备份恢复失败:", error);
      throw new Error("从备份恢复失败");
    }
  }

  // 导出分组配置
  async exportGroup(groupId: string): Promise<string> {
    const group = databaseService.getGroupById(groupId);
    if (!group) {
      throw new Error("分组不存在");
    }

    return JSON.stringify(
      {
        name: group.name,
        description: group.description,
        content: group.content,
        version: group.version,
        exportedAt: new Date().toISOString(),
      },
      null,
      2,
    );
  }

  // 导入分组配置
  importGroup(configJson: string): string {
    try {
      const config = JSON.parse(configJson);
      return this.createGroup({
        name: config.name,
        description: config.description,
        content: config.content,
        enabled: false, // 导入的分组默认禁用
      });
    } catch (error) {
      throw new Error("配置格式错误");
    }
  }

  // 获取数据目录路径
  getDataDirectory(): string {
    return this.dataDir;
  }

  // 获取备份目录路径
  getBackupDirectory(): string {
    return this.backupDir;
  }

  // 清理旧备份文件
  async cleanOldBackups(keepDays: number = 30): Promise<number> {
    try {
      const files = await fs.readdir(this.backupDir);
      const cutoffTime = Date.now() - keepDays * 24 * 60 * 60 * 1000;
      let deletedCount = 0;

      for (const file of files) {
        if (file.startsWith("hosts_") && file.endsWith(".txt")) {
          const filePath = path.join(this.backupDir, file);
          const stats = await fs.stat(filePath);

          if (stats.birthtime.getTime() < cutoffTime) {
            await fs.remove(filePath);
            deletedCount++;
          }
        }
      }

      return deletedCount;
    } catch (error) {
      console.error("清理备份文件失败:", error);
      return 0;
    }
  }

  // 获取数据大小
  async getDataSize(): Promise<{
    total: number;
    database: number;
    backups: number;
  }> {
    try {
      const getDirectorySize = async (dirPath: string): Promise<number> => {
        let size = 0;
        const files = await fs.readdir(dirPath, { withFileTypes: true });

        for (const file of files) {
          const filePath = path.join(dirPath, file.name);
          if (file.isDirectory()) {
            size += await getDirectorySize(filePath);
          } else {
            const stats = await fs.stat(filePath);
            size += stats.size;
          }
        }

        return size;
      };

      const totalSize = await getDirectorySize(this.dataDir);
      const dbStats = await fs.stat(databaseService.getDatabasePath());
      const backupsSize = await getDirectorySize(this.backupDir);

      return {
        total: totalSize,
        database: dbStats.size,
        backups: backupsSize,
      };
    } catch (error) {
      console.error("获取数据大小失败:", error);
      return { total: 0, database: 0, backups: 0 };
    }
  }

  // 导出应用数据
  async exportAppData(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const exportPath = path.join(
      os.tmpdir(),
      `HostGenius-backup-${timestamp}.zip`,
    );

    try {
      // 这里需要添加压缩逻辑，可以使用 archiver 或 node-stream-zip
      // 暂时返回数据目录路径
      return this.dataDir;
    } catch (error) {
      console.error("导出应用数据失败:", error);
      throw new Error("导出应用数据失败");
    }
  }

  // 导入应用数据
  async importAppData(zipPath: string): Promise<void> {
    try {
      // 这里需要添加解压逻辑
      // 暂时抛出未实现错误
      throw new Error("导入功能暂未实现");
    } catch (error) {
      console.error("导入应用数据失败:", error);
      throw new Error("导入应用数据失败");
    }
  }
}

export const hostManagerService = new HostManagerService();
