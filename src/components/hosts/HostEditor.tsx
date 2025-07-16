import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Save, Plus, Trash2, FileText, List, ArrowLeft } from "lucide-react";
import { HostGroup, HostEntry } from "../../preload";
import { useHosts } from "../../hooks/useHosts";

interface HostEditorProps {
  group?: HostGroup;
  onSave: () => void;
  onCancel: () => void;
}

export function HostEditor({ group, onSave, onCancel }: HostEditorProps) {
  const { createGroup, updateGroup, parseHosts, formatHosts } = useHosts();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    content: "",
    enabled: true,
  });

  const [entries, setEntries] = useState<HostEntry[]>([]);
  const [activeTab, setActiveTab] = useState("text");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (group) {
      setFormData({
        name: group.name,
        description: group.description || "",
        content: group.content,
        enabled: group.enabled,
      });
      loadEntries(group.content);
    }
  }, [group]);

  const loadEntries = async (content: string) => {
    try {
      const parsed = await parseHosts(content);
      setEntries(parsed);
    } catch (error) {
      console.error("解析hosts内容失败:", error);
    }
  };

  const handleContentChange = async (content: string) => {
    setFormData((prev) => ({ ...prev, content }));
    await loadEntries(content);
  };

  const handleEntriesChange = async (newEntries: HostEntry[]) => {
    setEntries(newEntries);
    try {
      const formatted = await formatHosts(newEntries);
      setFormData((prev) => ({ ...prev, content: formatted }));
    } catch (error) {
      console.error("格式化hosts内容失败:", error);
    }
  };

  const addEntry = () => {
    const newEntry: HostEntry = {
      ip: "127.0.0.1",
      domain: "",
      comment: "",
      enabled: true,
    };
    handleEntriesChange([...entries, newEntry]);
  };

  const updateEntry = (index: number, updates: Partial<HostEntry>) => {
    const newEntries = entries.map((entry, i) =>
      i === index ? { ...entry, ...updates } : entry,
    );
    handleEntriesChange(newEntries);
  };

  const removeEntry = (index: number) => {
    const newEntries = entries.filter((_, i) => i !== index);
    handleEntriesChange(newEntries);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("请输入分组名称");
      return;
    }

    setLoading(true);
    try {
      if (group) {
        await updateGroup(group.id, formData);
        toast.success(`分组 "${formData.name}" 已更新`);
      } else {
        await createGroup(formData);
        toast.success(`分组 "${formData.name}" 已创建`);
      }
      onSave();
    } catch (error) {
      toast.error(group ? "更新失败" : "创建失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回
          </Button>
          <div>
            <h2 className="text-2xl font-bold">
              {group ? "编辑分组" : "新建分组"}
            </h2>
            <p className="text-muted-foreground">
              {group ? `编辑 "${group.name}" 分组配置` : "创建新的hosts分组"}
            </p>
          </div>
        </div>
        <div className="space-x-2">
          <Button variant="outline" onClick={onCancel}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            {loading ? "保存中..." : "保存"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>基本信息</CardTitle>
          <CardDescription>配置分组的基本信息</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">分组名称 *</Label>
              <Input
                id="name"
                placeholder="输入分组名称"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                disabled={group?.isSystem}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="enabled"
                checked={formData.enabled}
                onCheckedChange={(enabled) =>
                  setFormData((prev) => ({ ...prev, enabled }))
                }
                disabled={group?.isSystem}
              />
              <Label htmlFor="enabled">启用分组</Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">描述</Label>
            <Input
              id="description"
              placeholder="输入分组描述（可选）"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hosts 配置</CardTitle>
          <CardDescription>
            配置此分组的hosts条目，支持文本编辑和表格编辑两种模式
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="text" className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>文本编辑</span>
              </TabsTrigger>
              <TabsTrigger
                value="table"
                className="flex items-center space-x-2"
              >
                <List className="h-4 w-4" />
                <span>表格编辑</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="text" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="content">Hosts 内容</Label>
                <Textarea
                  id="content"
                  placeholder="127.0.0.1 localhost&#10;192.168.1.100 api.example.com # 开发环境"
                  value={formData.content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  className="min-h-[300px] font-mono text-sm"
                />
              </div>

              <div className="text-muted-foreground flex items-center space-x-4 text-sm">
                <span>共 {entries.length} 条有效记录</span>
                <Separator orientation="vertical" className="h-4" />
                <span>启用 {entries.filter((e) => e.enabled).length} 条</span>
              </div>
            </TabsContent>

            <TabsContent value="table" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-muted-foreground flex items-center space-x-4 text-sm">
                  <span>共 {entries.length} 条记录</span>
                </div>
                <Button onClick={addEntry} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  添加条目
                </Button>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">状态</TableHead>
                      <TableHead>IP地址</TableHead>
                      <TableHead>域名</TableHead>
                      <TableHead>备注</TableHead>
                      <TableHead className="w-[100px]">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((entry, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Switch
                            checked={entry.enabled}
                            onCheckedChange={(enabled) =>
                              updateEntry(index, { enabled })
                            }
                            size="sm"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={entry.ip}
                            onChange={(e) =>
                              updateEntry(index, { ip: e.target.value })
                            }
                            placeholder="127.0.0.1"
                            className="font-mono text-sm"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={entry.domain}
                            onChange={(e) =>
                              updateEntry(index, { domain: e.target.value })
                            }
                            placeholder="example.com"
                            className="font-mono text-sm"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={entry.comment || ""}
                            onChange={(e) =>
                              updateEntry(index, { comment: e.target.value })
                            }
                            placeholder="可选备注"
                            className="text-sm"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeEntry(index)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {entries.length === 0 && (
                <div className="text-muted-foreground py-8 text-center">
                  <p>暂无hosts条目</p>
                  <Button onClick={addEntry} variant="outline" className="mt-2">
                    <Plus className="mr-2 h-4 w-4" />
                    添加第一条记录
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {group && (
        <Card>
          <CardHeader>
            <CardTitle>分组信息</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
              <div>
                <span className="font-medium">版本：</span>
                <Badge variant="outline">v{group.version}</Badge>
              </div>
              <div>
                <span className="font-medium">同步状态：</span>
                <Badge
                  variant={
                    group.syncStatus === "synced" ? "default" : "secondary"
                  }
                >
                  {group.syncStatus === "synced" ? "已同步" : "本地"}
                </Badge>
              </div>
              <div>
                <span className="font-medium">创建时间：</span>
                <span className="text-muted-foreground">
                  {new Date(group.createdAt).toLocaleString("zh-CN")}
                </span>
              </div>
              <div>
                <span className="font-medium">更新时间：</span>
                <span className="text-muted-foreground">
                  {new Date(group.updatedAt).toLocaleString("zh-CN")}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
