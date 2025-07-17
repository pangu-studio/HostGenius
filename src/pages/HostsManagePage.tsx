import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { HostGroupList } from "@/components/hosts/HostGroupList";
import { HostEditor } from "@/components/hosts/HostEditor";
import { useHosts } from "@/hooks/useHosts";
import { HostGroup } from "../preload";
import { Loader2, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type ViewMode = "list" | "edit" | "create";

export default function HostsManagePage() {
  const { t } = useTranslation();
  const {
    groups,
    loading,
    error,
    loadGroups, // 添加 loadGroups 函数
    clearError,
  } = useHosts();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedGroup, setSelectedGroup] = useState<HostGroup | null>(null);

  const handleEditGroup = (group: HostGroup) => {
    setSelectedGroup(group);
    setViewMode("edit");
  };

  const handleCreateGroup = () => {
    setSelectedGroup(null);
    setViewMode("create");
  };

  const handleSave = async () => {
    // 确保在保存成功后刷新列表并返回到列表视图
    try {
      await loadGroups(); // 手动刷新列表确保数据最新
      setViewMode("list");
      setSelectedGroup(null);
    } catch (error) {
      console.error("Failed to refresh groups after save:", error);
      // 即使刷新失败也要返回列表视图
      setViewMode("list");
      setSelectedGroup(null);
    }
  };

  const handleCancel = () => {
    setViewMode("list");
    setSelectedGroup(null);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>{t("hosts.loading")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 错误提示 */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button onClick={clearError} size="sm" variant="outline">
              {t("hosts.cancel")}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* 主要内容 */}
      {viewMode === "list" && (
        <HostGroupList
          groups={groups}
          onEditGroup={handleEditGroup}
          onCreateGroup={handleCreateGroup}
        />
      )}

      {(viewMode === "edit" || viewMode === "create") && (
        <HostEditor
          group={selectedGroup}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}

      {/* 管理员密码对话框 */}
      {/* <AdminPasswordDialog
        open={adminDialogOpen}
        onOpenChange={setAdminDialogOpen}
      /> */}
    </div>
  );
}
