// Proposition B — "Clean Grid SaaS"
// Toolbar flottante avec filtres chips, toggle vue compacte/large, tri
// Design épuré, premium, "app-like"

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  LayoutGrid,
  Compass,
  Heart,
  Menu,
  X,
  Moon,
  Github,
  Copy,
  Plus,
  Download,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Filter,
  ArrowUpDown,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { cn } from "@/lib/utils";

/**
 * DESIGN SYSTEM COMPONENTS
 */

const Badge = ({ children, icon: Icon }: { children: React.ReactNode, icon?: React.ElementType }) => (
  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 border border-amber-200 text-amber-700 font-bold text-[10px] tracking-wide uppercase">
    {Icon && <Icon className="w-3 h-3" />}
    {children}
  </div>
);

const FeatureCard = () => (
  <div className="relative p-5 rounded-3xl bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 shadow-lg overflow-hidden group mb-6">
    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
      <Github className="w-16 h-16 rotate-12" />
    </div>
    <div className="relative z-10 space-y-2">
      <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs">
        <Github className="w-4 h-4" />
        Bonus GitHub
      </div>
      <p className="text-slate-600 text-[11px] font-medium leading-relaxed">
        Connectez-vous pour débloquer <span className="text-indigo-600">favoris</span> et <span className="text-indigo-600">collections</span>.
      </p>
      <button className="text-[11px] font-bold text-indigo-600 flex items-center gap-1 hover:gap-2 transition-all">
        Se connecter <ArrowRight className="w-3 h-3" />
      </button>
    </div>
  </div>
);

/**
 * SIDEBAR ITEM
 */
const SidebarItem = ({ icon: Icon, label, active = false, count }: { icon: React.ElementType, label: string, active?: boolean, count?: number }) => (
  <button className={cn(
    "w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-200 group",
    active ? "bg-slate-900 text-white shadow-lg" : "text-slate-600 hover:bg-slate-100"
  )}>
    <div className="flex items-center gap-3">
      <Icon className={cn("w-4 h-4", active ? "text-white" : "text-slate-400 group-hover:text-slate-900")} />
      <span className="text-sm font-bold tracking-tight">{label}</span>
    </div>
    {count !== undefined && (
      <span className={cn("text-[10px] font-black px-1.5 py-0.5 rounded-md", active ? "bg-slate-800 text-slate-400" : "bg-slate-200 text-slate-500")}>
        {count}
      </span>
    )}
  </button>
);

/**
 * PICTO CARD
 */
const PictoCard = ({ isCompact }: { isCompact: boolean }) => (
  <motion.div
    layout
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    whileHover={{ y: -4 }}
    className={cn(
      "group relative bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300",
      isCompact ? "p-3" : "p-5"
    )}
  >
    {/* Action Buttons (Hover Reveal) */}
    <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
      <button className="p-2 bg-white rounded-lg border border-slate-100 shadow-sm text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
        <Copy className="w-4 h-4" />
      </button>
      <button className="p-2 bg-white rounded-lg border border-slate-100 shadow-sm text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors">
        <Heart className="w-4 h-4" />
      </button>
      <button className="p-2 bg-white rounded-lg border border-slate-100 shadow-sm text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 transition-colors">
        <Plus className="w-4 h-4" />
      </button>
    </div>

    {/* SVG Preview Area */}
    <div className={cn(
      "flex items-center justify-center bg-slate-50 rounded-xl mb-3 overflow-hidden transition-all",
      isCompact ? "h-24" : "h-32"
    )}>
      <div className="relative">
        <Sparkles className={cn("text-slate-900", isCompact ? "w-8 h-8" : "w-12 h-12")} />
        <div className="absolute -inset-4 bg-indigo-500/10 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>

    {/* Info */}
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <h3 className="font-extrabold text-slate-900 text-sm truncate">sparkles-icon</h3>
        <Badge>2.4kb</Badge>
      </div>

      {!isCompact && (
        <div className="flex items-center justify-between pt-2 border-t border-slate-50">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600">
              JS
            </div>
            <span className="text-[10px] font-bold text-slate-400 truncate max-w-[60px]">John S.</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
            <Download className="w-3 h-3" />
            1.2k
          </div>
        </div>
      )}
    </div>
  </motion.div>
);

