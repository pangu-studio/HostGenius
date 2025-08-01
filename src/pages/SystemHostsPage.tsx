import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  FileText,
  List,
  Search,
  RefreshCw,
  AlertTriangle,
  Info,
  Copy,
  Check,
} from "lucide-react";
import { useSystemHosts } from "@/hooks/useSystemHosts";
import { toast } from "sonner";

export default function SystemHostsPage() {
  const { t } = useTranslation();
  const {
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
    clearError,
  } = useSystemHosts();

  const [activeTab, setActiveTab] = useState("text");
  const [copied, setCopied] = useState(false);
  const [copyingRowIndex, setCopyingRowIndex] = useState<number | null>(null);

  const handleRefresh = async () => {
    await loadSystemHosts();
    toast.success(t("hosts.systemView.refreshSuccess"));
  };

  const handleCopyContent = async () => {
    try {
      await navigator.clipboard.writeText(rawContent);
      setCopied(true);
      toast.success(t("hosts.systemView.copySuccess"));
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error(t("hosts.systemView.copyError"));
    }
  };

  const handleCopyRow = async (ip: string, domain: string, index: number) => {
    try {
      const textToCopy = `${ip}  ${domain}`;
      await navigator.clipboard.writeText(textToCopy);
      setCopyingRowIndex(index);
      toast.success(t("hosts.systemView.rowCopySuccess"));
      setTimeout(() => setCopyingRowIndex(null), 2000);
    } catch (err) {
      toast.error(t("hosts.systemView.rowCopyError"));
    }
  };

  const formatFileSize = (content: string) => {
    const bytes = new Blob([content]).size;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
    <div className="flex h-full flex-col">
      {/* 固定的顶部操作栏 */}
      <div className="bg-background/80 supports-[backdrop-filter]:bg-background/60 border-border/40 sticky top-0 z-40 border-b backdrop-blur">
        <div className="-mt-px flex h-14 items-center justify-between px-4">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-bold">{t("hosts.systemView.title")}</h2>
            <Badge variant="outline" className="text-xs">
              {t("hosts.systemView.readOnlyMode")}
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={handleCopyContent}
              variant="outline"
              size="sm"
              disabled={!rawContent}
            >
              {copied ? (
                <Check className="mr-2 h-4 w-4" />
              ) : (
                <Copy className="mr-2 h-4 w-4" />
              )}
              {copied
                ? t("hosts.systemView.copied")
                : t("hosts.systemView.copyContent")}
            </Button>
            <Button onClick={handleRefresh} size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              {t("hosts.systemView.refresh")}
            </Button>
          </div>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="p-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button onClick={clearError} size="sm" variant="outline">
                {t("hosts.cancel")}
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* 统计信息 */}
      <div className="bg-muted/30 p-4">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
          <div className="text-center">
            <div className="text-primary text-2xl font-bold">
              {stats.totalLines}
            </div>
            <div className="text-muted-foreground text-xs">
              {t("hosts.systemView.totalLines")}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {stats.hostLines}
            </div>
            <div className="text-muted-foreground text-xs">
              {t("hosts.systemView.hostLines")}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {stats.enabledHosts}
            </div>
            <div className="text-muted-foreground text-xs">
              {t("hosts.systemView.enabledHosts")}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">
              {stats.commentLines}
            </div>
            <div className="text-muted-foreground text-xs">
              {t("hosts.systemView.commentLines")}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {stats.filteredEntries}
            </div>
            <div className="text-muted-foreground text-xs">
              {t("hosts.systemView.filteredEntries")}
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600">
              {formatFileSize(rawContent)}
            </div>
            <div className="text-muted-foreground text-xs">
              {t("hosts.systemView.fileSize")}
            </div>
          </div>
        </div>
      </div>

      {/* 搜索栏 */}
      <div className="p-4">
        <div className="relative max-w-md">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder={t("hosts.systemView.search")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* 主要内容 */}
      <div className="flex-1 overflow-auto p-4 pb-20">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Info className="h-5 w-5" />
              <span>{t("hosts.systemView.fileContent")}</span>
            </CardTitle>
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
                  <div className="flex items-center justify-between">
                    <Label htmlFor="content">
                      {t("hosts.systemView.fileContent")}
                    </Label>
                    <div className="text-muted-foreground flex items-center space-x-4 text-sm">
                      {searchTerm && (
                        <>
                          <span>
                            {t("hosts.systemView.searchResults", {
                              term: searchTerm,
                            })}
                          </span>
                          <Separator orientation="vertical" className="h-4" />
                        </>
                      )}
                      <span>
                        {t("hosts.systemView.showingLines", {
                          count: filteredRawContent.split("\n").length,
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="relative">
                    <pre className="bg-muted h-[500px] overflow-auto rounded-md border p-4 font-mono text-sm">
                      {filteredRawContent || t("hosts.systemView.emptyFile")}
                    </pre>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="table" className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>{t("hosts.systemView.hostEntries")}</Label>
                    <div className="text-muted-foreground flex items-center space-x-4 text-sm">
                      {searchTerm && (
                        <>
                          <span>
                            {t("hosts.systemView.searchResults", {
                              term: searchTerm,
                            })}
                          </span>
                          <Separator orientation="vertical" className="h-4" />
                        </>
                      )}
                      <span>
                        {t("hosts.systemView.showingEntries", {
                          filtered: filteredEntries.length,
                          total: entries.length,
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="max-h-[500px] overflow-auto rounded-md border">
                    {filteredEntries.length > 0 ? (
                      <Table>
                        <TableHeader className="bg-background sticky top-0 z-10">
                          <TableRow>
                            <TableHead className="w-[80px]">
                              {t("hosts.systemView.status")}
                            </TableHead>
                            <TableHead>{t("hosts.ipAddress")}</TableHead>
                            <TableHead>{t("hosts.domain")}</TableHead>
                            <TableHead>{t("hosts.comment")}</TableHead>
                            <TableHead className="w-[100px]">
                              {t("hosts.systemView.actions")}
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredEntries.map((entry, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <Badge
                                  variant={
                                    entry.enabled ? "default" : "secondary"
                                  }
                                  className="text-xs"
                                >
                                  {entry.enabled
                                    ? t("hosts.enabled")
                                    : t("hosts.disabled")}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-mono text-sm">
                                {entry.ip}
                              </TableCell>
                              <TableCell className="font-mono text-sm">
                                {entry.domain}
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {entry.comment || "-"}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleCopyRow(entry.ip, entry.domain, index)
                                  }
                                  className="h-8 w-8 p-0"
                                  title={t("hosts.systemView.copyRow")}
                                >
                                  {copyingRowIndex === index ? (
                                    <Check className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-muted-foreground py-8 text-center">
                        {searchTerm ? (
                          <div>
                            <p>
                              {t("hosts.systemView.noResults", {
                                term: searchTerm,
                              })}
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2"
                              onClick={() => setSearchTerm("")}
                            >
                              {t("hosts.systemView.clearSearch")}
                            </Button>
                          </div>
                        ) : (
                          <p>{t("hosts.systemView.noEntries")}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
