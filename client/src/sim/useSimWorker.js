/**
 * Hook to manage simulation worker
 * Provides worker-based simulation with fallback to synchronous mode
 */
import { useEffect, useRef, useState } from 'react';
/**
 * Custom hook to manage the simulation worker
 */
export function useSimWorker({ enabled, buildings, people, environment }) {
    const workerRef = useRef(null);
    const [ready, setReady] = useState(false);
    const pendingResolveRef = useRef(null);
    useEffect(() => {
        if (!enabled) {
            setReady(false);
            if (workerRef.current) {
                workerRef.current.terminate();
                workerRef.current = null;
            }
            return;
        }
        try {
            // Create worker
            const worker = new Worker(new URL('../sim/worker.ts', import.meta.url), { type: 'module' });
            workerRef.current = worker;
            // Handle messages from worker
            worker.onmessage = (e) => {
                const { type, payload } = e.data;
                switch (type) {
                    case 'worker_ready':
                        // Initialize worker with current state
                        worker.postMessage({
                            type: 'init',
                            payload: { buildings, people, environment }
                        });
                        break;
                    case 'ready':
                        setReady(true);
                        console.log('[Worker] Ready');
                        break;
                    case 'tick_result':
                        // Resolve pending tick promise
                        if (pendingResolveRef.current) {
                            pendingResolveRef.current(payload);
                            pendingResolveRef.current = null;
                        }
                        break;
                    case 'state_updated':
                        // State update acknowledged
                        break;
                    default:
                        console.warn('[Worker] Unknown message type:', type);
                }
            };
            worker.onerror = (error) => {
                console.error('[Worker] Error:', error);
                setReady(false);
            };
            return () => {
                worker.terminate();
                workerRef.current = null;
                setReady(false);
            };
        }
        catch (error) {
            console.error('[Worker] Failed to create worker:', error);
            setReady(false);
        }
    }, [enabled]); // Only recreate if enabled changes
    // Update worker state when buildings/people/environment change externally
    useEffect(() => {
        if (ready && workerRef.current) {
            workerRef.current.postMessage({
                type: 'update_state',
                payload: { buildings, people, environment }
            });
        }
    }, [buildings.length, people.length, environment, ready]);
    const tick = async (dt, speed) => {
        if (!ready || !workerRef.current) {
            return null;
        }
        return new Promise((resolve) => {
            pendingResolveRef.current = resolve;
            workerRef.current.postMessage({
                type: 'tick',
                payload: { dt, speed, environment }
            });
            // Timeout fallback (100ms)
            setTimeout(() => {
                if (pendingResolveRef.current) {
                    console.warn('[Worker] Tick timeout, using null result');
                    pendingResolveRef.current(null);
                    pendingResolveRef.current = null;
                }
            }, 100);
        });
    };
    const updateState = (state) => {
        if (ready && workerRef.current) {
            workerRef.current.postMessage({
                type: 'update_state',
                payload: state
            });
        }
    };
    return { ready, tick, updateState };
}
