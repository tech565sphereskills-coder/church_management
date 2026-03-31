import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCcw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center p-6 text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-600">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-slate-900">Something went wrong</h2>
          <p className="mb-8 max-w-md text-slate-500">
            We encountered an unexpected error. Please try refreshing the page or return to the dashboard.
          </p>
          <div className="flex gap-4">
            <Button 
              onClick={() => window.location.reload()}
              variant="outline"
              className="gap-2"
            >
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </Button>
            <Button 
              onClick={() => window.location.href = '/'}
              className="btn-gold gap-2"
            >
              <Home className="h-4 w-4" />
              Go Home
            </Button>
          </div>
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-8 max-w-2xl overflow-auto rounded-lg bg-slate-50 p-4 text-left text-xs font-mono text-slate-700 border border-slate-200">
              {this.state.error?.toString()}
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
