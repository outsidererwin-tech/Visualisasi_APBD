# Dashboard APBD Interaktif - Google Sheets Integration

Aplikasi ini adalah dashboard interaktif premium untuk memonitor data APBD (Anggaran Pendapatan dan Belanja Daerah) Kabupaten Sumbawa Barat. Dilengkapi dengan visualisasi modern, analisis tren, dan integrasi langsung dengan Google Sheets.

## Fitur Utama

- **Identitas Daerah**: Menggunakan Logo Resmi Pemerintah Kabupaten Sumbawa Barat (KSB) untuk tampilan yang profesional dan kontekstual.
- **Navigasi Rail Modern**: Menggunakan Sidebar yang dapat di-expand/collapse untuk navigasi yang lebih efisien dan ruang kerja yang lebih luas.
- **Menu Terstruktur (Postur APBD)**: Pengelompokan logis navigasi berdasarkan Pendapatan, Belanja, dan Pembiayaan.
- **Ringkasan Komposisi**: Diagram donut "Komposisi APBD" yang letaknya strategis untuk memberikan gambaran cepat pembagian realisasi.
- **Filter Bulanan Dinamis**: Semua data otomatis terupdate berdasarkan bulan yang dipilih atau akumulasi.
- **Fitur Scraper DJPK (Baru!)**: Menu "Tambah Data" kini aktif! Anda bisa menarik data realisasi langsung dari Portal DJPK Kemenkeu ke Google Sheets secara otomatis dengan murni mengunduh spreadsheet XML untuk akurasi nominal rupiah mutlak sampai digit satuan decimal.
- **Integrasi Otomatis**: Terhubung langsung ke Google Sheets melalui Google Apps Script V5.0 (Presisi Tinggi) yang mendukung pengambilan data dashboard dan scraping data baru.

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

### Koneksi Google Apps Script (V5.0 - Presisi Tinggi)

1. Di Google Sheets, buka menu **Extensions** > **Apps Script**.
2. Hapus semua kode default dan tempel kode lengkap di bawah ini:

