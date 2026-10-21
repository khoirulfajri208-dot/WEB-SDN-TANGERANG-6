import React, { useState } from 'react';
import { Eye, EyeOff, ShieldCheck, Lock } from 'lucide-react';
import { maskingService, SensitiveDataType } from '../../services/maskingService';
import { useDataMasking } from '../../hooks/useDataMasking';

export interface SecureMaskedFieldProps {
  value: string | number | undefined | null;
  type: SensitiveDataType;
  fieldId?: string;
  label?: string;
  className?: string;
  inline?: boolean;
  allowReveal?: boolean;
  showDlpBadge?: boolean;
  monospace?: boolean;
  autoMaskDurationMs?: number;
}

export const SecureMaskedField: React.FC<SecureMaskedFieldProps> = ({
  value,
  type,
  fieldId,
  label = 'Data Sensitif',
  className = '',
  inline = true,
  allowReveal = true,
  showDlpBadge = false,
  monospace = false,
  autoMaskDurationMs = 30000,
}) => {
  const { isGlobalMasking, isFieldRevealed, toggleField } = useDataMasking();
  const [localShowNotice, setLocalShowNotice] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState('');

  // Generate fallback field ID if not provided
  const resolvedFieldId = fieldId || `${type}-${String(value || '')}`;
  const isRevealed = !isGlobalMasking || isFieldRevealed(resolvedFieldId);

  const displayValue = maskingService.maskValue(value, type, isRevealed);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!allowReveal) return;
    toggleField(resolvedFieldId, autoMaskDurationMs);
  };

  const showSecurityNotice = (msg: string) => {
    setNoticeMessage(msg);
    setLocalShowNotice(true);
    setTimeout(() => {
      setLocalShowNotice(false);
    }, 2800);
  };

  const handleCopy = (e: React.ClipboardEvent) => {
    maskingService.preventClipboardCopy(e, label);
    showSecurityNotice('🔒 Penyalinan diblokir (Anti-Exfiltration DLP)');
  };

  const handleCut = (e: React.ClipboardEvent) => {
    maskingService.preventClipboardCut(e, label);
    showSecurityNotice('🔒 Pemotongan diblokir (Anti-Exfiltration DLP)');
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    maskingService.preventContextMenu(e, label);
    showSecurityNotice('🛡️ Klik kanan dinonaktifkan pada data sensitif');
  };

  const WrapperTag = inline ? 'span' : 'div';

  return (
    <WrapperTag
      className={`relative inline-flex items-center gap-1.5 align-middle group/masked ${className}`}
    >
      {/* DLP Security Notice Tooltip */}
      {localShowNotice && (
        <span className="absolute -top-8 left-1/2 -translate-x-1/2 z-50 bg-rose-900 text-rose-100 text-[10px] font-bold px-2 py-0.8 rounded-lg shadow-lg whitespace-nowrap animate-bounce flex items-center gap-1 border border-rose-700 pointer-events-none">
          {noticeMessage}
        </span>
      )}

      {/* Sensitive Data Content: Strictly Protected */}
      <span
        onCopy={handleCopy}
        onCut={handleCut}
        onContextMenu={handleContextMenu}
        onDragStart={(e) => e.preventDefault()}
        style={{
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
        }}
        title={
          isRevealed
            ? `${label} (Akses DLP Terbuka Sementara - Klik Ikon Mata untuk Menyembunyikan)`
            : `${label} (Dilindungi Data Masking - Klik Ikon Mata untuk Menampilkan)`
        }
        className={`select-none cursor-default transition-all duration-150 ${
          monospace ? 'font-mono' : ''
        } ${
          !isRevealed
            ? 'tracking-wider text-slate-600 bg-slate-100/80 px-1.5 py-0.5 rounded border border-slate-200/60 font-semibold'
            : 'text-slate-900 font-bold bg-amber-50/70 px-1.5 py-0.5 rounded border border-amber-200'
        }`}
      >
        {displayValue}
      </span>

      {/* DLP Badge */}
      {showDlpBadge && !isRevealed && (
        <span
          className="text-[9px] text-slate-400 bg-slate-100 px-1 rounded flex items-center gap-0.5 border border-slate-200/50"
          title="Data Sensitif Siswa Dilindungi DLP"
        >
          <Lock size={9} />
          <span>DLP</span>
        </span>
      )}

      {/* Eye-Icon Toggle */}
      {allowReveal && (
        <button
          type="button"
          onClick={handleToggle}
          aria-label={isRevealed ? `Sembunyikan ${label}` : `Buka samaran ${label}`}
          title={
            isRevealed
              ? `Klik untuk menyamarkan kembali ${label}`
              : `Klik untuk melihat data asli ${label}`
          }
          className={`p-1 rounded-md transition-colors cursor-pointer shrink-0 ${
            isRevealed
              ? 'text-amber-600 hover:text-amber-700 bg-amber-100/70 hover:bg-amber-100'
              : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
          }`}
        >
          {isRevealed ? (
            <EyeOff size={13} className="shrink-0" />
          ) : (
            <Eye size={13} className="shrink-0" />
          )}
        </button>
      )}
    </WrapperTag>
  );
};
