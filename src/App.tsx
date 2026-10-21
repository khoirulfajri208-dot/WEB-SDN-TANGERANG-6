import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DlpGlobalNotice } from './components/common/DlpGlobalNotice';
import { accountService } from './services/accountService';
import { classroomService } from './services/classroomService';
import { db } from './services/localStorageService';
import { Asset, ActivePage, User } from './types';
import { useTheme } from './utils/theme';

// Lazy loaded modals to optimize bundle size and TTI
const UniversalSearchModal = lazy(() => import('./components/UniversalSearchModal').then(module => ({ default: module.UniversalSearchModal })));
const GoogleSheetsIntegrationModal = lazy(() => import('./components/GoogleSheetsIntegrationModal').then(module => ({ default: module.GoogleSheetsIntegrationModal })));
const FirebaseCloudSyncModal = lazy(() => import('./components/FirebaseCloudSyncModal').then(module => ({ default: module.FirebaseCloudSyncModal })));
const AIAssistantModal = lazy(() => import('./components/AIAssistantModal').then(module => ({ default: module.AIAssistantModal })));
const QRScannerModal = lazy(() => import('./components/QRScannerModal').then(module => ({ default: module.QRScannerModal })));
const PublicAssetVerificationModal = lazy(() => import('./components/PublicAssetVerificationModal').then(module => ({ default: module.PublicAssetVerificationModal })));
const QRStickerModal = lazy(() => import('./components/QRStickerModal').then(module => ({ default: module.QRStickerModal })));
const KeyboardShortcutsModal = lazy(() => import('./components/KeyboardShortcutsModal').then(module => ({ default: module.KeyboardShortcutsModal })));
const DataReconciliationDialog = lazy(() => import('./components/DataReconciliationDialog').then(module => ({ default: module.DataReconciliationDialog })));
const InactivityLockModal = lazy(() => import('./components/common/InactivityLockModal').then(module => ({ default: module.InactivityLockModal })));

// Lazy loaded views to optimize bundle size
const SchoolPublicWebsite = lazy(() => import('./components/SchoolPublicWebsite').then(module => ({ default: module.SchoolPublicWebsite })));
const DashboardView = lazy(() => import('./components/DashboardView').then(module => ({ default: module.DashboardView })));
const MasterBarangView = lazy(() => import('./components/MasterBarangView').then(module => ({ default: module.MasterBarangView })));
const PenyediaView = lazy(() => import('./components/PenyediaView').then(module => ({ default: module.PenyediaView })));
const BarangMasukView = lazy(() => import('./components/BarangMasukView').then(module => ({ default: module.BarangMasukView })));
const BarangKeluarView = lazy(() => import('./components/BarangKeluarView').then(module => ({ default: module.BarangKeluarView })));
const PersediaanView = lazy(() => import('./components/PersediaanView').then(module => ({ default: module.PersediaanView })));
const StockLedgerView = lazy(() => import('./components/StockLedgerView').then(module => ({ default: module.StockLedgerView })));
const PengambilanATKView = lazy(() => import('./components/PengambilanATKView').then(module => ({ default: module.PengambilanATKView })));
const AsetView = lazy(() => import('./components/AsetView').then(module => ({ default: module.AsetView })));
const AssetLifecycleView = lazy(() => import('./components/AssetLifecycleView').then(module => ({ default: module.AssetLifecycleView })));
const MutasiView = lazy(() => import('./components/MutasiView').then(module => ({ default: module.MutasiView })));
const StockOpnameView = lazy(() => import('./components/StockOpnameView').then(module => ({ default: module.StockOpnameView })));
const PemeliharaanPenghapusanView = lazy(() => import('./components/PemeliharaanPenghapusanView').then(module => ({ default: module.PemeliharaanPenghapusanView })));
const ProcurementPlannerView = lazy(() => import('./components/ProcurementPlannerView').then(module => ({ default: module.ProcurementPlannerView })));
const DocumentCenterView = lazy(() => import('./components/DocumentCenterView').then(module => ({ default: module.DocumentCenterView })));
const LaporanView = lazy(() => import('./components/LaporanView').then(module => ({ default: module.LaporanView })));
const GoogleSheetsSyncView = lazy(() => import('./components/GoogleSheetsSyncView').then(module => ({ default: module.GoogleSheetsSyncView })));
const AuditControlView = lazy(() => import('./components/AuditControlView').then(module => ({ default: module.AuditControlView })));
const ConfigView = lazy(() => import('./components/ConfigView').then(module => ({ default: module.ConfigView })));
const PegawaiView = lazy(() => import('./components/PegawaiView').then(module => ({ default: module.PegawaiView })));
const ARKASSiPlahView = lazy(() => import('./components/ARKASSiPlahView').then(module => ({ default: module.ARKASSiPlahView })));
const DepresiasiAsetView = lazy(() => import('./components/DepresiasiAsetView').then(module => ({ default: module.DepresiasiAsetView })));
const MultiSchoolConsolidationView = lazy(() => import('./components/MultiSchoolConsolidationView').then(module => ({ default: module.MultiSchoolConsolidationView })));
const ClassroomApp = lazy(() => import('./components/ClassroomApp').then(module => ({ default: module.ClassroomApp })));
const AdminPanel = lazy(() => import('./components/AdminPanel').then(module => ({ default: module.AdminPanel })));

