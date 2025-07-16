import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { MoreHorizontal, Edit, Trash2, Download } from "lucide-react";
import { HostGroup } from "../../preload";
import { useHosts } from "../../hooks/useHosts";

interface HostGroupListProps {
  groups: HostGroup[];
  onEditGroup: (group: HostGroup) => void;
  onCreateGroup: () => void;
}

export function HostGroupList({
  groups,
  onEditGroup,
  onCreateGroup,
}: HostGroupListProps) {
  const { toggleGroup, deleteGroup, applyHosts } = useHosts();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<HostGroup | null>(null);

  const handleToggleGroup = async (group: HostGroup) => {
    try {
      await toggleGroup(group.id);
      toast.success(
        `分组 "${group.name}" 已${group.enabled ? "禁用" : "启用"}`,
      );
    } catch (error) {
      toast.error("切换分组状态失败");
    }
  };

  const handleDeleteGroup = async () => {
    if (!groupToDelete) return;

    try {
      await deleteGroup(groupToDelete.id);
      toast.success(`分组 "${groupToDelete.name}" 已删除`);
      setDeleteDialogOpen(false);
      setGroupToDelete(null);
    } catch (error) {
      toast.error("无法删除分组，请重试");
    }
  };

  const handleApplyHosts = async () => {
    try {
      await applyHosts();
      toast.success("Hosts配置已应用到系统");
    } catch (error) {
      toast.error("应用Hosts配置失败，请检查权限");
    }
  };

  const handleExportGroup = async (group: HostGroup) => {
    try {
      const config = await window.electronAPI.exportGroup(group.id);
      const blob = new Blob([config], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${group.name}-hosts.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success(`分组 "${group.name}" 已导出`);
    } catch (error) {
      toast.error("导出分组配置失败");
    }
  };

  const getSyncStatusBadge = (status: HostGroup["syncStatus"]) => {
    const variants = {
      local: { variant: "secondary" as const, text: "本地" },
      synced: { variant: "default" as const, text: "已同步" },
      pending: { variant: "outline" as const, text: "待同步" },
      conflict: { variant: "destructive" as const, text: "冲突" },
    };

    const config = variants[status];
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("zh-CN");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Hosts 分组管理</h2>
          <p className="text-muted-foreground">管理不同环境的hosts配置</p>
        </div>
        <div className="space-x-2">
          <Button onClick={onCreateGroup} variant="outline">
            新建分组
          </Button>
          <Button onClick={handleApplyHosts}>应用到系统</Button>
        </div>
      </div>

      <div className="grid gap-4">
        {groups.map((group) => (
          <Card
            key={group.id}
            className={`transition-all ${group.enabled ? "ring-primary/20 ring-2" : ""}`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Switch
                    checked={group.enabled}
                    onCheckedChange={() => handleToggleGroup(group)}
                    disabled={group.isSystem}
                  />
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <span>{group.name}</span>
                      {group.isSystem && <Badge variant="outline">系统</Badge>}
                      {getSyncStatusBadge(group.syncStatus)}
                    </CardTitle>
                    {group.description && (
                      <CardDescription>{group.description}</CardDescription>
                    )}
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEditGroup(group)}>
                      <Edit className="mr-2 h-4 w-4" />
                      编辑
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExportGroup(group)}>
                      <Download className="mr-2 h-4 w-4" />
                      导出
                    </DropdownMenuItem>
                    {!group.isSystem && (
                      <DropdownMenuItem
                        onClick={() => {
                          setGroupToDelete(group);
                          setDeleteDialogOpen(true);
                        }}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        删除
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
                <div>
                  <span className="font-medium">版本：</span>
                  <span className="text-muted-foreground">
                    v{group.version}
                  </span>
                </div>
                <div>
                  <span className="font-medium">创建时间：</span>
                  <span className="text-muted-foreground">
                    {formatDate(group.createdAt)}
                  </span>
                </div>
                <div>
                  <span className="font-medium">更新时间：</span>
                  <span className="text-muted-foreground">
                    {formatDate(group.updatedAt)}
                  </span>
                </div>
              </div>

              {group.content && (
                <div className="mt-4">
                  <details className="group">
                    <summary className="flex cursor-pointer items-center text-sm font-medium">
                      <span>查看内容</span>
                      <span className="text-muted-foreground ml-auto">
                        {
                          group.content
                            .split("\n")
                            .filter((line) => line.trim()).length
                        }{" "}
                        行
                      </span>
                    </summary>
                    <pre className="bg-muted mt-2 max-h-32 overflow-x-auto rounded-md p-3 text-xs">
                      {group.content || "(空)"}
                    </pre>
                  </details>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除分组</AlertDialogTitle>
            <AlertDialogDescription>
              你确定要删除分组 "{groupToDelete?.name}" 吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGroup}
              className="bg-destructive text-destructive-foreground"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
