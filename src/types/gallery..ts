export type GalleryItem = {
  id: string;
  src: string;        // path gambar resolusi besar (di /public atau via URL)
  thumb?: string;     // optional: path thumbnail; kalau kosong pakai src
  title?: string;
  caption?: string;
  takenAt?: string;   // ISO string atau bebas untuk ditampilkan
  tags?: string[];    // optional: untuk filter
};
