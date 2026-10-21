import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Package, Check, X, Layers, AlertTriangle, ArrowUpDown, ChevronDown } from 'lucide-react';
import { db } from '../services/localStorageService';
import { Item } from '../types';

interface SearchableItemPickerProps {
  selectedItemCode?: string;
  onSelectItem: (item: Item) => void;
  filterType?: 'Habis Pakai' | 'Aset / Inventaris';
  requireStock?: boolean;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  showStockInfo?: boolean;
  id?: string;
}

export const SearchableItemPicker: React.FC<SearchableItemPickerProps> = ({
  selectedItemCode,
  onSelectItem,
  filterType,
  requireStock = false,
  label = 'Pilih Barang / Persediaan',
  placeholder = 'Cari nama barang, kode barang, kategori, lokasi...',
  disabled = false,
  showStockInfo = true,
  id = 'item-search-picker',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('SEMUA');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const items = db.getItems();
  const stockMap = db.getStockMap();

  // Selected item object
  const selectedItem = useMemo(() => {
    return items.find((i) => i.KODE_BARANG === selectedItemCode);
  }, [items, selectedItemCode]);

  // Categories for filter chips
  const categories = useMemo(() => {
    const cats = new Set<string>();
    items.forEach((itm) => {
      if (itm.KATEGORI) cats.add(itm.KATEGORI);
    });
    return ['SEMUA', ...Array.from(cats)];
  }, [items]);

  // Filtered items list
  const filteredItems = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return items.filter((itm) => {
      // Type filter
      if (filterType && itm.TIPE !== filterType) return false;

      // Category filter
      if (selectedCategory !== 'SEMUA' && itm.KATEGORI !== selectedCategory) return false;

      // Search match
      if (!query) return true;
      const matchName = itm.NAMA_BARANG.toLowerCase().includes(query);
      const matchCode = itm.KODE_BARANG.toLowerCase().includes(query);
      const matchCat = (itm.KATEGORI || '').toLowerCase().includes(query);
      const matchLoc = (itm.LOKASI_DEFAULT || '').toLowerCase().includes(query);
      const matchRek = (itm.KODE_REKENING_RKAS || '').toLowerCase().includes(query);
      return matchName || matchCode || matchCat || matchLoc || matchRek;
    });
  }, [items, searchQuery, selectedCategory, filterType]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpen = () => {
    if (disabled) return;
    setIsOpen(true);
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);
  };

  const handlePick = (item: Item) => {
    const stock = stockMap[item.KODE_BARANG] || 0;
    if (requireStock && stock <= 0) {
      alert(`Barang ${item.NAMA_BARANG} stok habis (0 ${item.JENIS_SATUAN})!`);
      return;
    }
    onSelectItem(item);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="relative w-full" ref={dropdownRef} id={id}>
      {label && (
        <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Package size={14} className="text-emerald-800" />
            {label}
          </span>
          {selectedItem && showStockInfo && (
            <span className="text-[11px] font-semibold text-slate-500">
              Stok Saat Ini:{' '}
              <strong className="text-emerald-800 font-bold">
                {stockMap[selectedItem.KODE_BARANG] || 0} {selectedItem.JENIS_SATUAN}
              </strong>
            </span>
          )}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={handleOpen}
        className={`w-full text-left px-3.5 py-2.5 rounded-xl border text-xs flex items-center justify-between transition-all shadow-2xs ${
          isOpen
            ? 'border-emerald-700 ring-2 ring-emerald-600/20 bg-white'
            : selectedItem
            ? 'border-slate-300 bg-white hover:border-emerald-600'
            : 'border-slate-300 bg-slate-50 hover:bg-white text-slate-400'
        } ${disabled ? 'opacity-60 cursor-not-allowed bg-slate-100' : 'cursor-pointer'}`}
      >
        {selectedItem ? (
          <div className="flex items-center gap-2.5 truncate">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold shrink-0 text-xs">
              <Package size={14} />
            </div>
            <div className="truncate">
              <div className="font-bold text-slate-900 leading-snug truncate">
                {selectedItem.NAMA_BARANG}
              </div>
              <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2">
                <span>{selectedItem.KODE_BARANG}</span>
                <span>•</span>
                <span className="text-slate-600 font-sans">{selectedItem.KATEGORI || selectedItem.TIPE}</span>
                {showStockInfo && (
                  <>
                    <span>•</span>
                    <span className="font-sans font-bold text-emerald-800">
                      Tersedia: {stockMap[selectedItem.KODE_BARANG] || 0} {selectedItem.JENIS_SATUAN}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <span className="text-slate-400 font-normal">{placeholder}</span>
        )}

        <div className="flex items-center gap-1 text-slate-400 shrink-0 ml-2">
          {selectedItem && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onSelectItem(null);
              }}
              className="p-1 hover:text-rose-600 rounded-md hover:bg-rose-50"
              title="Hapus Pilihan"
            >
              <X size={14} />
            </span>
          )}
          <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180 text-emerald-800' : ''}`} />
        </div>
      </button>

      {/* Dropdown Modal/Menu */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Search Header */}
          <div className="p-3 border-b border-slate-100 bg-slate-50/70 space-y-2">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ketik nama / kode barang untuk mencari..."
                className="w-full pl-8.5 pr-8 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-emerald-700 shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Category Chips */}
            {categories.length > 2 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar text-[11px]">
                {categories.slice(0, 6).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition-colors ${
                      selectedCategory === cat
                        ? 'bg-emerald-800 text-white shadow-2xs'
                        : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Items List */}
          <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 p-1">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => {
                const stock = stockMap[item.KODE_BARANG] || 0;
                const isSelected = item.KODE_BARANG === selectedItemCode;
                const isOutOfStock = stock <= 0;
                const isDisabled = requireStock && isOutOfStock;

                return (
                  <button
                    key={item.ID || item.KODE_BARANG}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => handlePick(item)}
                    className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between gap-3 transition-colors ${
                      isSelected
                        ? 'bg-emerald-50 text-emerald-950 font-semibold'
                        : isDisabled
                        ? 'opacity-40 bg-slate-50 cursor-not-allowed'
                        : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 truncate">{item.NAMA_BARANG}</span>
                        {item.TIPE === 'Aset / Inventaris' && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                            Aset
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 font-mono">
                        <span className="font-bold text-slate-700">{item.KODE_BARANG}</span>
                        <span>•</span>
                        <span className="font-sans text-slate-500 truncate">{item.KATEGORI}</span>
                        {item.LOKASI_DEFAULT && (
                          <>
                            <span>•</span>
                            <span className="font-sans text-slate-500 truncate">{item.LOKASI_DEFAULT}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0 flex flex-col items-end gap-1">
                      {showStockInfo && (
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            isOutOfStock
                              ? 'bg-rose-100 text-rose-800'
                              : stock <= (item.BATAS_MINIMUM || 5)
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-emerald-100 text-emerald-900'
                          }`}
                        >
                          {isOutOfStock ? 'Habis (0)' : `Stok: ${stock} ${item.JENIS_SATUAN}`}
                        </span>
                      )}
                      {isSelected && <Check size={14} className="text-emerald-800 font-bold" />}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="py-8 text-center text-slate-400 space-y-1">
                <Package size={24} className="mx-auto text-slate-300" />
                <p className="text-xs font-semibold">Tidak ditemukan barang yang sesuai</p>
                <p className="text-[11px] text-slate-400">Coba ubah kata kunci pencarian atau kategori.</p>
              </div>
            )}
          </div>

          {/* Footer Info */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium px-3">
            <span>Ditemukan: {filteredItems.length} Barang</span>
            <span className="text-slate-400">Klik barang untuk memilih</span>
          </div>
        </div>
      )}
    </div>
  );
};
