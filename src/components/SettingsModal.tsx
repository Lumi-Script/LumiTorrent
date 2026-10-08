'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Key,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Trash2,
  Zap,
  Shield,
  Eye,
  EyeOff,
  Server,
} from 'lucide-react';
import { useToast } from './Toast';
import { testTorboxKeyApi } from '../lib/api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSaveKey: (key: string) => void;
  onRecheckCache?: () => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  apiKey,
  onSaveKey,
  onRecheckCache,
}: SettingsModalProps) {
  const { toast } = useToast();
  const [inputKey, setInputKey] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    email?: string;
    plan?: string | number;
  } | null>(null);

  useEffect(() => {
    setInputKey(apiKey);
    setTestResult(null);
  }, [apiKey, isOpen]);

  const handleSave = () => {
    const trimmed = inputKey.trim();
    onSaveKey(trimmed);
    toast({
      type: 'success',
      title: 'Torbox Settings Saved',
      description: trimmed
        ? 'API Key saved. Hashes will now automatically check Torbox cache status.'
        : 'API Key removed.',
    });
    if (trimmed && onRecheckCache) {
      onRecheckCache();
    }
    onClose();
  };

  const handleClear = () => {
    setInputKey('');
    onSaveKey('');
    setTestResult(null);
    toast({
      type: 'info',
      title: 'API Key Cleared',
      description: 'Torbox API Key was removed.',
    });
  };

  const testConnection = async () => {
    const keyToTest = inputKey.trim();
    if (!keyToTest) {
      toast({
        type: 'error',
        title: 'Empty Key',
        description: 'Please paste your Torbox API key first.',
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const result = await testTorboxKeyApi(keyToTest);
      setTestResult(result);

      if (result.success) {
        toast({
          type: 'success',
          title: 'Torbox Connected',
          description: `Authorized as ${result.email || 'User'}`,
        });
      } else {
        toast({
          type: 'error',
          title: 'Torbox Test Failed',
          description: result.message || 'Invalid API Key.',
        });
      }
    } catch (err) {
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : 'Failed to reach Torbox API.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.18 }}
          className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl p-6 text-neutral-100 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-white">Torbox Configuration</h2>
                <p className="text-xs text-neutral-400">Manage instant debrid caching and API authorization</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
              aria-label="Close settings"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <div className="py-5 space-y-5">
            {/* API Key Input */}
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-neutral-400" />
                  Torbox API Key
                </span>
                <a
                  href="https://torbox.app/settings"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1 text-xs"
                >
                  Get key from Torbox <ExternalLink className="w-3 h-3" />
                </a>
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  placeholder="Paste your Torbox Bearer API key here..."
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg px-3.5 py-2.5 text-sm text-neutral-100 placeholder-neutral-600 font-mono pr-20"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="p-1 text-neutral-400 hover:text-neutral-200 rounded"
                    title={showKey ? 'Hide key' : 'Show key'}
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  {inputKey && (
                    <button
                      type="button"
                      onClick={handleClear}
                      className="p-1 text-neutral-400 hover:text-rose-400 rounded"
                      title="Clear key"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <p className="mt-1.5 text-xs text-neutral-400">
                Your key is stored securely in your browser&apos;s localStorage and passed via Bearer authorization headers.
              </p>
            </div>

            {/* Test Connection Button & Status */}
            <div className="p-3.5 bg-neutral-950/60 border border-neutral-800 rounded-lg flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-300">Connection Verification</span>
                <button
                  type="button"
                  onClick={testConnection}
                  disabled={isTesting || !inputKey.trim()}
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-xs font-medium text-white rounded-md transition-colors flex items-center gap-1.5"
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <Shield className="w-3.5 h-3.5 text-emerald-400" />
                      Test Key
                    </>
                  )}
                </button>
              </div>

              {testResult && (
                <div
                  className={`p-2.5 rounded text-xs flex items-start gap-2 ${
                    testResult.success
                      ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-950/40 border border-rose-500/30 text-rose-300'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  )}
                  <div>
                    <p className="font-medium">{testResult.message}</p>
                    {testResult.email && (
                      <p className="text-neutral-400 mt-0.5">
                        Account: <span className="text-neutral-200">{testResult.email}</span> · Plan: Tier {testResult.plan}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Cache Legend */}
            <div className="p-3.5 bg-neutral-950/60 border border-neutral-800 rounded-lg space-y-2">
              <h3 className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                Cache Status Indicator Guide
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2 p-2 rounded bg-neutral-900 border border-emerald-500/20">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500" />
                  <div>
                    <p className="font-medium text-emerald-300">Green / Cached</p>
                    <p className="text-[11px] text-neutral-400">Instant cloud download</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded bg-neutral-900 border border-rose-500/20">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500" />
                  <div>
                    <p className="font-medium text-rose-300">Red / Uncached</p>
                    <p className="text-[11px] text-neutral-400">Torbox swarm download</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-colors"
            >
              Save Configuration
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
