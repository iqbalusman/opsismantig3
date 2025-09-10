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
  MapPin,
  CalendarDays,
} from "lucide-react";

// =============================================
//  Galeri (khusus Kegiatan)
//  - Fokus default: foto kegiatan saja (tag "kegiatan")
//  - Layout: Masonry (CSS columns) + Lightbox elegan
//  - Fitur: cari, filter tag (selain "kegiatan"), sort, toggle hanya kegiatan, keyboard nav, download
// =============================================

export type GalleryItem = {
  id: string;
  src: string;
  thumb?: string;
  title?: string;
  caption?: string;
  takenAt?: string; // e.g. "2025-08-27 10:03"
  tags?: string[];  // tambahkan tag "kegiatan" untuk diprioritaskan default
  location?: string;
};

/**
 * Cara pakai:
 * 1) Letakkan gambar di /public/gallery/ (mis. /public/gallery/1.jpg)
 * 2) Isi array ITEMS di bawah ini (pastikan tag "kegiatan" untuk foto kegiatan).
 * 3) Impor:  import Gallery, { GalleryItem } from "./Gallery";
 * 4) Pakai:   <Gallery items={ITEMS} />
 */
const ITEMS: GalleryItem[] = [
  {
    id: "1",
    src: "/gallery/1.jpg",
    title: "Pelatihan Pengolahan Ikan",
    caption: "Sesi praktik pengasapan bersama nelayan setempat.",
    takenAt: "2025-08-27 10:03",
    tags: ["kegiatan", "pelatihan"],
    location: "Pesisir Manado",
  },
  {
    id: "2",
    src: "/gallery/2.jpg",
    title: "Survei Pasar Pagi",
    caption: "Pengambilan data sampel warna dan uji cepat.",
    takenAt: "2025-08-27 10:35",
    tags: ["kegiatan", "survei"],
    location: "Pasar Bahu",
  },
  {
    id: "3",
    src: "/gallery/3.jpg",
    title: "Pengiriman Batch Ekspor",
    caption: "Sortir akhir sebelum masuk cold chain.",
    takenAt: "2025-08-27 11:12",
    tags: ["kegiatan", "logistik"],
    location: "Gudang Pendingin",
  },
];

const columnsClass =
  "columns-2 sm:columns-3 lg:columns-4 2xl:columns-5 gap-4 [column-fill:_balance]";

type Props = {
  items?: GalleryItem[];
  activityOnly?: boolean; // default true → hanya foto bertag "kegiatan"
  activityTag?: string;   // default "kegiatan"
};

