import { useState, useEffect, useRef, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { searchAddress, type JusoAddress } from "@/lib/juso"
import { Search as SearchIcon, X as CloseIcon } from "lucide-react"

interface AddressSearchDialogProps {
  onSelect: (address: string) => void
  onClose: () => void
}

export function AddressSearchDialog({ onSelect, onClose }: AddressSearchDialogProps) {
  const [keyword, setKeyword] = useState("")
  const [results, setResults] = useState<JusoAddress[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const doSearch = useCallback(async (term: string, pageNum: number) => {
    if (!term.trim()) {
      setResults([])
      setTotalCount(0)
      return
    }
    setLoading(true)
    const result = await searchAddress(term, pageNum)
    if (pageNum === 1) {
      setResults(result.addresses)
    } else {
      setResults(prev => [...prev, ...result.addresses])
    }
    setTotalCount(result.totalCount)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setPage(1)
      doSearch(keyword, 1)
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [keyword, doSearch])

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    doSearch(keyword, nextPage)
  }

  const hasMore = results.length < totalCount

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 shrink-0">
        <h2 className="text-lg font-bold text-slate-900 flex-1">주소 검색</h2>
        <button onClick={onClose} className="p-1 text-slate-500">
          <CloseIcon />
        </button>
      </div>

      {/* Search Input */}
      <div className="px-4 py-3 shrink-0">
        <div className="relative">
          <SearchIcon size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            ref={inputRef}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="도로명, 건물명, 지번 검색"
            className="pl-10 bg-slate-50"
          />
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {!keyword.trim() && (
          <div className="px-4 py-8 text-center text-sm text-slate-400">
            검색어를 입력해주세요
          </div>
        )}

        {keyword.trim() && !loading && results.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-slate-400">
            검색 결과가 없습니다
          </div>
        )}

        {results.map((addr, index) => (
          <button
            key={`${addr.roadAddr}-${index}`}
            className="w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-slate-50 active:bg-slate-100"
            onClick={() => onSelect(addr.roadAddr)}
          >
            <p className="text-sm font-medium text-slate-900">{addr.roadAddr}</p>
            {addr.jibunAddr && (
              <p className="text-xs text-slate-400 mt-0.5">{addr.jibunAddr}</p>
            )}
            {addr.zipNo && (
              <p className="text-xs text-slate-400">[{addr.zipNo}]</p>
            )}
          </button>
        ))}

        {hasMore && !loading && (
          <button
            className="w-full py-3 text-sm text-primary font-medium hover:bg-slate-50"
            onClick={handleLoadMore}
          >
            더보기 ({results.length} / {totalCount})
          </button>
        )}

        {loading && (
          <div className="py-4 text-center text-sm text-slate-400">
            검색 중...
          </div>
        )}
      </div>
    </div>
  )
}
