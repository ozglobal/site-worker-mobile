import { listS3Files, type S3File } from './s3'
import type { ApiResult } from './api-result'

export interface ContractItem {
  id: string
  name: string
  month: number | null
  status: "signed" | "unsigned"
  url: string
}

/** Extract month from filename (e.g., "일용근로계약서_일반_김철수_1월.pdf" -> 1) */
export function extractMonthFromFilename(filename: string): number | null {
  const match = filename.match(/(\d+)월/)
  return match ? parseInt(match[1], 10) : null
}

/** Parse S3 files into contract items */
export function parseS3FilesToContracts(files: S3File[]): ContractItem[] {
  return files
    .filter((file) => file.name.endsWith(".pdf"))
    .map((file) => ({
      id: file.key,
      name: file.name.replace(".pdf", ""),
      month: extractMonthFromFilename(file.name),
      status: "signed" as const,
      url: file.url,
    }))
    .sort((a, b) => (b.month || 0) - (a.month || 0))
}

/** Fetch contracts from S3 for a given year */
export async function fetchContracts(year: number): Promise<ApiResult<ContractItem[]>> {
  const result = await listS3Files(`eformsign-documents/${year}/`)
  if (!result.success) return { success: false, error: result.error || 'Failed to fetch contracts' }
  return { success: true, data: parseS3FilesToContracts(result.files) }
}
