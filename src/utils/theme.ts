import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../services/localStorageService';

export interface ThemeColors {
  id: string;
  name: string;
  primaryGrad: string;         // e.g. 'from-blue-800 to-blue-950'
  heroGrad: string;            // e.g. 'from-blue-600 via-blue-700 to-blue-900'
  bgSoft: string;              // e.g. 'bg-blue-50/60'
  textAccent: string;          // e.g. 'text-blue-700'
  textAccentDark: string;      // e.g. 'text-blue-900'
  borderAccent: string;        // e.g. 'border-blue-200'
  buttonBase: string;          // e.g. 'bg-blue-700 hover:bg-blue-800 text-white'
  buttonActive: string;        // e.g. 'bg-blue-800 text-white'
  accentRing: string;          // e.g. 'focus:ring-blue-500'
  tagStyle: string;            // e.g. 'bg-blue-100 text-blue-800'
  glowEffect: string;          // e.g. 'glow-blue-subtle'
  accentBadge: string;         // e.g. 'bg-blue-100 text-blue-800 border-blue-200'
  accentHoverBg: string;       // e.g. 'hover:bg-blue-50'
  accentColorName: string;     // e.g. 'blue'
}

export interface ThemeStyles {
  mode: 'light' | 'dark' | 'high_contrast';
  themeId: string;
  isDark: boolean;
  isHighContrast: boolean;
  
  // App-wide containers
  bgApp: string;
  card: string;                // Glassmorphism default
  cardHover: string;           // Glassmorphism default with extra hover state
  cardFlat: string;            // Static container
  borderSubtle: string;
  textMain: string;
  textMuted: string;
  textTitle: string;
  
  // Form elements
  input: string;
  label: string;
  
  // Theme specific properties (mapped dynamically to mode)
  primaryGrad: string;
  heroGrad: string;
  bgSoft: string;
  textAccent: string;
  textAccentDark: string;
  borderAccent: string;
  buttonBase: string;
  buttonActive: string;
  accentRing: string;
  tagStyle: string;
  glowEffect: string;
  accentBadge: string;
  accentHoverBg: string;
  accentColorName: string;
}