const formatDate = (s?: string) => {
  if (!s) return "";
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

const Gallery: React.FC<Props> = ({ items = ITEMS, activityOnly = true, activityTag = "kegiatan" }) => {
  const [q, setQ] = React.useState("");
  const [tag, setTag] = React.useState<string | null>(null);
  const [sort, setSort] = React.useState<"newest" | "oldest" | "title">("newest");
  const [activeIdx, setActiveIdx] = React.useState<number | null>(null);
  const [onlyKegiatan, setOnlyKegiatan] = React.useState(activityOnly);
  const debouncedQ = useDebounced(q);

  // Filter dasar: only kegiatan
  const base = React.useMemo(() => {
    if (!onlyKegiatan) return items;
    const key = activityTag.toLowerCase();
    const filtered = items.filter((it) => (it.tags || []).some((t) => t.toLowerCase() === key));
    return filtered.length > 0 ? filtered : items; // fallback jika belum ada tag "kegiatan"
  }, [items, onlyKegiatan, activityTag]);

  const allTags = React.useMemo(() =>
    uniq(
      base
        .flatMap((it) => it.tags || [])
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t && t !== activityTag.toLowerCase())
    ).sort((a, b) => a.localeCompare(b))
  , [base, activityTag]);

  const filtered = React.useMemo(() => {
    let arr = base.slice();

    // text search
    const s = debouncedQ.trim().toLowerCase();
    if (s) {
      arr = arr.filter((it) => {
        const bag = [
          it.title ?? "",
          it.caption ?? "",
          it.takenAt ?? "",
          it.location ?? "",
          ...(it.tags ?? []),
        ]
          .join(" ")
          .toLowerCase();
        return bag.includes(s);
      });
    }

    // tag filter (selain tag kegiatan)
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
  }, [base, debouncedQ, tag, sort]);

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
    <div className="pt-10 pb-20">
      {/* HERO */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-r from-sky-100 via-blue-50 to-indigo-100 p-6 sm:p-8">
          <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-sky-200/40 blur-3xl" aria-hidden />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between relative">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/70 border shadow-sm">
                <Images className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-800">Galeri</h1>
                <p className="text-slate-600 text-sm">Kumpulan dokumentasi aktivitas lapangan, pelatihan, survei, dan logistik.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 text-xs rounded-full bg-white/70 border">{filtered.length} foto</span>
              <button
                onClick={() => setOnlyKegiatan((v) => !v)}
                className={`px-3 py-1.5 rounded-full text-sm border shadow-sm transition ${
                  onlyKegiatan
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white hover:bg-gray-50"
                }`}
                title="Tampilkan hanya foto bertag kegiatan"
              >
                {onlyKegiatan ? "Hanya Kegiatan" : "Semua Foto"}
              </button>
            </div>
          </div>

          {/* Controls */}
          <div className="mt-4 flex flex-col sm:flex-row gap-3 w-full">
            {/* Search */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Cari judul, lokasi, catatan, atau tag…"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/90 backdrop-blur"
              />
            </div>

            {/* Tag filter (selain kegiatan) */}
            <div className="flex items-center gap-2 min-w-0">
              <Tag className="w-4 h-4 text-gray-400 shrink-0" />
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setTag(null)}
                  className={`px-3 py-1.5 rounded-full border text-sm whitespace-nowrap ${
                    tag === null
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white hover:bg-gray-50"
                  }`}
                >
                  Semua Tag
                </button>
                {allTags.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTag(t === tag ? null : t)}
                    className={`px-3 py-1.5 rounded-full border text-sm whitespace-nowrap ${
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
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border bg-white/90 backdrop-blur">
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
      </div>

      {/* BODY */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Stats / hint */}
        <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
          <Info className="w-4 h-4" />
          <span>Menampilkan <strong>{filtered.length}</strong> dari {base.length} foto kegiatan.</span>
          {q && (
            <button onClick={() => setQ("")} className="underline underline-offset-2 hover:no-underline">
              Hapus pencarian
            </button>
          )}
        </div>

        {/* Grid Masonry */}
        {filtered.length === 0 ? (
          <div className="p-8 rounded-2xl border bg-white/70 text-center text-gray-600">
            Tidak ada foto kegiatan yang cocok.
          </div>
        ) : (
          <div className={columnsClass}>
            {filtered.map((it, i) => (
              <motion.button
                key={it.id}
                onClick={() => open(i)}
                whileHover={{ y: -2 }}
                className="group mb-4 block w-full text-left break-inside-avoid relative"
                title={it.title}
              >
                <div className="relative overflow-hidden rounded-2xl border bg-white shadow-sm">
                  {/* gambar natural aspect */}
                  <img
                    src={it.thumb || it.src}
                    alt={it.title || "Foto kegiatan"}
                    className="w-full h-auto object-cover transition duration-500 group-hover:scale-[1.02]"
                    loading="lazy"
                  />

                  {/* ribbon Kegiatan */}
                  <div className="absolute left-3 top-3">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-blue-600 text-white shadow">
                      Kegiatan
                    </span>
                  </div>

                  {/* overlay info */}
                  {(it.title || it.takenAt || it.location) && (
                    <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/70 via-black/40 to-transparent text-white">
                      <div className="text-sm font-semibold line-clamp-2">
                        {it.title || "Tanpa judul"}
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-[11px] opacity-90">
                        {it.takenAt && (
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays className="w-3.5 h-3.5" /> {formatDate(it.takenAt)}
                          </span>
                        )}
                        {it.location && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" /> {it.location}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
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
                  alt={a.title || "Foto kegiatan"}
                  className="w-full max-h-[80vh] object-contain rounded-xl shadow-2xl bg-black/30"
                />
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
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 mt-1">
                      {a.takenAt && (
                        <span className="inline-flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" /> {formatDate(a.takenAt)}</span>
                      )}
                      {a.location && (
                        <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {a.location}</span>
                      )}
                    </div>
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
                      <span key={t} className="px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-100">#{t}</span>
                    ))}
                  </div>
                )}

                {/* Filmstrip */}
                {filtered.length > 1 && (
                  <div className="mt-6">
                    <div className="text-xs font-semibold text-gray-500 mb-2">Lainnya dalam koleksi ({filtered.length})</div>
                    <div className="grid grid-cols-6 gap-2">
                      {filtered.map((it, i) => (
                        <button
                          key={it.id}
                          onClick={() => setActiveIdx(i)}
                          className={`relative rounded-md overflow-hidden border ${i === activeIdx ? "ring-2 ring-blue-600" : ""}`}
                          title={it.title}
                        >
                          <img src={it.thumb || it.src} alt={it.title || "Foto kegiatan"} className="aspect-square w-full object-cover" loading="lazy" />
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
