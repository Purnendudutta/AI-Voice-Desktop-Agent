import { useState, useEffect } from 'react';
import { AppConfig } from '../../shared/types/config';
import { DEFAULT_CONFIG } from '../../shared/constants/defaults';

export function useConfigStore() {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.getConfig().then((cfg) => {
        if (cfg) setConfig(cfg);
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, []);

  const updateConfig = async (partial: Partial<AppConfig>) => {
    if (window.electronAPI) {
      const updated = await window.electronAPI.updateConfig(partial);
      setConfig(updated);
      return updated;
    }
    const updated = { ...config, ...partial };
    setConfig(updated);
    return updated;
  };

  const completeOnboarding = async (identity: AppConfig['identity']) => {
    if (window.electronAPI) {
      const updated = await window.electronAPI.completeOnboarding(identity);
      setConfig(updated);
      return updated;
    }
    const updated = { ...config, identity, isOnboarded: true };
    setConfig(updated);
    return updated;
  };

  return { config, setConfig, updateConfig, completeOnboarding, isLoading };
}
