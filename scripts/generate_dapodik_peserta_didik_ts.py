#!/usr/bin/env python3
import json

with open("/tmp/parsed_students.json", "r") as f:
    students = json.load(f)

# Build TS file
ts_code = """/**
 * Data Resmi Dapodik Peserta Didik SD NEGERI TANGERANG 6
 * Berdasarkan Dokumen Resmi Dapodik Kementerian Pendidikan Dasar dan Menengah
 * Total Siswa Terdata: 742 Siswa Aktif (Rombel 1A s/d 6D)
 * Tanggal Unduh: 2026-09-30 | Pengunduh: Eko Satria Kusuma (sdnegeritangerang6@gmail.com)
 */

export interface DapodikSiswaItem {
  no: number;
  id: string;
  nama: string;
  nipd: string;
  jk: 'L' | 'P';
  nisn: string;
  tempatLahir: string;
  rombel: string;
  tingkatKelas: number;
  agama?: string;
  status: 'AKTIF';
}

export const DAPODIK_PESERTA_DIDIK: DapodikSiswaItem[] = [
"""

for s in students:
    no = s['no']
    nama = s['nama'].replace("'", "\\'")
    nipd = s['nipd']
    jk = s['jk']
    nisn = s['nisn']
    tempat_lahir = s['tempatLahir'].replace("'", "\\'")
    rombel = s['rombel']
    # compute tingkat
    tingkat = 1
    if "Kelas 2" in rombel: tingkat = 2
    elif "Kelas 3" in rombel: tingkat = 3
    elif "Kelas 4" in rombel: tingkat = 4
    elif "Kelas 5" in rombel: tingkat = 5
    elif "Kelas 6" in rombel: tingkat = 6
    
    siswa_id = f"SISWA-{str(no).padStart(4, '0') if hasattr(str(no), 'padStart') else str(no).zfill(4)}"
    
    ts_code += f"""  {{
    no: {no},
    id: '{siswa_id}',
    nama: '{nama}',
    nipd: '{nipd}',
    jk: '{jk}',
    nisn: '{nisn}',
    tempatLahir: '{tempat_lahir}',
    rombel: '{rombel}',
    tingkatKelas: {tingkat},
    agama: 'Islam',
    status: 'AKTIF'
  }},\n"""

ts_code += """];

/**
 * Helper to query students by class from Dapodik
 */
export const getDapodikStudentsByClass = (rombelName?: string): DapodikSiswaItem[] => {
  if (!rombelName) return DAPODIK_PESERTA_DIDIK;
  const clean = rombelName.trim().toLowerCase();
  return DAPODIK_PESERTA_DIDIK.filter((s) => {
    const sRombel = s.rombel.toLowerCase();
    return sRombel === clean || sRombel.replace('kelas ', '') === clean.replace('kelas ', '');
  });
};

/**
 * Summary breakdown of students per class
 */
export const getDapodikRombelStudentCounts = (): Record<string, { total: number; l: number; p: number }> => {
  const result: Record<string, { total: number; l: number; p: number }> = {};
  DAPODIK_PESERTA_DIDIK.forEach((s) => {
    if (!result[s.rombel]) {
      result[s.rombel] = { total: 0, l: 0, p: 0 };
    }
    result[s.rombel].total += 1;
    if (s.jk === 'L') result[s.rombel].l += 1;
    else result[s.rombel].p += 1;
  });
  return result;
};
"""

with open("src/data/dapodikPesertaDidik.ts", "w") as f:
    f.write(ts_code)

print("Generated src/data/dapodikPesertaDidik.ts successfully!")
