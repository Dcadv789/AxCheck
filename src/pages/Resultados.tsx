import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Award, 
  ChevronDown, 
  ChevronUp, 
  Trash2, 
  ThumbsUp, 
  ThumbsDown, 
  Lightbulb,
  Building2,
  Users,
  DollarSign,
  MapPin,
  Calendar,
  Target,
  Eye,
  FileText,
  Activity,
  Edit3,
  Save,
  X
} from 'lucide-react';
import { useDiagnosticCalculation } from '../hooks/useDiagnosticCalculation';
import ExportPDF from '../components/ExportPDF';
import { supabase } from '../lib/supabase';
import type { DiagnosticResult, PillarScore } from '../types/diagnostic';

interface QuestionAnswer {
  questionId: string;
  questionText: string;
  answer: string;
  points: number;
  positiveAnswer: string;
  answerType: string;
}

interface PillarQA {
  pillarId: string;
  pillarName: string;
  questions: QuestionAnswer[];
}

function getBestAndWorstPillars(pillarScores: PillarScore[]): { best: PillarScore; worst: PillarScore } {
  // Ordena por PERCENTUAL DE APROVEITAMENTO (percentageScore) em ordem decrescente
  const sortedPillars = [...pillarScores].sort((a, b) => b.percentageScore - a.percentageScore);
  return {
    best: sortedPillars[0],
    worst: sortedPillars[sortedPillars.length - 1]
  };
}

function getMaturityLevel(score: number): {
  level: string;
  description: string;
  color: string;
  bgColor: string;
} {
  if (score <= 40) {
    return {
      level: 'Inicial',
      description: 'O negócio está começando ou ainda não possui processos bem definidos. Planejamento e estruturação são prioridades.',
      color: 'text-red-400',
      bgColor: 'bg-red-500/20'
    };
  } else if (score <= 70) {
    return {
      level: 'Em Desenvolvimento',
      description: 'O negócio já possui alguns processos organizados, mas ainda enfrenta desafios para alcançar estabilidade e crescimento consistente.',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20'
    };
  } else {
    return {
      level: 'Consolidado',
      description: 'O negócio tem processos bem estabelecidos, boa gestão e está em um estágio de expansão ou consolidação no mercado.',
      color: 'text-green-400',
      bgColor: 'bg-green-500/20'
    };
  }
}

function getRecommendation(score: number): string {
  if (score <= 40) {
    return "Priorize a criação de um planejamento estratégico básico, organize as finanças e defina processos essenciais para o funcionamento do negócio. Considere buscar orientação de um consultor para acelerar essa estruturação.";
  } else if (score <= 70) {
    return "Foco em otimizar os processos existentes, investir em capacitação da equipe e melhorar a gestão financeira. Avalie ferramentas que possam automatizar operações e aumentar a eficiência.";
  } else {
    return "Concentre-se na inovação, expansão de mercado e diversificação de produtos/serviços. Invista em estratégias de marketing e mantenha um controle financeiro rigoroso para sustentar o crescimento.";
  }
}

