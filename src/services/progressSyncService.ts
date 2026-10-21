import { useState, useEffect, useCallback } from 'react';
import { ClassroomSubmission, ClassroomAssignment } from '../types/classroom';
import { db } from './localStorageService';
import { accountService } from './accountService';

export interface ClassProgressSummary {
  kelas: string;
  totalStudents: number;
  totalAssignments: number;
  expectedSubmissions: number;
  submittedCount: number;
  gradedCount: number;
  completionRate: number; // 0 - 100
}

export interface ProgressMetrics {
  timestamp: number;
  globalCompletionRate: number; // 0 - 100
  totalStudents: number;
  totalAssignments: number;
  totalExpectedSubmissions: number;
  totalSubmitted: number;
  totalGraded: number;
  classSummaries: Record<string, ClassProgressSummary>;
  recentEvents: Array<{
    id: string;
    timestamp: number;
    studentId: string;
    studentName: string;
    assignmentId: string;
    assignmentTitle: string;
    kelas: string;
    status: 'DRAFT' | 'SUBMITTED' | 'GRADED';
    nilai?: number;
    actionType: 'SAVE' | 'GRADE' | 'BULK_GRADE';
  }>;
}

const BROADCAST_CHANNEL_NAME = 'sdn6_progress_sync_v1';
const CUSTOM_EVENT_NAME = 'sdn6_submission_status_changed';
const STORAGE_KEY_METRICS = 'BB_PROGRESS_SYNC_METRICS_CACHE';

class ProgressSyncService {
  private channel: BroadcastChannel | null = null;
  private subscribers: Set<(metrics: ProgressMetrics) => void> = new Set();
  private cachedMetrics: ProgressMetrics | null = null;

  constructor() {
    this.initCommunicationChannels();
  }

  private initCommunicationChannels() {
    if (typeof window === 'undefined') return;

    // 1. BroadcastChannel for cross-tab multi-user real-time sync
    try {
      if ('BroadcastChannel' in window) {
        this.channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        this.channel.onmessage = (event) => {
          if (event.data && event.data.type === 'PROGRESS_SYNC_EVENT') {
            this.handleRemoteSync(event.data.metrics);
          }
        };
      }
    } catch (e) {
      console.warn('BroadcastChannel not available for ProgressSyncService:', e);
    }

    // 2. CustomEvent listener for same-window component sync
    window.addEventListener(CUSTOM_EVENT_NAME, ((e: CustomEvent) => {
      if (e.detail && e.detail.metrics) {
        this.handleRemoteSync(e.detail.metrics);
      }
    }) as EventListener);

    // 3. Storage event listener for fallback tab sync
    window.addEventListener('storage', (e) => {
      if (e.key === 'BB_CLASSROOM_SUBMISSIONS' || e.key === STORAGE_KEY_METRICS) {
        this.recalculateAndBroadcast('EXTERNAL');
      }
    });

    // 4. Initial calculation
    this.cachedMetrics = this.calculateMetrics();
  }

  /**
   * Calculates comprehensive student completion metrics across all active assignments and classes.
   */
  public calculateMetrics(targetClassFilter?: string): ProgressMetrics {
    let submissions: ClassroomSubmission[] = [];
    let assignments: ClassroomAssignment[] = [];
    let students: any[] = [];

    try {
      const rawSubs = localStorage.getItem('BB_CLASSROOM_SUBMISSIONS');
      submissions = rawSubs ? JSON.parse(rawSubs) : [];
    } catch {
      submissions = [];
    }

    try {
      const rawAsgs = localStorage.getItem('BB_CLASSROOM_ASSIGNMENTS');
      assignments = rawAsgs ? JSON.parse(rawAsgs) : [];
    } catch {
      assignments = [];
    }

    try {
      students = accountService.getStudents();
    } catch {
      students = [];
    }

    const standardClasses = ['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6'];
    const classSummaries: Record<string, ClassProgressSummary> = {};

    let totalStudents = students.length || 0;
    let totalAssignments = assignments.length || 0;

    let totalExpectedSubmissions = 0;
    let totalSubmitted = 0;
    let totalGraded = 0;

    // Build per-class summaries
    standardClasses.forEach((kls) => {
      const classStudents = students.filter((s) => s.KELAS === kls);
      const studentIds = new Set(classStudents.map((s) => s.ID));

      // Get courses & assignments for this class
      const classAssignments = assignments.filter((a) => {
        return a.GURU_NAMA?.includes(kls) || a.JUDUL?.includes(kls) || true; // fallback
      });

      const expected = classStudents.length * Math.max(1, classAssignments.length);

      const classSubmissions = submissions.filter((s) => {
        const isClassStudent = studentIds.has(s.SISWA_ID);
        return isClassStudent && (s.STATUS === 'SUBMITTED' || s.STATUS === 'GRADED');
      });

      const submitted = classSubmissions.length;
      const graded = classSubmissions.filter((s) => s.STATUS === 'GRADED').length;
      const rate = expected > 0 ? Math.min(100, Math.round((submitted / expected) * 100)) : 0;

      classSummaries[kls] = {
        kelas: kls,
        totalStudents: classStudents.length,
        totalAssignments: classAssignments.length,
        expectedSubmissions: expected,
        submittedCount: submitted,
        gradedCount: graded,
        completionRate: rate,
      };

      totalExpectedSubmissions += expected;
    });

    // Global counts across all submissions
    const validSubmissions = submissions.filter(
      (s) => s.STATUS === 'SUBMITTED' || s.STATUS === 'GRADED'
    );
    totalSubmitted = validSubmissions.length;
    totalGraded = validSubmissions.filter((s) => s.STATUS === 'GRADED').length;

    // Base total expected submissions fallback
    if (totalExpectedSubmissions === 0) {
      totalExpectedSubmissions = Math.max(1, totalStudents * Math.max(1, totalAssignments));
    }

    const globalCompletionRate = Math.min(
      100,
      Math.round((totalSubmitted / Math.max(1, totalExpectedSubmissions)) * 100)
    );

    // Extract recent events
    const recentEvents = submissions
      .slice()
      .sort((a, b) => (b.SUBMITTED_AT || '').localeCompare(a.SUBMITTED_AT || ''))
      .slice(0, 15)
      .map((sub) => ({
        id: sub.ID,
        timestamp: sub.SUBMITTED_AT ? new Date(sub.SUBMITTED_AT).getTime() : Date.now(),
        studentId: sub.SISWA_ID,
        studentName: sub.SISWA_NAMA || 'Siswa',
        assignmentId: sub.ASSIGNMENT_ID,
        assignmentTitle: `Tugas ${sub.ASSIGNMENT_ID.slice(-6)}`,
        kelas: 'SDN 6 Banyuasin III',
        status: sub.STATUS,
        nilai: sub.NILAI,
        actionType: (sub.STATUS === 'GRADED' ? 'GRADE' : 'SAVE') as 'SAVE' | 'GRADE',
      }));

    const metrics: ProgressMetrics = {
      timestamp: Date.now(),
      globalCompletionRate,
      totalStudents,
      totalAssignments,
      totalExpectedSubmissions,
      totalSubmitted,
      totalGraded,
      classSummaries,
      recentEvents,
    };

    return metrics;
  }