```javascript
/**
 * GOOGLE APPS SCRIPT LENGKAP (V5.0)
 * Gabungan: Dashboard Data + Scraper DJPK ( Spreadsheet XML Presisi Tinggi ) + Sync Internal + Manual Copy-Paste
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
      anggaran: row[1] ? safeParseNumber(row[1]) : 0,
      realisasi: row[2] ? safeParseNumber(row[2]) : 0,
      persentase: row[3] ? safeParseNumber(row[3]) : 0,
      kategori: row[4] ? row[4].toString().toLowerCase().trim() : "pendapatan",
      bulan: row[5] ? row[5].toString().trim() : "Januari"
    }));
    return createJsonResponse(result);
  } catch (err) {
    return createJsonResponse({ error: true, message: err.toString() });
  }
}

// Bypassing CORS Preflight by receiving raw JSON inside a simple POST
function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action;
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    if (action === 'save_rows') {
      const rows = postData.rows; // Array of [Akun, Anggaran, Realisasi, Persen, Kategori, Bulan]
      let rawSheet = ss.getSheetByName('Raw_Data');
      if (!rawSheet) {
        rawSheet = ss.insertSheet('Raw_Data');
        rawSheet.appendRow(['Akun', 'Anggaran', 'Realisasi', 'Persen', 'Kategori', 'Bulan', 'Timestamp', 'Log Status']);
      }
      
      const timestamp = new Date();
      rows.forEach(row => {
        rawSheet.appendRow([
          row[0] ? row[0].toString() : "", // Akun
          safeParseNumber(row[1]), // Anggaran
          safeParseNumber(row[2]), // Realisasi
          row[3] ? safeParseNumber(row[3]) : 0, // Persen (simpan sebagai numerik murni agar terhindar dari format tanggal)
          row[4] || 'pendapatan', // Kategori
          row[5] || 'Januari', // Bulan
          timestamp,
          'SCRAPED'
        ]);
      });
      return createJsonResponse({ status: 'success', message: 'Berhasil menyimpan ' + rows.length + ' baris data ke sheet Raw_Data!' });
    }
  } catch(err) {
    return createJsonResponse({ status: 'error', message: err.toString() });
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
    mainSheet.appendRow(['Akun', 'Anggaran', 'Realisasi', 'Persen', 'Kategori', 'Bulan']);
  }
  
  const data = rawSheet.getDataRange().getValues();
  if (data.length <= 1) return createJsonResponse({ status: 'info', message: 'Tidak ada data di Raw_Data.' });
  
  // Set format kolom Persen di sheet tujuan sebagai angka desimal standar sebelum memindahkan
  const lastRow = mainSheet.getLastRow();
  
  let syncedCount = 0;
  for (let i = 1; i < data.length; i++) {
    const status = data[i][7]; // Kolom H (Log Status)
    if (status === 'SCRAPED') {
      const rowToMove = [
        data[i][0], // Akun
        safeParseNumber(data[i][1]), // Anggaran (Numerik Murni)
        safeParseNumber(data[i][2]), // Realisasi (Numerik Murni)
        safeParseNumber(data[i][3]), // Persen (Numerik Murni)
        data[i][4], // Kategori
        data[i][5]  // Bulan
      ];
      mainSheet.appendRow(rowToMove);
      rawSheet.getRange(i + 1, 8).setValue('SYNCED');
      syncedCount++;
    }
  }
  
  // Beri format angka eksplisit ke kolom persen agar meyakinkan tidak ditampilkan kembali sebagai tanggal
  if (mainSheet.getLastRow() > lastRow) {
    const newRowsCount = mainSheet.getLastRow() - lastRow;
    mainSheet.getRange(lastRow + 1, 4, newRowsCount, 1).setNumberFormat("0.00");
  }
  
  return createJsonResponse({ status: 'success', message: 'Berhasil memindahkan ' + syncedCount + ' baris ke Data APBD.' });
}

function scrapeDataToRaw(periode, tahun) {
  const years = tahun || '2026';
  const prov = '23'; 
  const pemda = '09'; 
  const url = 'https://djpk.kemenkeu.go.id/portal/csv_apbd?type=apbd&periode=' + periode + '&tahun=' + years + '&provinsi=' + prov + '&pemda=' + pemda;
  
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const bulanNama = months[parseInt(periode) - 1] || 'Januari';

  try {
    const options = {
      "muteHttpExceptions": true,
      "validateHttpsCertificates": false,
      "followRedirects": true,
      "headers": {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "id,en-US;q=0.9,en;q=0.8"
      }
    };
    const response = UrlFetchApp.fetch(url, options);
    const statusCode = response.getResponseCode();
    
    if (statusCode !== 200) {
      throw new Error("HTTP Status " + statusCode + " dari Portal DJPK. Portal mungkin sedang memblokir akses otomatis Google Apps Script.");
    }
    
    const xml = response.getContentText();
    if (!xml || !xml.includes("<Row>")) {
      throw new Error("Respon kosong atau tidak mengandung data tabel dari Portal DJPK. Periksa apakah URL dapat diakses.");
    }
    
    // Parse the XML spreadsheet rows using a fast and ultra-robust Regex
    const rows = [];
    const rowMatches = xml.match(/<Row>([\s\S]*?)<\/Row>/g);
    if (rowMatches) {
      // Loop starting from index 1 to skip the header row (Akun, Anggaran, Realisasi, Persentase)
      for (let i = 1; i < rowMatches.length; i++) {
        const rowXml = rowMatches[i];
        const cellMatches = rowXml.match(/<Cell[^>]*>[\s\S]*?<Data[^>]*>([\s\S]*?)<\/Data>[\s\S]*?<\/Cell>/g);
        if (cellMatches && cellMatches.length >= 4) {
          const cells = cellMatches.map(cellXml => {
            const dataMatch = cellXml.match(/<Data[^>]*>([\s\S]*?)<\/Data>/);
            let content = dataMatch ? dataMatch[1].trim() : "";
            content = content
              .replace(/&amp;/g, '&')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&quot;/g, '"')
              .replace(/&apos;/g, "'")
              .replace(/&#39;/g, "'");
            return content;
          });
          rows.push(cells);
        }
      }
    }
    
    if (rows.length === 0) {
      throw new Error("Tabel realisasi APBD tidak ditemukan di file Spreadsheet XML Portal DJPK. Pastikan data periode & tahun tersebut sudah dipublikasikan.");
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
        // XML indices: row[0] is Akun, row[1] is Anggaran (number), row[2] is Realisasi (number), row[3] is Persentase
        const akunField = row[0] || "";
        const akunRaw = akunField.trim();
        if (!akunRaw) return;
        
        const lowerAkun = akunRaw.toLowerCase();
        if (lowerAkun.includes("pendapatan daerah")) currentCategory = "pendapatan";
        else if (lowerAkun.includes("belanja daerah")) currentCategory = "belanja";
        else if (lowerAkun.includes("pembiayaan daerah")) currentCategory = "pembiayaan";
        
        let rawAnggaran = safeParseNumber(row[1]);
        let rawRealisasi = safeParseNumber(row[2]);
        let rawPersen = safeParseNumber(row[3]);
        
        rawSheet.appendRow([
          akunRaw, 
          rawAnggaran, 
          rawRealisasi, 
          rawPersen, 
          currentCategory, 
          bulanNama, 
          timestamp, 
          'SCRAPED'
        ]);
    });
    
    const finalLastRow = rawSheet.getLastRow();
    if (finalLastRow > 1) {
       rawSheet.getRange(2, 4, finalLastRow - 1, 1).setNumberFormat("0.00");
    }
    
    return createJsonResponse({ 
      status: 'success', 
      message: 'Data PRESISI TINGGI periode ' + bulanNama + ' ' + years + ' berhasil ditarik langsung dari file Spreadsheet XML Portal DJPK ke tab "Raw_Data"!' 
    });
  } catch(e) {
    return createJsonResponse({ 
      status: 'error', 
      message: 'Gagal menghubungi atau parsing file spreadsheet dari Portal DJPK Kemenkeu karena faktor jaringan luring (Google Cloud IP). Solusi: Silakan buka langsung URL: ' + url + ' di browser Anda, lalu salin manual tabel ke tab Raw_Data. Error Detail: ' + e.toString() 
    });
  }
}

function parseAmount(val) {
  if (!val) return 0;
  let strVal = val.toString().trim();
  
  // Jika string merupakan bentuk gabungan "TEXT|TITLE" dari parsing cell td
  if (strVal.indexOf('|') !== -1) {
    let parts = strVal.split('|');
    let textPart = parts[0];
    let titlePart = parts[1];
    
    // Coba parsing dari titlePart terlebih dahulu karena titlePart berisi angka rupiah presisi penuh (misal "Rp 1.084.268.619.724,00")
    if (titlePart) {
      // Hilangkan prefiks rupiah dan karakter non-angka desimal
      let cleanTitle = titlePart.replace(/^[Rr][Pp]\.?\s*/g, '').replace(/[^0-9.,-]/g, '').trim();
      let parseAttempt = safeParseNumber(cleanTitle);
      if (parseAttempt !== 0) {
        return parseAttempt; // Kembalikan nilai presisi eksak penuh tanpa pembulatan singkatan!
      }
    }
    strVal = textPart;
  }
  
  let tempVal = strVal.trim();
  if (tempVal === "-" || tempVal === "0") return 0;
  let multiplier = 1;
  if (tempVal.endsWith(' M')) multiplier = 1000000000;
  else if (tempVal.endsWith(' J')) multiplier = 1000000;
  else if (tempVal.endsWith(' T')) multiplier = 1000000000000;
  
  let numStr = tempVal.split(' ')[0];
  return safeParseNumber(numStr) * multiplier;
}

function safeParseNumber(val) {
  if (val === undefined || val === null) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  
  let str = val.toString().trim();
  
  // Remove "Rp" or "Rp." prefixes in a case-insensitive way
  str = str.replace(/^[Rr][Pp]\.?\s*/g, '');
  
  // Clean from anything other than digits, dots, commas, and hyphens (minus sign)
  str = str.replace(/[^0-9.,-]/g, '').trim();
  if (!str || str === '-') return 0;
  
  // If we have both dots and commas, e.g. "1.084.270.000,50"
  if (str.indexOf('.') !== -1 && str.indexOf(',') !== -1) {
    // If dot comes before comma, e.g. "1.234,56", dots are thousands and comma is decimal
    if (str.lastIndexOf('.') < str.lastIndexOf(',')) {
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      // If comma comes before dot, e.g. "1,234.56"
      str = str.replace(/,/g, '');
    }
  } else if (str.indexOf(',') !== -1) {
    // Has commas but no dots
    const parts = str.split(',');
    if (parts.length === 2 && parts[1].length < 3) {
      str = str.replace(',', '.');
    } else {
      str = str.replace(/,/g, '');
    }
  } else if (str.indexOf('.') !== -1) {
    // Has dots but no commas.
    const parts = str.split('.');
    // If there is only ONE dot, treat it as thousands separator if the part after it is exactly 3 digits
    if (parts.length > 2) {
      // Multiple dots, e.g. "1.084.270.000" -> thousands separator
      str = str.replace(/\./g, '');
    } else if (parts.length === 2 && parts[1].length === 3) {
      // Single dot followed by exactly 3 digits, e.g. "159.000" or "8.100" -> thousands separator
      str = str.replace(/\./g, '');
    }
  }
  
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
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
