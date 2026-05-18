import type { DictItem } from '@/lib/dict'

export function findByCode<T extends { code: string }>(items: T[] | undefined, code: string | undefined): T | undefined {
  if (!items || !code) return undefined
  return items.find((i) => i.code === code)
}

export function findByName<T extends { name: string }>(items: T[] | undefined, name: string | undefined): T | undefined {
  if (!items || !name) return undefined
  return items.find((i) => i.name === name)
}

export function labelOf(items: DictItem[] | undefined, code: string | undefined, fallback?: string): string {
  if (!code) return fallback ?? ''
  return findByCode(items, code)?.name ?? fallback ?? code
}

export function codeOfNameOrCode(items: DictItem[] | undefined, raw: string | undefined): string {
  if (!raw) return ''
  return findByName(items, raw)?.code ?? findByCode(items, raw)?.code ?? raw
}
