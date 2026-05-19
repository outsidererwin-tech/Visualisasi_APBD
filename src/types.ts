export interface APBDData {
  akun: string;
  anggaran: number;
  realisasi: number;
  persentase: number;
}

export interface DashboardStats {
  totalAnggaran: number;
  totalRealisasi: number;
  overallPersentase: number;
}
