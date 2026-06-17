export interface APBDData {
  akun: string;
  anggaran: number;
  realisasi: number;
  persentase: number;
  kategori: 'pendapatan' | 'belanja' | 'pembiayaan';
  bulan: string;
}

export interface SikdRecord {
  id?: string;
  tanggal: string;       // Tanggal
  jenisDana: string;     // Jenis Dana
  uraian: string;        // Uraian
  periode: string;       // Periode
  nilaiKotor: number;    // Nilai Kotor
  potongan: number;      // Potongan
  nilaiBersih: number;   // Nilai Bersih
  tunda: number;         // Tunda
  status: string;        // Status
  lkt: string;           // LKT
}

export interface SikdAllocationRecord {
  id?: string;
  kode: string;          // Kode
  uraian: string;        // Uraian
  pagu: number;          // Pagu (Anggaran)
  realisasi: number;     // Realisasi
  rasio: number;         // Rasio (%)
}

export interface SipdRealizationRecord {
  id?: string;
  idDaerah: string;
  tahun: string;
  kodeUrusan: string;
  namaUrusan: string;
  kodeBidangUrusan: string;
  namaBidangUrusan: string;
  kodeFungsi: string;
  namaFungsi: string;
  kodeSubFungsi: string;
  namaSubFungsi: string;
  kodeSkpd: string;
  namaSkpd: string;
  kodeSubSkpd: string;
  namaSubSkpd: string;
  kodeProgram: string;
  namaProgram: string;
  kodeKegiatan: string;
  namaKegiatan: string;
  kodeSubKegiatan: string;
  namaSubKegiatan: string;
  kodeRekening: string;
  namaRekening: string;
  alokasiAnggaran: number;
  realisasiAnggaran: number;
}

export interface DashboardStats {
  totalAnggaran: number;
  totalRealisasi: number;
  overallPersentase: number;
}

