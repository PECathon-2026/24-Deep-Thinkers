import type { PowProgress } from '../types';

export interface PowResult {
  nonce: string;
  hash: string;
  timeMs: number;
  totalHashes: number;
}

/**
 * Worker script as a string to instantiate an inline Blob Web Worker
 */
const WORKER_CODE = `
self.onmessage = async function(e) {
  const { challenge, difficulty } = e.data;
  const targetPrefix = '0'.repeat(difficulty);
  const encoder = new TextEncoder();

  let nonce = 0;
  let lastReportTime = performance.now();
  const startTime = lastReportTime;
  let hashesInWindow = 0;

  while (true) {
    const candidate = challenge + ':' + nonce;
    const data = encoder.encode(candidate);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    
    // Convert to hex
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    hashesInWindow++;

    if (hashHex.startsWith(targetPrefix)) {
      const totalTime = performance.now() - startTime;
      self.postMessage({
        type: 'complete',
        nonce: String(nonce),
        hash: hashHex,
        timeMs: Math.round(totalTime),
        totalHashes: nonce + 1
      });
      break;
    }

    // Report progress every 150ms
    const now = performance.now();
    if (now - lastReportTime > 150) {
      const elapsedSec = (now - lastReportTime) / 1000;
      const hashRate = Math.round(hashesInWindow / elapsedSec);
      
      // Rough heuristic progress estimation based on expected 16^difficulty tries
      const expectedAttempts = Math.pow(16, difficulty);
      const estPercent = Math.min(99, Math.round((nonce / expectedAttempts) * 100));

      self.postMessage({
        type: 'progress',
        hashesComputed: nonce,
        nonce,
        hashRate,
        percent: estPercent,
        currentHash: hashHex
      });

      lastReportTime = now;
      hashesInWindow = 0;
    }

    nonce++;
  }
};
`;

/**
 * Runs the Proof of Work SHA-256 puzzle in a background Web Worker
 */
export function solvePowPuzzle(
  challenge: string,
  difficulty: number,
  onProgress?: (progress: PowProgress) => void
): { promise: Promise<PowResult>; cancel: () => void } {
  let worker: Worker | null = null;
  let isCancelled = false;

  const promise = new Promise<PowResult>((resolve, reject) => {
    try {
      const blob = new Blob([WORKER_CODE], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      worker = new Worker(workerUrl);

      worker.onmessage = (event) => {
        if (isCancelled) return;
        const msg = event.data;

        if (msg.type === 'progress') {
          if (onProgress) {
            onProgress({
              hashesComputed: msg.hashesComputed,
              nonce: msg.nonce,
              hashRate: msg.hashRate,
              percent: msg.percent,
              foundHash: msg.currentHash,
            });
          }
        } else if (msg.type === 'complete') {
          URL.revokeObjectURL(workerUrl);
          worker?.terminate();
          resolve({
            nonce: msg.nonce,
            hash: msg.hash,
            timeMs: msg.timeMs,
            totalHashes: msg.totalHashes,
          });
        }
      };

      worker.onerror = (err) => {
        URL.revokeObjectURL(workerUrl);
        worker?.terminate();
        reject(err);
      };

      worker.postMessage({ challenge, difficulty });
    } catch (err) {
      reject(err);
    }
  });

  const cancel = () => {
    isCancelled = true;
    if (worker) {
      worker.terminate();
      worker = null;
    }
  };

  return { promise, cancel };
}
