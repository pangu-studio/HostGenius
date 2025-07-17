import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import {
  Save,
  Plus,
  Trash2,
  FileText,
  List,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { HostGroup, HostEntry } from "../../preload";
import { useHosts } from "../../hooks/useHosts";

interface HostEditorProps {
  group?: HostGroup;
  onSave: () => void;
  onCancel: () => void;
}

export function HostEditor({ group, onSave, onCancel }: HostEditorProps) {
  const { t } = useTranslation();
  const { createGroup, updateGroup, parseHosts, formatHosts, readSystemHosts } =
    useHosts();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    content: "",
    enabled: true,
  });

  const [entries, setEntries] = useState<HostEntry[]>([]);
  const [activeTab, setActiveTab] = useState("text");
  const [loading, setLoading] = useState(false);
  const [isBasicInfoOpen, setIsBasicInfoOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    console.log("编辑分组:", group);
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

  useEffect(() => {
    readSystemHosts()
      .then((result: any) => {
        console.log("读取系统hosts内容:", result);
        formData.content = result;
      })
      .catch((err: any) => {
        console.error("读取系统hosts失败:", err);
        toast.error(t("hosts.readSystemHostsError"));
      });
  }, [t]);
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
      toast.error(t("hosts.nameRequired"));
      return;
    }

    setLoading(true);
    try {
      if (group) {
        await updateGroup(group.id, formData);
        toast.success(t("hosts.updateSuccess", { name: formData.name }));
      } else {
        await createGroup(formData);
        toast.success(t("hosts.createSuccess", { name: formData.name }));
      }
      // 保存成功后调用 onSave 回调
      onSave();
    } catch (error) {
      toast.error(group ? t("hosts.updateError") : t("hosts.createError"));
      console.error("Save error:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // 全屏编辑组件
  const FullscreenEditor = () => (
    <div className="bg-background fixed inset-0 z-50 flex flex-col">
      <div className="bg-background flex-shrink-0 border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h4 className="text-xl font-bold">
              {t("hosts.fullscreenEdit")} -{" "}
              {group ? group.name : t("hosts.newGroup")}
            </h4>
          </div>
          <div className="space-x-2">
            <Button variant="outline" onClick={toggleFullscreen}>
              <Minimize2 className="mr-2 h-4 w-4" />
              {t("hosts.exitFullscreen")}
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              <Save className="mr-2 h-4 w-4" />
              {loading ? t("hosts.saving") : t("hosts.save")}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-4">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex h-full flex-col"
        >
          <TabsList className="grid w-full max-w-md flex-shrink-0 grid-cols-2">
            <TabsTrigger value="text" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>{t("hosts.systemView.textView")}</span>
            </TabsTrigger>
            <TabsTrigger value="table" className="flex items-center space-x-2">
              <List className="h-4 w-4" />
              <span>{t("hosts.systemView.tableView")}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="text"
            className="mt-4 flex flex-1 flex-col space-y-4"
          >
            <div className="flex flex-1 flex-col space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="fullscreen-content">{t("hosts.content")}</Label>
                <div className="text-muted-foreground flex items-center space-x-4 text-sm">
                  <span>
                    {t("hosts.totalEntries", { count: entries.length })}
                  </span>
                  <Separator orientation="vertical" className="h-4" />
                  <span>
                    {t("hosts.enabledEntries", {
                      count: entries.filter((e) => e.enabled).length,
                    })}
                  </span>
                </div>
              </div>
              <Textarea
                id="fullscreen-content"
                placeholder={t("hosts.contentPlaceholder")}
                value={formData.content}
                onChange={(e) => handleContentChange(e.target.value)}
                className="flex-1 resize-none font-mono text-sm"
              />
            </div>
          </TabsContent>

          <TabsContent
            value="table"
            className="mt-4 flex flex-1 flex-col space-y-4"
          >
            <div className="flex flex-shrink-0 items-center justify-between">
              <div className="text-muted-foreground flex items-center space-x-4 text-sm">
                <span>
                  {t("hosts.totalEntries", { count: entries.length })}
                </span>
              </div>
              <Button onClick={addEntry} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                {t("hosts.addEntry")}
              </Button>
            </div>

            <div className="flex-1 overflow-auto rounded-md border">
              <Table>
                <TableHeader className="bg-background sticky top-0 z-10">
                  <TableRow>
                    <TableHead className="w-[100px]">
                      {t("hosts.systemView.status")}
                    </TableHead>
                    <TableHead>{t("hosts.ipAddress")}</TableHead>
                    <TableHead>{t("hosts.domain")}</TableHead>
                    <TableHead>{t("hosts.comment")}</TableHead>
                    <TableHead className="w-[100px]">
                      {t("hosts.actions")}
                    </TableHead>
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
                          placeholder={t("hosts.optionalComment")}
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
                <p>{t("hosts.noEntries")}</p>
                <Button onClick={addEntry} variant="outline" className="mt-2">
                  <Plus className="mr-2 h-4 w-4" />
                  {t("hosts.addFirstEntry")}
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );

  // 如果是全屏模式，显示全屏编辑器
  if (isFullscreen) {
    return <FullscreenEditor />;
  }

  return (
    <div className="relative flex h-full flex-col">
      {/* 固定的顶部操作栏 */}
      <div className="bg-background/80 supports-[backdrop-filter]:bg-background/60 border-border/40 sticky top-0 z-40 border-b backdrop-blur">
        <div className="-mt-px flex items-center justify-between px-2 py-0">
          <div className="flex h-14 items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("hosts.back")}
            </Button>
            <div>
              <h4 className="text-xl font-bold">
                {group ? t("hosts.editGroup") : t("hosts.createGroup")}
              </h4>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={onCancel}>
              {t("hosts.cancel")}
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              <Save className="mr-2 h-4 w-4" />
              {loading ? t("hosts.saving") : t("hosts.save")}
            </Button>
          </div>
        </div>
      </div>

      {/* 可滚动的内容区域 */}
      <div className="flex-1 overflow-auto p-6 pb-20">
        <div className="space-y-6">
          <Collapsible open={isBasicInfoOpen} onOpenChange={setIsBasicInfoOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{t("hosts.basicInfo")}</CardTitle>
                    </div>
                    <div className="hover:bg-accent/40">
                      {isBasicInfoOpen ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">{t("hosts.name")} *</Label>
                      <Input
                        id="name"
                        placeholder={t("hosts.namePlaceholder")}
                        value={formData.name}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
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
                      <Label htmlFor="enabled">{t("hosts.enableGroup")}</Label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">
                      {t("hosts.description")}
                    </Label>
                    <Input
                      id="description"
                      placeholder={t("hosts.descriptionPlaceholder")}
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
              </CollapsibleContent>
            </Card>
          </Collapsible>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t("hosts.hostsConfig")}</CardTitle>
                </div>
                <Button variant="outline" size="sm" onClick={toggleFullscreen}>
                  <Maximize2 className="mr-2 h-4 w-4" />
                  {t("hosts.fullscreenEdit")}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger
                    value="text"
                    className="flex items-center space-x-2"
                  >
                    <FileText className="h-4 w-4" />
                    <span>{t("hosts.systemView.textView")}</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="table"
                    className="flex items-center space-x-2"
                  >
                    <List className="h-4 w-4" />
                    <span>{t("hosts.systemView.tableView")}</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="text" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="content">{t("hosts.content")}</Label>
                    <Textarea
                      id="content"
                      placeholder={t("hosts.contentPlaceholder")}
                      value={formData.content}
                      onChange={(e) => handleContentChange(e.target.value)}
                      className="h-[400px] resize-none overflow-auto font-mono text-sm"
                    />
                  </div>

                  <div className="text-muted-foreground flex items-center space-x-4 text-sm">
                    <span>
                      {t("hosts.totalEntries", { count: entries.length })}
                    </span>
                    <Separator orientation="vertical" className="h-4" />
                    <span>
                      {t("hosts.enabledEntries", {
                        count: entries.filter((e) => e.enabled).length,
                      })}
                    </span>
                  </div>
                </TabsContent>

                <TabsContent value="table" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-muted-foreground flex items-center space-x-4 text-sm">
                      <span>
                        {t("hosts.totalEntries", { count: entries.length })}
                      </span>
                    </div>
                    <Button onClick={addEntry} size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      {t("hosts.addEntry")}
                    </Button>
                  </div>

                  <div className="max-h-[400px] overflow-auto rounded-md border">
                    <Table>
                      <TableHeader className="bg-background sticky top-0 z-10">
                        <TableRow>
                          <TableHead className="w-[100px]">
                            {t("hosts.systemView.status")}
                          </TableHead>
                          <TableHead>{t("hosts.ipAddress")}</TableHead>
                          <TableHead>{t("hosts.domain")}</TableHead>
                          <TableHead>{t("hosts.comment")}</TableHead>
                          <TableHead className="w-[100px]">
                            {t("hosts.actions")}
                          </TableHead>
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
                                  updateEntry(index, {
                                    comment: e.target.value,
                                  })
                                }
                                placeholder={t("hosts.optionalComment")}
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
                      <p>{t("hosts.noEntries")}</p>
                      <Button
                        onClick={addEntry}
                        variant="outline"
                        className="mt-2"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        {t("hosts.addFirstEntry")}
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
                <CardTitle>{t("hosts.groupInfo")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                  <div>
                    <span className="font-medium">{t("hosts.version")}：</span>
                    <Badge variant="outline">v{group.version}</Badge>
                  </div>
                  <div>
                    <span className="font-medium">
                      {t("hosts.syncStatus")}：
                    </span>
                    <Badge
                      variant={
                        group.syncStatus === "synced" ? "default" : "secondary"
                      }
                    >
                      {group.syncStatus === "synced"
                        ? t("hosts.statusSynced")
                        : t("hosts.statusLocal")}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-medium">
                      {t("hosts.createdAt")}：
                    </span>
                    <span className="text-muted-foreground">
                      {new Date(group.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">
                      {t("hosts.updatedAt")}：
                    </span>
                    <span className="text-muted-foreground">
                      {new Date(group.updatedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
