'use client';

import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import * as Sentry from '@sentry/nextjs';

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

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
    if (Sentry?.captureException) {
      Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } });
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] p-8 animate-fade-in">
          <div className="relative mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#E8334A]/10 to-[#E8334A]/5 border border-[#E8334A]/20 flex items-center justify-center shadow-sm">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E8334A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#E8334A] border-2 border-white dark:border-ink animate-pulse" />
          </div>
          <h2 className="font-display text-xl font-bold text-ink dark:text-white mb-2">Une erreur est survenue</h2>
          <p className="text-sm text-ink-3 text-center max-w-md mb-1 font-body leading-relaxed">
            {this.state.error?.message ?? 'Une erreur inattendue s\'est produite.'}
          </p>
          <p className="text-xs text-ink-3/60 text-center max-w-sm mb-6 font-body">
            Vous pouvez réessayer ou rafraîchir la page si le problème persiste.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#3B1FA8] to-[#5535C4] text-white text-sm font-semibold font-body shadow-md shadow-[#3B1FA8]/20 hover:shadow-lg hover:shadow-[#3B1FA8]/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              Réessayer
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-xl bg-white dark:bg-white/10 border border-border/60 text-ink dark:text-white text-sm font-semibold font-body hover:border-[#3B1FA8]/30 hover:shadow-sm transition-all duration-200"
            >
              Rafraîchir
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
