import fs from "fs-extra";
import path from "path";
import os from "os";
import { databaseService, HostGroup, HostEntry } from "./database";
import log from "electron-log/main";
import sudo from "sudo-prompt";

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
  private sudoOptions: any;

  constructor() {
    this.hostFilePath = this.getSystemHostsPath();

    // 获取用户家目录下的.HostGenius目录
    const homeDir = os.homedir();
    this.dataDir = path.join(homeDir, ".HostGenius");
    this.backupDir = path.join(this.dataDir, "backups");

    // 确保数据目录和备份目录存在
    fs.ensureDirSync(this.dataDir);
    fs.ensureDirSync(this.backupDir);

    // 配置 sudo-prompt 选项
    this.sudoOptions = {
      name: "Host Genius",
    };

    // 初始化系统hosts内容
    this.initSystemHostsGroup();
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

  // 使用 sudo-prompt 执行命令的辅助方法
  private async execWithSudo(command: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      sudo.exec(
        command.join(" "),
        this.sudoOptions,
        (error, stdout, stderr) => {
          if (error) {
            log.error("Sudo exec error:", error);
            reject(error);
          } else {
            resolve(stdout?.toString() || "");
          }
        },
      );
    });
  }

  // 直接读取文件，无需sudo权限
  private async readFileWithSudo(filePath: string): Promise<string> {
    try {
      return await fs.readFile(filePath, "utf-8");
    } catch (error) {
      log.error("Failed to read file:", error);
      throw new Error("无法读取文件，请检查文件路径和权限");
    }
  }

  // 使用 sudo-prompt 写入文件并刷新DNS
  private async writeFileWithSudo(
    filePath: string,
    content: string,
  ): Promise<void> {
    try {
      let tempFile: string;
      let commands: string[] = [];

      if (process.platform === "win32") {
        // Windows 处理
        tempFile = path.join(process.env.TEMP || "C:\\temp", "hosts_temp.txt");
        await fs.writeFile(tempFile, content, "utf-8");
        commands = [
          `powershell -Command "Copy-Item -Path '${tempFile}' -Destination '${filePath}' -Force"`,
          "ipconfig /flushdns",
        ];
      } else {
        // macOS 和 Linux 处理
        tempFile = "/tmp/hosts_temp.txt";
        await fs.writeFile(tempFile, content, "utf-8");

        if (process.platform === "darwin") {
          commands = [
            `cp "${tempFile}" "${filePath}"`,
            "dscacheutil -flushcache",
          ];
        } else {
          // Linux
          commands = [
            `cp "${tempFile}" "${filePath}"`,
            "systemctl restart systemd-resolved",
          ];
        }
      }

      // 合并所有命令，一次性执行
      const combinedCommand = commands.join(" && ");
      await this.execWithSudo([combinedCommand]);

      // 清理临时文件
      await fs.remove(tempFile);

      log.info("系统hosts文件更新和DNS缓存刷新成功");
    } catch (error) {
      log.error("Failed to write file with sudo:", error);
      throw new Error("无法写入文件，请确认管理员权限");
    }
  }

  /**
   * 初始化系统hosts分组内容
   */
  private async initSystemHostsGroup(): Promise<void> {
    try {
      const systemHostsContent = await this.readAndParseSystemHosts();
      const systemGroup = databaseService.getGroupByName("系统Hosts");

      if (systemGroup && systemHostsContent !== systemGroup.content) {
        databaseService.updateGroup(systemGroup.id, {
          content: systemHostsContent,
        });
      }
    } catch (error) {
      log.warn("初始化系统hosts分组失败:", error);
    }
  }

  /**
   * 读取并解析系统hosts文件内容
   */
  private async readAndParseSystemHosts(): Promise<string> {
    try {
      if (!fs.existsSync(this.hostFilePath)) {
        return "";
      }

      const content = await fs.readFile(this.hostFilePath, "utf8");
      return this.parseSystemHostsContent(content);
    } catch (error) {
      log.warn("Failed to read system hosts file:", error);
      return "";
    }
  }

  /**
   * 解析系统hosts内容，提取基础配置（排除SwitchHosts和HostGenius管理的部分）
   */
  public parseSystemHostsContent(content: string): string {
    const lines = content.split("\n");
    const systemLines: string[] = [];
    let inManagedSection = false;

    for (const line of lines) {
      const trimmedLine = line.trim();

      // 检测管理工具内容开始标记（支持SwitchHosts和HostGenius）
      if (
        trimmedLine.includes("SWITCHHOSTS_CONTENT_START") ||
        trimmedLine.includes("HOSTGENIUS_CONTENT_START")
      ) {
        inManagedSection = true;
        continue;
      }

      // 检测管理工具内容结束标记
      if (
        trimmedLine.includes("SWITCHHOSTS_CONTENT_END") ||
        trimmedLine.includes("HOSTGENIUS_CONTENT_END")
      ) {
        inManagedSection = false;
        continue;
      }

      // 如果不在管理工具的区域内，保留该行
      if (!inManagedSection) {
        systemLines.push(line);
      }
    }

    return systemLines.join("\n").trim();
  }

  /**
   * 从SwitchHosts或HostGenius格式的hosts文件中提取分组
   */
  parseHostsGroups(
    content: string,
  ): Array<{ name: string; content: string; enabled: boolean }> {
    const groups: Array<{ name: string; content: string; enabled: boolean }> =
      [];
    const lines = content.split("\n");

    let currentGroup: {
      name: string;
      content: string[];
      enabled: boolean;
    } | null = null;
    let inManagedSection = false;
    let managedSectionType: "switchhosts" | "hostgenius" | null = null;

    for (const line of lines) {
      const trimmedLine = line.trim();

      // 检测管理工具内容开始
      if (trimmedLine.includes("SWITCHHOSTS_CONTENT_START")) {
        inManagedSection = true;
        managedSectionType = "switchhosts";
        continue;
      }
      if (trimmedLine.includes("HOSTGENIUS_CONTENT_START")) {
        inManagedSection = true;
        managedSectionType = "hostgenius";
        continue;
      }

      // 检测管理工具内容结束
      if (
        trimmedLine.includes("SWITCHHOSTS_CONTENT_END") ||
        trimmedLine.includes("HOSTGENIUS_CONTENT_END")
      ) {
        if (currentGroup) {
          groups.push({
            name: currentGroup.name,
            content: currentGroup.content.join("\n").trim(),
            enabled: currentGroup.enabled,
          });
        }
        inManagedSection = false;
        managedSectionType = null;
        break;
      }

      if (!inManagedSection) continue;

      // 检测分组标记
      if (trimmedLine.startsWith("#") && trimmedLine.includes("---")) {
        // 保存上一个分组
        if (currentGroup) {
          groups.push({
            name: currentGroup.name,
            content: currentGroup.content.join("\n").trim(),
            enabled: currentGroup.enabled,
          });
        }

        // 解析分组名称和状态
        let groupName = trimmedLine.replace(/[#\-\s]/g, "").trim();
        let enabled = true;

        // HostGenius格式支持更详细的状态标记
        if (managedSectionType === "hostgenius") {
          const statusMatch = trimmedLine.match(
            /\[(disabled|off|enabled|on)\]/i,
          );
          if (statusMatch) {
            enabled = !["disabled", "off"].includes(
              statusMatch[1].toLowerCase(),
            );
            groupName = groupName
              .replace(/\[(disabled|off|enabled|on)\]/gi, "")
              .trim();
          }
        } else {
          // SwitchHosts格式
          enabled =
            !trimmedLine.includes("[disabled]") &&
            !trimmedLine.includes("[off]");
        }

        if (!groupName) {
          groupName = `分组${groups.length + 1}`;
        }

        currentGroup = {
          name: groupName,
          content: [],
          enabled,
        };
      } else if (currentGroup) {
        // 添加到当前分组
        currentGroup.content.push(line);
      } else if (trimmedLine && !trimmedLine.startsWith("#")) {
        // 没有明确分组标记的内容，创建默认分组
        if (!currentGroup) {
          const defaultName =
            managedSectionType === "hostgenius"
              ? "HostGenius导入"
              : "SwitchHosts导入";
          currentGroup = {
            name: defaultName,
            content: [],
            enabled: true,
          };
        }
        currentGroup.content.push(line);
      }
    }

    // 处理最后一个分组
    if (currentGroup) {
      groups.push({
        name: currentGroup.name,
        content: currentGroup.content.join("\n").trim(),
        enabled: currentGroup.enabled,
      });
    }

    return groups.filter((group) => group.content.trim());
  }

  /**
   * 导入SwitchHosts或HostGenius格式的配置文件
   */
  async importHostsConfig(filePath: string): Promise<boolean> {
    try {
      if (!fs.existsSync(filePath)) {
        return false;
      }

      const content = await fs.readFile(filePath, "utf8");
      const groups = this.parseHostsGroups(content);

      for (const group of groups) {
        // 检查是否已存在同名分组
        const existingGroup = databaseService.getGroupByName(group.name);
        if (existingGroup && !existingGroup.isSystem) {
          // 更新现有分组
          databaseService.updateGroup(existingGroup.id, {
            content: group.content,
            enabled: group.enabled,
          });
        } else if (!existingGroup) {
          // 创建新分组
          databaseService.createGroup({
            name: group.name,
            description: `从配置文件导入的hosts规则`,
            content: group.content,
            enabled: group.enabled,
            isSystem: false,
          });
        }
      }

      return true;
    } catch (error) {
      log.error("Failed to import hosts config:", error);
      return false;
    }
  }

  /**
   * 生成兼容SwitchHosts格式的hosts文件内容
   */
  generateSwitchHostsCompatibleContent(): string {
    const systemGroup = databaseService.getGroupByName("系统Hosts");
    const otherGroups = databaseService
      .getAllGroups()
      .filter((g) => !g.isSystem && g.enabled);

    const sections: string[] = [];

    // 添加系统基础配置
    if (systemGroup && systemGroup.content.trim()) {
      sections.push(systemGroup.content.trim());
    }

    // 添加SwitchHosts兼容的分组内容
    if (otherGroups.length > 0) {
      sections.push("# --- SWITCHHOSTS_CONTENT_START ---");

      for (const group of otherGroups) {
        if (group.content.trim()) {
          const statusSuffix = group.enabled ? "" : " [disabled]";
          sections.push(`# --- ${group.name}${statusSuffix} ---`);
          sections.push(group.content.trim());
          sections.push("");
        }
      }

      sections.push("# --- SWITCHHOSTS_CONTENT_END ---");
    }

    return sections.join("\n\n");
  }

  /**
   * 生成HostGenius专有格式的hosts文件内容
   */
  generateHostGeniusContent(): string {
    const systemGroup = databaseService.getGroupByName("系统Hosts");
    const otherGroups = databaseService
      .getAllGroups()
      .filter((g) => !g.isSystem && g.enabled); // 只包含启用的分组

    const sections: string[] = [];

    // 添加系统基础配置
    if (systemGroup && systemGroup.content.trim()) {
      sections.push(systemGroup.content.trim());
    }

    // 添加HostGenius格式的分组内容
    if (otherGroups.length > 0) {
      sections.push("# --- HOSTGENIUS_CONTENT_START ---");

      for (const group of otherGroups) {
        if (group.content.trim()) {
          const statusSuffix = " [enabled]"; // 由于已经过滤了启用的分组，这里都是enabled
          sections.push(`# --- ${group.name}${statusSuffix} ---`);
          if (group.description) {
            sections.push(`# Description: ${group.description}`);
          }
          sections.push(group.content.trim());
          sections.push("");
        }
      }

      sections.push("# --- HOSTGENIUS_CONTENT_END ---");
    }

    return sections.join("\n\n");
  }

  // 读取系统hosts文件
  async readSystemHosts(): Promise<string> {
    try {
      // 直接读取hosts文件，通常读取不需要管理员权限
      const content = await fs.readFile(this.hostFilePath, "utf-8");

      // 更新数据库中的系统hosts
      const systemHostsContent = this.parseSystemHostsContent(content);
      const systemGroup = databaseService.getGroupByName("系统Hosts");
      if (systemGroup && systemGroup.content !== systemHostsContent) {
        databaseService.updateGroup(systemGroup.id, {
          content: systemHostsContent,
        });
      }

      log.info("Successfully read hosts file, length:", content.length);
      return content;
    } catch (error) {
      log.error("Failed to read system hosts file:", error);
      throw new Error("无法读取系统hosts文件，请检查权限");
    }
  }

  // 读取原始系统hosts文件（完整内容，不进行任何解析）
  async readRawSystemHosts(): Promise<string> {
    try {
      if (!fs.existsSync(this.hostFilePath)) {
        return "";
      }

      const content = await fs.readFile(this.hostFilePath, "utf-8");
      log.info("Successfully read raw hosts file, length:", content.length);
      return content;
    } catch (error) {
      log.error("Failed to read raw system hosts file:", error);
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

      // 写入新内容并刷新DNS（合并操作）
      await this.writeFileWithSudo(this.hostFilePath, content);

      log.info("系统hosts文件更新成功");
    } catch (error) {
      log.error("写入系统hosts文件失败:", error);
      throw new Error("写入hosts文件失败，请检查管理员权限");
    }
  }

  // 应用所有启用的分组到系统hosts
  async applyHosts(): Promise<void> {
    const mergedContent = this.generateHostGeniusContent();
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
  async updateGroup(
    id: string,
    data: {
      name?: string;
      description?: string;
      content?: string;
      enabled?: boolean;
    },
  ): Promise<boolean> {
    let result = false;
    databaseService.updateGroup(id, data);

    try {
      await this.applyHosts();
      result = true;
    } catch (error) {
      log.error("应用分组更新到系统hosts失败:", error);
    }
    return result;
  }

  // 删除分组
  async deleteGroup(id: string): Promise<boolean> {
    const success = databaseService.deleteGroup(id);

    if (success) {
      try {
        // 删除分组后重新应用hosts配置
        await this.applyHosts();
      } catch (error) {
        log.error("删除分组后应用hosts配置失败:", error);
        // 即使应用失败，分组删除操作已经成功
      }
    }

    return success;
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

  /**
   * 从SwitchHosts或HostGenius格式的hosts文件中提取分组
   */
  parseSwitchHostsGroups(
    content: string,
  ): Array<{ name: string; content: string; enabled: boolean }> {
    const groups: Array<{ name: string; content: string; enabled: boolean }> =
      [];
    const lines = content.split("\n");

    let currentGroup: {
      name: string;
      content: string[];
      enabled: boolean;
    } | null = null;
    let inManagedSection = false;
    let managedSectionType: "switchhosts" | "hostgenius" | null = null;

    for (const line of lines) {
      const trimmedLine = line.trim();

      // 检测管理工具内容开始
      if (trimmedLine.includes("SWITCHHOSTS_CONTENT_START")) {
        inManagedSection = true;
        managedSectionType = "switchhosts";
        continue;
      }
      if (trimmedLine.includes("HOSTGENIUS_CONTENT_START")) {
        inManagedSection = true;
        managedSectionType = "hostgenius";
        continue;
      }

      // 检测管理工具内容结束
      if (
        trimmedLine.includes("SWITCHHOSTS_CONTENT_END") ||
        trimmedLine.includes("HOSTGENIUS_CONTENT_END")
      ) {
        if (currentGroup) {
          groups.push({
            name: currentGroup.name,
            content: currentGroup.content.join("\n").trim(),
            enabled: currentGroup.enabled,
          });
        }
        inManagedSection = false;
        managedSectionType = null;
        break;
      }

      if (!inManagedSection) continue;

      // 检测分组标记
      if (trimmedLine.startsWith("#") && trimmedLine.includes("---")) {
        // 保存上一个分组
        if (currentGroup) {
          groups.push({
            name: currentGroup.name,
            content: currentGroup.content.join("\n").trim(),
            enabled: currentGroup.enabled,
          });
        }

        // 解析分组名称和状态
        let groupName = trimmedLine.replace(/[#\-\s]/g, "").trim();
        let enabled = true;

        // HostGenius格式支持更详细的状态标记
        if (managedSectionType === "hostgenius") {
          const statusMatch = trimmedLine.match(
            /\[(disabled|off|enabled|on)\]/i,
          );
          if (statusMatch) {
            enabled = !["disabled", "off"].includes(
              statusMatch[1].toLowerCase(),
            );
            groupName = groupName
              .replace(/\[(disabled|off|enabled|on)\]/gi, "")
              .trim();
          }
        } else {
          // SwitchHosts格式
          enabled =
            !trimmedLine.includes("[disabled]") &&
            !trimmedLine.includes("[off]");
        }

        if (!groupName) {
          groupName = `分组${groups.length + 1}`;
        }

        currentGroup = {
          name: groupName,
          content: [],
          enabled,
        };
      } else if (currentGroup) {
        // 添加到当前分组
        currentGroup.content.push(line);
      } else if (trimmedLine && !trimmedLine.startsWith("#")) {
        // 没有明确分组标记的内容，创建默认分组
        if (!currentGroup) {
          const defaultName =
            managedSectionType === "hostgenius"
              ? "HostGenius导入"
              : "SwitchHosts导入";
          currentGroup = {
            name: defaultName,
            content: [],
            enabled: true,
          };
        }
        currentGroup.content.push(line);
      }
    }

    // 处理最后一个分组
    if (currentGroup) {
      groups.push({
        name: currentGroup.name,
        content: currentGroup.content.join("\n").trim(),
        enabled: currentGroup.enabled,
      });
    }

    return groups.filter((group) => group.content.trim());
  }

  /**
   * 导入SwitchHosts或HostGenius格式的配置文件（同步版本）
   */
  importSwitchHostsConfig(filePath: string): boolean {
    try {
      if (!fs.existsSync(filePath)) {
        return false;
      }

      const content = fs.readFileSync(filePath, "utf8");
      const groups = this.parseSwitchHostsGroups(content);

      for (const group of groups) {
        // 检查是否已存在同名分组
        const existingGroup = databaseService.getGroupByName(group.name);
        if (existingGroup && !existingGroup.isSystem) {
          // 更新现有分组
          databaseService.updateGroup(existingGroup.id, {
            content: group.content,
            enabled: group.enabled,
          });
        } else if (!existingGroup) {
          // 创建新分组
          databaseService.createGroup({
            name: group.name,
            description: `从配置文件导入的hosts规则`,
            content: group.content,
            enabled: group.enabled,
            isSystem: false,
          });
        }
      }

      return true;
    } catch (error) {
      log.error("Failed to import hosts config:", error);
      return false;
    }
  }
}

export const hostManagerService = new HostManagerService();