  /**
   * Called when an assignment submission status changes in ClassroomAssignment.
   * Calculates new progress and broadcasts to all subscribers and tabs instantly.
   */
  public notifySubmissionChange(
    submission: ClassroomSubmission,
    actionType: 'SAVE' | 'GRADE' | 'BULK_GRADE' = 'SAVE'
  ): ProgressMetrics {
    const newMetrics = this.calculateMetrics();
    this.cachedMetrics = newMetrics;

    // Save cache
    try {
      localStorage.setItem(STORAGE_KEY_METRICS, JSON.stringify(newMetrics));
    } catch {}

    // Broadcast via BroadcastChannel to other tabs
    try {
      if (this.channel) {
        this.channel.postMessage({
          type: 'PROGRESS_SYNC_EVENT',
          submission,
          actionType,
          metrics: newMetrics,
        });
      }
    } catch (e) {
      console.warn('Failed to postMessage via BroadcastChannel:', e);
    }

    // Dispatch CustomEvent for same-window subscribers
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(CUSTOM_EVENT_NAME, {
          detail: { submission, actionType, metrics: newMetrics },
        })
      );
    }

    // Notify local subscribers
    this.notifySubscribers(newMetrics);

    return newMetrics;
  }

  public recalculateAndBroadcast(source: string = 'INTERNAL'): ProgressMetrics {
    const metrics = this.calculateMetrics();
    this.cachedMetrics = metrics;
    this.notifySubscribers(metrics);
    return metrics;
  }

  private handleRemoteSync(metrics: ProgressMetrics) {
    this.cachedMetrics = metrics;
    this.notifySubscribers(metrics);
  }

  private notifySubscribers(metrics: ProgressMetrics) {
    this.subscribers.forEach((cb) => {
      try {
        cb(metrics);
      } catch (err) {
        console.error('Error in progressSyncService subscriber:', err);
      }
    });
  }

  public getCachedMetrics(): ProgressMetrics {
    if (!this.cachedMetrics) {
      this.cachedMetrics = this.calculateMetrics();
    }
    return this.cachedMetrics;
  }

  public subscribe(callback: (metrics: ProgressMetrics) => void): () => void {
    this.subscribers.add(callback);
    // Send initial cached state
    callback(this.getCachedMetrics());

    return () => {
      this.subscribers.delete(callback);
    };
  }
}

export const progressSyncService = new ProgressSyncService();

/**
 * Custom React Hook to subscribe UI components to real-time student completion rate progress updates.
 */
export function useRealtimeProgress(targetClass?: string) {
  const [metrics, setMetrics] = useState<ProgressMetrics>(() =>
    progressSyncService.getCachedMetrics()
  );
  const [isLive, setIsLive] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());

  useEffect(() => {
    const unsubscribe = progressSyncService.subscribe((newMetrics) => {
      setMetrics(newMetrics);
      setLastUpdated(Date.now());
      setIsLive(true);
    });

    return () => unsubscribe();
  }, []);

  const classSummary = targetClass
    ? metrics.classSummaries[targetClass] || {
        kelas: targetClass,
        totalStudents: 0,
        totalAssignments: 0,
        expectedSubmissions: 0,
        submittedCount: 0,
        gradedCount: 0,
        completionRate: 0,
      }
    : null;

  const triggerSync = useCallback(() => {
    const updated = progressSyncService.recalculateAndBroadcast('HOOK');
    setMetrics(updated);
    setLastUpdated(Date.now());
  }, []);

  return {
    metrics,
    classSummary,
    lastUpdated,
    isLive,
    triggerSync,
  };
}
