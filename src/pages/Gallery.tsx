import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Images,
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Search,
  Tag,
  Info,
  SlidersHorizontal,
} from "lucide-react";

// If you already have this type elsewhere, feel free to remove and use yours
export type GalleryItem = {
  id: string;
  src: string;
  thumb?: string;
  title?: string;
  caption?: string;
  takenAt?: string; // e.g. "2025-08-27 10:03"
  tags?: string[];
};

/**
 * Cara pakai:
 * 1) Letakkan gambar di /public/gallery/ (mis. /public/gallery/1.jpg)
 * 2) Isi array ITEMS di bawah ini.
 * 3) Impor dan pakai <GalleryPlus items={ITEMS} />
 */
const ITEMS: GalleryItem[] = [
  {
    id: "1",
    src: "/gallery/1.jpg",
    title: "Ikan Fufu – Sampel A",
    caption: "Kondisi segar, warna cerah.",
    takenAt: "2025-08-27 10:03",
    tags: ["segar", "cerah"],
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
];

const gridCols =
  "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4";

type GalleryProps = {
  items?: GalleryItem[];
};

const formatDate = (s?: string) => {
  if (!s) return "";
  // Parse common formats safely
  const str = s.replace("/", "-");
  const d = new Date(str);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const uniq = (arr: string[]) => Array.from(new Set(arr));

const useDebounced = (value: string, delay = 200) => {
  const [v, setV] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
};

const Gallery: React.FC<GalleryProps> = ({ items = ITEMS }) => {
  const [q, setQ] = React.useState("");
  const [tag, setTag] = React.useState<string | null>(null);
  const [sort, setSort] = React.useState<"newest" | "oldest" | "title">(
    "newest"
  );
  const [activeIdx, setActiveIdx] = React.useState<number | null>(null);
  const [loaded, setLoaded] = React.useState<Record<string, boolean>>({});
  const debouncedQ = useDebounced(q);

  const allTags = React.useMemo(
    () =>
      uniq(
        items
          .flatMap((it) => it.tags || [])
          .map((t) => t.trim())
          .filter(Boolean)
      ).sort((a, b) => a.localeCompare(b)),
    [items]
  );

  const filtered = React.useMemo(() => {
    let arr = items.slice();

    // text search
    const s = debouncedQ.trim().toLowerCase();
    if (s) {
      arr = arr.filter((it) => {
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
    }

    // tag filter
    if (tag) {
      arr = arr.filter((it) => (it.tags || []).map((t) => t.toLowerCase()).includes(tag.toLowerCase()));
    }

    // sort
    arr.sort((a, b) => {
      if (sort === "title") return (a.title || "").localeCompare(b.title || "");
      const da = new Date(a.takenAt || 0).getTime();
      const db = new Date(b.takenAt || 0).getTime();
      return sort === "newest" ? db - da : da - db;
    });

    return arr;
  }, [items, debouncedQ, tag, sort]);

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

  const downloadFile = (src: string) => {
    const a = document.createElement("a");
    a.href = src;
    a.download = src.split("/").pop() || "image.jpg";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="pt-8 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Images className="w-7 h-7 text-blue-600" />
              Galeri
            </h1>
            <p className="text-gray-500">
              Koleksi foto hasil penelitian dan kegiatan lapangan.
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {/* Search */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Cari judul, catatan, atau tag…"
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            {/* Tag filter */}
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-gray-400" />
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setTag(null)}
                  className={`px-3 py-1 rounded-full border text-sm whitespace-nowrap ${
                    tag === null
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white hover:bg-gray-50"
                  }`}
                >
                  Semua
                </button>
                {allTags.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTag(t === tag ? null : t)}
                    className={`px-3 py-1 rounded-full border text-sm whitespace-nowrap ${
                      tag === t
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white hover:bg-gray-50"
                    }`}
                    title={`Filter: ${t}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort */}
            <div className="relative">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-white">
                <SlidersHorizontal className="w-4 h-4 text-gray-400" />
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as any)}
                  className="bg-transparent focus:outline-none"
                >
                  <option value="newest">Terbaru</option>
                  <option value="oldest">Terlama</option>
                  <option value="title">Judul A→Z</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Stats / hint */}
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <Info className="w-4 h-4" />
          <span>
            Menampilkan <strong>{filtered.length}</strong> dari {items.length} item.
          </span>
          {q && (
            <button
              onClick={() => setQ("")}
              className="underline underline-offset-2 hover:no-underline"
            >
              Hapus pencarian
            </button>
          )}
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
                className="group relative rounded-xl overflow-hidden border bg-white shadow-sm hover:shadow-md transition-shadow"
                title={it.title}
              >
                {/* Blur-up placeholder */}
                <div className="aspect-square w-full bg-gradient-to-br from-gray-100 to-gray-200" />
                <img
                  src={it.thumb || it.src}
                  alt={it.title || "Foto"}
                  onLoad={() => setLoaded((s) => ({ ...s, [it.id]: true }))}
                  className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${
                    loaded[it.id] ? "opacity-100" : "opacity-0 blur-sm"
                  }`}
                  loading="lazy"
                />

                {/* Overlay bottom info */}
                {(it.title || it.takenAt) && (
                  <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/60 to-transparent text-white">
                    <div className="text-xs font-semibold line-clamp-1">
                      {it.title}
                    </div>
                    {it.takenAt && (
                      <div className="text-[10px] opacity-80">{formatDate(it.takenAt)}</div>
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
            aria-modal
            role="dialog"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.98, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              className="relative max-w-6xl w-full grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4"
            >
              {/* Image */}
              <div className="relative">
                <img
                  src={a.src}
                  alt={a.title || "Foto"}
                  className="w-full max-h-[80vh] object-contain rounded-xl shadow-2xl bg-black/30"
                />

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
              </div>

              {/* Side panel */}
              <div className="lg:h-[80vh] overflow-y-auto rounded-xl bg-white/95 text-gray-800 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-lg font-semibold">{a.title || "Tanpa judul"}</div>
                    {a.takenAt && (
                      <div className="text-xs text-gray-500 mt-0.5">{formatDate(a.takenAt)}</div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => downloadFile(a.src)}
                      className="p-2 rounded-lg bg-gray-900 text-white hover:bg-black"
                      title="Download"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                    <button
                      onClick={close}
                      className="p-2 rounded-lg bg-gray-200 hover:bg-gray-300"
                      title="Tutup"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {a.caption && (
                  <p className="mt-3 text-sm leading-relaxed">{a.caption}</p>
                )}

                {a.tags && a.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {a.tags.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-100"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

                {/* Filmstrip thumbnails */}
                {filtered.length > 1 && (
                  <div className="mt-6">
                    <div className="text-xs font-semibold text-gray-500 mb-2">
                      Lainnya dalam koleksi ({filtered.length})
                    </div>
                    <div className="grid grid-cols-6 gap-2">
                      {filtered.map((it, i) => (
                        <button
                          key={it.id}
                          onClick={() => setActiveIdx(i)}
                          className={`relative rounded-md overflow-hidden border ${
                            i === activeIdx ? "ring-2 ring-blue-600" : ""
                          }`}
                          title={it.title}
                        >
                          <img
                            src={it.thumb || it.src}
                            alt={it.title || "Foto"}
                            className="aspect-square w-full object-cover"
                            loading="lazy"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Gallery;
