import type { AnalysisResult, Aspect, FeedbackRecord, Sentiment } from '../types/analysis'

const raw: Array<[string, Sentiment, Aspect[], string, string]> = [
  ['The new dashboard is intuitive and loads quickly. Great work!', 'positive', ['User Interface', 'Performance', 'Usability'], '2026-10-18', 'In-app'],
  ['Support took four days to respond to a billing question.', 'negative', ['Customer Support', 'Pricing'], '2026-10-18', 'Email'],
  ['Love the collaboration features, they save our team so much time.', 'positive', ['Features', 'Usability'], '2026-10-17', 'Survey'],
  ['The app freezes whenever I export a large report.', 'negative', ['Performance', 'Reliability'], '2026-10-17', 'In-app'],
  ['Pricing is fair for the functionality we use.', 'positive', ['Pricing'], '2026-10-16', 'Survey'],
  ['It works as expected, but the navigation could be clearer.', 'neutral', ['User Interface', 'Usability'], '2026-10-16', 'Email'],
  ['Login errors have become frequent this month.', 'negative', ['Reliability'], '2026-10-15', 'In-app'],
  ['The mobile experience is clean and easy to learn.', 'positive', ['User Interface', 'Usability'], '2026-10-15', 'Survey'],
  ['I need better bulk editing options for our workflow.', 'neutral', ['Features'], '2026-10-14', 'In-app'],
  ['Pages are painfully slow during peak hours.', 'negative', ['Performance'], '2026-10-14', 'Email'],
  ['Customer support solved my issue professionally.', 'positive', ['Customer Support'], '2026-10-13', 'Survey'],
  ['The new feature is useful but crashes occasionally.', 'negative', ['Features', 'Reliability'], '2026-10-13', 'In-app'],
  ['Setup was straightforward and documentation was helpful.', 'positive', ['Usability'], '2026-10-12', 'Survey'],
  ['I would like an annual pricing option.', 'neutral', ['Pricing'], '2026-10-12', 'Email'],
  ['The interface feels polished and consistent.', 'positive', ['User Interface'], '2026-10-11', 'In-app'],
  ['Notifications arrive late, which affects our response time.', 'negative', ['Reliability', 'Performance'], '2026-10-11', 'Email'],
]
const feedback: FeedbackRecord[] = raw.map(([text, sentiment, aspects, timestamp, source], index) => ({ id: `demo-${index + 1}`, text, sentiment, aspects, timestamp, source, sentimentScore: sentiment === 'positive' ? 0.84 : sentiment === 'negative' ? -0.76 : 0.08 }))
const aspects: Aspect[] = ['Performance', 'User Interface', 'Pricing', 'Customer Support', 'Reliability', 'Features', 'Usability']
const distribution = (['positive', 'negative', 'neutral'] as Sentiment[]).reduce((result, sentiment) => ({ ...result, [sentiment]: feedback.filter(item => item.sentiment === sentiment).length }), {} as Record<Sentiment, number>)

export const demoAnalysis: AnalysisResult = {
  analysisId: 'demo-q4-experience', analysisName: 'Product experience pulse', createdAt: '2026-10-18T10:30:00.000Z', totalFeedback: feedback.length,
  sentimentDistribution: distribution,
  aspectSummaries: aspects.map(aspect => { const entries = feedback.filter(item => item.aspects.includes(aspect)); return { aspect, count: entries.length, positive: entries.filter(item => item.sentiment === 'positive').length, negative: entries.filter(item => item.sentiment === 'negative').length, neutral: entries.filter(item => item.sentiment === 'neutral').length } }).filter(item => item.count > 0).sort((a,b) => b.count - a.count),
  feedback,
  insights: [
    { id: 'insight-support', title: 'Support is the clearest service gap', description: 'Response time is the recurring issue in the support-related feedback.', statistic: '1 of 2 support mentions is negative', aspect: 'Customer Support', feedbackIds: ['demo-2', 'demo-11'], severity: 'high' },
    { id: 'insight-reliability', title: 'Reliability concerns deserve triage', description: 'Feedback links failures to exports, login, and notifications.', statistic: '4 negative reliability mentions', aspect: 'Reliability', feedbackIds: ['demo-4', 'demo-7', 'demo-12', 'demo-16'], severity: 'high' },
    { id: 'insight-ui', title: 'Interface sentiment is a durable strength', description: 'Users consistently describe the experience as clear and polished.', statistic: '3 of 4 UI mentions are positive', aspect: 'User Interface', feedbackIds: ['demo-1', 'demo-6', 'demo-8', 'demo-15'], severity: 'low' }
  ],
  availableSources: ['In-app', 'Email', 'Survey'], availableDateRange: { start: '2026-10-11', end: '2026-10-18' }, metadata: { isDemo: true, sourceFilename: 'synthetic-product-feedback.csv', textColumn: 'feedback', status: 'ready' }
}

