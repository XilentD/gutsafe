"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { MapPin, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    if (searchParams?.get("registered") === "true") {
      setRegistered(true);
      // Auto-hide the success banner after 8 seconds
      const timer = setTimeout(() => setRegistered(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const validate = (): boolean => {
    const errors: typeof fieldErrors = {};
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
    setError("");
    setFieldErrors({});
    if (!validate()) return;
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("邮箱或密码错误");
      } else {
        router.push("/map");
        router.refresh();
      }
    } catch {
      setError("登录失败，请检查网络后重试");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-2xl bg-card p-6 shadow-sm">
      {/* Success banner */}
      {registered && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2.5 text-sm text-green-700 animate-fade-in">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>注册成功！请用刚才的账号登录</span>
        </div>
      )}

      {/* Logo */}
      <div className="mb-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <MapPin className="h-8 w-8 text-primary" />
        </div>
        <h1 className="mt-4 text-xl font-bold">拉了么</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          肠道友好，出行无忧
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && (
          <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-600">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

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
            placeholder="••••••••"
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
          {isLoading ? "登录中..." : "登录"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        还没有账号？{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          注册
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
