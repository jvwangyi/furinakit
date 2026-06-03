'use client';

import React from 'react';

/**
 * Error reporting interface.
 * Implement this and pass to ErrorBoundary to send errors to your monitoring service.
 * Example: Sentry, custom endpoint, etc.
 */
export interface ErrorReporter {
  report(error: Error, errorInfo: React.ErrorInfo): void;
}

/**
 * Default no-op reporter. Replace with a real implementation when
 * integrating with an external monitoring service.
 */
const defaultReporter: ErrorReporter = {
  report(error, errorInfo) {
    if (process.env.NODE_ENV === 'development') {
      console.group('%c[ErrorBoundary] Uncaught Error', 'color: #ef4444; font-weight: bold');
      console.error('Error:', error);
      console.error('Component Stack:', errorInfo.componentStack);
      console.groupEnd();
    }
  },
};

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  /** Optional error reporter for external monitoring services */
  reporter?: ErrorReporter;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Use provided reporter or fall back to default (console in dev)
    const reporter = this.props.reporter ?? defaultReporter;
    reporter.report(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isDev = process.env.NODE_ENV === 'development';

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
          <div className="rounded-full bg-destructive/10 p-4 mb-4">
            <svg
              className="h-8 w-8 text-destructive"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Something went wrong
          </h2>
          <p className="text-sm text-muted-foreground mb-4 max-w-md">
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={this.handleReset}
            className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
          {isDev && this.state.error?.stack && (
            <details className="mt-4 w-full max-w-lg text-left">
              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                Error Details (dev only)
              </summary>
              <pre className="mt-2 p-3 rounded-md bg-muted text-xs text-muted-foreground overflow-x-auto whitespace-pre-wrap break-all">
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
