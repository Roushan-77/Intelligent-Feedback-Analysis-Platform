/** Shared JSON contract: backend POST /api/analyze accepts CSV multipart data plus textColumn,
 * and returns AnalysisResult. Dates are ISO-8601 strings; absent data is null/undefined. */
export type Sentiment = 'positive' | 'negative' | 'neutral'
export type Aspect = 'Performance' | 'User Interface' | 'Pricing' | 'Customer Support' | 'Reliability' | 'Features' | 'Usability'

export interface FeedbackRecord { id: string; text: string; sentiment: Sentiment; sentimentScore?: number | null; aspects: Aspect[]; timestamp?: string | null; source?: string | null }
export interface SentimentDistribution { positive: number; negative: number; neutral: number }
export interface AspectSummary { aspect: Aspect; count: number; positive: number; negative: number; neutral: number }
export interface Insight { id: string; title: string; description: string; statistic: string; aspect?: Aspect; feedbackIds: string[]; severity: 'high' | 'medium' | 'low' }
export interface AnalysisMetadata { isDemo: boolean; sourceFilename?: string; textColumn?: string; status: 'ready' | 'processing' | 'error' }
export interface AnalysisResult { analysisId: string; analysisName: string; createdAt: string; totalFeedback: number; sentimentDistribution: SentimentDistribution; aspectSummaries: AspectSummary[]; feedback: FeedbackRecord[]; insights: Insight[]; availableSources: string[]; availableDateRange?: { start: string; end: string } | null; metadata: AnalysisMetadata }
export interface AnalysisRequest { file: File; textColumn: string; analysisName?: string }
export interface ApiError { detail: string; code?: string; field?: string }
