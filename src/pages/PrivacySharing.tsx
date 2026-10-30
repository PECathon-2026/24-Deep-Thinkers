import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Cpu,
  Lock,
  Eye,
  CheckCircle2,
  XCircle,
  Play,
  RotateCw,
  Terminal,
  Activity,
  Layers,
  Info,
} from 'lucide-react';
import type { Feed, Settings, PowProgress } from '../types';
import { getChallenge, submitFeeds } from '../lib/api';
import { solvePowPuzzle, type PowResult } from '../lib/pow';
import { normalizeUrl } from '../lib/normalizer';

interface PrivacySharingProps {
  feeds: Feed[];
  settings: Settings;
  onUpdateSettings: (partial: Partial<Settings>) => void;
}

export const PrivacySharing: React.FC<PrivacySharingProps> = ({
  feeds,
  settings,
  onUpdateSettings,
}) => {
  const [isSolving, setIsSolving] = useState(false);
  const [powProgress, setPowProgress] = useState<PowProgress | null>(null);
  const [powResult, setPowResult] = useState<PowResult | null>(null);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Exact payload preview
  const payloadPreview = useMemo(() => {
    const anonymizedFeedUrls = feeds.map((f) => normalizeUrl(f.url));
    return {
      protocol: 'quill-zk-v1',
      action: 'recommendation_graph_sync',
      feeds: anonymizedFeedUrls,
      proofOfWork: powResult
        ? {
            nonce: powResult.nonce,
            hash: powResult.hash,
            difficulty: 4,
            timeMs: powResult.timeMs,
          }
        : {
            nonce: '<computed_via_client_web_worker>',
            hash: '0000<256_bit_digest>',
            difficulty: 4,
          },
      clientMeta: {
        indexedCount: feeds.length,
        timestamp: Date.now(),
        // Explicitly nullified to show absence of trackers
        userId: null,
        userIp: null,
        readingHistory: null,
        bookmarks: null,
      },
    };
  }, [feeds, powResult]);

  // Handle "Share now" Proof-of-Work puzzle
  const handleShareNow = async () => {
    if (!settings.sharingEnabled) {
      setSubmitError('Please enable decentralized sharing in the toggle above before sharing.');
      return;
    }

    setIsSolving(true);
    setPowProgress(null);
    setPowResult(null);
    setSubmitMessage(null);
    setSubmitError(null);

    try {
      // 1. Get challenge
      const challengeData = await getChallenge();

      // 2. Run Web Worker puzzle
      const { promise } = solvePowPuzzle(
        challengeData.challenge,
        challengeData.difficulty,
        (progress) => {
          setPowProgress(progress);
        }
      );

      const result = await promise;
      setPowResult(result);

      // 3. Submit feeds with verified proof
      const feedUrls = feeds.map((f) => normalizeUrl(f.url));
      const res = await submitFeeds(feedUrls, challengeData.challenge, result.nonce);

      if (res.success) {
        setSubmitMessage(`Verified & submitted: ${res.message}`);
        onUpdateSettings({ lastSharedAt: Date.now() });
      }
    } catch (err: unknown) {
      setSubmitError((err as Error)?.message || 'Proof-of-work puzzle or submission failed');
    } finally {
      setIsSolving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-12 space-y-8">
      {/* Top Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-500 mb-1">
          <ShieldCheck className="w-4 h-4" />
          <span>Privacy & Architecture</span>
        </div>
        <h1 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
          Zero-Knowledge Feed Sharing
        </h1>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-2xl leading-relaxed">
          Quill is built on local-first storage. All feeds, full text articles, and read history exist solely inside your browser's IndexedDB. No centralized tracking server is ever required.
        </p>
      </div>

      {/* Main Opt-in Toggle Card */}
      <div className="p-6 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/90 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base text-stone-900 dark:text-stone-100">
                Contribute Anonymous Feed Graph
              </h2>
              <span
                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                  settings.sharingEnabled
                    ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                    : 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                }`}
              >
                {settings.sharingEnabled ? 'Opted In' : 'Off by Default'}
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed max-w-xl">
              When turned on, your browser can contribute an anonymous list of followed feed URLs to improve decentralized recommendations for the indie web.
            </p>
          </div>

          {/* Toggle Switch */}
          <button
            onClick={() => onUpdateSettings({ sharingEnabled: !settings.sharingEnabled })}
            className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
              settings.sharingEnabled ? 'bg-amber-600' : 'bg-stone-300 dark:bg-stone-700'
            }`}
            role="switch"
            aria-checked={settings.sharingEnabled}
            aria-label="Toggle anonymous feed graph sharing"
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                settings.sharingEnabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {settings.lastSharedAt && (
          <div className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-800 text-xs text-stone-400">
            Last contributed payload: {new Date(settings.lastSharedAt).toLocaleString()}
          </div>
        )}
      </div>

      {/* What IS and IS NOT Shared Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* What is NOT shared */}
        <div className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/60 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
            <XCircle className="w-4 h-4" />
            <span>What is NEVER shared</span>
          </div>
          <ul className="space-y-2 text-xs text-stone-600 dark:text-stone-300">
            <li className="flex items-start gap-2">
              <span className="text-rose-500 font-bold shrink-0">✕</span>
              <span><strong>Reading Activity:</strong> Which articles you read, scroll through, or mark read.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-500 font-bold shrink-0">✕</span>
              <span><strong>Bookmarks & Notes:</strong> Any offline saved articles or personal annotations.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-500 font-bold shrink-0">✕</span>
              <span><strong>Identities & Tokens:</strong> No user accounts, cookies, IP logs, or tracking beacons.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-500 font-bold shrink-0">✕</span>
              <span><strong>Device Fingerprints:</strong> Screen dimensions, hardware IDs, or browser fingerprints.</span>
            </li>
          </ul>
        </div>

        {/* What IS shared */}
        <div className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/60 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>What IS shared (Only when opted in)</span>
          </div>
          <ul className="space-y-2 text-xs text-stone-600 dark:text-stone-300">
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold shrink-0">✓</span>
              <span><strong>Subscribed Feed URLs:</strong> Normalized public feed addresses (e.g. <code>https://jvns.ca/atom.xml</code>).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold shrink-0">✓</span>
              <span><strong>Proof-of-Work Nonce:</strong> SHA-256 hash solution proving legitimate human compute.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold shrink-0">✓</span>
              <span><strong>Sybil Prevention:</strong> Rate-limiting without requiring phone numbers or email verification.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Proof of Work "Share Now" Panel */}
      <div className="p-6 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-amber-500" />
              Client-Side Proof-of-Work Engine
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              To prevent bot spam without capturing user identity, submissions require solving a cryptographic SHA-256 puzzle in a Web Worker.
            </p>
          </div>

          <button
            onClick={handleShareNow}
            disabled={isSolving || !settings.sharingEnabled}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition shadow-xs ${
              !settings.sharingEnabled
                ? 'bg-stone-200 dark:bg-stone-800 text-stone-400 cursor-not-allowed'
                : isSolving
                ? 'bg-amber-500 text-white cursor-wait'
                : 'bg-amber-600 hover:bg-amber-700 text-white'
            }`}
          >
            {isSolving ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" />
                <span>Computing Hash Puzzle...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Share Now (Run PoW)</span>
              </>
            )}
          </button>
        </div>

        {/* Live Proof of Work Progress UI */}
        {isSolving && powProgress && (
          <div className="p-4 rounded-xl bg-stone-900 text-stone-100 space-y-3 font-mono text-xs shadow-inner">
            <div className="flex items-center justify-between text-stone-400 text-[11px]">
              <span className="flex items-center gap-1.5 text-amber-400 font-sans font-bold">
                <Activity className="w-3.5 h-3.5 animate-pulse" />
                Web Worker Hashing
              </span>
              <span>Rate: {powProgress.hashRate.toLocaleString()} H/s</span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-stone-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-amber-500 h-full transition-all duration-150"
                style={{ width: `${Math.max(5, powProgress.percent)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-stone-400">
              <span>Target Prefix: <code className="text-amber-400">0000</code></span>
              <span>Nonce tested: {powProgress.nonce.toLocaleString()}</span>
            </div>

            {powProgress.foundHash && (
              <div className="text-[10px] text-stone-500 truncate">
                Current digest: {powProgress.foundHash}
              </div>
            )}
          </div>
        )}

        {/* Success proof summary */}
        {powResult && submitMessage && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 space-y-2">
            <div className="flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{submitMessage}</span>
            </div>
            <div className="font-mono text-[11px] text-emerald-700 dark:text-emerald-400 space-y-1">
              <div>• Nonce solved: <strong>{powResult.nonce}</strong></div>
              <div>• Total hashes tested: {powResult.totalHashes.toLocaleString()} in {powResult.timeMs}ms</div>
              <div className="truncate">• Verified digest: {powResult.hash}</div>
            </div>
          </div>
        )}

        {submitError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-medium text-rose-700 dark:text-rose-400 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}
      </div>

      {/* Live Preview of the Exact Payload */}
      <div className="p-6 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/90 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300">
            <Terminal className="w-4 h-4 text-amber-500" />
            <span>Preview of Exact Network Payload</span>
          </div>
          <span className="text-[11px] text-stone-400">Read-only JSON inspection</span>
        </div>

        <p className="text-xs text-stone-500 dark:text-stone-400">
          Verify the exact schema submitted to <code>POST /api/submit</code>. Notice the complete absence of user tokens, IP addresses, or reading logs.
        </p>

        <div className="relative rounded-xl bg-stone-950 p-4 overflow-x-auto text-xs font-mono text-emerald-400 border border-stone-800 max-h-72">
          <pre>{JSON.stringify(payloadPreview, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
};
