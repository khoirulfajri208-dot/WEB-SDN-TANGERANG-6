export interface OfflineQueueItem {
  id: string;
  type: 'SUBMISSION' | 'ATTENDANCE' | 'GRADE' | 'FORUM_POST';
  payload: any;
  timestamp: string;
}

const QUEUE_KEY = 'classroom_offline_queue_v1';

export const offlineSyncService = {
  getQueue(): OfflineQueueItem[] {
    try {
      const data = localStorage.getItem(QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  enqueue(type: OfflineQueueItem['type'], payload: any): OfflineQueueItem {
    const queue = this.getQueue();
    const newItem: OfflineQueueItem = {
      id: 'OFFLINE-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      type,
      payload,
      timestamp: new Date().toISOString(),
    };
    queue.push(newItem);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    return newItem;
  },

  dequeue(id: string) {
    const queue = this.getQueue().filter((item) => item.id !== id);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  },

  clearQueue() {
    localStorage.removeItem(QUEUE_KEY);
  },

  processSyncQueue(processItemCallback?: (item: OfflineQueueItem) => void): number {
    const queue = this.getQueue();
    if (queue.length === 0) return 0;

    let processedCount = 0;
    for (const item of queue) {
      if (processItemCallback) {
        processItemCallback(item);
      }
      processedCount++;
    }

    this.clearQueue();
    return processedCount;
  },
};
