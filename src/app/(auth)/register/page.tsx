"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MapPin, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
  }>({});
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validate = (): boolean => {
    const errors: typeof fieldErrors = {};
    if (!name.trim()) errors.name = "请输入昵称";
    if (!email.trim()) {
      errors.email = "请输入邮箱";
    } else if (!EMAIL_REGEX.test(email)) {
      errors.email = "邮箱格式不正确";
    }
    if (!password) {
      errors.password = "请输入密码";
    } else if (password.length < 6) {
      errors.password = "密码至少6位";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    setFieldErrors({});
    if (!validate()) return;
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `注册失败 (${res.status})`);
      }

      setSuccess(true);
      // Redirect after a brief success display
      setTimeout(() => router.push("/login?registered=true"), 1500);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "注册失败，请检查网络后重试");
    } finally {
      setIsLoading(false);
    }
  };

  // Show success state
  if (success) {
    return (
      <div className="rounded-2xl bg-card p-6 shadow-sm">
        <div className="text-center">
          <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
          <h2 className="mt-4 text-xl font-bold text-green-700">注册成功！</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            正在跳转到登录页面...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-card p-6 shadow-sm">
      <div className="mb-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <MapPin className="h-8 w-8 text-primary" />
        </div>
        <h1 className="mt-4 text-xl font-bold">注册拉了么</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          开启你的肠道友好之旅
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {submitError && (
          <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-600">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-medium">
            昵称 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (fieldErrors.name) setFieldErrors((p) => ({ ...p, name: undefined }));
            }}
            placeholder="你的昵称"
            required
            className={cn(
              "w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:ring-1",
              fieldErrors.name
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : "focus:border-primary focus:ring-primary"
            )}
          />
          {fieldErrors.name && (
            <p className="mt-1 text-xs text-red-500">{fieldErrors.name}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">
            邮箱 <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined }));
            }}
            placeholder="your@email.com"
            required
            className={cn(
              "w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:ring-1",
              fieldErrors.email
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : "focus:border-primary focus:ring-primary"
            )}
          />
          {fieldErrors.email && (
            <p className="mt-1 text-xs text-red-500">{fieldErrors.email}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">
            密码 <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined }));
            }}
            placeholder="至少6位"
            required
            minLength={6}
            className={cn(
              "w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:ring-1",
              fieldErrors.password
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : "focus:border-primary focus:ring-primary"
            )}
          />
          {fieldErrors.password && (
            <p className="mt-1 text-xs text-red-500">{fieldErrors.password}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 disabled:opacity-50"
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          {isLoading ? "注册中..." : "创建账号"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        已有账号？{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          登录
        </Link>
      </p>
    </div>
  );
}
