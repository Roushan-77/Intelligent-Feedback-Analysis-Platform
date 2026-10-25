import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { demoAnalysis } from './lib/demo-data'
import type { AnalysisResult } from './types/analysis'
import { AppShell } from './components/layout/AppShell'
import { DashboardPage } from './pages/DashboardPage'
import { UploadPage } from './pages/UploadPage'
import { ExplorerPage } from './pages/ExplorerPage'
import { HistoryPage } from './pages/HistoryPage'
import { historyStore } from './lib/history'

export default function App() { const [analysis, setAnalysis] = useState<AnalysisResult | null>(demoAnalysis); const [history, setHistory] = useState<AnalysisResult[]>([]); const [storageError, setStorageError] = useState(''); const navigate = useNavigate(); const refresh = () => historyStore.list().then(setHistory).catch(error => setStorageError(error instanceof Error ? error.message : 'Browser storage is unavailable.')); useEffect(() => { refresh() }, []); const save = async (result: AnalysisResult) => { setAnalysis(result); try { await historyStore.save(result); await refresh() } catch (error) { setStorageError(error instanceof Error ? error.message : 'Analysis is available for this session, but could not be saved.') } }; const openHistory = async (id: string) => { const saved = await historyStore.get(id); if (saved) { setAnalysis(saved); navigate('/') } return saved }; return <AppShell analysis={analysis}>{storageError && <p className="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{storageError}</p>}<Routes><Route path="/" element={<DashboardPage analysis={analysis} />} /><Route path="/upload" element={<UploadPage onLoadDemo={() => save(demoAnalysis)} onAnalyzed={save} />} /><Route path="/explorer" element={<ExplorerPage analysis={analysis} />} /><Route path="/history" element={<HistoryPage history={history} activeAnalysisId={analysis?.analysisId} onOpen={openHistory} onChange={refresh} />} /><Route path="*" element={<Navigate to="/" replace />} /></Routes></AppShell> }
