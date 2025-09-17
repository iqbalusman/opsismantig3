// types/sheet.ts
export type SheetRow = {
  timestamp: string;     // waktu dari kolom A
  suhu_ikan: number;     // kolom B
  nilai_gas: number;     // kolom E
  avg_rgb: number;       // kolom F
  status_gas: string;    // kolom I
  status_h: string;      // kolom J
};

// titik data untuk grafik pada halaman Monitoring
export type ChartPoint = {
  timestamp: number;   // epoch ms
  time: string;        // "HH:MM"
  suhuIkan: number;    // dari sheet.suhu_ikan
  nilaiGas: number;    // dari sheet.nilai_gas
  avgRgb: number;      // dari sheet.avg_rgb
};
