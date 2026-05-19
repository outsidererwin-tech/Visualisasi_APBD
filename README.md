# Dashboard APBD - Google Sheets Integration

Aplikasi ini adalah dashboard interaktif untuk memonitor data APBD (Anggaran Pendapatan dan Belanja Daerah).

## Cara Menghubungkan ke Google Sheets

1. **Siapkan Google Sheet**:
   - Buat spreadsheet baru.
   - Beri nama Sheet pertama sebagai `Data APBD`.
   - Buat kolom berikut di baris pertama (Header):
     - `Akun` (Kolom A)
     - `Anggaran` (Kolom B)
     - `Realisasi` (Kolom C)
     - `Persentase` (Kolom D)
   - Isi data Anda di baris-baris berikutnya.

2. **Setup Google Apps Script**:
   - Di Google Sheets, buka menu **Extensions** > **Apps Script**.
   - Hapus semua kode yang ada dan tempel kode berikut:

   ```javascript
   function doGet() {
     const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Data APBD");
     const data = sheet.getDataRange().getValues();
     const rows = data.slice(1); // Melewati baris header
     
     const result = rows.map(row => ({
       akun: row[0].toString(),
       anggaran: Number(row[1]),
       realisasi: Number(row[2]),
       persentase: Number(row[3])
     }));
     
     return ContentService.createTextOutput(JSON.stringify(result))
       .setMimeType(ContentService.MimeType.JSON);
   }
   ```

3. **Deploy sebagai Web App**:
   - Klik tombol **Deploy** > **New deployment**.
   - Pilih type **Web app**.
   - Di bagian **Execute as**, pilih `Me`.
   - Di bagian **Who has access**, pilih `Anyone`.
   - Klik **Deploy** dan salin **Web App URL** yang muncul.

4. **Koneksikan ke Dashboard**:
   - Buka dashboard ini.
   - Klik ikon **Settings** (roda gigi) di pojok kanan atas.
   - Tempel URL Apps Script Anda ke kotak input yang tersedia.
   - Klik **Update Data**.

Dashboard akan sekarang menampilkan data langsung dari Google Sheet Anda!
