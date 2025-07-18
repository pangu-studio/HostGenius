import Database from "better-sqlite3";
import path from "path";
import os from "os";
import fs from "fs-extra";

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

export interface HostHistory {
  id: string;
  groupId: string;
  content: string;
  version: number;
  operation: "create" | "update" | "delete" | "merge";
  createdAt: string;
  createdBy?: string;
}

export class DatabaseService {
  private db: Database.Database;
  private dbPath: string;
  private dataDir: string;

  constructor() {
    this.initDatabase();
  }

  private initDatabase() {
    // 获取用户家目录下的.HostGenius目录
    const homeDir = os.homedir();
    this.dataDir = path.join(homeDir, ".HostGenius");

    // 确保数据目录存在
    fs.ensureDirSync(this.dataDir);

    this.dbPath = path.join(this.dataDir, ".data.db");

    // 兼容性处理：如果存在旧的hosts.db文件，重命名为新的.data.db
    const oldDbPath = path.join(this.dataDir, "hosts.db");
    if (fs.existsSync(oldDbPath) && !fs.existsSync(this.dbPath)) {
      try {
        fs.renameSync(oldDbPath, this.dbPath);
        console.log("已将旧数据库文件 hosts.db 重命名为 .data.db");
      } catch (error) {
        console.error("重命名数据库文件失败:", error);
        // 如果重命名失败，使用旧文件路径
        this.dbPath = oldDbPath;
      }
    }

    this.db = new Database(this.dbPath);

    this.createTables();
    this.initDefaultData();
  }

