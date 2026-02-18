// Proposition A — "Masonry Fluide"
// Sidebar glassmorphism + grille aérée + cards avec hover reveal

import React, { useState } from 'react';
import {
  Search,
  Menu,
  X,
  LayoutGrid,
  Compass,
  Heart,
  History,
  Github,
  Download,
  Copy,
  FolderPlus,
  ArrowRight,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Filter,
  LogOut,
  Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

const IconButton = ({ icon: Icon, onClick, className }: { icon: React.ElementType, onClick?: () => void, className?: string }) => (
  <button
    onClick={onClick}
    className={cn(
      "p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all active:scale-90",
      className
    )}
  >
    <Icon className="w-5 h-5" />
  </button>
);

/**
 * PICTO CARD COMPONENT
 */

const UserCircle = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const PictoCard = ({ name, size, downloads, contributor }: { name: string, size: string, downloads: string, contributor: string }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className="group relative flex flex-col bg-white border border-slate-100 rounded-3xl p-5 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-100/50 overflow-hidden"
    >
      {/* Action Buttons (Hover) */}
      <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 z-20">
        <button className="p-2.5 bg-slate-900 text-white rounded-xl shadow-lg hover:bg-indigo-600 transition-colors">
          <Copy className="w-4 h-4" />
        </button>
        <button className="p-2.5 bg-white border border-slate-100 text-slate-600 rounded-xl shadow-lg hover:border-indigo-200 hover:text-indigo-600 transition-colors">
          <FolderPlus className="w-4 h-4" />
        </button>
      </div>

      {/* SVG Preview Container */}
      <div className="relative aspect-square mb-4 bg-slate-50/50 rounded-2xl flex items-center justify-center group-hover:bg-indigo-50/30 transition-colors duration-500 overflow-hidden">
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
          <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-indigo-100/20 to-transparent blur-3xl rounded-full animate-pulse" />
        </div>
        <Sparkles className="w-12 h-12 text-slate-300 group-hover:text-indigo-500 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6" />
      </div>

      {/* Info */}
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <h3 className="font-bold text-slate-900 truncate pr-2 group-hover:text-indigo-600 transition-colors">
            {name}
          </h3>
          <Badge>{size}</Badge>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-50">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Download className="w-3.5 h-3.5" />
            <span className="text-[11px] font-bold uppercase tracking-wider">{downloads}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium text-slate-400 text-right">{contributor}</span>
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-200 to-slate-100 border-2 border-white shadow-sm overflow-hidden">
               <div className="w-full h-full bg-indigo-100 flex items-center justify-center">
                 <UserCircle className="w-5 h-5 text-indigo-300" />
               </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/**
 * MAIN PAGE COMPONENT
 */
export default function GalleryProposalA() {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkMode, setDarkMode] = useState(false);

  const itemsPerPage = 50;
  const totalItems = 230;

  const collections = [
    { name: 'Interface UI', color: 'bg-rose-500' },
    { name: 'Éducation', color: 'bg-amber-400' },
    { name: 'E-commerce', color: 'bg-indigo-600' },
    { name: 'Nature', color: 'bg-emerald-500' },
  ];

  return (
    <div className="min-h-screen bg-white font-medium text-slate-900 selection:bg-indigo-100 selection:text-indigo-700 relative overflow-hidden">

      {/* DECORATIVE BACKGROUND ELEMENTS */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '32px 32px' }}
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0], x: [0, 50, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[20%] -right-[10%] w-[60%] h-[60%] bg-gradient-to-br from-amber-300 to-rose-400 blur-3xl opacity-30 rounded-full"
        />
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [0, -45, 0], y: [0, 30, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-[10%] -left-[10%] w-[50%] h-[50%] bg-gradient-to-br from-indigo-300 to-cyan-400 blur-3xl opacity-30 rounded-full"
        />
      </div>

      <div className="flex h-screen relative z-10">

        {/* SIDEBAR */}
        <aside className={cn(
          "h-full bg-white/80 backdrop-blur-xl border-r border-slate-100 flex flex-col transition-all duration-500 ease-in-out z-40",
          isSidebarOpen ? "w-80" : "w-20"
        )}>
          {/* Logo Section */}
          <div className="p-6 flex items-center justify-between">
            <AnimatePresence mode="wait">
              {isSidebarOpen && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-xl shadow-slate-200">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <span className="font-extrabold text-xl tracking-tight text-slate-900">
                    Picto<span className="bg-gradient-to-r from-rose-500 via-fuchsia-600 to-indigo-600 bg-clip-text text-transparent italic">Galerie</span>
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
            <IconButton
              icon={isSidebarOpen ? X : Menu}
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className={!isSidebarOpen ? "mx-auto" : ""}
            />
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-8" style={{ scrollbarWidth: 'none' }}>
            <div className="space-y-1">
              {[
                { icon: LayoutGrid, label: 'Accueil', active: true },
                { icon: Compass, label: 'Découvrir' },
                { icon: Heart, label: 'Favoris' },
                { icon: History, label: 'Historique' },
              ].map((item) => (
                <button
                  key={item.label}
                  className={cn(
                    "w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all group",
                    item.active
                      ? "bg-indigo-50 text-indigo-600"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <item.icon className={cn("w-5 h-5", item.active ? "text-indigo-600" : "group-hover:scale-110 transition-transform")} />
                  {isSidebarOpen && <span className="font-bold text-sm">{item.label}</span>}
                </button>
              ))}
            </div>

            {isSidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <div className="px-4 flex items-center justify-between">
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Collections</h4>
                  <button className="text-indigo-600 text-xs font-bold hover:underline">Voir tout</button>
                </div>
                <div className="space-y-1">
                  {collections.map((col) => (
                    <button key={col.name} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all group">
                      <div className={cn("w-2 h-2 rounded-full", col.color)} />
                      <span className="text-sm font-bold">{col.name}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {isSidebarOpen && (
              <div className="px-2">
                <div className="relative p-5 rounded-3xl bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 shadow-sm overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Github className="w-16 h-16 rotate-12" />
                  </div>
                  <div className="relative z-10 space-y-3">
                    <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs">
                      <Github className="w-4 h-4" />
                      Bonus GitHub
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed font-medium">
                      Connectez-vous pour débloquer les <span className="text-indigo-600 italic">favoris</span>.
                    </p>
                    <button className="text-[11px] font-bold text-indigo-600 flex items-center gap-1 hover:gap-2 transition-all">
                      Se connecter <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Footer */}
          <div className="p-6 border-t border-slate-100 space-y-4">
            <div className={cn("flex items-center justify-between", !isSidebarOpen && "flex-col gap-4")}>
              <button
                onClick={() => setDarkMode(!isDarkMode)}
                className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 hover:text-indigo-600 transition-colors"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              {isSidebarOpen && (
                <div className="flex items-center gap-3">
                   <div className="text-right">
                     <div className="text-xs font-bold text-slate-900">[UserName]</div>
                     <div className="text-[10px] text-slate-400">Contributeur</div>
                   </div>
                   <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-slate-50 overflow-hidden">
                     <div className="w-full h-full bg-gradient-to-tr from-rose-400 to-indigo-500 opacity-80" />
                   </div>
                </div>
              )}
              {!isSidebarOpen && (
                <button className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 hover:text-rose-500 transition-colors">
                  <LogOut className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 flex flex-col h-full relative overflow-hidden">

          {/* HEADER */}
          <header className="h-20 border-b border-slate-100 bg-white/50 backdrop-blur-md px-8 flex items-center justify-between z-30 sticky top-0">
            <div className="flex-1 max-w-2xl relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
              <input
                type="text"
                placeholder="Rechercher un pictogramme (ex: user, home, arrow...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50/50 border-none rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all outline-none placeholder:text-slate-400"
              />
            </div>

            <div className="flex items-center gap-4 ml-8">
              <div className="hidden sm:flex flex-col items-end mr-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Statut</span>
                <span className="text-xs font-bold text-slate-900">{itemsPerPage} / {totalItems} <span className="text-slate-400 font-medium">pictos</span></span>
              </div>
              <button className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold flex items-center gap-2 hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200">
                <Filter className="w-4 h-4" />
                Filtres
              </button>
            </div>
          </header>

          {/* GALLERY CONTENT */}
          <div className="flex-1 overflow-y-auto px-8 py-8">

            {/* Title Section */}
            <div className="mb-10 flex items-end justify-between">
              <div className="space-y-2">
                <Badge icon={Sparkles}>Nouvelle collection disponible</Badge>
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
                  Vos pictogrammes, <br />
                  <span className="bg-gradient-to-r from-rose-500 via-fuchsia-600 to-indigo-600 bg-clip-text text-transparent italic">
                    prêts à l'emploi
                  </span>
                </h1>
              </div>

              <div className="hidden lg:flex gap-8 pb-2">
                <div>
                  <div className="text-2xl font-black text-slate-900">15+</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Collections</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-slate-900">2.4k</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Downloads</div>
                </div>
              </div>
            </div>

            {/* Grid or Empty State */}
            {searchQuery === 'empty' ? (
              <div className="flex flex-col items-center justify-center py-24 space-y-6">
                <div className="relative">
                   <div className="absolute inset-0 bg-indigo-100 blur-3xl rounded-full opacity-50 scale-150" />
                   <ImageIcon className="relative w-24 h-24 text-slate-200" />
                </div>
                <div className="text-center space-y-2 relative z-10">
                   <h2 className="text-2xl font-black text-slate-900">Aucun pictogramme trouvé</h2>
                   <p className="text-slate-500 max-w-xs mx-auto">Essayez d'autres mots-clés ou parcourez nos collections thématiques.</p>
                </div>
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-6 py-3 rounded-2xl bg-indigo-50 text-indigo-600 font-bold text-sm hover:bg-indigo-100 transition-all"
                >
                  Réinitialiser la recherche
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                {Array.from({ length: 15 }).map((_, i) => (
                  <PictoCard
                    key={i}
                    name={[`Navigation_Home`, `User_Profile`, `Arrow_Right_Alt`, `Settings_Gear`, `Cloud_Sync`][i % 5]}
                    size={[`1.2 KB`, `2.4 KB`, `0.8 KB`][i % 3]}
                    downloads={`${(i + 1) * 12}k`}
                    contributor={[`Alex R.`, `Sarah J.`, `Studio_Pix`][i % 3]}
                  />
                ))}
              </div>
            )}

            {/* PAGINATION */}
            <div className="mt-16 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-slate-100 pt-8 pb-12">
              <div className="text-sm text-slate-500 font-bold">
                Affichage <span className="text-slate-900">1-15</span> sur <span className="text-slate-900">{totalItems}</span> pictos
              </div>

              <div className="flex items-center gap-2">
                <button className="p-3 rounded-xl border border-slate-100 text-slate-400 hover:text-indigo-600 hover:bg-white transition-all disabled:opacity-30" disabled>
                  <ChevronLeft className="w-5 h-5" />
                </button>

                {[1, 2, 3, '...', 5].map((page, i) => (
                  <button
                    key={i}
                    className={cn(
                      "w-11 h-11 rounded-xl font-black text-sm transition-all",
                      page === 1
                        ? "bg-slate-900 text-white shadow-lg shadow-slate-200"
                        : "text-slate-500 hover:bg-slate-50"
                    )}
                  >
                    {page}
                  </button>
                ))}

                <button className="p-3 rounded-xl border border-slate-100 text-slate-400 hover:text-indigo-600 hover:bg-white transition-all">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Par page</span>
                <select className="bg-slate-50 border-none rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-100">
                  <option>15</option>
                  <option>30</option>
                  <option>50</option>
                </select>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
