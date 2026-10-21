import * as XLSX from 'xlsx';
import { Item, Asset, BarangMasuk, BarangKeluar, StockLedgerEntry, StockSummary, Config } from '../types';

export const excelService = {
  /**
   * Export Master Persediaan & Stok ke Excel
   */
  exportPersediaan(items: Item[], stockMap: Record<string, number>, config: Config, filename = 'Laporan_Persediaan_Barang') {
    const data = items.map((item, index) => ({
      'No': index + 1,
      'Kode Barang': item.KODE_BARANG,
      'Nama Barang': item.NAMA_BARANG,
      'Kategori': item.KATEGORI,
      'Tipe': item.TIPE,
      'Satuan': item.JENIS_SATUAN,
      'Stok Fisik': stockMap[item.KODE_BARANG] || 0,
      'Stok Minimum': item.MINIMUM_STOK,
      'Status Stok': (stockMap[item.KODE_BARANG] || 0) <= 0 ? 'HABIS' : (stockMap[item.KODE_BARANG] || 0) <= item.MINIMUM_STOK ? 'KRITIS' : 'AMAN',
      'Harga Satuan Standar (Rp)': item.HARGA_STANDAR || 0,
      'Total Nilai Persediaan (Rp)': (stockMap[item.KODE_BARANG] || 0) * (item.HARGA_STANDAR || 0),
      'Lokasi Simpan': item.LOKASI_DEFAULT,
      'Sumber Dana Default': item.SUMBER_DANA_DEFAULT || 'BOS Reguler',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Auto-fit column widths
    const colWidths = [
      { wch: 6 },  // No
      { wch: 18 }, // Kode
      { wch: 32 }, // Nama
      { wch: 18 }, // Kategori
      { wch: 14 }, // Tipe
      { wch: 10 }, // Satuan
      { wch: 12 }, // Stok Fisik
      { wch: 14 }, // Stok Min
      { wch: 14 }, // Status
      { wch: 22 }, // Harga
      { wch: 24 }, // Total Nilai
      { wch: 20 }, // Lokasi
      { wch: 20 }, // Sumber Dana
    ];
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Persediaan');

    const formattedDate = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `${filename}_${config.SCHOOL_NAME.replace(/\s+/g, '_')}_${formattedDate}.xlsx`);
  },

  /**
   * Export Aset Inventaris / KIB ke Excel
   */
  exportAssets(assets: Asset[], config: Config, filterKib = 'ALL', filename = 'Daftar_Aset_KIB') {
    const filtered = filterKib === 'ALL' 
      ? assets 
      : assets.filter(a => a.KIB_KATEGORI === filterKib || a.KATEGORI === filterKib);

    const data = filtered.map((ast, index) => ({
      'No': index + 1,
      'Kode Register Aset': ast.KODE_ASET,
      'Kode Barang': ast.KODE_BARANG,
      'Nama Barang / Aset': ast.NAMA_BARANG,
      'Golongan KIB': ast.KIB_KATEGORI || 'KIB B (Peralatan)',
      'Merk / Spesifikasi': ast.MERK_SPESIFIKASI || '-',
      'Tahun Perolehan': ast.TAHUN_PEROLEHAN,
      'Kondisi': ast.KONDISI,
      'Jumlah Unit': ast.JUMLAH || 1,
      'Satuan': ast.JENIS_SATUAN || 'Unit',
      'Harga Perolehan (Rp)': ast.HARGA_PEROLEHAN || 0,
      'Nilai Buku Saat Ini (Rp)': ast.NILAI_BUKU !== undefined ? ast.NILAI_BUKU : (ast.HARGA_PEROLEHAN || 0),
      'Lokasi Ruangan': ast.LOKASI,
      'Penanggung Jawab': ast.PENANGGUNG_JAWAB,
      'Sumber Perolehan': ast.SUMBER_PEROLEHAN || 'BOS Reguler',
      'Link Berkas Google Drive': ast.DRIVE_FILE_URL || '-',
      'Keterangan': ast.KETERANGAN || '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    worksheet['!cols'] = [
      { wch: 6 },
      { wch: 20 },
      { wch: 18 },
      { wch: 34 },
      { wch: 20 },
      { wch: 26 },
      { wch: 16 },
      { wch: 14 },
      { wch: 12 },
      { wch: 10 },
      { wch: 22 },
      { wch: 22 },
      { wch: 20 },
      { wch: 24 },
      { wch: 20 },
      { wch: 35 },
      { wch: 25 },
    ];

    const workbook = XLSX.utils.book_new();
    const sheetName = filterKib === 'ALL' ? 'Inventaris KIB' : filterKib.slice(0, 31);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    const formattedDate = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `${filename}_${filterKib}_${formattedDate}.xlsx`);
  },

  /**
   * Export Barang Masuk / Pengadaan ke Excel
   */
  exportBarangMasuk(records: BarangMasuk[], config: Config, filename = 'Laporan_Barang_Masuk_BOS') {
    const data = records.map((bm, index) => ({
      'No': index + 1,
      'Tanggal Penerimaan': bm.TANGGAL,
      'Nomor Dokumen/Faktur': bm.NOMOR_KWITANSI || bm.NOMOR_BKU || '-',
      'Nomor BKU': bm.NOMOR_BKU || '-',
      'Kode Barang': bm.KODE_BARANG,
      'Nama Barang': bm.NAMA_BARANG,
      'Kategori': bm.KATEGORI,
      'Jumlah Diterima': bm.JUMLAH,
      'Satuan': bm.JENIS_SATUAN,
      'Harga Satuan (Rp)': bm.HARGA_SATUAN,
      'Total Nilai (Rp)': bm.TOTAL_HARGA,
      'Penyedia / Toko': bm.NAMA_TOKO,
      'Sumber Anggaran': bm.SUMBER_DANA,
      'Petugas Penerima': bm.PENERIMA,
      'Keterangan': bm.KETERANGAN || '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    worksheet['!cols'] = [
      { wch: 6 },
      { wch: 16 },
      { wch: 22 },
      { wch: 18 },
      { wch: 16 },
      { wch: 30 },
      { wch: 16 },
      { wch: 14 },
      { wch: 10 },
      { wch: 18 },
      { wch: 20 },
      { wch: 26 },
      { wch: 18 },
      { wch: 22 },
      { wch: 24 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Barang Masuk');

    const formattedDate = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `${filename}_${formattedDate}.xlsx`);
  },

  /**
   * Export Barang Keluar / SPB ke Excel
   */
  exportBarangKeluar(records: BarangKeluar[], config: Config, filename = 'Laporan_Distribusi_Barang_Keluar') {
    const data = records.map((bk, index) => ({
      'No': index + 1,
      'Tanggal Penyerahan': bk.TANGGAL,
      'Nomor SPB': bk.NOMOR_DOKUMEN,
      'Kode Barang': bk.KODE_BARANG,
      'Nama Barang': bk.NAMA_BARANG,
      'Kategori': bk.KATEGORI,
      'Jumlah Diserahkan': bk.JUMLAH,
      'Satuan': bk.JENIS_SATUAN,
      'Nilai Perkiraan (Rp)': bk.TOTAL_NILAI || 0,
      'Penerima / Guru': bk.PENERIMA,
      'NIP Penerima': bk.NIP_PENERIMA || '-',
      'Unit / Kelas / Ruangan': bk.PERUNTUKAN,
      'Status Transaksi': bk.STATUS_TRANSAKSI || 'SELESAI',
      'Petugas Gudang': bk.PETUGAS_GUDANG || '-',
      'Keterangan': bk.KETERANGAN || '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    worksheet['!cols'] = [
      { wch: 6 },
      { wch: 16 },
      { wch: 22 },
      { wch: 16 },
      { wch: 30 },
      { wch: 16 },
      { wch: 14 },
      { wch: 10 },
      { wch: 18 },
      { wch: 24 },
      { wch: 20 },
      { wch: 22 },
      { wch: 20 },
      { wch: 22 },
      { wch: 24 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Distribusi Barang');

    const formattedDate = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `${filename}_${formattedDate}.xlsx`);
  },

  /**
   * Export Buku Pembantu Kas / Stok Buku Besar
   */
  exportStockLedger(entries: StockLedgerEntry[], config: Config, filename = 'Buku_Besar_Kartu_Stok') {
    const data = entries.map((entry, index) => ({
      'No': index + 1,
      'Tanggal': entry.TANGGAL || '-',
      'Kode Barang': entry.KODE_BARANG || '-',
      'Nama Barang': entry.NAMA_BARANG || '-',
      'Jenis Mutasi': entry.REF_TYPE || entry.JENIS_MUTASI || '-',
      'Nomor Dokumen': entry.NOMOR_DOKUMEN || '-',
      'Keterangan': entry.STATUS || entry.KETERANGAN || '-',
      'Jumlah Masuk': entry.QTY_IN ?? entry.MASUK ?? 0,
      'Jumlah Keluar': entry.QTY_OUT ?? entry.KELUAR ?? 0,
      'Saldo Sisa Stok': entry.SALDO_SESUDAH ?? entry.SALDO_AKHIR ?? 0,
      'Satuan': entry.JENIS_SATUAN || 'Pcs',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    worksheet['!cols'] = [
      { wch: 6 },
      { wch: 14 },
      { wch: 16 },
      { wch: 28 },
      { wch: 14 },
      { wch: 22 },
      { wch: 30 },
      { wch: 14 },
      { wch: 14 },
      { wch: 16 },
      { wch: 10 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Kartu Stok');

    const formattedDate = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `${filename}_${formattedDate}.xlsx`);
  }
};
