# Dashboard APBD Interaktif - Google Sheets Integration

Aplikasi ini adalah dashboard interaktif premium untuk memonitor data APBD (Anggaran Pendapatan dan Belanja Daerah) Kabupaten Sumbawa Barat. Dilengkapi dengan visualisasi modern, analisis tren, dan integrasi langsung dengan Google Sheets.

## Fitur Utama

- **Identitas Daerah**: Menggunakan Logo Resmi Pemerintah Kabupaten Sumbawa Barat (KSB) untuk tampilan yang profesional dan kontekstual.
- **Navigasi Rail Modern**: Menggunakan Sidebar yang dapat di-expand/collapse untuk navigasi yang lebih efisien dan ruang kerja yang lebih luas.
- **Menu Terstruktur (Postur APBD)**: Pengelompokan logis navigasi berdasarkan Pendapatan, Belanja, dan Pembiayaan.
- **Ringkasan Komposisi**: Diagram donut "Komposisi APBD" yang letaknya strategis untuk memberikan gambaran cepat pembagian realisasi.
- **Filter Bulanan Dinamis**: Semua data otomatis terupdate berdasarkan bulan yang dipilih atau akumulasi.
- **Fitur Scraper DJPK (Baru!)**: Menu "Tambah Data" kini aktif! Anda bisa menarik data realisasi langsung dari Portal DJPK Kemenkeu ke Google Sheets secara otomatis menggunakan teknik DOM Parsing (Regex).
- **Integrasi Otomatis**: Terhubung langsung ke Google Sheets melalui Google Apps Script V3.0 yang mendukung pengambilan data dashboard dan scraping data baru.

## Struktur Google Sheets

Untuk menghubungkan data Anda, pastikan Google Sheet memiliki struktur sebagai berikut pada sheet utama (beri nama sheet: **Data APBD**):

| Kolom | Nama Header | Deskripsi | Contoh Value |
|-------|-------------|-----------|--------------|
| **A** | `Akun` | Nama pos anggaran | PAD, Belanja Pegawai, dll |
| **B** | `Anggaran` | Total anggaran (Angka) | 150000000 |
| **C** | `Realisasi` | Total realisasi (Angka) | 75000000 |
| **D** | `Persentase`| % Capaian (Angka/Rumus) | 50.00 |
| **E** | `Kategori` | Jenis pos (Kecil semua) | `pendapatan`, `belanja`, atau `pembiayaan` |
| **F** | `Bulan` | Nama Bulan | Januari, Februari, Maret, dst |

Fitur **Tambah Data (Scraper)** akan otomatis membuat sheet baru bernama **Raw_Data** untuk menampung hasil tarikan data dari Portal DJPK sebagai kontrol sebelum Anda memindahkannya ke data dashboard.

---

### Koneksi Google Apps Script (V3.9)

1. Di Google Sheets, buka menu **Extensions** > **Apps Script**.
2. Hapus semua kode default dan tempel kode lengkap di bawah ini:

