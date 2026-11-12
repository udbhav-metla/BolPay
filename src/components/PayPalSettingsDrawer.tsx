import React, { useState } from "react";
import {
  X,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  KeyRound,
  RefreshCw,
} from "lucide-react";
import type { PayPalConfig } from "../types";

interface PayPalSettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  config: PayPalConfig;
  onSaveConfig: (updated: PayPalConfig) => void;
}

export const PayPalSettingsDrawer: React.FC<PayPalSettingsDrawerProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [clientId, setClientId] = useState(config.clientId || "");
  const [clientSecret, setClientSecret] = useState(config.clientSecret || "");
  const [useLiveSandbox, setUseLiveSandbox] = useState(config.useLiveSandbox || false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    token?: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch("/api/paypal/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          clientSecret,
        }),
      });

      const data = await res.json();
      setTestResult(data);
      if (data.success) {
        setUseLiveSandbox(true);
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || "Network error connecting to PayPal.",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    onSaveConfig({
      ...config,
      clientId,
      clientSecret,
      useLiveSandbox,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between overflow-y-auto">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#003087] text-white flex items-center justify-center font-bold text-sm">
                P
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  PayPal Developer Sandbox
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Configure live PayPal Invoicing API v2 credentials
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 space-y-6">
            {/* Status overview */}
            <div className="p-4 bg-sky-50 dark:bg-slate-800/80 rounded-xl border border-sky-100 dark:border-slate-700 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-[#003087] dark:text-sky-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold text-slate-900 dark:text-white block">
                  Hackathon Ready Sandbox Mode
                </span>
                <p className="text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  BolPay is preloaded with active PayPal Invoicing Sandbox simulation. Every voice command generates compliant PayPal Invoicing structures, shareable checkout links, and verifiable QR codes.
                </p>
              </div>
            </div>

            {/* Custom developer credentials input */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-slate-400" /> Optional Custom Credentials
                </span>
                <a
                  href="https://developer.paypal.com/dashboard/applications/sandbox"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-sky-700 dark:text-sky-400 hover:underline flex items-center gap-1"
                >
                  developer.paypal.com <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  PayPal Sandbox Client ID
                </label>
                <input
                  type="text"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="e.g. A21AA... or leave blank for auto-sandbox"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#003087]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  PayPal Sandbox Client Secret
                </label>
                <input
                  type="password"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  placeholder="Enter secret to execute live REST requests"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#003087]"
                />
              </div>

              {/* Test Button */}
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting || !clientId || !clientSecret}
                className="w-full min-h-[44px] px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-40"
              >
                {isTesting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Testing against api-m.sandbox.paypal.com...
                  </>
                ) : (
                  <>Test PayPal OAuth 2.0 Token</>
                )}
              </button>

              {testResult && (
                <div
                  className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${
                    testResult.success
                      ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                      : "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300"
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                  )}
                  <div>
                    <span className="font-semibold block">{testResult.message}</span>
                    {testResult.token && (
                      <span className="font-mono text-[11px] block mt-0.5 opacity-80">
                        Token: {testResult.token}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3 bg-slate-50 dark:bg-slate-900/60">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 min-h-[44px] px-4 py-2 rounded-xl bg-[#003087] hover:bg-[#002466] text-white text-xs font-semibold shadow-xs transition-colors"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};
