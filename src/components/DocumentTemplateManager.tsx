import React, { useState } from 'react';
import {
  Bookmark,
  Plus,
  Search,
  Check,
  Eye,
  Edit3,
  Trash2,
  Copy,
  RotateCcw,
  Sparkles,
  Layers,
  FileText,
  Building2,
  ShieldCheck,
  Award,
  Filter,
  CheckCircle2,
  X,
  Sliders,
  Printer,
  Calendar,
  History,
  Clock,
  ArrowLeftRight,
  Undo2,
  Tag,
} from 'lucide-react';
import { BATemplate, BATemplateVersion } from '../types';
import { db } from '../services/localStorageService';
import { BeritaAcaraOptions } from '../services/pdfService';

interface DocumentTemplateManagerProps {
  onApplyTemplate: (template: BATemplate) => void;
  onPreviewTemplate: (template: BATemplate) => void;
}

export const DocumentTemplateManager: React.FC<DocumentTemplateManagerProps> = ({
  onApplyTemplate,
  onPreviewTemplate,
}) => {
  const config = db.getConfig();
  const [templates, setTemplates] = useState<BATemplate[]>(db.getBATemplates());
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [activeTemplate, setActiveTemplate] = useState<BATemplate | null>(null);

  // Edit / Create Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Partial<BATemplate> | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Version History Modal state
  const [selectedTemplateForHistory, setSelectedTemplateForHistory] = useState<BATemplate | null>(null);
  const [templateVersions, setTemplateVersions] = useState<BATemplateVersion[]>([]);
  const [showManualSnapshotModal, setShowManualSnapshotModal] = useState(false);
  const [manualSnapshotTag, setManualSnapshotTag] = useState('');
  const [manualSnapshotNote, setManualSnapshotNote] = useState('');

  const refreshTemplates = () => {
    setTemplates(db.getBATemplates());
  };

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleResetDefaults = () => {
    if (confirm('Kembalikan semua template ke format dinas bawaan standar? Template buatan Anda yang tidak diubah akan tetap ada.')) {
      const defaults = db.getDefaultBATemplates();
      const customOnes = templates.filter((t) => !t.isSystem);
      const merged = [...defaults, ...customOnes];
      localStorage.setItem('SIPERSEDA_BA_TEMPLATES_V1', JSON.stringify(merged));
      refreshTemplates();
      showToast('Template bawaan dinas berhasil direset ke standar!');
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Hapus template "${name}"? Tindakan ini tidak dapat dibatalkan.`)) {
      db.deleteBATemplate(id);
      refreshTemplates();
      showToast(`Template "${name}" berhasil dihapus.`);
    }
  };

  const handleDuplicate = (template: BATemplate) => {
    const duplicated = {
      ...template,
      id: undefined,
      name: `${template.name} (Salinan)`,
      isSystem: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.saveBATemplate(duplicated);
    refreshTemplates();
    showToast(`Template "${template.name}" berhasil diduplikasi!`);
  };

  const handleOpenCreateModal = () => {
    setEditingTemplate({
      name: '',
      category: 'PENGADAAN',
      description: '',
      institutionName: config.SCHOOL_NAME || 'SD NEGERI TANGERANG 6',
      institutionAddress: `NPSN: ${config.SCHOOL_NPSN || '20606498'}  |  ${config.ADDRESS || 'Jl. Perintis Kemerdekaan No. 6'}`,
      institutionCity: config.BA_DEFAULT_CITY || 'Tangerang',
      governingBody: `PEMERINTAH KOTA ${(config.BA_DEFAULT_CITY || 'TANGERANG').toUpperCase()}`,
      institutionAgency: 'DINAS PENDIDIKAN',
      title: 'BERITA ACARA SERAH TERIMA PENGADAAN (BAST)',
      docNumberPattern: '027/BAST-BOS/SDN6/{YEAR}/{NO}',
      openingClause: 'Pada hari ini telah dilakukan serah terima hasil pengadaan barang inventaris sekolah dengan rincian sebagai berikut:',
      closingClause: 'Demikian Berita Acara ini dibuat dalam rangkap 2 (dua) untuk dapat dipergunakan sebagaimana mestinya.',
      defaultHeaders: ['No', 'Kode Barang', 'Nama Barang', 'Volume', 'Satuan', 'Harga Satuan', 'Total Harga', 'Keterangan'],
      defaultSampleRows: [
        ['1', 'BRG-001', 'Kertas HVS A4 75gr Sinar Dunia', '10', 'Rim', 'Rp 55.000', 'Rp 550.000', 'Sesuai Spesifikasi'],
        ['2', 'BRG-002', 'Spidol Whiteboard Snowman Hitam', '2', 'Lusin', 'Rp 95.000', 'Rp 190.000', 'Sesuai Spesifikasi'],
      ],
      leftSignerTitle: 'Pihak Pertama (Pengurus Barang),',
      leftSignerName: config.WAREHOUSE_OFFICER || 'Budi Santoso, A.Md.',
      leftSignerNip: config.WAREHOUSE_OFFICER_NIP || '19920311 201903 1 008',
      rightSignerTitle: 'Pihak Kedua (Penerima/Penyedia),',
      rightSignerName: config.TREASURER || 'Siti Rahmawati, S.Pd.',
      rightSignerNip: config.TREASURER_NIP || '19870921 201001 2 005',
      centerSignerTitle: `Kepala UPT Satuan Pendidikan ${config.SCHOOL_NAME || 'SDN Tangerang 6'}`,
      centerSignerName: config.HEADMASTER || 'Hj. Sumarsih, S.Pd., M.M.',
      centerSignerNip: config.HEADMASTER_NIP || '19680412 199303 2 005',
      includeHeadmaster: true,
      paperSize: 'a4',
      orientation: 'portrait',
      kopAlignment: 'dual_logo',
      kopBorderStyle: 'double',
      themeColor: 'emerald',
      fontFamily: 'helvetica',
      tableDensity: 'normal',
      includeVerificationQR: true,
      autoPageNumbering: true,
      pageNumberPosition: 'bottom_center',
      headerFooterStyle: 'formal_line',
      runningHeaderText: `Dokumen Resmi Inventaris — ${config.SCHOOL_NAME || 'SDN Tangerang 6'}`,
      runningFooterText: `Sistem Informasi Persediaan & Aset Sekolah (SIPERSEDA)`,
      watermark: '',
    });
    setIsEditModalOpen(true);
  };

  const handleOpenEditModal = (template: BATemplate) => {
    setEditingTemplate({ ...template });
    setIsEditModalOpen(true);
  };

  const handleOpenVersionHistory = (template: BATemplate) => {
    setSelectedTemplateForHistory(template);
    const versions = db.getBATemplateVersions(template.id);
    setTemplateVersions(versions);
  };

  const handleRestoreVersion = (version: BATemplateVersion) => {
    if (
      confirm(
        `Pulihkan template "${selectedTemplateForHistory?.name}" ke versi ${
          version.versionTag || 'v' + version.versionNumber
        } (${new Date(version.timestamp).toLocaleString('id-ID')})?`
      )
    ) {
      const restored = db.restoreBATemplateVersion(version.id);
      if (restored) {
        refreshTemplates();
        if (selectedTemplateForHistory) {
          setTemplateVersions(db.getBATemplateVersions(selectedTemplateForHistory.id));
        }
        showToast(
          `Template berhasil dipulihkan ke versi ${
            version.versionTag || 'v' + version.versionNumber
          }!`
        );
      }
    }
  };

  const handleCreateManualSnapshot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplateForHistory) return;

    const newVer = db.saveBATemplateVersion(
      selectedTemplateForHistory.id,
      manualSnapshotNote || 'Snapshot Manual Pengguna',
      db.getActiveUser().NAMA || 'Administrator',
      manualSnapshotTag || undefined
    );

    if (newVer) {
      setTemplateVersions(db.getBATemplateVersions(selectedTemplateForHistory.id));
      setShowManualSnapshotModal(false);
      setManualSnapshotTag('');
      setManualSnapshotNote('');
      showToast(`Snapshot versi baru ${newVer.versionTag || ''} berhasil dibuat!`);
    }
  };

  const handleDeleteVersion = (versionId: string) => {
    if (confirm('Hapus riwayat versi ini?')) {
      db.deleteBATemplateVersion(versionId);
      if (selectedTemplateForHistory) {
        setTemplateVersions(db.getBATemplateVersions(selectedTemplateForHistory.id));
      }
      showToast('Riwayat versi berhasil dihapus.');
    }
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate || !editingTemplate.name?.trim()) {
      alert('Nama Template wajib diisi.');
      return;
    }

    db.saveBATemplate(editingTemplate as any);
    refreshTemplates();
    setIsEditModalOpen(false);
    showToast(`Template "${editingTemplate.name}" berhasil disimpan!`);
  };

  const categories = [
    { id: 'ALL', label: 'Semua Kategori' },
    { id: 'PENGADAAN', label: 'Pengadaan & BAST' },
    { id: 'SERAH_TERIMA', label: 'Serah Terima & Distribusi' },
    { id: 'PEMERIKSAAN', label: 'Pemeriksaan & Uji Fisik' },
    { id: 'STOCK_OPNAME', label: 'Stock Opname' },
    { id: 'PENGHAPUSAN', label: 'Usulan Penghapusan' },
    { id: 'MUTASI', label: 'Mutasi Ruangan' },
  ];

  const filteredTemplates = templates.filter((t) => {
    const matchCat = selectedCategory === 'ALL' || t.category === selectedCategory;
    const matchQuery =
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(search.toLowerCase())) ||
      (t.institutionName && t.institutionName.toLowerCase().includes(search.toLowerCase()));
    return matchCat && matchQuery;
  });

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-700 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-semibold animate-slide-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Top Banner & Action Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Document Template Manager
              </h3>
              <p className="text-xs text-slate-500">
                Kelola, simpan, dan terapkan format Berita Acara kedinasan dengan kop surat & institusi kustom
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            title="Pulihkan Template Bawaan"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Bawaan</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Template Baru</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 text-xs">
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                selectedCategory === c.id
                  ? 'bg-purple-700 text-white shadow-xs font-bold'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama template..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((tpl) => (
          <div
            key={tpl.id}
            className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
          >
            {/* Card Header */}
            <div className="p-4 space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        tpl.category === 'PENGADAAN'
                          ? 'bg-emerald-100 text-emerald-800'
                          : tpl.category === 'SERAH_TERIMA'
                          ? 'bg-blue-100 text-blue-800'
                          : tpl.category === 'STOCK_OPNAME'
                          ? 'bg-amber-100 text-amber-800'
                          : tpl.category === 'PENGHAPUSAN'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {tpl.category}
                    </span>
                    {tpl.isSystem ? (
                      <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        Resmi Sistem
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                        Kustom Sekolah
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 leading-snug group-hover:text-purple-700 transition-colors">
                    {tpl.name}
                  </h4>
                </div>
              </div>

              <p className="text-xs text-slate-500 line-clamp-2">{tpl.description}</p>

              {/* Specs Chips */}
              <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1.5 text-[10px] text-slate-600">
                <span className="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md font-semibold text-slate-700">
                  {tpl.paperSize?.toUpperCase() || 'A4'} {tpl.paperSize === 'f4' ? '(Folio)' : ''}
                </span>
                <span className="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md text-slate-600">
                  Kop: {tpl.kopAlignment === 'dual_logo' ? 'Logo Ganda' : tpl.kopAlignment === 'center' ? 'Tengah' : 'Rata Kiri'}
                </span>
                <span className="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md text-slate-600">
                  Tema: {tpl.themeColor || 'emerald'}
                </span>
                <span className="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md text-slate-600">
                  QR: {tpl.includeVerificationQR !== false ? '✓' : '-'}
                </span>
              </div>

              {/* Institution and Signer Summary */}
              <div className="bg-slate-50/70 p-2 rounded-xl text-[11px] text-slate-600 space-y-1">
                <div className="flex items-center gap-1 font-semibold text-slate-700 truncate">
                  <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">{tpl.institutionName || config.SCHOOL_NAME}</span>
                </div>
                <div className="text-[10px] text-slate-500 truncate">
                  TTD: {tpl.leftSignerName || config.WAREHOUSE_OFFICER} & {tpl.rightSignerName || config.TREASURER}
                </div>
              </div>
            </div>

            {/* Card Footer Actions */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onPreviewTemplate(tpl)}
                  className="p-1.5 text-slate-600 hover:text-purple-700 hover:bg-white rounded-lg transition-colors"
                  title="Pratinjau Dokumen"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenVersionHistory(tpl)}
                  className="p-1.5 text-slate-600 hover:text-purple-700 hover:bg-white rounded-lg transition-colors relative"
                  title="Riwayat Versi & Snapshot"
                >
                  <History className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDuplicate(tpl)}
                  className="p-1.5 text-slate-600 hover:text-purple-700 hover:bg-white rounded-lg transition-colors"
                  title="Duplikasi Template"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenEditModal(tpl)}
                  className="p-1.5 text-slate-600 hover:text-purple-700 hover:bg-white rounded-lg transition-colors"
                  title="Edit Template & Institusi"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                {!tpl.isSystem && (
                  <button
                    type="button"
                    onClick={() => handleDelete(tpl.id, tpl.name)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-colors"
                    title="Hapus Template"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => onApplyTemplate(tpl)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-lg shadow-xs transition-all active:scale-98"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Terapkan</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 space-y-3">
          <Bookmark className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="text-sm font-bold text-slate-700">Tidak ada template yang cocok</h4>
          <p className="text-xs text-slate-500">Coba ganti filter kategori atau kata kunci pencarian Anda.</p>
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setSelectedCategory('ALL');
            }}
            className="px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 rounded-lg"
          >
            Reset Filter
          </button>
        </div>
      )}

      {/* MODAL EDIT / CREATE TEMPLATE */}
      {isEditModalOpen && editingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-up">
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-purple-100 text-purple-700 rounded-lg">
                  <Bookmark className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">
                  {editingTemplate.id ? 'Edit Template Berita Acara' : 'Buat Template Berita Acara Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveModal} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              {/* Section 1: Template Info */}
              <div className="bg-purple-50/50 p-3.5 rounded-xl border border-purple-100 space-y-3">
                <h4 className="font-bold text-purple-900 flex items-center gap-1.5">
                  <Bookmark className="w-3.5 h-3.5 text-purple-700" />
                  Informasi Dasar Template
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700">Nama Template *</label>
                    <input
                      type="text"
                      required
                      value={editingTemplate.name || ''}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                      placeholder="Contoh: BAST Pengadaan BOS Reguler..."
                      className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-purple-500 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700">Kategori Dokumen</label>
                    <select
                      value={editingTemplate.category || 'PENGADAAN'}
                      onChange={(e) =>
                        setEditingTemplate({
                          ...editingTemplate,
                          category: e.target.value as any,
                        })
                      }
                      className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-purple-500"
                    >
                      <option value="PENGADAAN">Pengadaan & BAST</option>
                      <option value="SERAH_TERIMA">Serah Terima & Distribusi</option>
                      <option value="PEMERIKSAAN">Pemeriksaan & Uji Fisik</option>
                      <option value="STOCK_OPNAME">Stock Opname Fisik</option>
                      <option value="PENGHAPUSAN">Usulan Penghapusan BMD</option>
                      <option value="MUTASI">Mutasi Ruangan</option>
                      <option value="LAINNYA">Lainnya / Khusus</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Keterangan / Tujuan Penggunaan</label>
                  <input
                    type="text"
                    value={editingTemplate.description || ''}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                    placeholder="Contoh: Digunakan untuk berita acara belanja barang modal dan operasional sekolah..."
                    className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Section 2: Custom Institution & Kop Surat */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-600" />
                  Kop Surat & Data Lembaga / Satuan Pendidikan
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700">Pemerintah Daerah / Penyelenggara (Baris 1)</label>
                    <input
                      type="text"
                      value={editingTemplate.governingBody || ''}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, governingBody: e.target.value })}
                      className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700">Dinas / Instansi Terkait (Baris 2)</label>
                    <input
                      type="text"
                      value={editingTemplate.institutionAgency || ''}
                      onChange={(e) =>
                        setEditingTemplate({ ...editingTemplate, institutionAgency: e.target.value })
                      }
                      className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700">Nama Satuan Pendidikan (Baris 3)</label>
                    <input
                      type="text"
                      value={editingTemplate.institutionName || ''}
                      onChange={(e) =>
                        setEditingTemplate({ ...editingTemplate, institutionName: e.target.value })
                      }
                      className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-lg font-semibold"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700">Kota Domisili Surat</label>
                    <input
                      type="text"
                      value={editingTemplate.institutionCity || ''}
                      onChange={(e) =>
                        setEditingTemplate({ ...editingTemplate, institutionCity: e.target.value })
                      }
                      className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Alamat, NPSN & Kontak (Baris 4)</label>
                  <input
                    type="text"
                    value={editingTemplate.institutionAddress || ''}
                    onChange={(e) =>
                      setEditingTemplate({ ...editingTemplate, institutionAddress: e.target.value })
                    }
                    className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              {/* Section 3: Paper Size, Kop Style & Formatting */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-slate-600" />
                  Format Kertas & Gaya Cetak
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Ukuran Kertas</label>
                    <select
                      value={editingTemplate.paperSize || 'a4'}
                      onChange={(e) =>
                        setEditingTemplate({ ...editingTemplate, paperSize: e.target.value as any })
                      }
                      className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-lg"
                    >
                      <option value="a4">A4 Standar (210×297 mm)</option>
                      <option value="f4">F4 / Folio Dinas (215×330 mm)</option>
                      <option value="letter">Letter (216×279 mm)</option>
                      <option value="legal">Legal (216×356 mm)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Orientasi</label>
                    <select
                      value={editingTemplate.orientation || 'portrait'}
                      onChange={(e) =>
                        setEditingTemplate({ ...editingTemplate, orientation: e.target.value as any })
                      }
                      className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-lg"
                    >
                      <option value="portrait">Portrait (Tegak)</option>
                      <option value="landscape">Landscape (Mendatar)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Logo Kop</label>
                    <select
                      value={editingTemplate.kopAlignment || 'dual_logo'}
                      onChange={(e) =>
                        setEditingTemplate({ ...editingTemplate, kopAlignment: e.target.value as any })
                      }
                      className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-lg"
                    >
                      <option value="dual_logo">Logo Ganda (Pemda + Sekolah)</option>
                      <option value="center">Tengah (1 Logo Kiri)</option>
                      <option value="left">Rata Kiri</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Tema Warna</label>
                    <select
                      value={editingTemplate.themeColor || 'emerald'}
                      onChange={(e) =>
                        setEditingTemplate({ ...editingTemplate, themeColor: e.target.value as any })
                      }
                      className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-lg"
                    >
                      <option value="emerald">Emerald Dinas</option>
                      <option value="navy">Navy Formal</option>
                      <option value="monochrome">Monokrom Hitam</option>
                      <option value="slate">Slate Gray</option>
                      <option value="amber">Amber / Emas</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 4: Clauses & Content */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-600" />
                  Judul & Klausul Dokumen
                </h4>
                <div>
                  <label className="font-semibold text-slate-700">Judul Berita Acara</label>
                  <input
                    type="text"
                    value={editingTemplate.title || ''}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, title: e.target.value })}
                    className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-lg font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Paragraf Konsiderans / Pembuka</label>
                  <textarea
                    rows={2}
                    value={editingTemplate.openingClause || ''}
                    onChange={(e) =>
                      setEditingTemplate({ ...editingTemplate, openingClause: e.target.value })
                    }
                    className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Paragraf Penutup Dokumen</label>
                  <textarea
                    rows={2}
                    value={editingTemplate.closingClause || ''}
                    onChange={(e) =>
                      setEditingTemplate({ ...editingTemplate, closingClause: e.target.value })
                    }
                    className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-xs"
                >
                  Simpan Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL RIWAYAT VERSI TEMPLATE */}
      {selectedTemplateForHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200 animate-scale-up space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Riwayat Versi Template: {selectedTemplateForHistory.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Lacak perubahan tata letak dan pulihkan konfigurasi template sebelumnya
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowManualSnapshotModal(true)}
                  className="px-3 py-1.5 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>Snapshot Manual</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTemplateForHistory(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Version List Body */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
              {templateVersions.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <Clock className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-semibold text-slate-600">Belum ada riwayat snapshot versi</p>
                  <p className="text-[11px] text-slate-400">
                    Sistem akan secara otomatis merekam versi setiap kali template ini diperbarui atau disimpan.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowManualSnapshotModal(true)}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-lg shadow-xs mt-2"
                  >
                    Buat Snapshot Versi Pertama Sekarang
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {templateVersions.map((ver, idx) => {
                    const snap = ver.snapshot;
                    return (
                      <div
                        key={ver.id}
                        className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 hover:border-purple-300 transition-all space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="bg-purple-700 text-white font-mono font-bold text-xs px-2 py-0.5 rounded-md">
                              {ver.versionTag || `v1.${ver.versionNumber}`}
                            </span>
                            {idx === 0 && (
                              <span className="bg-emerald-100 text-emerald-800 font-semibold text-[10px] px-2 py-0.5 rounded">
                                Versi Terbaru
                              </span>
                            )}
                            <span className="text-xs font-semibold text-slate-700">{ver.summary}</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleRestoreVersion(ver)}
                              className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-all active:scale-95"
                              title="Pulihkan konfigurasi ini"
                            >
                              <Undo2 className="w-3.5 h-3.5" />
                              <span>Pulihkan Versi</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteVersion(ver.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded"
                              title="Hapus riwayat versi ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Snapshot specs badge */}
                        <div className="flex flex-wrap gap-1.5 text-[11px] text-slate-600">
                          <span className="bg-white px-2 py-0.5 rounded border border-slate-200 font-medium">
                            Kertas: <strong className="text-slate-800">{snap.paperSize?.toUpperCase()}</strong>
                          </span>
                          <span className="bg-white px-2 py-0.5 rounded border border-slate-200 font-medium">
                            Kop: <strong className="text-slate-800">{snap.kopAlignment}</strong>
                          </span>
                          <span className="bg-white px-2 py-0.5 rounded border border-slate-200 font-medium">
                            Warna: <strong className="text-slate-800">{snap.themeColor}</strong>
                          </span>
                          <span className="bg-white px-2 py-0.5 rounded border border-slate-200 font-medium">
                            QR Validasi: <strong className="text-slate-800">{snap.includeVerificationQR ? 'Ya' : 'Tidak'}</strong>
                          </span>
                        </div>

                        {/* Author & Timestamp */}
                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200">
                          <span>Dibuat oleh: <strong className="text-slate-600">{ver.author}</strong></span>
                          <span>{new Date(ver.timestamp).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedTemplateForHistory(null)}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL BUAT SNAPSHOT MANUAL */}
      {showManualSnapshotModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-md shadow-2xl border border-slate-200 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                <Tag className="w-4 h-4 text-purple-700" />
                <span>Simpan Snapshot Versi Manual</span>
              </div>
              <button
                type="button"
                onClick={() => setShowManualSnapshotModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateManualSnapshot} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Label / Tag Versi</label>
                <input
                  type="text"
                  value={manualSnapshotTag}
                  onChange={(e) => setManualSnapshotTag(e.target.value)}
                  placeholder="Contoh: v1.5-Final-Dinas atau Revisi-Kop-2026"
                  className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Catatan Perubahan / Keterangan</label>
                <textarea
                  rows={3}
                  required
                  value={manualSnapshotNote}
                  onChange={(e) => setManualSnapshotNote(e.target.value)}
                  placeholder="Jelaskan ringkasan penyesuaian tata letak dokumen ini..."
                  className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowManualSnapshotModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-xs"
                >
                  Simpan Snapshot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
