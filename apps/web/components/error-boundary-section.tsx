'use client';
import { Component, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  section?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundarySection extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[ErrorBoundary][${this.props.section ?? 'unknown'}]`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex items-center justify-center p-6 gap-3 text-sm text-ink-3 bg-surface-2/50 dark:bg-white/5 rounded-xl border border-border/60">
          <AlertTriangle size={16} className="text-gold" />
          <span>Ce module est temporairement indisponible.</span>
        </div>
      );
    }
    return this.props.children;
  }
}