export const themes: Record<string, ThemeColors> = {
  classic_blue: {
    id: 'classic_blue',
    name: '🇸🇬 Classic Blue Satdik (Default)',
    primaryGrad: 'from-blue-800 to-blue-950',
    heroGrad: 'from-blue-600 via-blue-700 to-blue-900',
    bgSoft: 'bg-blue-50/60',
    textAccent: 'text-blue-700',
    textAccentDark: 'text-blue-900',
    borderAccent: 'border-blue-200',
    buttonBase: 'bg-blue-700 hover:bg-blue-800 text-white shadow-blue-900/10',
    buttonActive: 'bg-blue-800 text-white',
    accentRing: 'focus:outline-blue-600',
    tagStyle: 'bg-blue-100 text-blue-800',
    glowEffect: 'glow-blue-subtle',
    accentBadge: 'bg-blue-50 text-blue-800 border border-blue-200',
    accentHoverBg: 'hover:bg-blue-50',
    accentColorName: 'blue',
  },
  luxury_gold: {
    id: 'luxury_gold',
    name: '👑 Luxury Gold & Charcoal',
    primaryGrad: 'from-amber-600 to-slate-900',
    heroGrad: 'from-slate-950 via-slate-900 to-amber-950',
    bgSoft: 'bg-amber-50/60',
    textAccent: 'text-amber-700',
    textAccentDark: 'text-amber-900',
    borderAccent: 'border-amber-200',
    buttonBase: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-900/10',
    buttonActive: 'bg-amber-700 text-white',
    accentRing: 'focus:outline-amber-600',
    tagStyle: 'bg-amber-100 text-amber-900',
    glowEffect: 'glow-amber-subtle',
    accentBadge: 'bg-amber-50 text-amber-900 border border-amber-200',
    accentHoverBg: 'hover:bg-amber-50',
    accentColorName: 'amber',
  },
  emerald_nature: {
    id: 'emerald_nature',
    name: '🌲 Emerald Mint & Spruce',
    primaryGrad: 'from-emerald-700 to-teal-950',
    heroGrad: 'from-emerald-800 via-emerald-950 to-teal-900',
    bgSoft: 'bg-emerald-50/60',
    textAccent: 'text-emerald-700',
    textAccentDark: 'text-emerald-900',
    borderAccent: 'border-emerald-200',
    buttonBase: 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-900/10',
    buttonActive: 'bg-emerald-800 text-white',
    accentRing: 'focus:outline-emerald-600',
    tagStyle: 'bg-emerald-100 text-emerald-800',
    glowEffect: 'glow-emerald-subtle',
    accentBadge: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
    accentHoverBg: 'hover:bg-emerald-50',
    accentColorName: 'emerald',
  },
  dark_violet: {
    id: 'dark_violet',
    name: '🔮 Amethyst Midnight & Cyber',
    primaryGrad: 'from-indigo-800 to-slate-950',
    heroGrad: 'from-indigo-900 via-slate-950 to-violet-950',
    bgSoft: 'bg-indigo-50/60',
    textAccent: 'text-indigo-700',
    textAccentDark: 'text-indigo-900',
    borderAccent: 'border-indigo-200',
    buttonBase: 'bg-indigo-700 hover:bg-indigo-800 text-white shadow-indigo-900/10',
    buttonActive: 'bg-indigo-800 text-white',
    accentRing: 'focus:outline-indigo-600',
    tagStyle: 'bg-indigo-100 text-indigo-800',
    glowEffect: 'glow-indigo-subtle',
    accentBadge: 'bg-indigo-50 text-indigo-800 border border-indigo-200',
    accentHoverBg: 'hover:bg-indigo-50',
    accentColorName: 'indigo',
  },
  crimson_scholastic: {
    id: 'crimson_scholastic',
    name: '🍷 Crimson Academy & Stone',
    primaryGrad: 'from-rose-800 to-stone-950',
    heroGrad: 'from-rose-900 via-stone-900 to-rose-950',
    bgSoft: 'bg-rose-50/60',
    textAccent: 'text-rose-700',
    textAccentDark: 'text-rose-900',
    borderAccent: 'border-rose-200',
    buttonBase: 'bg-rose-700 hover:bg-rose-800 text-white shadow-rose-900/10',
    buttonActive: 'bg-rose-800 text-white',
    accentRing: 'focus:outline-rose-600',
    tagStyle: 'bg-rose-100 text-rose-800',
    glowEffect: 'glow-rose-subtle',
    accentBadge: 'bg-rose-50 text-rose-800 border border-rose-200',
    accentHoverBg: 'hover:bg-rose-50',
    accentColorName: 'rose',
  },
};

export interface ThemeContextType {
  themeId: string;
  themeMode: 'light' | 'dark' | 'high_contrast';
  setThemeId: (id: string) => void;
  setThemeMode: (mode: 'light' | 'dark' | 'high_contrast') => void;
  
  // Preview handlers
  previewThemeId: string | null;
  previewThemeMode: ('light' | 'dark' | 'high_contrast') | null;
  setPreview: (id: string | null, mode?: ('light' | 'dark' | 'high_contrast') | null) => void;
  
  // Realized styles based on either preview or actual config
  styles: ThemeStyles;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const config = db.getConfig();
  const savedThemeId = config.SYSTEM_THEME || 'classic_blue';
  const savedThemeMode = config.SYSTEM_THEME_MODE || 'light';

  const [themeId, setThemeIdState] = useState<string>(savedThemeId);
  const [themeMode, setThemeModeState] = useState<'light' | 'dark' | 'high_contrast'>(savedThemeMode);

  // Live preview state (when not null, we override saved settings)
  const [previewThemeId, setPreviewThemeId] = useState<string | null>(null);
  const [previewThemeMode, setPreviewThemeMode] = useState<('light' | 'dark' | 'high_contrast') | null>(null);

  // Synchronize when db config is saved/loaded
  useEffect(() => {
    const updatedConfig = db.getConfig();
    setThemeIdState(updatedConfig.SYSTEM_THEME || 'classic_blue');
    setThemeModeState(updatedConfig.SYSTEM_THEME_MODE || 'light');
  }, []);

  const setThemeId = (id: string) => {
    setThemeIdState(id);
  };

  const setThemeMode = (mode: 'light' | 'dark' | 'high_contrast') => {
    setThemeModeState(mode);
  };

