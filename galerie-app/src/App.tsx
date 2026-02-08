import { useMemo, useState } from "react";
import { Palette } from "lucide-react";
import { usePictograms } from "@/hooks/usePictograms";
import { PictoGrid } from "@/components/PictoGrid";
import { SearchBar } from "@/components/SearchBar";

function App() {
  const { pictograms, loading, error, lastUpdated } = usePictograms();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPictograms = useMemo(() => {
    if (!searchQuery) return pictograms;

    const query = searchQuery.toLowerCase();
    return pictograms.filter(
      (picto) =>
        picto.name.toLowerCase().includes(query) ||
        picto.id.toLowerCase().includes(query) ||
        picto.filename.toLowerCase().includes(query),
    );
  }, [pictograms, searchQuery]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            Chargement des pictogrammes...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-2">Erreur de chargement</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-2">
            <Palette className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Galerie Pictogrammes</h1>
          </div>
          {lastUpdated && (
            <p className="text-sm text-muted-foreground">
              Dernière mise à jour :{" "}
              {new Date(lastUpdated).toLocaleString("fr-FR")}
            </p>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <SearchBar
          onSearch={setSearchQuery}
          totalCount={pictograms.length}
          filteredCount={filteredPictograms.length}
        />

        <PictoGrid pictograms={filteredPictograms} />
      </main>

      {/* Footer */}
      <footer className="border-t mt-16">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>
            Galerie de pictogrammes - {pictograms.length} éléments disponibles
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
