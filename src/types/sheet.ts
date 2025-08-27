export type SheetRow = {
  timestamp: string;
  suhu_ikan: number;
  warna_ikan: string;
  status_gas: string;
  nilai_gas: number;
  avg_rgb?: number;
};

// titik data untuk grafik pada halaman Monitoring
export type ChartPoint = {
  timestamp: number;   // epoch ms
  time: string;        // "HH:MM"
  suhuIkan: number;    // dari sheet.suhu_ikan
  nilaiGas: number;    // dari sheet.nilai_gas
  warnaIndex: number;  // 0..2 dari sheet.warna_ikan
};
