import React, { useState } from "react";
import { HostGroupList } from "@/components/hosts/HostGroupList";
import { HostEditor } from "@/components/hosts/HostEditor";
import { AdminPasswordDialog } from "@/components/hosts/AdminPasswordDialog";
import { useHosts } from "@/hooks/useHosts";
import { HostGroup } from "../preload";
import { Loader2, AlertTriangle, Shield } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type ViewMode = "list" | "edit" | "create";

export default function HostsPage() {
  const {
    groups,
    loading,
    error,
    // hasPermissions,
    adminDialogOpen,
    setAdminDialogOpen,
    handleAdminSuccess,
    // clearAdminPermissions,
    // requestAdmin,
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

  const handleSave = () => {
    setViewMode("list");
    setSelectedGroup(null);
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
          <span>加载中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* 权限状态显示 */}
      {/* {hasPermissions ? (
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>管理员权限已验证，可以修改系统hosts文件</span>
            <Button onClick={clearAdminPermissions} size="sm" variant="outline">
              清除权限
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            需要管理员权限才能修改系统hosts文件，操作时会要求验证密码
            <Button onClick={requestAdmin} size="sm" variant="outline">
              申请权限
            </Button>
          </AlertDescription>
        </Alert>
      )} */}

      {/* 错误提示 */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button onClick={clearError} size="sm" variant="outline">
              关闭
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
      <AdminPasswordDialog
        open={adminDialogOpen}
        onOpenChange={setAdminDialogOpen}
        onSuccess={handleAdminSuccess}
      />
    </div>
  );
}