function QuestionAnswerModal({ 
  result, 
  isOpen, 
  onClose, 
  onSave 
}: { 
  result: DiagnosticResult; 
  isOpen: boolean; 
  onClose: () => void;
  onSave: (updatedResult: DiagnosticResult) => void;
}) {
  const [pillarsQA, setPillarsQA] = useState<PillarQA[]>([]);
  const [editedAnswers, setEditedAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedPillar, setExpandedPillar] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadPillarsAndQuestions();
    }
  }, [isOpen, result]);

  const loadPillarsAndQuestions = async () => {
    setLoading(true);
    try {
      const { data: pillars, error } = await supabase
        .from('pillars')
        .select(`
          id,
          name,
          "order",
          questions (
            id,
            text,
            points,
            positive_answer,
            answer_type,
            "order"
          )
        `)
        .order('"order"');

      if (error) throw error;

      const formattedPillars: PillarQA[] = pillars.map(pillar => ({
        pillarId: pillar.id,
        pillarName: pillar.name,
        questions: pillar.questions
          .sort((a: any, b: any) => a.order - b.order)
          .map((q: any) => ({
            questionId: q.id,
            questionText: q.text,
            answer: result.answers[q.id] || '',
            points: q.points,
            positiveAnswer: q.positive_answer,
            answerType: q.answer_type
          }))
      }));

      setPillarsQA(formattedPillars);
      setEditedAnswers({ ...result.answers });
    } catch (error) {
      console.error('Erro ao carregar perguntas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, newAnswer: string) => {
    setEditedAnswers(prev => ({
      ...prev,
      [questionId]: newAnswer
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Recalcular pontuações com as novas respostas
      const { calculateScore } = useDiagnosticCalculation();
      
      // Converter pillarsQA para o formato esperado
      const pillarsForCalculation = pillarsQA.map(pillar => ({
        id: pillar.pillarId,
        name: pillar.pillarName,
        questions: pillar.questions.map(q => ({
          id: q.questionId,
          text: q.questionText,
          points: q.points,
          positiveAnswer: q.positiveAnswer,
          answerType: q.answerType
        }))
      }));

      const { pillarScores, totalScore, maxPossibleScore, percentageScore } = calculateScore(editedAnswers, pillarsForCalculation);

      // Atualizar no banco de dados
      const { error } = await supabase
        .from('diagnostic_results')
        .update({
          answers: editedAnswers,
          pillar_scores: pillarScores,
          total_score: totalScore,
          max_possible_score: maxPossibleScore,
          percentage_score: percentageScore
        })
        .eq('id', result.id);

      if (error) throw error;

      // Criar resultado atualizado
      const updatedResult: DiagnosticResult = {
        ...result,
        answers: editedAnswers,
        pillarScores,
        totalScore,
        maxPossibleScore,
        percentageScore
      };

      onSave(updatedResult);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar alterações:', error);
      alert('Erro ao salvar alterações. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-zinc-900 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="bg-zinc-800 p-6 border-b border-zinc-700 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">Perguntas e Respostas</h2>
            <p className="text-gray-400">{result.companyData.empresa}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Save size={20} />
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
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
              <div className="text-white">Carregando perguntas...</div>
            </div>
          ) : (
            <div className="space-y-6">
              {pillarsQA.map((pillar) => (
                <div key={pillar.pillarId} className="bg-zinc-800 rounded-lg">
                  <button
                    onClick={() => setExpandedPillar(expandedPillar === pillar.pillarId ? null : pillar.pillarId)}
                    className="w-full p-4 flex items-center justify-between text-left hover:bg-zinc-700 transition-colors rounded-lg"
                  >
                    <h3 className="text-xl font-semibold text-white">{pillar.pillarName}</h3>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400">{pillar.questions.length} perguntas</span>
                      {expandedPillar === pillar.pillarId ? (
                        <ChevronUp className="text-gray-400" />
                      ) : (
                        <ChevronDown className="text-gray-400" />
                      )}
                    </div>
                  </button>

                  {expandedPillar === pillar.pillarId && (
                    <div className="p-4 border-t border-zinc-700 space-y-6">
                      {pillar.questions.map((question, index) => (
                        <div key={question.questionId} className="bg-zinc-900 rounded-lg p-4">
                          <div className="mb-4">
                            <h4 className="text-lg font-medium text-white mb-2">
                              {index + 1}. {question.questionText}
                            </h4>
                            <div className="text-sm text-gray-400 space-x-4">
                              <span>Pontos: {question.points}</span>
                              <span>Resposta positiva: {question.positiveAnswer}</span>
                              <span>Tipo: {question.answerType === 'BINARY' ? 'Sim/Não' : 'Sim/Não/Parcialmente'}</span>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <p className="text-sm font-medium text-gray-300">Resposta atual:</p>
                            <div className="flex gap-3">
                              <button
                                onClick={() => handleAnswerChange(question.questionId, 'SIM')}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                  editedAnswers[question.questionId] === 'SIM'
                                    ? 'bg-green-600 text-white'
                                    : 'bg-zinc-700 text-gray-300 hover:bg-zinc-600'
                                }`}
                              >
                                Sim
                              </button>
                              
                              {question.answerType === 'TERNARY' && (
                                <button
                                  onClick={() => handleAnswerChange(question.questionId, 'PARCIALMENTE')}
                                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                    editedAnswers[question.questionId] === 'PARCIALMENTE'
                                      ? 'bg-yellow-600 text-white'
                                      : 'bg-zinc-700 text-gray-300 hover:bg-zinc-600'
                                  }`}
                                >
                                  Parcialmente
                                </button>
                              )}
                              
                              <button
                                onClick={() => handleAnswerChange(question.questionId, 'NÃO')}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                  editedAnswers[question.questionId] === 'NÃO'
                                    ? 'bg-red-600 text-white'
                                    : 'bg-zinc-700 text-gray-300 hover:bg-zinc-600'
                                }`}
                              >
                                Não
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Resultados() {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQAModal, setShowQAModal] = useState(false);
  const [selectedResult, setSelectedResult] = useState<DiagnosticResult | null>(null);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const { fetchResults } = useDiagnosticCalculation();

  useEffect(() => {
    const loadResults = async () => {
      try {
        const data = await fetchResults();
        setResults(data);
      } catch (error) {
        console.error('Erro ao carregar resultados:', error);
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, [fetchResults]);

  const handleDelete = async (id: string) => {
    try {
      // Implementar a deleção no Supabase
      setResults(results.filter(result => result.id !== id));
    } catch (error) {
      console.error('Erro ao deletar resultado:', error);
    }
  };

  const handleOpenQAModal = (result: DiagnosticResult) => {
    setSelectedResult(result);
    setShowQAModal(true);
  };

  const handleSaveQAChanges = (updatedResult: DiagnosticResult) => {
    setResults(prev => prev.map(result => 
      result.id === updatedResult.id ? updatedResult : result
    ));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div>
        <div className="bg-zinc-900 rounded-lg p-8 mb-6">
          <h1 className="text-3xl font-bold text-white mb-3">Resultados</h1>
          <p className="text-gray-400">Visualize e analise os resultados detalhados do seu diagnóstico de maturidade digital.</p>
        </div>

        <div className="bg-zinc-900 rounded-lg p-8">
          <div className="text-center py-12">
            <TrendingUp size={48} className="text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">
              Nenhum diagnóstico realizado ainda. Complete um diagnóstico para ver seus resultados aqui.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const latestResult = results[0];
  const { best, worst } = getBestAndWorstPillars(latestResult.pillarScores);
  const maturityLevel = getMaturityLevel(Math.round(latestResult.totalScore));
  const recommendation = getRecommendation(Math.round(latestResult.totalScore));

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div>
      <div className="bg-zinc-900 rounded-lg p-8 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-white mb-3">Resultados</h1>
            <p className="text-gray-400">Visualize e analise os resultados detalhados do seu diagnóstico de maturidade digital.</p>
          </div>
          <div className="flex items-center gap-4 text-gray-400">
            <div className="flex items-center gap-2">
              <FileText size={20} />
              <span>{results.length} diagnóstico{results.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity size={20} />
              <span>Último: {formatDate(latestResult.date)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Dashboard do Último Resultado - SEM botão de Ver Q&A */}
        <div className="bg-zinc-900 rounded-lg p-8">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-2xl font-semibold text-white mb-2 flex items-center gap-3">
                <Eye size={28} className="text-blue-500" />
                Dashboard - Último Diagnóstico
              </h2>
              <div className="flex items-center gap-4 text-gray-400">
                <div className="flex items-center gap-2">
                  <Building2 size={16} />
                  <span>{latestResult.companyData.empresa}</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-2">
                  <Calendar size={16} />
                  <span>{formatDate(latestResult.date)}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <ExportPDF result={latestResult} />
            </div>
          </div>

          {/* Informações da Empresa - Grid Superior */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-zinc-800 rounded-lg p-4 text-center">
              <Users size={24} className="text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{latestResult.companyData.numeroFuncionarios}</p>
              <p className="text-sm text-gray-400">Funcionários</p>
            </div>
            
            <div className="bg-zinc-800 rounded-lg p-4 text-center">
              <DollarSign size={24} className="text-green-500 mx-auto mb-2" />
              <p className="text-lg font-bold text-white">
                {new Intl.NumberFormat('pt-BR', { 
                  style: 'currency', 
                  currency: 'BRL',
                  notation: 'compact',
                  maximumFractionDigits: 1
                }).format(latestResult.companyData.faturamento)}
              </p>
              <p className="text-sm text-gray-400">Faturamento</p>
            </div>
            
            <div className="bg-zinc-800 rounded-lg p-4 text-center">
              <Target size={24} className="text-purple-500 mx-auto mb-2" />
              <p className="text-lg font-bold text-white">{latestResult.companyData.segmento}</p>
              <p className="text-sm text-gray-400">Segmento</p>
            </div>
            
            <div className="bg-zinc-800 rounded-lg p-4 text-center">
              <MapPin size={24} className="text-red-500 mx-auto mb-2" />
              <p className="text-lg font-bold text-white">{latestResult.companyData.localizacao}</p>
              <p className="text-sm text-gray-400">Localização</p>
            </div>
          </div>

          {/* Cards de Resumo Principal */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-6 text-center text-white">
              <div className="flex items-center justify-center mb-3">
                <BarChart3 size={32} />
              </div>
              <p className="text-3xl font-bold mb-2">{Math.round(latestResult.totalScore)}</p>
              <p className="text-blue-100">Pontuação Total</p>
              <p className="text-sm text-blue-200 mt-1">{Math.round(latestResult.percentageScore)}% do máximo</p>
            </div>

            <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-lg p-6 text-center text-white">
              <div className="flex items-center justify-center mb-3">
                <ThumbsUp size={32} />
              </div>
              <p className="text-xl font-bold mb-2">{best.pillarName}</p>
              <p className="text-green-100">Melhor Desempenho</p>
              <p className="text-sm text-green-200 mt-1">{Math.round(best.percentageScore)}% de aproveitamento</p>
            </div>

            <div className={`bg-gradient-to-br ${maturityLevel.level === 'Inicial' ? 'from-red-600 to-red-700' : maturityLevel.level === 'Em Desenvolvimento' ? 'from-yellow-600 to-yellow-700' : 'from-green-600 to-green-700'} rounded-lg p-6 text-center text-white`}>
              <div className="flex items-center justify-center mb-3">
                <Award size={32} />
              </div>
              <p className="text-xl font-bold mb-2">{maturityLevel.level}</p>
              <p className="text-white/90">Nível de Maturidade</p>
              <p className="text-sm text-white/80 mt-1">Baseado na pontuação geral</p>
            </div>

            <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-lg p-6 text-center text-white">
              <div className="flex items-center justify-center mb-3">
                <ThumbsDown size={32} />
              </div>
              <p className="text-xl font-bold mb-2">{worst.pillarName}</p>
              <p className="text-red-100">Precisa de Atenção</p>
              <p className="text-sm text-red-200 mt-1">{Math.round(worst.percentageScore)}% de aproveitamento</p>
            </div>
          </div>

          {/* Gráfico de Pilares Melhorado */}
          <div className="bg-zinc-800 rounded-lg p-6 mb-8">
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <BarChart3 size={24} className="text-blue-500" />
              Desempenho Detalhado por Pilar
            </h3>
            <div className="space-y-6">
              {latestResult.pillarScores
                .sort((a, b) => b.percentageScore - a.percentageScore) // Ordena por percentual para mostrar melhor primeiro
                .map((pillar, index) => (
                <div key={index} className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-lg font-medium text-white">{pillar.pillarName}</h4>
                      <p className="text-sm text-gray-400">
                        {Math.round(pillar.score)} de {pillar.maxPossibleScore} pontos possíveis
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-400">
                        {Math.round(pillar.percentageScore)}%
                      </p>
                      <p className="text-sm text-gray-400">Aproveitamento</p>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="w-full bg-zinc-700 rounded-full h-4">
                      <div
                        className={`h-4 rounded-full transition-all duration-1000 ${
                          pillar.percentageScore >= 80 ? 'bg-gradient-to-r from-green-500 to-green-400' :
                          pillar.percentageScore >= 60 ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' :
                          pillar.percentageScore >= 40 ? 'bg-gradient-to-r from-orange-500 to-orange-400' :
                          'bg-gradient-to-r from-red-500 to-red-400'
                        }`}
                        style={{ width: `${pillar.percentageScore}%` }}
                      />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-medium text-white drop-shadow-lg">
                        {Math.round(pillar.score)} pts
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Análise e Recomendações */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`${maturityLevel.bgColor} rounded-lg p-6`}>
              <h3 className={`text-xl font-semibold ${maturityLevel.color} mb-4 flex items-center gap-2`}>
                <Award size={24} />
                Análise de Maturidade
              </h3>
              <div className="space-y-3">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${maturityLevel.bgColor} border border-current`}>
                  <span className={`text-lg font-bold ${maturityLevel.color}`}>
                    {maturityLevel.level}
                  </span>
                </div>
                <p className="text-gray-300 leading-relaxed">
                  {maturityLevel.description}
                </p>
              </div>
            </div>

            <div className="bg-yellow-500/20 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-yellow-400 mb-4 flex items-center gap-2">
                <Lightbulb size={24} />
                Recomendações Estratégicas
              </h3>
              <p className="text-gray-300 leading-relaxed">
                {recommendation}
              </p>
            </div>
          </div>
        </div>

        {/* Histórico de Resultados - TODOS em dropdown */}
        <div className="bg-zinc-900 rounded-lg p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-white flex items-center gap-3">
              <FileText size={28} className="text-blue-500" />
              Histórico Completo de Diagnósticos
            </h2>
            <button
              onClick={() => setShowAllHistory(!showAllHistory)}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
            >
              {showAllHistory ? (
                <>
                  <ChevronUp size={20} />
                  Ocultar Histórico
                </>
              ) : (
                <>
                  <ChevronDown size={20} />
                  Ver Histórico ({results.length} diagnósticos)
                </>
              )}
            </button>
          </div>

          {showAllHistory && (
            <div className="space-y-4">
              {results.map((result) => (
                <div key={result.id} className="bg-zinc-800 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-grow">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <p className="text-white font-medium">{result.companyData.nome}</p>
                          <span className="text-gray-400">•</span>
                          <p className="text-white">{result.companyData.empresa}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-gray-400 text-sm">CNPJ: {result.companyData.cnpj}</p>
                          <span className="text-gray-400">•</span>
                          <p className="text-gray-400 text-sm">{formatDate(result.date)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-400">Pontuação</p>
                        <p className="text-xl font-bold text-white">{Math.round(result.totalScore)} pontos</p>
                        <p className="text-sm text-gray-400">{Math.round(result.percentageScore)}%</p>
                      </div>
                      <button
                        onClick={() => handleOpenQAModal(result)}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <Edit3 size={20} />
                        Ver Q&A
                      </button>
                      <ExportPDF result={result} />
                      <button
                        onClick={() => handleDelete(result.id)}
                        className="p-2 hover:bg-zinc-700 rounded-lg transition-colors text-red-500 hover:text-red-400"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!showAllHistory && (
            <div className="text-center py-8 text-gray-400">
              Clique no botão acima para ver todos os diagnósticos realizados
            </div>
          )}
        </div>
      </div>

      {/* Modal de Perguntas e Respostas */}
      {selectedResult && (
        <QuestionAnswerModal
          result={selectedResult}
          isOpen={showQAModal}
          onClose={() => {
            setShowQAModal(false);
            setSelectedResult(null);
          }}
          onSave={handleSaveQAChanges}
        />
      )}
    </div>
  );
}

export default Resultados;