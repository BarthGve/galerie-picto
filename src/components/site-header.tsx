import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState } from "react";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function SiteHeader({
  onSearch,
  totalCount,
  filteredCount,
  page,
  pageSize,
  totalPages,
  onPageChange,
}: {
  onSearch: (query: string) => void;
  totalCount: number;
  filteredCount: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}) {
  const [query, setQuery] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onSearch(value), 250);
  };

  const currentPage = page ?? 1;
  const size = pageSize ?? 50;
  const rangeStart = (currentPage - 1) * size + 1;
  const rangeEnd = Math.min(currentPage * size, filteredCount);

  return (
    <header className="flex shrink-0 items-center gap-2 px-6 py-4">
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mx-1 h-4" />

          {/* Search */}
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder={`Rechercher parmi ${totalCount} pictogrammes...`}
              value={query}
              onChange={handleChange}
              className="w-full md:w-[400px] h-11 bg-white border border-border rounded-2xl pl-11 pr-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-ring/10 focus:border-primary transition-all shadow-sm dark:bg-card"
            />
          </div>
        </div>

        {/* Counter + pagination arrows (only on gallery page) */}
        {page != null && <div className="hidden sm:flex items-center gap-3">
          <div className="text-xs font-bold text-muted-foreground tabular-nums">
            <span className="text-foreground">{rangeStart}-{rangeEnd}</span> sur {filteredCount}
          </div>
          {totalPages && totalPages > 1 && onPageChange && (
            <>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => onPageChange(currentPage - 1)}
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => onPageChange(currentPage + 1)}
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </>
          )}
        </div>}
      </div>
    </header>
  );
}