export const demoCsv = ['feedback,timestamp,source', ...feedback.map(item => `"${item.text.replaceAll('"', '""')}",${item.timestamp},${item.source}`)].join('\n')

const sampleRows = [
  ['The replacement headphones arrived well packaged and the sound quality is excellent.', '2026-10-22', 'Email'],
  ['My order was delivered two days earlier than expected, which was a pleasant surprise.', '2026-10-22', 'Survey'],
  ['The checkout price changed after I added shipping, so the final bill felt misleading.', '2026-10-21', 'Web'],
  ['The mobile app takes a long time to load my orders and sometimes freezes on the tracking screen.', '2026-10-21', 'In-app'],
  ['Customer service listened carefully and arranged a replacement without any hassle.', '2026-10-20', 'Chat'],
  ['The product looks good, but the material feels cheaper than the description suggested.', '2026-10-20', 'Review'],
  ['The monthly plan is affordable compared with similar services.', '2026-10-19', 'Survey'],
  ['I received the wrong color and have been waiting a week for someone to resolve it.', '2026-10-19', 'Email'],
  ['The delivery driver left the package in a safe place and sent a clear notification.', '2026-10-18', 'Survey'],
  ['The app crashed twice while I was trying to upload a receipt.', '2026-10-18', 'In-app'],
  ['The setup instructions were clear, and the first use felt straightforward.', '2026-10-17', 'Review'],
  ['I cannot tell whether my discount was applied because the pricing summary is confusing.', '2026-10-17', 'Web'],
  ['The fabric is comfortable and has held up well after several washes.', '2026-10-16', 'Review'],
  ['Support replied quickly, although the first answer did not solve my question.', '2026-10-16', 'Chat'],
  ['The parcel arrived with a damaged corner, but the item inside still works.', '2026-10-15', 'Email'],
  ['The latest app update made the search screen noticeably slower.', '2026-10-15', 'In-app'],
  ['I am satisfied with the quality and would recommend this product to a friend.', '2026-10-14', 'Survey'],
  ['Delivery tracking stopped updating for three days and then jumped to delivered.', '2026-10-14', 'Web'],
  ['The premium price seems reasonable because the warranty is included.', '2026-10-13', 'Review'],
  ['The return form is difficult to use on a phone and lost my details twice.', '2026-10-13', 'In-app'],
  ['Nothing was wrong with the order, but it arrived later than the original estimate.', '2026-10-12', 'Survey'],
  ['The representative explained the refund timeline clearly and followed up as promised.', '2026-10-12', 'Chat'],
  ['The service is acceptable for now; I have only used the basic features so far.', '2026-10-11', 'Email'],
  ['Login errors appeared this morning and I had to restart the app before it worked.', '2026-10-11', 'In-app'],
]

export const sampleCsv = [
  'feedback,timestamp,source',
  ...sampleRows.map(([text, timestamp, source]) => `"${text.replaceAll('"', '""')}",${timestamp},${source}`),
].join('\n')
