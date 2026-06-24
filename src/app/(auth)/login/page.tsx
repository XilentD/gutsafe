"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MapPin } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
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
      setError("登录失败，请重试");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-2xl bg-card p-6 shadow-sm">
      {/* Logo */}
      <div className="mb-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <MapPin className="h-8 w-8 text-primary" />
        </div>
        <h1 className="mt-4 text-xl font-bold">肠安地图</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          肠道友好，出行无忧
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-medium">邮箱</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">密码</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={6}
            className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 disabled:opacity-50"
        >
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