  const setPreview = (id: string | null, mode?: ('light' | 'dark' | 'high_contrast') | null) => {
    setPreviewThemeId(id);
    if (mode !== undefined) {
      setPreviewThemeMode(mode);
    }
  };

  // Compute effective active values
  const effectiveThemeId = previewThemeId || themeId;
  const effectiveMode = previewThemeMode || themeMode;

  const baseColorTheme = themes[effectiveThemeId] || themes.classic_blue;

  // Realize state-specific styles
  const isDark = effectiveMode === 'dark';
  const isHighContrast = effectiveMode === 'high_contrast';

  // Apply visual effects globally to root document
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('high-contrast');
      root.style.backgroundColor = '#0b0f19';
    } else if (isHighContrast) {
      root.classList.remove('dark');
      root.classList.add('high-contrast');
      root.style.backgroundColor = '#000000';
    } else {
      root.classList.remove('dark');
      root.classList.remove('high-contrast');
      root.style.backgroundColor = '#f8fafc';
    }
  }, [effectiveMode]);

  // Generate responsive customized glassmorphic variables
  const styles: ThemeStyles = {
    mode: effectiveMode,
    themeId: effectiveThemeId,
    isDark,
    isHighContrast,
    
    // Containers
    bgApp: isHighContrast
      ? 'bg-black text-white'
      : isDark
      ? 'bg-[#0b0f19] text-slate-100 min-h-screen transition-all duration-300'
      : 'bg-slate-50 text-slate-900 min-h-screen transition-all duration-300',
      
    card: isHighContrast
      ? 'bg-black text-white border-2 border-white rounded-none p-5 sm:p-6 mb-4'
      : isDark
      ? 'bg-slate-900/75 backdrop-blur-md border border-slate-800/80 shadow-md rounded-2xl p-5 sm:p-6 transition-all duration-300'
      : 'bg-white/80 backdrop-blur-md border border-slate-200/60 shadow-sm hover:shadow-md rounded-2xl p-5 sm:p-6 transition-all duration-300',
      
    cardHover: isHighContrast
      ? 'bg-black text-white border-2 border-white rounded-none p-5 sm:p-6 mb-4 hover:bg-white hover:text-black cursor-pointer'
      : isDark
      ? 'bg-slate-900/75 backdrop-blur-md border border-slate-800/80 hover:border-slate-700/60 shadow-md hover:shadow-lg rounded-2xl p-5 sm:p-6 transition-all duration-300'
      : 'bg-white/80 backdrop-blur-md border border-slate-200/60 shadow-sm hover:shadow-md hover:border-slate-300/80 rounded-2xl p-5 sm:p-6 transition-all duration-300',
      
    cardFlat: isHighContrast
      ? 'bg-black text-white border-2 border-white p-4'
      : isDark
      ? 'bg-slate-900/40 border border-slate-800 rounded-xl p-4'
      : 'bg-slate-50 border border-slate-100 rounded-xl p-4',
      
    borderSubtle: isHighContrast
      ? 'border-white'
      : isDark
      ? 'border-slate-800'
      : 'border-slate-100',
      
    textMain: isHighContrast
      ? 'text-white font-mono'
      : isDark
      ? 'text-slate-100'
      : 'text-slate-800',
      
    textMuted: isHighContrast
      ? 'text-white font-bold underline decoration-dotted'
      : isDark
      ? 'text-slate-400 font-medium'
      : 'text-slate-500 font-medium',
      
    textTitle: isHighContrast
      ? 'text-white font-black'
      : isDark
      ? 'text-white'
      : 'text-slate-900',
      
    input: isHighContrast
      ? 'bg-black text-white border-2 border-white px-3 py-2 text-xs font-mono rounded-none focus:bg-white focus:text-black focus:outline-none'
      : isDark
      ? 'w-full px-3.5 py-2.5 text-xs bg-slate-950/60 border border-slate-800 rounded-xl focus:border-slate-700 text-slate-100 placeholder-slate-500 transition-all focus:ring-2 focus:ring-white/5 outline-none'
      : 'w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:border-slate-300 text-slate-800 placeholder-slate-400 transition-all focus:ring-4 focus:ring-slate-100 outline-none',
      
    label: isHighContrast
      ? 'block text-xs font-black uppercase text-white mb-1.5 tracking-wider'
      : isDark
      ? 'block text-xs font-semibold text-slate-300 mb-1 tracking-wide'
      : 'block text-xs font-semibold text-slate-700 mb-1 tracking-wide',

    // Adapt standard ThemeColors to modes
    primaryGrad: isHighContrast
      ? 'from-black to-black'
      : isDark
      ? baseColorTheme.primaryGrad.replace('from-blue-', 'from-slate-').replace('from-emerald-', 'from-slate-').replace('from-indigo-', 'from-slate-').replace('from-rose-', 'from-slate-').replace('to-blue-', 'to-black').replace('to-emerald-', 'to-black').replace('to-indigo-', 'to-black').replace('to-rose-', 'to-black')
      : baseColorTheme.primaryGrad,
      
    heroGrad: isHighContrast
      ? 'from-black to-black'
      : isDark
      ? 'from-slate-950 via-slate-900 to-black'
      : baseColorTheme.heroGrad,
      
    bgSoft: isHighContrast
      ? 'bg-black text-white border border-white'
      : isDark
      ? `bg-${baseColorTheme.accentColorName}-950/20 text-${baseColorTheme.accentColorName}-300 border border-${baseColorTheme.accentColorName}-900/30`
      : baseColorTheme.bgSoft,
      
    textAccent: isHighContrast
      ? 'text-white font-black underline hover:bg-white hover:text-black px-1.5 py-0.5'
      : isDark
      ? `text-${baseColorTheme.accentColorName}-400`
      : baseColorTheme.textAccent,
      
    textAccentDark: isHighContrast
      ? 'text-white font-black'
      : isDark
      ? `text-${baseColorTheme.accentColorName}-300`
      : baseColorTheme.textAccentDark,
      
    borderAccent: isHighContrast
      ? 'border-white'
      : isDark
      ? `border-${baseColorTheme.accentColorName}-900/40`
      : baseColorTheme.borderAccent,
      
    buttonBase: isHighContrast
      ? 'bg-black hover:bg-white hover:text-black text-white border-2 border-white px-4 py-2 font-black transition-all cursor-pointer'
      : isDark
      ? `bg-${baseColorTheme.accentColorName}-600 hover:bg-${baseColorTheme.accentColorName}-500 text-white shadow-md transition-all duration-300 cursor-pointer`
      : baseColorTheme.buttonBase,
      
    buttonActive: isHighContrast
      ? 'bg-white text-black border-2 border-white px-4 py-2 font-black transition-all cursor-pointer'
      : isDark
      ? `bg-${baseColorTheme.accentColorName}-500 text-white cursor-pointer`
      : baseColorTheme.buttonActive,
      
    accentRing: isHighContrast
      ? 'focus:outline-white'
      : isDark
      ? 'focus:outline-slate-700'
      : baseColorTheme.accentRing,
      
    tagStyle: isHighContrast
      ? 'bg-black text-white border border-white px-1 font-mono text-[10px]'
      : isDark
      ? `bg-${baseColorTheme.accentColorName}-950/40 text-${baseColorTheme.accentColorName}-300 border border-${baseColorTheme.accentColorName}-800/40`
      : baseColorTheme.tagStyle,
      
    glowEffect: isHighContrast
      ? 'shadow-none'
      : isDark
      ? 'shadow-inner'
      : baseColorTheme.glowEffect,
      
    accentBadge: isHighContrast
      ? 'bg-black text-white border border-white font-mono'
      : isDark
      ? `bg-${baseColorTheme.accentColorName}-950/40 text-${baseColorTheme.accentColorName}-300 border border-${baseColorTheme.accentColorName}-900/50`
      : baseColorTheme.accentBadge,
      
    accentHoverBg: isHighContrast
      ? 'hover:bg-white hover:text-black'
      : isDark
      ? `hover:bg-${baseColorTheme.accentColorName}-950/25`
      : baseColorTheme.accentHoverBg,
      
    accentColorName: baseColorTheme.accentColorName,
  };

  return React.createElement(
    ThemeContext.Provider,
    {
      value: {
        themeId,
        themeMode,
        setThemeId,
        setThemeMode,
        previewThemeId,
        previewThemeMode,
        setPreview,
        styles,
      },
    },
    children
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Legacy compatibility helper
export function getActiveTheme(): ThemeColors {
  const config = db.getConfig();
  const themeId = config.SYSTEM_THEME || 'classic_blue';
  return themes[themeId] || themes.classic_blue;
}
