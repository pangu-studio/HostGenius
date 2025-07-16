import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Shield, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface AdminPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
}

export function AdminPasswordDialog({
  open,
  onOpenChange,
  onSuccess,
  title = "需要管理员权限",
  description = "修改hosts文件需要管理员权限，请输入您的密码。",
}: AdminPasswordDialogProps) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 使用预加载脚本暴露的平台信息
  const isWindows = window.electronAPI?.isWindows ?? false;
  const platform = window.electronAPI?.platform ?? "unknown";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password.trim()) {
      setError("请输入密码");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await window.electronAPI.validateAdminPassword(password);

      if (result.success) {
        toast.success("管理员权限验证成功");
        onSuccess();
        onOpenChange(false);
        setPassword("");
      } else {
        setError(result.message || "密码验证失败");
      }
    } catch (err) {
      setError("权限验证过程中发生错误");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setPassword("");
    setError(null);
    onOpenChange(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      handleCancel();
    } else {
      onOpenChange(open);
    }
  };

  const getPasswordLabel = () => {
    switch (platform) {
      case "win32":
        return "管理员密码";
      case "darwin":
        return "macOS 用户密码";
      case "linux":
        return "sudo 密码";
      default:
        return "用户密码";
    }
  };

  const getSecurityTips = () => {
    const commonTips = [
      "密码将在5分钟后自动过期",
      "密码不会被保存或传输",
      "仅用于验证管理员权限",
    ];

    if (isWindows) {
      return [...commonTips, "需要当前用户具备管理员权限"];
    } else {
      return [...commonTips, "需要具备sudo权限的用户密码"];
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-orange-500" />
            <span>{title}</span>
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">{getPasswordLabel()}</Label>
            <Input
              id="password"
              type="password"
              placeholder="请输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoFocus
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="text-muted-foreground space-y-1 text-sm">
            {getSecurityTips().map((tip, index) => (
              <p key={index}>• {tip}</p>
            ))}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
            >
              取消
            </Button>
            <Button type="submit" disabled={loading || !password.trim()}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              确认
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
