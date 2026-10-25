import type { AnalysisRequest, AnalysisResult, ApiError } from '../types/analysis'
export class AnalysisApiError extends Error { constructor(message: string, public readonly status?: number) { super(message) } }
/** Backend boundary for Prompt 3: multipart POST /api/analyze with file, textColumn and analysisName. */
export async function analyzeFeedback(request: AnalysisRequest): Promise<AnalysisResult> {
  const form = new FormData(); form.append('file', request.file); form.append('text_column', request.textColumn); if (request.analysisName) form.append('analysis_name', request.analysisName)
  let response: Response
  try { response = await fetch('/api/analyze', { method: 'POST', body: form }) } catch { throw new AnalysisApiError('Network error. Check that the analysis service is running and try again.') }
  if (!response.ok) { const error = await response.json().catch(() => ({})) as ApiError; throw new AnalysisApiError(error.detail || 'Analysis request failed. Please check the file and try again.', response.status) }
  const data: unknown = await response.json()
  if (!isAnalysisResult(data)) throw new AnalysisApiError('The analysis service returned an unexpected response. Please try again.')
  return data
}

function isAnalysisResult(value: unknown): value is AnalysisResult { const item = value as Partial<AnalysisResult> | null; return !!item && typeof item === 'object' && typeof item.analysisId === 'string' && typeof item.totalFeedback === 'number' && Array.isArray(item.feedback) && Array.isArray(item.aspectSummaries) && !!item.sentimentDistribution }