export default function App() {
  const { styles } = useTheme();
  const [viewMode, setViewMode] = useState<'app' | 'website' | 'classroom' | 'admin'>('website');
  const [activePage, setActivePage] = useState<ActivePage>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [isFirebaseModalOpen, setIsFirebaseModalOpen] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  // Scanned / Public Verification State
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [scannedDriveUrl, setScannedDriveUrl] = useState<string | undefined>(undefined);
  const [selectedAssetDetail, setSelectedAssetDetail] = useState<Asset | null>(null);

  // Handle URL parameters for Dual-Mode QR Scanning & View Mode
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const scanParam = params.get('scan') || params.get('code');
      const driveParam = params.get('drive');
      const pageParam = params.get('page');
      const viewParam = params.get('view');

      if (viewParam === 'website' || viewParam === 'portal') {
        setViewMode('website');
      } else if (viewParam === 'app' || viewParam === 'dashboard') {
        setViewMode('app');
      } else if (viewParam === 'admin') {
        setViewMode('admin');
      } else if (viewParam === 'classroom') {
        setViewMode('classroom');
      }

      if (pageParam) {
        setActivePage(pageParam as ActivePage);
      }

      if (scanParam) {
        setScannedCode(scanParam);
        if (driveParam) {
          setScannedDriveUrl(decodeURIComponent(driveParam));
        }
      }
    } catch (e) {
      console.error('Error parsing scan URL parameters:', e);
    }
  }, []);

  useEffect(() => {
    // Check low stock count for notifications
    const lowStock = db.getStockSummary().filter((s) => s.STATUS === 'MINIMUM').length;
    const pendingApprovals = db
      .getBarangKeluar()
      .filter((k) => k.STATUS_TRANSAKSI === 'MENUNGGU_PERSETUJUAN').length;
    setNotificationCount(lowStock + pendingApprovals);
  }, [activePage, viewMode]);

  // Global keyboard shortcut for search (Ctrl+K), QR Scanner (Ctrl+Shift+S), and Shortcuts (Ctrl+/)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K -> Universal Search
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      // Ctrl+Shift+S or Cmd+Shift+S -> QR Scanner
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        setIsQRScannerOpen((prev) => !prev);
      }
      // Ctrl+/ or Cmd+/ -> Keyboard Shortcuts Overlay
      if ((e.metaKey || e.ctrlKey) && (e.key === '/' || e.key === '?')) {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Initialize Classroom & Admin account stores on first load
  useEffect(() => {
    accountService.initAccounts();
    classroomService.initClassroom();
  }, []);

  const handleOpenAssetInApp = (assetCode: string) => {
    const assets = db.getAssets();
    const found = assets.find((a) => a.KODE_ASET.toUpperCase() === assetCode.toUpperCase());
    if (found) {
      setSelectedAssetDetail(found);
      setActivePage('aset');
      setViewMode('app');
    }
  };

  const handleNavigate = (page: ActivePage | string) => {
    if (page === 'website_sekolah') {
      setViewMode('website');
      return;
    }
    setActivePage(page as ActivePage);
    setViewMode('app');
  };

  const renderActiveView = () => {
    switch (activePage as any) {
      case 'dashboard':
        return (
          <DashboardView
            onNavigate={(page) => handleNavigate(page)}
            onOpenSheetsModal={() => setIsGoogleModalOpen(true)}
          />
        );
      case 'barang_masuk':
        return <BarangMasukView />;
      case 'barang_keluar':
        return <BarangKeluarView />;
      case 'pengambilan_atk':
        return <PengambilanATKView />;
      case 'persediaan':
        return <PersediaanView />;
      case 'stock_ledger':
        return <StockLedgerView />;
      case 'stock_opname':
        return <StockOpnameView />;
      case 'master':
      case 'master_barang':
        return <MasterBarangView />;
      case 'supplier':
      case 'penyedia':
        return <PenyediaView />;
      case 'aset':
        return <AsetView />;
      case 'depresiasi':
      case 'depresiasi_aset':
        return <DepresiasiAsetView />;
      case 'asset_lifecycle':
        return <AssetLifecycleView />;
      case 'mutasi':
        return <MutasiView />;
      case 'pemeliharaan':
      case 'penghapusan':
        return <PemeliharaanPenghapusanView />;
      case 'procurement_plan':
      case 'procurement_planner':
        return <ProcurementPlannerView />;
      case 'arkas':
      case 'arkas_siplah':
      case 'siplah':
        return <ARKASSiPlahView />;
      case 'multi_school':
      case 'consolidation':
        return <MultiSchoolConsolidationView />;
      case 'document_center':
        return <DocumentCenterView />;
      case 'laporan':
        return <LaporanView />;
      case 'google_sheets':
      case 'google_sheets_sync':
        return <GoogleSheetsSyncView onOpenModal={() => setIsGoogleModalOpen(true)} />;
      case 'audit':
      case 'control_center':
        return <AuditControlView />;
      case 'pegawai':
      case 'guru':
      case 'users':
        return <PegawaiView />;
      case 'config':
        return <ConfigView />;
      default:
        return (
          <DashboardView
            onNavigate={(page) => handleNavigate(page)}
            onOpenSheetsModal={() => setIsGoogleModalOpen(true)}
          />
        );
    }
  };

  // Classroom module — separate from SIPERSEDA
  if (viewMode === 'classroom') {
    return (
      <Suspense fallback={<div className="flex items-center justify-center h-screen bg-slate-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
        <ClassroomApp onLogout={() => setViewMode('website')} />
      </Suspense>
    );
  }

  // Admin management panel
  if (viewMode === 'admin') {
    return (
      <Suspense fallback={<div className="flex items-center justify-center h-screen bg-slate-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div></div>}>
        <AdminPanel onLogout={() => setViewMode('website')} />
      </Suspense>
    );
  }

  // If currently in Public Website mode, display the official school portal
  if (viewMode === 'website') {
    return (
      <>
        <Suspense fallback={<div className="flex items-center justify-center h-screen bg-white"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div></div>}>
          <SchoolPublicWebsite
            onEnterApp={(user?: User) => {
              if (user) db.setActiveUser(user);
              setViewMode('app');
            }}
            onEnterClassroom={() => setViewMode('classroom')}
            onEnterAdmin={() => setViewMode('admin')}
          />
        </Suspense>

        {/* Global Modals accessible if opened from website actions */}
        {scannedCode && (
          <PublicAssetVerificationModal
            isOpen={Boolean(scannedCode)}
            assetCode={scannedCode}
            driveUrl={scannedDriveUrl}
            onClose={() => {
              setScannedCode(null);
              setScannedDriveUrl(undefined);
            }}
            onOpenInApp={handleOpenAssetInApp}
          />
        )}
      </>
    );
  }

  return (
    <div className={`min-h-screen ${styles.bgApp} flex flex-col font-sans antialiased selection:bg-blue-900 selection:text-white`}>
      {/* Top Navigation */}
      <Navbar
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onToggleSidebarMobile={() => setIsSidebarOpen(!isSidebarOpen)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenGoogleSync={() => setIsGoogleModalOpen(true)}
        onOpenSheetsModal={() => setIsGoogleModalOpen(true)}
        onOpenFirebaseSync={() => setIsFirebaseModalOpen(true)}
        onOpenAIAssistant={() => setIsAIAssistantOpen(true)}
        onOpenQRScanner={() => setIsQRScannerOpen(true)}
        onOpenSchoolWebsite={() => setViewMode('website')}
        onLogout={() => setViewMode('website')}
        onNavigate={(page) => handleNavigate(page)}
        notificationCount={notificationCount}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <Sidebar
          activePage={activePage}
          onNavigate={(page) => {
            handleNavigate(page);
            setIsSidebarOpen(false);
          }}
          onOpenSchoolWebsite={() => setViewMode('website')}
          isOpen={isSidebarOpen}
          isMobileOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onCloseMobile={() => setIsSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 pb-24 sm:p-6 sm:pb-28 lg:p-8 lg:pb-32 max-w-7xl mx-auto w-full">
          <Suspense
            fallback={
              <div className="w-full space-y-5 animate-pulse p-2">
                <div className="h-28 bg-slate-200/70 rounded-3xl w-full"></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="h-24 bg-slate-200/60 rounded-2xl"></div>
                  <div className="h-24 bg-slate-200/60 rounded-2xl"></div>
                  <div className="h-24 bg-slate-200/60 rounded-2xl"></div>
                  <div className="h-24 bg-slate-200/60 rounded-2xl"></div>
                </div>
                <div className="h-72 bg-slate-200/50 rounded-3xl w-full"></div>
              </div>
            }
          >
            {renderActiveView()}
          </Suspense>
        </main>
      </div>

      {/* Global Universal Search & Omnibar Command Palette Modal */}
      {isSearchOpen && (
        <Suspense fallback={null}>
          <UniversalSearchModal
            isOpen={isSearchOpen}
            onClose={() => setIsSearchOpen(false)}
            onNavigate={(page) => {
              handleNavigate(page);
              setIsSearchOpen(false);
            }}
            onOpenQRScanner={() => setIsQRScannerOpen(true)}
            onOpenAIAssistant={() => setIsAIAssistantOpen(true)}
            onOpenGoogleSync={() => setIsGoogleModalOpen(true)}
            onSwitchViewMode={(mode) => setViewMode(mode)}
          />
        </Suspense>
      )}

      {/* Global Google Sheets Sync & Apps Script Modal */}
      {isGoogleModalOpen && (
        <Suspense fallback={null}>
          <GoogleSheetsIntegrationModal
            isOpen={isGoogleModalOpen}
            onClose={() => setIsGoogleModalOpen(false)}
          />
        </Suspense>
      )}

      {/* Global Firebase Firestore Cloud Sync Modal */}
      {isFirebaseModalOpen && (
        <Suspense fallback={null}>
          <FirebaseCloudSyncModal
            isOpen={isFirebaseModalOpen}
            onClose={() => setIsFirebaseModalOpen(false)}
          />
        </Suspense>
      )}

      {/* Global Gemini AI Assistant Modal */}
      {isAIAssistantOpen && (
        <Suspense fallback={null}>
          <AIAssistantModal
            isOpen={isAIAssistantOpen}
            onClose={() => setIsAIAssistantOpen(false)}
            onNavigate={(page) => {
              handleNavigate(page);
              setIsAIAssistantOpen(false);
            }}
          />
        </Suspense>
      )}

      {/* Global In-App QR Scanner Modal */}
      {isQRScannerOpen && (
        <Suspense fallback={null}>
          <QRScannerModal
            isOpen={isQRScannerOpen}
            onClose={() => setIsQRScannerOpen(false)}
            onSelectAsset={(asset) => {
              setSelectedAssetDetail(asset);
              setActivePage('aset');
            }}
          />
        </Suspense>
      )}

      {/* Public Asset Verification & Dual-Mode Google Drive Modal */}
      {scannedCode && (
        <Suspense fallback={null}>
          <PublicAssetVerificationModal
            isOpen={Boolean(scannedCode)}
            assetCode={scannedCode}
            driveUrl={scannedDriveUrl}
            onClose={() => {
              setScannedCode(null);
              setScannedDriveUrl(undefined);
            }}
            onOpenInApp={handleOpenAssetInApp}
          />
        </Suspense>
      )}

      {/* Scanned Asset QR Details Modal */}
      {selectedAssetDetail && (
        <Suspense fallback={null}>
          <QRStickerModal
            isOpen={Boolean(selectedAssetDetail)}
            asset={selectedAssetDetail}
            onClose={() => setSelectedAssetDetail(null)}
          />
        </Suspense>
      )}

      {/* Connection & Offline Conflict Reconciliation Dialog */}
      <Suspense fallback={null}>
        <DataReconciliationDialog />
      </Suspense>

      {/* Global Keyboard Shortcuts Overlay */}
      {isShortcutsOpen && (
        <Suspense fallback={null}>
          <KeyboardShortcutsModal
            isOpen={isShortcutsOpen}
            onClose={() => setIsShortcutsOpen(false)}
          />
        </Suspense>
      )}

      {/* Global DLP Anti-Exfiltration Alert Notice */}
      <DlpGlobalNotice />

      {/* Inactivity Security Auto-Lock Modal */}
      <Suspense fallback={null}>
        <InactivityLockModal />
      </Suspense>
    </div>
  );
}
