import { useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface EgressLogData {
  operationType: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'STORAGE_DOWNLOAD' | 'PDF_EXPORT' | 'AUTH' | 'SETTINGS';
  tableName?: string;
  dataSizeBytes: number;
  endpoint?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  responseTimeMs?: number;
  statusCode?: number;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export function useEgressLogger() {
  const logEgress = useCallback(async (data: EgressLogData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Captura informações do navegador
      const userAgent = navigator.userAgent;
      const timestamp = Date.now();

      await supabase
        .from('egress_logs')
        .insert([{
          user_id: user.id,
          operation_type: data.operationType,
          table_name: data.tableName,
          data_size_bytes: data.dataSizeBytes,
          endpoint: data.endpoint,
          method: data.method || 'GET',
          user_agent: userAgent,
          response_time_ms: data.responseTimeMs,
          status_code: data.statusCode || 200,
          error_message: data.errorMessage,
          metadata: data.metadata
        }]);

      console.log(`📊 Egress logged: ${data.operationType} - ${data.dataSizeBytes} bytes`);
    } catch (error) {
      console.error('Erro ao registrar egress:', error);
    }
  }, []);

  const logDataFetch = useCallback(async (
    tableName: string,
    data: any,
    responseTimeMs?: number
  ) => {
    const dataSizeBytes = calculateDataSize(data);
    await logEgress({
      operationType: 'SELECT',
      tableName,
      dataSizeBytes,
      endpoint: `/rest/v1/${tableName}`,
      method: 'GET',
      responseTimeMs,
      metadata: {
        recordCount: Array.isArray(data) ? data.length : 1,
        timestamp: new Date().toISOString()
      }
    });
  }, [logEgress]);

  const logPDFExport = useCallback(async (
    pdfSizeBytes: number,
    companyName: string,
    responseTimeMs?: number
  ) => {
    await logEgress({
      operationType: 'PDF_EXPORT',
      dataSizeBytes: pdfSizeBytes,
      endpoint: '/pdf-export',
      method: 'POST',
      responseTimeMs,
      metadata: {
        companyName,
        exportType: 'diagnostic_pdf',
        timestamp: new Date().toISOString()
      }
    });
  }, [logEgress]);

  const logStorageDownload = useCallback(async (
    fileName: string,
    fileSizeBytes: number,
    responseTimeMs?: number
  ) => {
    await logEgress({
      operationType: 'STORAGE_DOWNLOAD',
      tableName: 'storage',
      dataSizeBytes: fileSizeBytes,
      endpoint: `/storage/v1/object/public/logos/${fileName}`,
      method: 'GET',
      responseTimeMs,
      metadata: {
        fileName,
        fileType: fileName.split('.').pop(),
        timestamp: new Date().toISOString()
      }
    });
  }, [logEgress]);

  const getEgressSummary = useCallback(async (days: number = 30) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('egress_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calcular estatísticas
      const totalBytes = data.reduce((sum, log) => sum + log.data_size_bytes, 0);
      const totalMB = totalBytes / (1024 * 1024);
      const totalGB = totalMB / 1024;

      const operationStats = data.reduce((stats, log) => {
        const op = log.operation_type;
        if (!stats[op]) {
          stats[op] = { count: 0, bytes: 0 };
        }
        stats[op].count++;
        stats[op].bytes += log.data_size_bytes;
        return stats;
      }, {} as Record<string, { count: number; bytes: number }>);

      return {
        totalBytes,
        totalMB,
        totalGB,
        operationStats,
        logs: data,
        period: `${days} dias`
      };
    } catch (error) {
      console.error('Erro ao buscar resumo de egress:', error);
      return null;
    }
  }, []);

  return {
    logEgress,
    logDataFetch,
    logPDFExport,
    logStorageDownload,
    getEgressSummary
  };
}

// Função utilitária para calcular tamanho dos dados
function calculateDataSize(data: any): number {
  if (!data) return 0;
  
  try {
    const jsonString = JSON.stringify(data);
    return new Blob([jsonString]).size;
  } catch {
    return 0;
  }
}