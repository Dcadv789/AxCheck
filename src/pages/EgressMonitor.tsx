import React, { useState, useEffect } from 'react';
import { BarChart3, Download, Database, FileText, Settings, TrendingUp, Calendar, Filter } from 'lucide-react';
import { useEgressLogger } from '../hooks/useEgressLogger';

interface EgressSummary {
  totalBytes: number;
  totalMB: number;
  totalGB: number;
  operationStats: Record<string, { count: number; bytes: number }>;
  logs: any[];
  period: string;
}

function EgressMonitor() {
  const [summary, setSummary] = useState<EgressSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(30);
  const [selectedOperation, setSelectedOperation] = useState<string>('all');
  const { getEgressSummary } = useEgressLogger();

  useEffect(() => {
    loadSummary();
  }, [selectedPeriod]);

  const loadSummary = async () => {
    setLoading(true);
    try {
      const data = await getEgressSummary(selectedPeriod);
      setSummary(data);
    } catch (error) {
      console.error('Erro ao carregar resumo de egress:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getOperationIcon = (operation: string) => {
    switch (operation) {
      case 'SELECT':
        return <Database size={20} className="text-blue-500" />;
      case 'PDF_EXPORT':
        return <FileText size={20} className="text-red-500" />;
      case 'STORAGE_DOWNLOAD':
        return <Download size={20} className="text-green-500" />;
      case 'SETTINGS':
        return <Settings size={20} className="text-yellow-500" />;
      default:
        return <BarChart3 size={20} className="text-gray-500" />;
    }
  };

  const getOperationName = (operation: string) => {
    const names: Record<string, string> = {
      'SELECT': 'Consultas ao Banco',
      'INSERT': 'Inserções',
      'UPDATE': 'Atualizações',
      'DELETE': 'Exclusões',
      'PDF_EXPORT': 'Exportação de PDF',
      'STORAGE_DOWNLOAD': 'Download de Arquivos',
      'SETTINGS': 'Configurações',
      'AUTH': 'Autenticação'
    };
    return names[operation] || operation;
  };

  const filteredLogs = summary?.logs.filter(log => 
    selectedOperation === 'all' || log.operation_type === selectedOperation
  ) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-zinc-900 rounded-lg p-8 mb-6">
        <h1 className="text-3xl font-bold text-white mb-3">Monitor de Egress</h1>
        <p className="text-gray-400">Monitore o consumo de dados do Supabase em tempo real e identifique oportunidades de otimização.</p>
      </div>

      {/* Controles de Filtro */}
      <div className="bg-zinc-900 rounded-lg p-6 mb-6">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Calendar size={20} className="text-gray-400" />
            <label className="text-sm font-medium text-gray-300">Período:</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(Number(e.target.value))}
              className="bg-zinc-800 text-white rounded-lg px-3 py-2 border border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value={7}>Últimos 7 dias</option>
              <option value={30}>Últimos 30 dias</option>
              <option value={90}>Últimos 90 dias</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-400" />
            <label className="text-sm font-medium text-gray-300">Operação:</label>
            <select
              value={selectedOperation}
              onChange={(e) => setSelectedOperation(e.target.value)}
              className="bg-zinc-800 text-white rounded-lg px-3 py-2 border border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">Todas</option>
              {summary && Object.keys(summary.operationStats).map(op => (
                <option key={op} value={op}>{getOperationName(op)}</option>
              ))}
            </select>
          </div>

          <button
            onClick={loadSummary}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Atualizar
          </button>
        </div>
      </div>

      {summary && (
        <>
          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-zinc-900 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white">Total Consumido</h3>
                <TrendingUp size={24} className="text-blue-500" />
              </div>
              <p className="text-3xl font-bold text-white mb-2">{formatBytes(summary.totalBytes)}</p>
              <p className="text-sm text-gray-400">{summary.period}</p>
            </div>

            <div className="bg-zinc-900 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white">Em MB</h3>
                <Database size={24} className="text-green-500" />
              </div>
              <p className="text-3xl font-bold text-white mb-2">{summary.totalMB.toFixed(2)} MB</p>
              <p className="text-sm text-gray-400">Megabytes</p>
            </div>

            <div className="bg-zinc-900 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white">Em GB</h3>
                <BarChart3 size={24} className="text-red-500" />
              </div>
              <p className="text-3xl font-bold text-white mb-2">{summary.totalGB.toFixed(3)} GB</p>
              <p className="text-sm text-gray-400">Gigabytes</p>
            </div>

            <div className="bg-zinc-900 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white">Operações</h3>
                <Settings size={24} className="text-yellow-500" />
              </div>
              <p className="text-3xl font-bold text-white mb-2">{summary.logs.length}</p>
              <p className="text-sm text-gray-400">Total de operações</p>
            </div>
          </div>

          {/* Estatísticas por Operação */}
          <div className="bg-zinc-900 rounded-lg p-8 mb-6">
            <h2 className="text-2xl font-semibold text-white mb-6">Consumo por Tipo de Operação</h2>
            <div className="space-y-4">
              {Object.entries(summary.operationStats)
                .sort(([,a], [,b]) => b.bytes - a.bytes)
                .map(([operation, stats]) => {
                  const percentage = (stats.bytes / summary.totalBytes) * 100;
                  return (
                    <div key={operation} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          {getOperationIcon(operation)}
                          <span className="text-white font-medium">{getOperationName(operation)}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-white font-medium">{formatBytes(stats.bytes)}</span>
                          <span className="text-gray-400 text-sm ml-2">({stats.count} ops)</span>
                        </div>
                      </div>
                      <div className="w-full bg-zinc-700 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm text-gray-400">{percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Log Detalhado */}
          <div className="bg-zinc-900 rounded-lg p-8">
            <h2 className="text-2xl font-semibold text-white mb-6">Log Detalhado</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-700">
                    <th className="text-left py-3 px-4 text-gray-300">Data/Hora</th>
                    <th className="text-left py-3 px-4 text-gray-300">Operação</th>
                    <th className="text-left py-3 px-4 text-gray-300">Tabela</th>
                    <th className="text-left py-3 px-4 text-gray-300">Tamanho</th>
                    <th className="text-left py-3 px-4 text-gray-300">Tempo (ms)</th>
                    <th className="text-left py-3 px-4 text-gray-300">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.slice(0, 50).map((log) => (
                    <tr key={log.id} className="border-b border-zinc-800 hover:bg-zinc-800">
                      <td className="py-3 px-4 text-gray-300">
                        {new Date(log.created_at).toLocaleString('pt-BR')}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {getOperationIcon(log.operation_type)}
                          <span className="text-white">{getOperationName(log.operation_type)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-300">{log.table_name || '-'}</td>
                      <td className="py-3 px-4 text-white font-medium">
                        {formatBytes(log.data_size_bytes)}
                      </td>
                      <td className="py-3 px-4 text-gray-300">
                        {log.response_time_ms || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          log.status_code === 200 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {log.status_code}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredLogs.length > 50 && (
              <div className="mt-4 text-center">
                <p className="text-gray-400">Mostrando 50 de {filteredLogs.length} registros</p>
              </div>
            )}
          </div>
        </>
      )}

      {!summary && (
        <div className="bg-zinc-900 rounded-lg p-8">
          <div className="text-center py-12">
            <BarChart3 size={48} className="text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">
              Nenhum dado de egress encontrado para o período selecionado.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default EgressMonitor;