```javascript
/**
 * GOOGLE APPS SCRIPT LENGKAP (V3.9)
 * Gabungan: Dashboard Data + Scraper DJPK + Sync Internal
 * Deployment: Deploy -> New Deployment -> Web App -> Execute as: Me -> Who has access: Anyone
 */

function doGet(e) {
  const action = e.parameter.action;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  try {
    if (action === 'scrape') return scrapeDataToRaw(e.parameter.periode, e.parameter.tahun);
    if (action === 'sync') return syncRawToMain();
    
    // DEFAULT: Fetch Dashboard Data
    const sheet = ss.getSheetByName("Data APBD"); 
    if (!sheet) return createJsonResponse([]);
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return createJsonResponse([]); // Hanya header
    
    const rows = data.slice(1); 
    const result = rows.map(row => ({
      akun: row[0] ? row[0].toString() : "",
      anggaran: row[1] ? Number(row[1]) : 0,
      realisasi: row[2] ? Number(row[2]) : 0,
      persentase: row[3] ? Number(row[3]) : 0,
      kategori: row[4] ? row[4].toString().toLowerCase().trim() : "pendapatan",
      bulan: row[5] ? row[5].toString().trim() : "Januari"
    }));
    return createJsonResponse(result);
  } catch (err) {
    return createJsonResponse({ error: true, message: err.toString() });
  }
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function syncRawToMain() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const rawSheet = ss.getSheetByName('Raw_Data');
  let mainSheet = ss.getSheetByName('Data APBD');
  
  if (!rawSheet) return createJsonResponse({ status: 'error', message: 'Sheet Raw_Data tidak ditemukan.' });
  if (!mainSheet) {
    mainSheet = ss.insertSheet('Data APBD');
    mainSheet.appendRow(['Akun', 'Anggaran', 'Realisasi', 'Persentase', 'Kategori', 'Bulan']);
  }
  
  const data = rawSheet.getDataRange().getValues();
  if (data.length <= 1) return createJsonResponse({ status: 'info', message: 'Tidak ada data di Raw_Data.' });
  
  let syncedCount = 0;
  for (let i = 1; i < data.length; i++) {
    const status = data[i][7]; // Kolom H (Log Status)
    if (status === 'SCRAPED') {
      const rowToMove = data[i].slice(0, 6);
      mainSheet.appendRow(rowToMove);
      rawSheet.getRange(i + 1, 8).setValue('SYNCED');
      syncedCount++;
    }
  }
  return createJsonResponse({ status: 'success', message: 'Berhasil memindahkan ' + syncedCount + ' baris ke Data APBD.' });
}

function scrapeDataToRaw(periode, tahun) {
  const years = tahun || '2024';
  const prov = '23'; 
  const pemda = '09'; 
  const url = 'https://djpk.kemenkeu.go.id/portal/data/apbd?periode=' + periode + '&tahun=' + years + '&provinsi=' + prov + '&pemda=' + pemda;
  
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const bulanNama = months[parseInt(periode) - 1] || 'Januari';

  try {
    const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true, headers: { "User-Agent": "Mozilla/5.0" } });
    const html = response.getContentText();
    const tablePart = html.split('<tbody')[1] || html;
    const rowStrings = tablePart.split('<tr');
    const rows = [];
    for (let i = 1; i < rowStrings.length; i++) {
        const cellStrings = rowStrings[i].split('<td');
        const cells = [];
        for (let j = 1; j < cellStrings.length; j++) {
            let content = cellStrings[j].split('>')[1] || "";
            content = content.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').replace(/[ ]+/g, ' ').trim();
            cells.push(content);
        }
        if (cells.length >= 4 && cells[1] !== "") rows.push(cells);
    }
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let rawSheet = ss.getSheetByName('Raw_Data');
    if (!rawSheet) {
      rawSheet = ss.insertSheet('Raw_Data');
      rawSheet.appendRow(['Akun', 'Anggaran', 'Realisasi', 'Persen', 'Kategori', 'Bulan', 'Timestamp', 'Log Status']);
    }
    const timestamp = new Date();
    let currentCategory = "pendapatan"; 
    rows.forEach(row => {
        const akunRaw = row[1];
        if (akunRaw.toLowerCase().includes("pendapatan daerah")) currentCategory = "pendapatan";
        else if (akunRaw.toLowerCase().includes("belanja daerah")) currentCategory = "belanja";
        else if (akunRaw.toLowerCase().includes("pembiayaan daerah")) currentCategory = "pembiayaan";
        rawSheet.appendRow([akunRaw, parseAmount(row[2]), parseAmount(row[3]), row[4].replace(',', '.'), currentCategory, bulanNama, timestamp, 'SCRAPED']);
    });
    return createJsonResponse({ status: 'success', message: 'Data berhasil ditarik ke "Raw_Data". Silakan Sync.' });
  } catch(e) {
    return createJsonResponse({ status: 'error', message: 'Gagal: ' + e.toString() });
  }
}

function parseAmount(val) {
  if (!val || val === "-" || val === "0") return 0;
  let multiplier = 1;
  const cleanVal = val.toString().trim();
  if (cleanVal.endsWith(' M')) multiplier = 1000000000;
  else if (cleanVal.endsWith(' J')) multiplier = 1000000;
  else if (cleanVal.endsWith(' T')) multiplier = 1000000000000;
  let numStr = cleanVal.split(' ')[0].replace(/[.]/g, '').replace(/,/g, '.');
  return isNaN(parseFloat(numStr)) ? 0 : parseFloat(numStr) * multiplier;
}
```

## Cara Deployment (PENTING!)

1. Klik tombol biru **Deploy** di kanan atas > **New deployment**.
2. Pilih **Select type** > **Web app**.
3. Isi **Description** (misal: "API APBD Scraper v3").
4. **Execute as**: Pilih **Me** (Email Anda).
5. **Who has access**: Pilih **Anyone** (Penting agar aplikasi bisa berkomunikasi dengan script).
6. Klik **Deploy**.
7. Salin **Web App URL** yang muncul (Berakhir dengan `/exec`).

## Update Data di Dashboard

1. Buka aplikasi Dashboard ini.
2. Jika Anda baru pertama kali, menu **Tambah Data** akan meminta URL Apps Script.
3. Masukkan URL yang sudah disalin tadi ke kotak input yang tersedia.
4. Aplikasi akan refresh dan fitur Scraper siap digunakan!
