import { Search } from "lucide-react";
import { useRef, useState } from "react";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function SiteHeader({
  onSearch,
  totalCount,
}: {
  onSearch: (query: string) => void;
  totalCount: number;
}) {
  const [query, setQuery] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onSearch(value), 250);
  };

  return (
    <header className="sticky top-0 z-30 flex shrink-0 items-center gap-2 px-6 py-4">
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
            className="w-full md:w-[400px] h-11 bg-white border border-border rounded pl-11 pr-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-ring/10 focus:border-primary transition-all shadow-sm dark:bg-card"
          />
        </div>
      </div>
    </header>
  );
}
