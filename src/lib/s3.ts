/**
 * S3 Public Bucket API
 * Fetches file lists from public S3 buckets
 */

const S3_BUCKET = "cworker-bucket"
const S3_REGION = "ap-northeast-2"
const S3_BASE_URL = `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com`

export interface S3File {
  key: string
  name: string
  url: string
  lastModified: string
  size: number
}

export interface ListS3FilesResult {
  success: boolean
  files: S3File[]
  error?: string
}

/**
 * List files from a public S3 bucket folder
 * @param prefix - Folder path (e.g., "eformsign-documents/2026/")
 */
export async function listS3Files(prefix: string): Promise<ListS3FilesResult> {
  try {
    const url = `${S3_BASE_URL}?list-type=2&prefix=${encodeURIComponent(prefix)}`
    const response = await fetch(url)

    if (!response.ok) {
      return {
        success: false,
        files: [],
        error: `Failed to list files: ${response.status}`,
      }
    }

    const xml = await response.text()
    const parser = new DOMParser()
    const doc = parser.parseFromString(xml, "application/xml")

    const contents = doc.getElementsByTagName("Contents")
    const files: S3File[] = []

    for (let i = 0; i < contents.length; i++) {
      const item = contents[i]
      const key = item.getElementsByTagName("Key")[0]?.textContent || ""
      const lastModified = item.getElementsByTagName("LastModified")[0]?.textContent || ""
      const size = parseInt(item.getElementsByTagName("Size")[0]?.textContent || "0", 10)

      // Skip folder entries (size 0 and ends with /)
      if (size === 0 && key.endsWith("/")) continue

      // Extract filename from key
      const name = key.split("/").pop() || key

      files.push({
        key,
        name,
        url: `${S3_BASE_URL}/${key.split("/").map(encodeURIComponent).join("/")}`,
        lastModified,
        size,
      })
    }

    return { success: true, files }
  } catch (error) {
    return {
      success: false,
      files: [],
      error: error instanceof Error ? error.message : "Failed to list files",
    }
  }
}

/**
 * Get the public URL for an S3 file
 */
export function getS3FileUrl(key: string): string {
  return `${S3_BASE_URL}/${encodeURIComponent(key)}`
}
