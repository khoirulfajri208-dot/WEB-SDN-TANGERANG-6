import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw, Home, AlertTriangle, CheckCircle2, Copy, Check } from 'lucide-react';
import { resilienceService } from '../../services/resilienceService';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
    copied: false,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null, copied: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    // Run automated self-healing routine
    try {
      resilienceService.executeBootSelfHealing();
    } catch (e) {
      console.warn('Auto self-healing during error boundary catch:', e);
    }
  }

  private handleReload = () => {
    try {
      resilienceService.executeBootSelfHealing();
    } catch {}
    window.location.reload();
  };

  private handleResetAndGoHome = () => {
    try {
      resilienceService.executeBootSelfHealing();
      localStorage.removeItem('BB_ACTIVE_CLASSROOM_ACCOUNT');
      window.location.href = window.location.origin;
    } catch {
      window.location.reload();
    }
  };

  private handleCopyError = () => {
    const errorDetails = `[SDN Tangerang 6 Error Log]
Timestamp: ${new Date().toISOString()}
Error: ${this.state.error?.message}
Stack: ${this.state.error?.stack}
Component Stack: ${this.state.errorInfo?.componentStack}`;

    navigator.clipboard.writeText(errorDetails).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 3000);
    });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <ShieldAlert size={26} />
              </div>
              <div>
                <div className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400">
                  Engine Resiliensi & Auto-Recovery
                </div>
                <h2 className="text-lg font-black text-white tracking-tight">
                  Sistem Pemulihan Otomatis SDN Tangerang 6
                </h2>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-slate-300 text-xs leading-relaxed space-y-2">
              <p className="font-semibold text-white">
                Aplikasi mendeteksi kendala pada antarmuka, namun seluruh data dan basis data Anda tetap aman.
              </p>
              <p className="text-slate-400 text-[11px]">
                Sistem pencegahan eror telah memvalidasi integritas data di penyimpanan lokal dan mengisolasi komponen yang terdampak agar tidak merusak data utama.
              </p>
            </div>

            {/* Error Message Box */}
            {this.state.error && (
              <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-900/60 text-rose-300 text-xs font-mono break-words leading-relaxed">
                <div className="text-[10px] font-bold uppercase tracking-wider text-rose-400 mb-1 flex items-center gap-1.5">
                  <AlertTriangle size={12} />
                  <span>Informasi Kendala:</span>
                </div>
                {this.state.error.message || 'Kendala eksekusi komponen tidak terduga'}
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/40 cursor-pointer"
              >
                <RefreshCw size={14} />
                <span>Muat Ulang & Pulihkan</span>
              </button>

              <button
                type="button"
                onClick={this.handleResetAndGoHome}
                className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-2 border border-slate-700 cursor-pointer"
              >
                <Home size={14} />
                <span>Kembali ke Beranda</span>
              </button>
            </div>

            {/* Footer with Technical Copy */}
            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
              <span className="text-[11px]">SDN Tangerang 6 Digital Suite</span>
              <button
                type="button"
                onClick={this.handleCopyError}
                className="hover:text-slate-300 transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
              >
                {this.state.copied ? (
                  <>
                    <Check size={12} className="text-emerald-400" />
                    <span className="text-emerald-400">Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    <span>Salin Log Kendala</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
