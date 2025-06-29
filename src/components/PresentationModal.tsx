import React, { useState, useEffect } from 'react';
import { X, Play, ChevronDown, ChevronUp, Calendar, Building2 } from 'lucide-react';
import { useDiagnosticCalculation } from '../hooks/useDiagnosticCalculation';
import PresentationSlideshow from './PresentationSlideshow';
import type { DiagnosticResult } from '../types/diagnostic';
import { Particles } from './Particles';

interface PresentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function PresentationModal({ isOpen, onClose }: PresentationModalProps) {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResult, setSelectedResult] = useState<DiagnosticResult | null>(null);
  const [showAllResults, setShowAllResults] = useState(false);
  const [isPresenting, setIsPresenting] = useState(false);
  const { fetchResults } = useDiagnosticCalculation();

  // URL fixa da logo do Cloudinary
  const logoUrl = 'https://res.cloudinary.com/ducd9j4tx/image/upload/v1751168925/Ativo_26_-_Azul_branco_x3quzd.svg';

  useEffect(() => {
    if (isOpen) {
      loadResults();
    }
  }, [isOpen]);

  const loadResults = async () => {
    setLoading(true);
    try {
      console.log('🔄 Carregando resultados para apresentação...');
      const data = await fetchResults();
      console.log('📊 Resultados carregados:', data);
      setResults(data);
    } catch (error) {
      console.error('❌ Erro ao carregar resultados:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleStartPresentation = async (result: DiagnosticResult) => {
    console.log('🎯 Iniciando apresentação para:', result.companyData.empresa);
    
    // SEMPRE recarregar os dados mais recentes antes de apresentar
    setLoading(true);
    try {
      const freshResults = await fetchResults();
      console.log('🔄 Dados atualizados carregados:', freshResults);
      
      // Encontrar o resultado atualizado correspondente
      const updatedResult = freshResults.find(r => r.id === result.id);
      
      if (updatedResult) {
        console.log('✅ Usando dados atualizados para apresentação');
        setSelectedResult(updatedResult);
      } else {
        console.log('⚠️ Resultado não encontrado, usando dados originais');
        setSelectedResult(result);
      }
      
      setIsPresenting(true);
    } catch (error) {
      console.error('❌ Erro ao atualizar dados:', error);
      // Em caso de erro, usar os dados originais
      setSelectedResult(result);
      setIsPresenting(true);
    } finally {
      setLoading(false);
    }
  };

  const handleClosePresentation = () => {
    setIsPresenting(false);
    setSelectedResult(null);
    // Recarregar dados quando fechar a apresentação
    loadResults();
  };

  const recentResults = results.slice(0, 3);
  const displayResults = showAllResults ? results : recentResults;

  if (!isOpen) return null;

  if (isPresenting && selectedResult) {
    return (
      <PresentationSlideshow
        result={selectedResult}
        onClose={handleClosePresentation}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center p-4 z-50">
      <Particles
        className="absolute inset-0"
        quantity={50}
        staticity={30}
        ease={50}
        size={0.5}
      />
      <div className="bg-zinc-900 rounded-lg w-full max-w-4xl relative z-10 max-h-[90vh] overflow-hidden">
        <div className="bg-zinc-800 p-6 border-b border-zinc-700 flex justify-between items-center rounded-t-lg">
          <div className="flex items-start gap-4">
            <Play size={32} className="text-blue-500 mt-1" />
            <div>
              <h2 className="text-2xl font-bold text-white">Apresentação de Diagnóstico</h2>
              <p className="text-gray-400">
                Selecione um diagnóstico para apresentar em reunião
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <img
              src={logoUrl}
              alt="Logo da empresa"
              className="object-contain"
              style={{ 
                width: '200px', 
                height: '80px',
                minWidth: '200px', 
                minHeight: '80px', 
                maxWidth: '200px', 
                maxHeight: '80px' 
              }}
            />
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-white">Carregando diagnósticos...</div>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-12">
              <Building2 size={48} className="text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">
                Nenhum diagnóstico encontrado. Complete um diagnóstico primeiro.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Últimos 3 Diagnósticos */}
              <div>
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Calendar size={20} className="text-blue-500" />
                  Diagnósticos Recentes
                </h3>
                <div className="grid gap-4">
                  {recentResults.map((result) => (
                    <div
                      key={result.id}
                      className="bg-zinc-800 rounded-lg p-6 hover:bg-zinc-750 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-grow">
                          <div className="flex items-center gap-4 mb-2">
                            <h4 className="text-lg font-medium text-white">
                              {result.companyData.empresa}
                            </h4>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-400">{result.companyData.nome}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <span>CNPJ: {result.companyData.cnpj}</span>
                            <span>•</span>
                            <span>{formatDate(result.date)}</span>
                            <span>•</span>
                            <span className="text-blue-400 font-medium">
                              {Math.round(result.totalScore)} pontos ({Math.round(result.percentageScore)}%)
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleStartPresentation(result)}
                          disabled={loading}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Play size={20} />
                          {loading ? 'Carregando...' : 'Apresentar'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botão para mostrar todos */}
              {results.length > 3 && (
                <div className="border-t border-zinc-700 pt-6">
                  <button
                    onClick={() => setShowAllResults(!showAllResults)}
                    className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {showAllResults ? (
                      <>
                        <ChevronUp size={20} />
                        Mostrar Apenas Recentes
                      </>
                    ) : (
                      <>
                        <ChevronDown size={20} />
                        Ver Todos os Diagnósticos ({results.length})
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Lista completa (se expandida) */}
              {showAllResults && results.length > 3 && (
                <div>
                  <h3 className="text-xl font-semibold text-white mb-4">
                    Todos os Diagnósticos
                  </h3>
                  <div className="grid gap-4">
                    {results.slice(3).map((result) => (
                      <div
                        key={result.id}
                        className="bg-zinc-800 rounded-lg p-6 hover:bg-zinc-750 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-grow">
                            <div className="flex items-center gap-4 mb-2">
                              <h4 className="text-lg font-medium text-white">
                                {result.companyData.empresa}
                              </h4>
                              <span className="text-gray-400">•</span>
                              <span className="text-gray-400">{result.companyData.nome}</span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-400">
                              <span>CNPJ: {result.companyData.cnpj}</span>
                              <span>•</span>
                              <span>{formatDate(result.date)}</span>
                              <span>•</span>
                              <span className="text-blue-400 font-medium">
                                {Math.round(result.totalScore)} pontos ({Math.round(result.percentageScore)}%)
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleStartPresentation(result)}
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Play size={20} />
                            {loading ? 'Carregando...' : 'Apresentar'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PresentationModal;