  private createTables() {
    // 主机分组表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS host_groups (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        content TEXT NOT NULL DEFAULT '',
        enabled INTEGER NOT NULL DEFAULT 1,
        is_system INTEGER NOT NULL DEFAULT 0,
        version INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        sync_status TEXT NOT NULL DEFAULT 'local',
        last_sync_at TEXT,
        share_token TEXT,
        created_by TEXT
      )
    `);

    // 历史记录表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS host_history (
        id TEXT PRIMARY KEY,
        group_id TEXT NOT NULL,
        content TEXT NOT NULL,
        version INTEGER NOT NULL,
        operation TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_by TEXT,
        FOREIGN KEY (group_id) REFERENCES host_groups (id) ON DELETE CASCADE
      )
    `);

    // 同步配置表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sync_config (
        id TEXT PRIMARY KEY DEFAULT 'default',
        endpoint TEXT,
        token TEXT,
        user_id TEXT,
        auto_sync INTEGER NOT NULL DEFAULT 0,
        last_sync_at TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建索引
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_host_groups_name ON host_groups(name);
      CREATE INDEX IF NOT EXISTS idx_host_groups_sync_status ON host_groups(sync_status);
      CREATE INDEX IF NOT EXISTS idx_host_history_group_id ON host_history(group_id);
      CREATE INDEX IF NOT EXISTS idx_host_history_created_at ON host_history(created_at);
    `);
  }

  private initDefaultData() {
    const systemGroup = this.getGroupByName("系统Hosts");
    if (!systemGroup) {
      this.createGroup({
        name: "系统Hosts",
        description: "当前系统的hosts文件内容",
        content: "",
        enabled: true,
        isSystem: true,
      });
    }
  }

  // 分组管理
  createGroup(
    data: Omit<
      HostGroup,
      "id" | "version" | "createdAt" | "updatedAt" | "syncStatus"
    >,
  ): string {
    const id = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO host_groups 
      (id, name, description, content, enabled, is_system, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      data.name,
      data.description || null,
      data.content,
      data.enabled ? 1 : 0,
      data.isSystem ? 1 : 0,
      now,
      now,
    );

    this.addHistory(id, data.content, 1, "create");
    return id;
  }

  getAllGroups(): HostGroup[] {
    const stmt = this.db.prepare(`
      SELECT 
        id, name, description, content, enabled, is_system as isSystem,
        version, created_at as createdAt, updated_at as updatedAt,
        sync_status as syncStatus, last_sync_at as lastSyncAt,
        share_token as shareToken, created_by as createdBy
      FROM host_groups 
      ORDER BY is_system DESC, name ASC
    `);

    return stmt.all().map((row) => ({
      ...row,
      enabled: Boolean(row.enabled),
      isSystem: Boolean(row.isSystem),
    }));
  }

  getGroupById(id: string): HostGroup | null {
    const stmt = this.db.prepare(`
      SELECT 
        id, name, description, content, enabled, is_system as isSystem,
        version, created_at as createdAt, updated_at as updatedAt,
        sync_status as syncStatus, last_sync_at as lastSyncAt,
        share_token as shareToken, created_by as createdBy
      FROM host_groups 
      WHERE id = ?
    `);

    const row = stmt.get(id);
    if (!row) return null;

    return {
      ...row,
      enabled: Boolean(row.enabled),
      isSystem: Boolean(row.isSystem),
    };
  }

  getGroupByName(name: string): HostGroup | null {
    const stmt = this.db.prepare(`
      SELECT 
        id, name, description, content, enabled, is_system as isSystem,
        version, created_at as createdAt, updated_at as updatedAt,
        sync_status as syncStatus, last_sync_at as lastSyncAt,
        share_token as shareToken, created_by as createdBy
      FROM host_groups 
      WHERE name = ?
    `);

    const row = stmt.get(name);
    if (!row) return null;

    return {
      ...row,
      enabled: Boolean(row.enabled),
      isSystem: Boolean(row.isSystem),
    };
  }

  updateGroup(
    id: string,
    data: Partial<
      Pick<HostGroup, "name" | "description" | "content" | "enabled">
    >,
  ): boolean {
    const current = this.getGroupById(id);
    if (!current) return false;

    const now = new Date().toISOString();
    const newVersion = current.version + 1;

    const updateFields = [];
    const values = [];

    if (data.name !== undefined) {
      updateFields.push("name = ?");
      values.push(data.name);
    }
    if (data.description !== undefined) {
      updateFields.push("description = ?");
      values.push(data.description);
    }
    if (data.content !== undefined) {
      updateFields.push("content = ?");
      values.push(data.content);
    }
    if (data.enabled !== undefined) {
      updateFields.push("enabled = ?");
      values.push(data.enabled ? 1 : 0);
    }

    if (updateFields.length === 0) return false;

    updateFields.push("version = ?", "updated_at = ?", "sync_status = ?");
    values.push(newVersion, now, "pending");
    values.push(id);

    const stmt = this.db.prepare(`
      UPDATE host_groups 
      SET ${updateFields.join(", ")}
      WHERE id = ?
    `);

    const result = stmt.run(...values);

    if (result.changes > 0 && data.content !== undefined) {
      this.addHistory(id, data.content, newVersion, "update");
    }

    return result.changes > 0;
  }

  deleteGroup(id: string): boolean {
    const group = this.getGroupById(id);
    if (!group || group.isSystem) return false;

    // 使用事务确保数据一致性
    const transaction = this.db.transaction(() => {
      // 先删除相关的历史记录
      const deleteHistoryStmt = this.db.prepare(
        "DELETE FROM host_history WHERE group_id = ?",
      );
      deleteHistoryStmt.run(id);

      // 再删除分组
      const deleteGroupStmt = this.db.prepare(
        "DELETE FROM host_groups WHERE id = ?",
      );
      const result = deleteGroupStmt.run(id);

      if (result.changes > 0) {
        // 记录删除操作到历史（在删除前记录）
        const historyId = `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date().toISOString();

        // 由于分组已删除，我们将删除记录保存到一个特殊的表或者不记录
        // 这里选择不记录删除操作的历史，因为分组已经不存在了
      }

      return result.changes > 0;
    });

    try {
      return transaction();
    } catch (error) {
      console.error("删除分组失败:", error);
      return false;
    }
  }

  // 历史记录管理
  private addHistory(
    groupId: string,
    content: string,
    version: number,
    operation: string,
    createdBy?: string,
  ) {
    const id = `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO host_history (id, group_id, content, version, operation, created_at, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, groupId, content, version, operation, now, createdBy || null);
  }

  getHistory(groupId: string, limit: number = 50): HostHistory[] {
    const stmt = this.db.prepare(`
      SELECT id, group_id as groupId, content, version, operation, 
             created_at as createdAt, created_by as createdBy
      FROM host_history 
      WHERE group_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `);

    return stmt.all(groupId, limit);
  }

  // 获取合并后的hosts内容
  getMergedHosts(): string {
    const enabledGroups = this.db
      .prepare(
        `
      SELECT content FROM host_groups 
      WHERE enabled = 1 
      ORDER BY is_system DESC, name ASC
    `,
      )
      .all();

    const sections = enabledGroups
      .map((group) => group.content.trim())
      .filter((content) => content);
    return sections.join("\n\n");
  }

  // 解析hosts内容为结构化数据
  parseHostsContent(content: string): HostEntry[] {
    const lines = content.split("\n");
    const entries: HostEntry[] = [];

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith("#")) {
        continue;
      }

      const commentIndex = trimmedLine.indexOf("#");
      const hostPart =
        commentIndex >= 0
          ? trimmedLine.substring(0, commentIndex).trim()
          : trimmedLine;
      const comment =
        commentIndex >= 0
          ? trimmedLine.substring(commentIndex + 1).trim()
          : undefined;

      const parts = hostPart.split(/\s+/);
      if (parts.length >= 2) {
        const [ip, ...domains] = parts;
        for (const domain of domains) {
          entries.push({
            ip,
            domain,
            comment,
            enabled: true,
          });
        }
      }
    }

    return entries;
  }

  // 将结构化数据转换为hosts内容
  formatHostsContent(entries: HostEntry[]): string {
    const lines: string[] = [];

    for (const entry of entries) {
      if (!entry.enabled) continue;

      let line = `${entry.ip}\t${entry.domain}`;
      if (entry.comment) {
        line += `\t# ${entry.comment}`;
      }
      lines.push(line);
    }

    return lines.join("\n");
  }

  // 获取数据目录路径（供其他服务使用）
  getDataDirectory(): string {
    return this.dataDir;
  }

  // 获取数据库路径
  getDatabasePath(): string {
    return this.dbPath;
  }

  close() {
    this.db.close();
  }
}

export const databaseService = new DatabaseService();
