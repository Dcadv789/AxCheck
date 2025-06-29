import React, { useState, useEffect } from 'react';
import { Stethoscope, X, ArrowRight, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useDiagnosticCalculation } from '../hooks/useDiagnosticCalculation';
import { useEgressLogger } from '../hooks/useEgressLogger';
import type { CompanyData, Pillar, Question } from '../types/diagnostic';
import { Particles } from './Particles';

interface DiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SEGMENTOS = [
  'Tecnologia',
  'Varejo',
  'Indústria',
  'Serviços',
  'Saúde',
  'Educação',
  'Outros'
];

const TEMPO_ATIVIDADE = [
  'Menos de 1 ano',
  '1 a 3 anos',
  '3 a 5 anos',
  '5 a 10 anos',
  'Mais de 10 anos'
];

const LOCALIZACOES = [
  'Norte',
  'Nordeste',
  'Centro-Oeste',
  'Sudeste',
  'Sul'
];

const FORMAS_JURIDICAS = [
  'MEI',
  'EIRELI',
  'Sociedade Limitada',
  'Sociedade Anônima',
  'Outros'
];

function DiagnosticModal({ isOpen, onClose }: DiagnosticModalProps) {
  const [step, setStep] = useState<'form' | 'questions'>('form');
  const [currentPillarIndex, setCurrentPillarIndex] = useState(0);
  const [pillars, setPillars] = useState<Pillar[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const { saveDiagnosticResult } = useDiagnosticCalculation();
  const { logDataFetch } = useEgressLogger();
  const [companyData, setCompanyData] = useState<CompanyData>({
    nome: '',
    empresa: '',
    cnpj: '',
    temSocios: '',
    numeroFuncionarios: 0,
    faturamento: 0,
    segmento: '',
    tempoAtividade: '',
    localizacao: '',
    formaJuridica: ''
  });
  const [displayFaturamento, setDisplayFaturamento] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // URL fixa da logo do Cloudinary
  const logoUrl = 'https://res.cloudinary.com/ducd9j4tx/image/upload/v1751168925/Ativo_26_-_Azul_branco_x3quzd.svg';

  useEffect(() => {
    const fetchPillars = async () => {
      const startTime = Date.now();
      
      try {
        const { data, error } = await supabase
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

        const responseTime = Date.now() - startTime;

        if (!error && data) {
          const formattedPillars = data.map(pillar => ({
            id: pillar.id,
            name: pillar.name,
            questions: pillar.questions
              .sort((a: any, b: any) => a.order - b.order)
              .map((q: any) => ({
                id: q.id,
                text: q.text,
                points: q.points,
                positiveAnswer: q.positive_answer,
                answerType: q.answer_type
              }))
          }));
          setPillars(formattedPillars);
          await logDataFetch('pillars', data, responseTime);
          console.log('Pilares carregados:', formattedPillars);
        } else {
          console.error('Erro ao carregar pilares:', error);
        }
      } catch (error) {
        console.error('Erro ao carregar pilares:', error);
      }
    };

    if (isOpen) {
      fetchPillars();
    }
  }, [isOpen, logDataFetch]);

  const totalQuestions = React.useMemo(() => {
    return pillars.reduce((total, pillar) => total + pillar.questions.length, 0);
  }, [pillars]);

  const answeredQuestions = React.useMemo(() => {
    return Object.keys(answers).length;
  }, [answers]);

  const progressPercentage = React.useMemo(() => {
    return totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
  }, [totalQuestions, answeredQuestions]);

  if (!isOpen) return null;

  const handleChange = (field: keyof CompanyData, value: any) => {
    setCompanyData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatCurrency = (value: string) => {
    value = value.replace(/\D/g, '');
    const numericValue = parseInt(value) / 100;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numericValue);
  };

  const handleFaturamentoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    const numericValue = parseInt(value) || 0;
    setCompanyData(prev => ({
      ...prev,
      faturamento: numericValue / 100
    }));
    setDisplayFaturamento(value ? formatCurrency(value) : 'R$ ');
  };

  const handleFaturamentoFocus = () => {
    setDisplayFaturamento('R$ ');
  };

  const handleSubmit = async () => {
    if (step === 'form') {
      setStep('questions');
    } else {
      if (isSubmitting) return;
      
      setIsSubmitting(true);
      try {
        console.log('Salvando diagnóstico...');
        console.log('Dados da empresa:', companyData);
        console.log('Respostas:', answers);
        console.log('Pilares:', pillars);
        
        const result = await saveDiagnosticResult(companyData, answers, pillars);
        console.log('Diagnóstico salvo com sucesso:', result);
        
        // Reset form
        setStep('form');
        setCurrentPillarIndex(0);
        setAnswers({});
        setCompanyData({
          nome: '',
          empresa: '',
          cnpj: '',
          temSocios: '',
          numeroFuncionarios: 0,
          faturamento: 0,
          segmento: '',
          tempoAtividade: '',
          localizacao: '',
          formaJuridica: ''
        });
        setDisplayFaturamento('');
        
        onClose();
        
        // Opcional: mostrar mensagem de sucesso
        alert('Diagnóstico salvo com sucesso!');
      } catch (error) {
        console.error('Erro ao salvar diagnóstico:', error);
        alert('Erro ao salvar diagnóstico. Tente novamente.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers(prev => {
      if (prev[questionId] === answer) {
        const newAnswers = { ...prev };
        delete newAnswers[questionId];
        return newAnswers;
      }
      return {
        ...prev,
        [questionId]: answer
      };
    });
  };

  const currentPillar = pillars[currentPillarIndex];

  const canGoNext = currentPillarIndex < pillars.length - 1;
  const canGoPrevious = currentPillarIndex > 0;

  const goToNextPillar = () => {
    if (canGoNext) {
      setCurrentPillarIndex(prev => prev + 1);
    }
  };

  const goToPreviousPillar = () => {
    if (canGoPrevious) {
      setCurrentPillarIndex(prev => prev - 1);
    }
  };

  const goBackToForm = () => {
    setStep('form');
    setCurrentPillarIndex(0);
  };

  const isFormValid = () => {
    return companyData.nome && 
           companyData.empresa && 
           companyData.cnpj && 
           companyData.temSocios && 
           companyData.segmento && 
           companyData.tempoAtividade && 
           companyData.localizacao && 
           companyData.formaJuridica;
  };

  const allQuestionsAnswered = () => {
    return totalQuestions > 0 && answeredQuestions === totalQuestions;
  };

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center p-4 z-50">
      <Particles
        className="absolute inset-0"
        quantity={50}
        staticity={30}
        ease={50}
        size={0.5}
      />
      <div className="bg-zinc-900 rounded-lg w-full max-w-4xl relative z-10">
        <div className="bg-zinc-800 p-6 border-b border-zinc-700 flex justify-between items-center rounded-t-lg">
          <div className="flex items-start gap-4">
            <Stethoscope size={32} className="text-blue-500 mt-1" />
            <div>
              <h2 className="text-2xl font-bold text-white">Diagnóstico Financeiro Empresarial</h2>
              <p className="text-gray-400">
                {step === 'form' ? 'Preencha os dados da sua empresa para começar' : 'Responda as perguntas a seguir'}
              </p>
              <div className="mt-2 space-y-1">
                <div className="text-sm text-gray-300">
                  <span className="font-medium">Nome:</span> {companyData.nome || '------'}
                </div>
                <div className="text-sm text-gray-300">
                  <span className="font-medium">Empresa:</span> {companyData.empresa || '------'}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
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
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {step === 'questions' && (
          <div className="px-6 pt-4">
            <div className="w-full h-4 bg-zinc-800 rounded-full overflow-hidden relative">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-300 relative"
                style={{ width: `${progressPercentage}%` }}
              >
                {progressPercentage > 0 && (
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-white text-[10px] font-medium">
                    {Math.round(progressPercentage)}%
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="p-6">
          {step === 'form' ? (
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Nome
                  </label>
                  <input
                    type="text"
                    value={companyData.nome}
                    onChange={(e) => handleChange('nome', e.target.value)}
                    className="w-full bg-zinc-800 text-white rounded-lg px-3 py-2 border border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Digite seu nome completo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Nome da Empresa
                  </label>
                  <input
                    type="text"
                    value={companyData.empresa}
                    onChange={(e) => handleChange('empresa', e.target.value)}
                    className="w-full bg-zinc-800 text-white rounded-lg px-3 py-2 border border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Digite o nome da empresa"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    CNPJ
                  </label>
                  <input
                    type="text"
                    value={companyData.cnpj}
                    onChange={(e) => handleChange('cnpj', e.target.value)}
                    className="w-full bg-zinc-800 text-white rounded-lg px-3 py-2 border border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Digite o CNPJ"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Tem sócios?
                  </label>
                  <select
                    value={companyData.temSocios}
                    onChange={(e) => handleChange('temSocios', e.target.value)}
                    className="w-full bg-zinc-800 text-white rounded-lg px-3 py-2 border border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Selecione uma opção</option>
                    <option value="sim">Sim</option>
                    <option value="nao">Não</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Número de Funcionários
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={companyData.numeroFuncionarios || ''}
                    onChange={(e) => handleChange('numeroFuncionarios', parseInt(e.target.value) || 0)}
                    onFocus={(e) => e.target.value = ''}
                    className="w-full bg-zinc-800 text-white rounded-lg px-3 py-2 border border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Ex: 10 funcionários"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Faturamento
                  </label>
                  <input
                    type="text"
                    value={displayFaturamento}
                    onChange={handleFaturamentoChange}
                    onFocus={handleFaturamentoFocus}
                    className="w-full bg-zinc-800 text-white rounded-lg px-3 py-2 border border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Ex: R$ 100.000,00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Segmento
                  </label>
                  <select
                    value={companyData.segmento}
                    onChange={(e) => handleChange('segmento', e.target.value)}
                    className="w-full bg-zinc-800 text-white rounded-lg px-3 py-2 border border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Selecione o segmento</option>
                    {SEGMENTOS.map(segmento => (
                      <option key={segmento} value={segmento}>{segmento}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Tempo de Atividade
                  </label>
                  <select
                    value={companyData.tempoAtividade}
                    onChange={(e) => handleChange('tempoAtividade', e.target.value)}
                    className="w-full bg-zinc-800 text-white rounded-lg px-3 py-2 border border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Selecione o tempo de atividade</option>
                    {TEMPO_ATIVIDADE.map(tempo => (
                      <option key={tempo} value={tempo}>{tempo}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Localização
                  </label>
                  <select
                    value={companyData.localizacao}
                    onChange={(e) => handleChange('localizacao', e.target.value)}
                    className="w-full bg-zinc-800 text-white rounded-lg px-3 py-2 border border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Selecione a localização</option>
                    {LOCALIZACOES.map(local => (
                      <option key={local} value={local}>{local}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Forma Jurídica
                  </label>
                  <select
                    value={companyData.formaJuridica}
                    onChange={(e) => handleChange('formaJuridica', e.target.value)}
                    className="w-full bg-zinc-800 text-white rounded-lg px-3 py-2 border border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Selecione a forma jurídica</option>
                    {FORMAS_JURIDICAS.map(forma => (
                      <option key={forma} value={forma}>{forma}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ) : (
            <div>
              {currentPillar && (
                <div>
                  <div className="bg-zinc-800 rounded-lg p-6 mb-8">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                          <span className="text-2xl font-bold text-white">{currentPillarIndex + 1}</span>
                        </div>
                        <h3 className="text-2xl font-semibold text-white">
                          {currentPillar.name}
                        </h3>
                      </div>
                      <div className="text-gray-400">
                        Pilar {currentPillarIndex + 1} de {pillars.length}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-8">
                    {currentPillar.questions.map((question, index) => (
                      <div key={question.id} className="space-y-4">
                        <p className="text-lg text-white">
                          {currentPillarIndex + 1}.{index + 1}. {question.text}
                        </p>
                        <div className="flex gap-4">
                          <button
                            onClick={() => handleAnswer(question.id, 'SIM')}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                              answers[question.id] === 'SIM'
                                ? 'bg-blue-600 text-white'
                                : 'bg-zinc-800 text-gray-300 hover:bg-zinc-700'
                            }`}
                          >
                            Sim
                          </button>
                          {question.answerType === 'TERNARY' && (
                            <button
                              onClick={() => handleAnswer(question.id, 'PARCIALMENTE')}
                              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                answers[question.id] === 'PARCIALMENTE'
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-zinc-800 text-gray-300 hover:bg-zinc-700'
                              }`}
                            >
                              Parcialmente
                            </button>
                          )}
                          <button
                            onClick={() => handleAnswer(question.id, 'NÃO')}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                              answers[question.id] === 'NÃO'
                                ? 'bg-blue-600 text-white'
                                : 'bg-zinc-800 text-gray-300 hover:bg-zinc-700'
                              }`}
                          >
                            Não
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-8 flex justify-between items-center">
            {step === 'questions' ? (
              <>
                <button
                  onClick={currentPillarIndex === 0 ? goBackToForm : goToPreviousPillar}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-gray-300 hover:text-white"
                >
                  <ArrowLeft size={20} />
                  {currentPillarIndex === 0 ? 'Voltar para dados' : 'Anterior'}
                </button>
                {canGoNext ? (
                  <button
                    onClick={goToNextPillar}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
                  >
                    Próximo
                    <ArrowRight size={20} />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={!allQuestionsAnswered() || isSubmitting}
                    className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Salvando...' : 'Finalizar'}
                  </button>
                )}
              </>
            ) : (
              <div className="flex justify-end gap-3 w-full">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!isFormValid()}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continuar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DiagnosticModal;