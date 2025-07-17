import React, { useState } from "react";
import { useTranslation } from "react-i18next";
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
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Download,
  ChevronDown,
  ChevronRight,
  Eye,
} from "lucide-react";
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
  const { t } = useTranslation();
  const { toggleGroup, deleteGroup, applyHosts } = useHosts();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<HostGroup | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const handleToggleGroup = async (group: HostGroup) => {
    try {
      await toggleGroup(group.id);
      toast.success(
        t(group.enabled ? "hosts.groupDisabled" : "hosts.groupEnabled", {
          name: group.name,
        }),
      );
    } catch (error) {
      toast.error(t("hosts.toggleGroupError"));
    }
  };

  const handleDeleteGroup = async () => {
    if (!groupToDelete) return;

    try {
      await deleteGroup(groupToDelete.id);
      toast.success(t("hosts.groupDeleted", { name: groupToDelete.name }));
      setDeleteDialogOpen(false);
      setGroupToDelete(null);
    } catch (error) {
      toast.error(t("hosts.deleteGroupError"));
    }
  };

  const handleApplyHosts = async () => {
    try {
      await applyHosts();
      toast.success(t("hosts.applySuccess"));
    } catch (error) {
      toast.error(t("hosts.applyError"));
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

      toast.success(t("hosts.exportSuccess", { name: group.name }));
    } catch (error) {
      toast.error(t("hosts.exportError"));
    }
  };

  const getSyncStatusBadge = (status: HostGroup["syncStatus"]) => {
    const variants = {
      local: { variant: "secondary" as const, text: t("hosts.statusLocal") },
      synced: { variant: "default" as const, text: t("hosts.statusSynced") },
      pending: { variant: "outline" as const, text: t("hosts.statusPending") },
      conflict: {
        variant: "destructive" as const,
        text: t("hosts.statusConflict"),
      },
    };

    const config = variants[status];
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const toggleGroupContent = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  return (
    <div className="flex h-full flex-col">
      {/* 固定的顶部操作栏 */}
      <div className="bg-background/80 supports-[backdrop-filter]:bg-background/60 border-border/40 sticky top-0 z-40 border-b backdrop-blur">
        <div className="-mt-px flex h-14 items-center justify-between px-4">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-bold">{t("hosts.title")}</h2>
            <p className="text-muted-foreground text-sm">
              {t("hosts.description")}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={onCreateGroup} variant="outline" size="sm">
              {t("hosts.createGroup")}
            </Button>
            <Button onClick={handleApplyHosts} size="sm">
              {t("hosts.applyToSystem")}
            </Button>
          </div>
        </div>
      </div>

      {/* 可滚动的内容区域 */}
      <div className="flex-1 overflow-x-hidden overflow-y-auto p-4 pb-20">
        <div className="grid gap-4">
          {groups.map((group) => (
            <Card
              key={group.id}
              className={`transition-all ${group.enabled ? "ring-primary/5 ring-1" : ""}`}
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
                        {group.isSystem && (
                          <Badge variant="outline">
                            {t("hosts.systemLabel")}
                          </Badge>
                        )}
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
                        {t("hosts.edit")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleExportGroup(group)}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        {t("hosts.export")}
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
                          {t("hosts.delete")}
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
                  <div>
                    <span className="font-medium">{t("hosts.version")}：</span>
                    <span className="text-muted-foreground">
                      v{group.version}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">
                      {t("hosts.createdAt")}：
                    </span>
                    <span className="text-muted-foreground">
                      {formatDate(group.createdAt)}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">
                      {t("hosts.updatedAt")}：
                    </span>
                    <span className="text-muted-foreground">
                      {formatDate(group.updatedAt)}
                    </span>
                  </div>
                </div>

                {group.content && (
                  <div className="mt-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleGroupContent(group.id)}
                      className="hover:bg-accent w-full justify-between p-2 text-sm font-medium"
                    >
                      <div className="flex items-center space-x-2">
                        <Eye className="h-4 w-4" />
                        <span>{t("hosts.viewContent")}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-muted-foreground text-xs">
                          {
                            group.content
                              .split("\n")
                              .filter((line) => line.trim()).length
                          }{" "}
                          {t("hosts.lines")}
                        </span>
                        {expandedGroups.has(group.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </div>
                    </Button>

                    {expandedGroups.has(group.id) && (
                      <div className="bg-muted mt-2 max-h-120 overflow-auto rounded-md border">
                        <pre className="w-1 p-3 font-mono text-xs leading-relaxed whitespace-pre">
                          {group.content || t("hosts.emptyContent")}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("hosts.confirmDeleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("hosts.confirmDeleteMessage", { name: groupToDelete?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("hosts.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGroup}
              className="bg-destructive text-destructive-foreground"
            >
              {t("hosts.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
