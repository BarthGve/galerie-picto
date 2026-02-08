import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  onSearch: (query: string) => void;
  totalCount: number;
  filteredCount: number;
}

export function SearchBar({
  onSearch,
  totalCount,
  filteredCount,
}: SearchBarProps) {
  const [query, setQuery] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    onSearch(value);
  };

  return (
    <div className="w-full max-w-2xl mx-auto mb-8">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Rechercher un pictogramme..."
          value={query}
          onChange={handleChange}
          className="pl-10"
        />
      </div>
      <p className="text-sm text-muted-foreground mt-2 text-center">
        {filteredCount} / {totalCount} pictogrammes
        {query && filteredCount === 0 && " - Aucun résultat"}
      </p>
    </div>
  );
}
