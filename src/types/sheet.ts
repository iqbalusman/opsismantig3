export interface SheetRow {
  timestamp: string;   // ISO 8601
  suhuIkan: number;    // dari "suhu ikan" (mengubah koma -> titik)
  warnaIkan: string;   // dari "warna ikan" (mis. CERAH | NETRAL | PUCAT)
  statusGas: string;   // dari "status gas" (mis. AMAN | TIDAK)
  nilaiGas: number;    // dari "nilai gas" (angka)
}

export interface ChartPoint {
  time: string;        // label waktu lokal (HH:MM)
  timestamp: number;   // epoch ms
  suhuIkan: number;
  nilaiGas: number;
  warnaIndex: number;  // 0=PUCAT, 1=NETRAL, 2=CERAH
}
