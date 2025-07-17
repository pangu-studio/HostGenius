import { useState, useEffect, useCallback } from "react";
// import { toast } from "sonner";
import { HostGroup, HostEntry, BackupInfo } from "../preload";

export function useHosts() {
  const [groups, setGroups] = useState<HostGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // const [hasPermissions, setHasPermissions] = useState(false);
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  // const [pendingAction, setPendingAction] = useState<
  //   (() => Promise<void>) | null
  // >(null);

  const [hostEntry, setHostEntry] = useState<HostEntry[]>([]);

  const readSystemHosts = useCallback(async () => {
    try {
      const txt = await window.electronAPI.readSystemHosts();
      const parsed = await parseHosts(txt);
      setHostEntry(parsed);
    } catch (err) {
      setError("读取系统hosts失败");
      throw err;
    }
  }, []);

  // 加载分组
  const loadGroups = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await window.electronAPI.getGroups();
      setGroups(result);
    } catch (err) {
      setError("加载分组失败");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 创建分组
  const createGroup = useCallback(
    async (data: {
      name: string;
      description?: string;
      content?: string;
      enabled?: boolean;
    }) => {
      try {
        const id = await window.electronAPI.createGroup(data);
        await loadGroups();
        return id;
      } catch (err) {
        setError("创建分组失败");
        throw err;
      }
    },
    [loadGroups],
  );

  // 更新分组
  const updateGroup = useCallback(
    async (
      id: string,
      data: {
        name?: string;
        description?: string;
        content?: string;
        enabled?: boolean;
      },
    ) => {
      try {
        const result = await window.electronAPI.updateGroup(id, data);
        if (result) {
          await loadGroups();
        }
        return result;
      } catch (err) {
        setError("更新分组失败");
        throw err;
      }
    },
    [loadGroups],
  );

  // 删除分组
  const deleteGroup = useCallback(
    async (id: string) => {
      try {
        const result = await window.electronAPI.deleteGroup(id);
        if (result) {
          await loadGroups();
        }
        return result;
      } catch (err) {
        setError("删除分组失败");
        throw err;
      }
    },
    [loadGroups],
  );

  // 切换分组状态
  const toggleGroup = useCallback(
    async (id: string) => {
      try {
        const result = await window.electronAPI.toggleGroup(id);
        if (result) {
          await loadGroups();
        }
        return result;
      } catch (err) {
        setError("切换分组状态失败");
        throw err;
      }
    },
    [loadGroups],
  );

  // 应用配置
  const applyHosts = useCallback(async () => {
    // if (!hasPermissions) {
    //   const granted = await requestAdmin();
    //   if (!granted) {
    //     setError("需要管理员权限才能应用配置");
    //     return false;
    //   }
    // }

    try {
      await window.electronAPI.applyHosts();
      return true;
    } catch (err) {
      setError("应用配置失败");
      return false;
    }
  }, []);

  // 解析hosts内容
  const parseHosts = useCallback(
    async (content: string): Promise<HostEntry[]> => {
      try {
        return await window.electronAPI.parseHosts(content);
      } catch (err) {
        setError("解析hosts内容失败");
        return [];
      }
    },
    [],
  );

  // 格式化hosts内容
  const formatHosts = useCallback(
    async (entries: HostEntry[]): Promise<string> => {
      try {
        return await window.electronAPI.formatHosts(entries);
      } catch (err) {
        setError("格式化hosts内容失败");
        return "";
      }
    },
    [],
  );

  // 初始化
  useEffect(() => {
    (async () => {
      try {
        await loadGroups();
        console.log("分组加载成功", groups);
        if (groups === undefined || (groups && groups.length === 0)) {
          // 初始化系统hosts
          // 如果没有分组，尝试读取系统hosts

          const content = await window.electronAPI.readSystemHosts();
          console.log("系统hosts内容:", hostEntry);

          console.log("尝试解析系统hosts内容", content);
          const parsed =
            await window.electronAPI.parseSystemHostsContent(content);
          console.log("解析后的hosts内容:", parsed);
        }
      } catch (err) {
        setError("初始化失败: " + (err as Error).message);
        console.log("初始化失败:", err);
        throw err;
      }
    })();
  }, [loadGroups]);

  return {
    groups,
    hostEntry,
    loading,
    error,
    adminDialogOpen,
    setAdminDialogOpen,
    readSystemHosts,
    loadGroups,
    createGroup,
    updateGroup,
    deleteGroup,
    toggleGroup,
    applyHosts,
    parseHosts,
    formatHosts,
    clearError: () => setError(null),
  };
}

export function useBackups() {
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBackups = useCallback(async () => {
    setLoading(true);
    try {
      const result = await window.electronAPI.getBackups();
      setBackups(result);
    } catch (err) {
      setError("加载备份列表失败");
    } finally {
      setLoading(false);
    }
  }, []);

  const createBackup = useCallback(async () => {
    try {
      await window.electronAPI.createBackup();
      await loadBackups();
      return true;
    } catch (err) {
      setError("创建备份失败");
      return false;
    }
  }, [loadBackups]);

  const restoreBackup = useCallback(async (backupId: string) => {
    try {
      await window.electronAPI.restoreBackup(backupId);
      return true;
    } catch (err) {
      setError("恢复备份失败");
      return false;
    }
  }, []);

  useEffect(() => {
    loadBackups();
  }, [loadBackups]);

  return {
    backups,
    loading,
    error,
    loadBackups,
    createBackup,
    restoreBackup,
    clearError: () => setError(null),
  };
}
