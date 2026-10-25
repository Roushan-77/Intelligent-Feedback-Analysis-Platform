export interface CsvPreview { headers: string[]; rows: string[][] }
export function parseCsvPreview(text: string): CsvPreview {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean)
  if (lines.length < 2) throw new Error('Add a header row and at least one feedback row.')
  const parse = (line: string) => { const out: string[] = []; let value = ''; let quote = false; for (let i=0;i<line.length;i++) { const char=line[i]; if(char==='"' && line[i+1]==='"') { value+='"'; i++ } else if(char==='"') quote=!quote; else if(char===','&&!quote) { out.push(value.trim()); value='' } else value+=char } out.push(value.trim()); return out }
  const headers = parse(lines[0]).filter(Boolean); if (!headers.length) throw new Error('We could not find any CSV headers.')
  return { headers, rows: lines.slice(1, 5).map(parse) }
}
export const likelyTextColumn = (headers: string[]) => headers.find(header => /feedback|review|comment|message|response|text/i.test(header)) ?? headers[0]
