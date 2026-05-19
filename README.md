# Dashboard APBD Interaktif - Google Sheets Integration

Aplikasi ini adalah dashboard interaktif premium untuk memonitor data APBD (Anggaran Pendapatan dan Belanja Daerah) dengan fitur analisis trend bulanan dan komposisi realisasi.

## Struktur Google Sheets

Untuk menghubungkan data Anda, pastikan Google Sheet memiliki struktur sebagai berikut pada sheet pertama (beri nama sheet: **Data APBD**):

| Kolom | Nama Header | Deskripsi | Contoh Value |
|-------|-------------|-----------|--------------|
| **A** | `Akun` | Nama pos anggaran | PAD, Belanja Pegawai, dll |
| **B** | `Anggaran` | Total anggaran (Angka) | 150000000 |
| **C** | `Realisasi` | Total realisasi (Angka) | 75000000 |
| **D** | `Persentase`| % Capaian (Angka/Rumus) | 50.00 |
| **E** | `Kategori` | Jenis pos (Kecil semua) | `pendapatan`, `belanja`, atau `pembiayaan` |
| **F** | `Bulan` | Nama Bulan | Januari, Februari, Maret, dst |

---

## Koneksi Google Apps Script

1. Di Google Sheets, buka menu **Extensions** > **Apps Script**.
2. Hapus semua kode default dan tempel kode lengkap di bawah ini:

```javascript
/**
 * Script untuk mengambil data APBD dari Google Sheets dan
 * mengirimkannya ke Dashboard dalam format JSON.
 */
function doGet() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("Data APBD"); // Sesuaikan nama sheet jika berbeda
    
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({ error: "Sheet 'Data APBD' tidak ditemukan" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1); // Mengambil data tanpa header
    
    // Mapping data ke format JSON yang dibutuhkan aplikasi
    const result = rows.map(row => {
      return {
        akun: row[0] ? row[0].toString() : "",
        anggaran: row[1] ? Number(row[1]) : 0,
        realisasi: row[2] ? Number(row[2]) : 0,
        persentase: row[3] ? Number(row[3]) : 0,
        kategori: row[4] ? row[4].toString().toLowerCase().trim() : "pendapatan",
        bulan: row[5] ? row[5].toString().trim() : "Januari"
      };
    });
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({ error: e.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

## Cara Deployment (PENTING!)

1. Klik tombol biru **Deploy** di kanan atas > **New deployment**.
2. Pilih **Select type** > **Web app**.
3. Isi **Description** (misal: "API APBD v1").
4. **Execute as**: Pilih **Me** (Email Anda).
5. **Who has access**: Pilih **Anyone** (Agar dashboard bisa membaca data tanpa login Google).
6. Klik **Deploy**.
7. Salin **Web App URL** yang muncul (Berakhir dengan `/exec`).

## Update Data di Dashboard

1. Buka aplikasi Dashboard ini.
2. Klik tombol **Settings** (ikon roda gigi) di pojok kanan atas.
3. Masukkan URL yang sudah disalin tadi.
4. Klik **Update Data**.