/**
 * EMPTY STATE
 */
const EmptyState = ({ onReset }: { onReset: () => void }) => (
  <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
    <div className="relative mb-6">
      <div className="absolute inset-0 bg-indigo-200 blur-3xl opacity-20 rounded-full animate-pulse" />
      <Search className="w-20 h-20 text-slate-200 relative z-10" />
    </div>
    <h2 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Aucun résultat trouvé</h2>
    <p className="text-slate-500 max-w-sm mx-auto font-medium mb-8">
      Nous n'avons trouvé aucun pictogramme correspondant à vos filtres actuels. Essayez d'autres mots-clés.
    </p>
    <button
      onClick={onReset}
      className="px-6 py-3 rounded-xl bg-slate-900 text-white font-bold text-sm shadow-xl hover:scale-105 transition-transform"
    >
      Réinitialiser les filtres
    </button>
  </div>
);

/**
 * PAGE COMPONENT
 */
export default function GalleryProposalB() {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isCompact, setCompact] = useState(false);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("Tous");

  const filters = ["Tous", "Interface", "Commerce", "Social", "Finance", "Santé"];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans flex overflow-hidden">

      {/* Background Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [0, 45, 0], x: [0, 50, 0] }}
          transition={{ duration: 15, repeat: Infinity }}
          className="absolute -top-[10%] -right-[5%] w-[40vw] h-[40vw] rounded-full bg-gradient-to-br from-amber-200 to-rose-300 blur-3xl opacity-20"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, -90, 0], x: [0, -30, 0] }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute -bottom-[10%] -left-[5%] w-[35vw] h-[35vw] rounded-full bg-gradient-to-tr from-indigo-200 to-cyan-200 blur-3xl opacity-20"
        />
        <div className="absolute inset-0 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.03]" />
      </div>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 0, opacity: isSidebarOpen ? 1 : 0 }}
        className="relative z-30 flex-shrink-0 bg-white border-r border-slate-100 flex flex-col overflow-hidden"
      >
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black tracking-tighter whitespace-nowrap">Galerie Picto</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-8 py-4" style={{ scrollbarWidth: 'none' }}>
          <nav className="space-y-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 mb-2">Navigation</div>
            <SidebarItem icon={LayoutGrid} label="Découvrir" active />
            <SidebarItem icon={Compass} label="Tous les pictos" count={230} />
            <SidebarItem icon={Heart} label="Mes Favoris" count={12} />
          </nav>

          <nav className="space-y-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 mb-2">Collections</div>
            <div className="space-y-1">
              {['Interface Pro', 'Dashboard Kit', 'E-commerce'].map((c, i) => (
                <button key={c} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    i === 0 ? "bg-rose-500" : i === 1 ? "bg-amber-400" : "bg-indigo-600"
                  )} />
                  {c}
                </button>
              ))}
              <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-bold text-slate-400 hover:bg-slate-100 rounded-xl transition-colors border-2 border-dashed border-slate-100 mt-2">
                <Plus className="w-4 h-4" /> Nouvelle liste
              </button>
            </div>
          </nav>

          <nav className="space-y-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 mb-2">Contributeurs</div>
            <div className="space-y-2 px-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200" />
                  <div className="h-2 w-16 bg-slate-100 rounded" />
                </div>
              ))}
            </div>
          </nav>

          <FeatureCard />
        </div>

        <div className="p-4 border-t border-slate-100 space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 overflow-hidden">
                <Github className="w-full h-full p-1.5 text-indigo-600" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-900 truncate w-24">Utilisateur</span>
                <span className="text-[10px] text-slate-400">Contributeur</span>
              </div>
            </div>
            <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
              <Moon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <main className="flex-1 relative z-10 flex flex-col h-screen overflow-hidden">

        {/* Header / Floating Toolbar */}
        <header className="flex-shrink-0 px-6 py-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {!isSidebarOpen && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2.5 bg-white shadow-sm border border-slate-100 rounded-xl hover:bg-slate-50 transition-all"
                >
                  <Menu className="w-5 h-5" />
                </button>
              )}
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <input
                  type="text"
                  placeholder="Rechercher parmi 230 pictogrammes..."
                  className="w-full md:w-[400px] h-11 pl-11 pr-4 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-3">
              <div className="text-xs font-bold text-slate-400">
                <span className="text-slate-900">1-50</span> sur 230
              </div>
              <div className="h-4 w-[1px] bg-slate-200" />
              <div className="flex items-center gap-1">
                <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Floating Toolbar */}
          <div className="flex items-center justify-between bg-white/80 backdrop-blur-md p-2 rounded-2xl border border-white shadow-xl shadow-slate-200/50">
            <div className="flex items-center gap-1 overflow-x-auto px-1" style={{ scrollbarWidth: 'none' }}>
              <div className="p-2 text-slate-400 mr-1">
                <Filter className="w-4 h-4" />
              </div>
              {filters.map(f => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={cn(
                    "px-4 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                    activeFilter === f
                      ? "bg-slate-900 text-white shadow-md shadow-slate-900/20"
                      : "text-slate-500 hover:bg-slate-100"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 px-2 border-l border-slate-100">
              <button className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-600 transition-colors">
                <ArrowUpDown className="w-4 h-4" />
                <span className="hidden md:inline">Tri: Date</span>
              </button>
              <div className="w-[1px] h-6 bg-slate-100 mx-1" />
              <div className="flex bg-slate-50 p-1 rounded-xl">
                <button
                  onClick={() => setCompact(true)}
                  className={cn("p-1.5 rounded-lg transition-all", isCompact ? "bg-white shadow-sm text-slate-900" : "text-slate-400")}
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCompact(false)}
                  className={cn("p-1.5 rounded-lg transition-all", !isCompact ? "bg-white shadow-sm text-slate-900" : "text-slate-400")}
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Gallery Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-12">
          {search === "empty" ? (
            <EmptyState onReset={() => setSearch("")} />
          ) : (
            <div className={cn(
              "grid gap-4 md:gap-6",
              isCompact
                ? "grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10"
                : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"
            )}>
              {Array.from({ length: 48 }).map((_, i) => (
                <PictoCard key={i} isCompact={isCompact} />
              ))}
            </div>
          )}

          {/* Pagination Section */}
          <div className="mt-12 flex flex-col items-center gap-6">
            <div className="flex items-center gap-2">
              <button className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-50">
                <ChevronLeft className="w-5 h-5" />
              </button>
              {[1, 2, 3, '...', 5].map((p, i) => (
                <button
                  key={i}
                  className={cn(
                    "w-10 h-10 flex items-center justify-center rounded-xl text-sm font-bold transition-all",
                    p === 1 ? "bg-slate-900 text-white shadow-lg" : "hover:bg-slate-50 text-slate-600"
                  )}
                >
                  {p}
                </button>
              ))}
              <button className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-50">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-8 py-4 border-t border-slate-100 w-full max-w-xl justify-center">
              <div className="text-center">
                <div className="text-xl font-black text-slate-900">15+</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Collections</div>
              </div>
              <div className="w-[1px] h-8 bg-slate-100" />
              <div className="text-center">
                <div className="text-xl font-black text-slate-900">48k+</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Downloads</div>
              </div>
              <div className="w-[1px] h-8 bg-slate-100" />
              <div className="text-center">
                <div className="text-xl font-black text-slate-900">100%</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Gratuit</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
