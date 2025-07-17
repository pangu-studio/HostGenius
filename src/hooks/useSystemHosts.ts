import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { HostEntry } from "../preload";

export function useSystemHosts() {
  const { t } = useTranslation();
  const [rawContent, setRawContent] = useState<string>("");
  const [entries, setEntries] = useState<HostEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // 加载系统hosts文件
  const loadSystemHosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const content = await window.electronAPI.readRawSystemHosts();
      setRawContent(content);

      // 解析为结构化数据
      const parsed = await window.electronAPI.parseHosts(content);
      setEntries(parsed);
    } catch (err) {
      setError(t("hosts.systemView.loadError"));
      console.error("Failed to load system hosts:", err);
    } finally {
      setLoading(false);
    }
  }, [t]);

  // 根据搜索条件过滤条目
  const filteredEntries = useMemo(() => {
    if (!searchTerm.trim()) {
      return entries;
    }

    const term = searchTerm.toLowerCase();
    return entries.filter(
      (entry) =>
        entry.ip.toLowerCase().includes(term) ||
        entry.domain.toLowerCase().includes(term) ||
        (entry.comment && entry.comment.toLowerCase().includes(term)),
    );
  }, [entries, searchTerm]);

  // 根据搜索条件过滤文本内容
  const filteredRawContent = useMemo(() => {
    if (!searchTerm.trim()) {
      return rawContent;
    }

    const term = searchTerm.toLowerCase();
    const lines = rawContent.split("\n");
    const filteredLines = lines.filter((line) =>
      line.toLowerCase().includes(term),
    );

    return filteredLines.join("\n");
  }, [rawContent, searchTerm]);

  // 获取统计信息
  const stats = useMemo(() => {
    const totalLines = rawContent.split("\n").length;
    const commentLines = rawContent
      .split("\n")
      .filter((line) => line.trim().startsWith("#")).length;
    const emptyLines = rawContent
      .split("\n")
      .filter((line) => !line.trim()).length;
    const hostLines = entries.length;
    const enabledHosts = entries.filter((entry) => entry.enabled).length;

    return {
      totalLines,
      commentLines,
      emptyLines,
      hostLines,
      enabledHosts,
      filteredEntries: filteredEntries.length,
    };
  }, [rawContent, entries, filteredEntries]);

  // 初始化时加载数据
  useEffect(() => {
    loadSystemHosts();
  }, [loadSystemHosts]);

  return {
    rawContent,
    filteredRawContent,
    entries,
    filteredEntries,
    loading,
    error,
    searchTerm,
    stats,
    setSearchTerm,
    loadSystemHosts,
    clearError: () => setError(null),
  };
}
