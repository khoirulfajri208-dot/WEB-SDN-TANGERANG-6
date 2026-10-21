import { useState, useEffect, useCallback } from 'react';
import { maskingService, SensitiveDataType, DlpAlert } from '../services/maskingService';

export function useDataMasking() {
  const [isGlobalMasking, setIsGlobalMaskingState] = useState<boolean>(() =>
    maskingService.isGlobalMaskingEnabled()
  );
  const [updateTick, setUpdateTick] = useState<number>(0);
  const [lastDlpAlert, setLastDlpAlert] = useState<DlpAlert | null>(null);

  useEffect(() => {
    const unsub = maskingService.subscribe(() => {
      setIsGlobalMaskingState(maskingService.isGlobalMaskingEnabled());
      setUpdateTick((t) => t + 1);
    });

    const unsubDlp = maskingService.subscribeDlpAlert((alert) => {
      setLastDlpAlert(alert);
    });

    return () => {
      unsub();
      unsubDlp();
    };
  }, []);

  const toggleGlobalMasking = useCallback(() => {
    return maskingService.toggleGlobalMasking();
  }, []);

  const setGlobalMasking = useCallback((enabled: boolean) => {
    maskingService.setGlobalMasking(enabled);
  }, []);

  const isFieldRevealed = useCallback(
    (fieldId: string) => {
      return maskingService.isFieldRevealed(fieldId);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [updateTick, isGlobalMasking]
  );

  const toggleField = useCallback((fieldId: string, durationMs?: number) => {
    return maskingService.toggleField(fieldId, durationMs);
  }, []);

  const revealField = useCallback((fieldId: string, durationMs?: number) => {
    maskingService.revealField(fieldId, durationMs);
  }, []);

  const hideField = useCallback((fieldId: string) => {
    maskingService.hideField(fieldId);
  }, []);

  const maskValue = useCallback(
    (value: any, type?: SensitiveDataType, isRevealed?: boolean) => {
      return maskingService.maskValue(value, type, isRevealed);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isGlobalMasking, updateTick]
  );

  const preventClipboardCopy = useCallback((e: any, label?: string) => {
    maskingService.preventClipboardCopy(e, label);
  }, []);

  const preventContextMenu = useCallback((e: any, label?: string) => {
    maskingService.preventContextMenu(e, label);
  }, []);

  return {
    isGlobalMasking,
    toggleGlobalMasking,
    setGlobalMasking,
    isFieldRevealed,
    toggleField,
    revealField,
    hideField,
    maskValue,
    preventClipboardCopy,
    preventContextMenu,
    lastDlpAlert,
  };
}
