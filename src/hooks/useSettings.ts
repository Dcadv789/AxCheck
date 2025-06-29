import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Settings {
  id: string;
  logo: string | null;
  navbar_logo: string | null;
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .single();

      if (error) throw error;

      setSettings(data);
    } catch (err) {
      console.error('Erro ao carregar configurações:', err);
      setError('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<Settings>) => {
    try {
      if (!settings?.id) throw new Error('ID das configurações não encontrado');

      const { error } = await supabase
        .from('settings')
        .update(newSettings)
        .eq('id', settings.id);

      if (error) throw error;

      setSettings(prev => prev ? { ...prev, ...newSettings } : null);
    } catch (err) {
      console.error('Erro ao atualizar configurações:', err);
      throw err;
    }
  };

  return {
    settings,
    loading,
    error,
    updateSettings,
    refetch: fetchSettings
  };
}