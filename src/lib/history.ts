import type { AnalysisResult } from '../types/analysis'

const DB_NAME = 'pulselens-history', STORE = 'analyses', VERSION = 1, MAX_IMPORT_BYTES = 5 * 1024 * 1024
export interface HistoryBackup { schemaVersion: 1; exportedAt: string; analyses: AnalysisResult[] }
const sentiments = new Set(['positive', 'negative', 'neutral'])
const valid = (item: unknown): item is AnalysisResult => {
  const value = item as Partial<AnalysisResult> | null
  const totalFeedback = value?.totalFeedback
  if (!value || typeof value !== 'object' || typeof value.analysisId !== 'string' || !value.analysisId ||
    typeof value.analysisName !== 'string' || !value.analysisName || typeof value.createdAt !== 'string' ||
    Number.isNaN(Date.parse(value.createdAt)) || !Number.isInteger(totalFeedback) || (totalFeedback ?? -1) < 0 ||
    !value.sentimentDistribution || !Number.isInteger(value.sentimentDistribution.positive) ||
    !Number.isInteger(value.sentimentDistribution.negative) || !Number.isInteger(value.sentimentDistribution.neutral) ||
    !Array.isArray(value.feedback) || value.feedback.length !== totalFeedback ||
    !Array.isArray(value.aspectSummaries) || !Array.isArray(value.insights) || !value.metadata ||
    typeof value.metadata.isDemo !== 'boolean') return false
  const distribution = value.sentimentDistribution
  if (distribution.positive < 0 || distribution.negative < 0 || distribution.neutral < 0 ||
    distribution.positive + distribution.negative + distribution.neutral !== totalFeedback) return false
  const ids = new Set<string>()
  if (!value.feedback.every(record => {
    if (!record || typeof record.id !== 'string' || !record.id || ids.has(record.id) ||
      typeof record.text !== 'string' || !sentiments.has(record.sentiment) || !Array.isArray(record.aspects) ||
      !record.aspects.every(aspect => typeof aspect === 'string') ||
      (record.sentimentScore !== undefined && record.sentimentScore !== null && typeof record.sentimentScore !== 'number')) return false
    ids.add(record.id)
    return true
  }) || !value.aspectSummaries.every(summary => Boolean(summary) &&
    typeof summary.aspect === 'string' && Number.isInteger(summary.count) && summary.count >= 0 &&
    Number.isInteger(summary.positive) && Number.isInteger(summary.negative) && Number.isInteger(summary.neutral) &&
    summary.positive >= 0 && summary.negative >= 0 && summary.neutral >= 0 &&
    summary.positive + summary.negative + summary.neutral === summary.count) ||
    !Array.isArray(value.availableSources) || !value.availableSources.every(source => typeof source === 'string')) return false
  return value.insights.every(insight => Boolean(insight) && typeof insight.id === 'string' &&
    typeof insight.title === 'string' && typeof insight.description === 'string' &&
    typeof insight.statistic === 'string' && Array.isArray(insight.feedbackIds) &&
    insight.feedbackIds.every(id => ids.has(id)) &&
    ['high', 'medium', 'low'].includes(insight.severity))
}
function database(): Promise<IDBDatabase> { return new Promise((resolve, reject) => { if (!('indexedDB' in window)) return reject(new Error('Browser storage is unavailable.')); const request = indexedDB.open(DB_NAME, VERSION); request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE, { keyPath: 'analysisId' }) }; request.onsuccess = () => resolve(request.result); request.onerror = () => reject(new Error('Could not open browser storage.')) }) }
function request<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> { return database().then(db => new Promise<T>((resolve, reject) => { const transaction = db.transaction(STORE, mode); const operation = action(transaction.objectStore(STORE)); operation.onsuccess = () => resolve(operation.result); operation.onerror = () => reject(new Error('Browser storage operation failed.')); transaction.oncomplete = () => db.close() })) }
export const historyStore = { list: async () => ((await request<AnalysisResult[]>('readonly', store => store.getAll())).filter(valid).sort((a,b) => b.createdAt.localeCompare(a.createdAt))), get: async (id: string) => { const item = await request<unknown>('readonly', store => store.get(id)); return valid(item) ? item : null }, save: (analysis: AnalysisResult) => request<IDBValidKey>('readwrite', store => store.put(analysis)), remove: (id: string) => request<undefined>('readwrite', store => store.delete(id)), clear: () => request<undefined>('readwrite', store => store.clear()), backup: (analyses: AnalysisResult[]): HistoryBackup => ({ schemaVersion: 1, exportedAt: new Date().toISOString(), analyses }), import: async (backup: unknown) => { const data = backup as Partial<HistoryBackup> | null; if (!data || data.schemaVersion !== 1 || !Array.isArray(data.analyses) || !data.analyses.every(valid)) throw new Error('This file is not a compatible PulseLens history backup.'); const seen = new Set((await historyStore.list()).map(item => item.analysisId)); const deduplicated = data.analyses.filter(item => { if (seen.has(item.analysisId)) return false; seen.add(item.analysisId); return true }); await Promise.all(deduplicated.map(item => historyStore.save(item))); return { imported: deduplicated.length, skipped: data.analyses.length - deduplicated.length } }, maxImportBytes: MAX_IMPORT_BYTES }
