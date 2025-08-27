import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Images, X, ChevronLeft, ChevronRight, Download, Search } from "lucide-react";
import type { GalleryItem } from "../types/gallery.";

/**
 * Cara pakai:
 * - Letakkan gambar di folder /public/gallery/ (mis. /public/gallery/1.jpg)
 * - Tambahkan entri ke array ITEMS di bawah ini.
 *   (thumb boleh dikosongkan; otomatis pakai src)
 */
const ITEMS: GalleryItem[] = [
  {
    id: "1",
    src: "/gallery/1.jpg",
    title: "Ikan Fufu – Sampel A",
    caption: "Kondisi segar, warna cerah.",
    takenAt: "2025-08-27 10:03",
    tags: ["seg ar", "cerah"],
  },
  {
    id: "2",
    src: "/gallery/2.jpg",
    title: "Sampel B",
    caption: "Kecerahan menurun, perlu pemantauan.",
    takenAt: "2025-08-27 10:35",
    tags: ["netral"],
  },
  {
    id: "3",
    src: "/gallery/3.jpg",
    title: "Sampel C",
    caption: "Warna pucat.",
    takenAt: "2025-08-27 11:12",
    tags: ["pucat", "perhatian"],
  },
  // Tambah sesuka hati…
];

const gridCols =
  "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4";

const Gallery: React.FC = () => {
  const [q, setQ] = React.useState("");
  const [activeIdx, setActiveIdx] = React.useState<number | null>(null);

  const filtered = React.useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return ITEMS;
    return ITEMS.filter((it) => {
      const bag = [
        it.title ?? "",
        it.caption ?? "",
        it.takenAt ?? "",
        ...(it.tags ?? []),
      ]
        .join(" ")
        .toLowerCase();
      return bag.includes(s);
    });
  }, [q]);

  const open = (i: number) => setActiveIdx(i);
  const close = () => setActiveIdx(null);

  const prev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveIdx((i) => (i == null ? i : (i - 1 + filtered.length) % filtered.length));
  };
  const next = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveIdx((i) => (i == null ? i : (i + 1) % filtered.length));
  };

  // keyboard: esc/arrow
  React.useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (activeIdx == null) return;
      if (ev.key === "Escape") close();
      if (ev.key === "ArrowLeft") prev();
      if (ev.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeIdx, filtered.length]);

  const a = activeIdx == null ? null : filtered[activeIdx];

  const download = (src: string) => {
    const a = document.createElement("a");
    a.href = src;
    a.download = src.split("/").pop() || "image.jpg";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="pt-8 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Images className="w-7 h-7 text-blue-600" />
              Galeri
            </h1>
            <p className="text-gray-500">Koleksi foto sampel ikan & hasil pengamatan.</p>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari judul, catatan, atau tag…"
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="p-6 rounded-xl border bg-white text-gray-600">
            Tidak ada item yang cocok.
          </div>
        ) : (
          <div className={gridCols}>
            {filtered.map((it, i) => (
              <motion.button
                key={it.id}
                onClick={() => open(i)}
                whileHover={{ y: -4 }}
                className="group relative rounded-xl overflow-hidden border bg-white"
                title={it.title}
              >
                <img
                  src={it.thumb || it.src}
                  alt={it.title || "Foto"}
                  className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                {(it.title || it.takenAt) && (
                  <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/60 to-transparent text-white">
                    <div className="text-xs font-semibold line-clamp-1">
                      {it.title}
                    </div>
                    {it.takenAt && (
                      <div className="text-[10px] opacity-80">{it.takenAt}</div>
                    )}
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {a && (
          <motion.div
            key="lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.98, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              className="relative max-w-6xl w-full"
            >
              {/* Image */}
              <img
                src={a.src}
                alt={a.title || "Foto"}
                className="w-full max-h-[80vh] object-contain rounded-xl shadow-2xl bg-black/30"
              />

              {/* Caption */}
              {(a.title || a.caption) && (
                <div className="mt-3 px-1 text-white">
                  <div className="text-lg font-semibold">{a.title}</div>
                  {a.caption && (
                    <div className="text-sm opacity-90">{a.caption}</div>
                  )}
                </div>
              )}

              {/* Controls */}
              <div className="absolute top-2 right-2 flex gap-2">
                <button
                  onClick={() => download(a.src)}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                  title="Download"
                >
                  <Download className="w-5 h-5" />
                </button>
                <button
                  onClick={close}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                  title="Tutup"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Prev/Next */}
              {filtered.length > 1 && (
                <>
                  <button
                    onClick={prev}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                    title="Sebelumnya"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={next}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                    title="Berikutnya"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Gallery;
