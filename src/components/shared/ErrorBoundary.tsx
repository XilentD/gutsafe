"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { MapPin, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error.message, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex min-h-dvh flex-col items-center justify-center bg-background p-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
            <MapPin className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="mt-4 text-lg font-bold">出了一点小问题</h2>
          <p className="mt-1 max-w-xs text-center text-sm text-muted-foreground">
            页面遇到了意外错误，请刷新重试
          </p>
          {this.state.error && (
            <p className="mt-3 max-w-xs rounded-lg bg-muted p-3 text-xs text-muted-foreground">
              {this.state.error.message}
            </p>
          )}
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow transition-all hover:bg-primary/90"
            >
              <RefreshCw className="h-4 w-4" /> 刷新页面
            </button>
            <button
              onClick={() => (window.location.href = "/map")}
              className="inline-flex items-center gap-2 rounded-lg border bg-card px-5 py-2.5 text-sm font-medium transition-all hover:bg-muted"
            >
              <Home className="h-4 w-4" /> 回到首页
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
