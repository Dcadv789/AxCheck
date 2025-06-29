import React from 'react';
import { 
  TrendingUp, 
  Award, 
  BarChart3, 
  Target, 
  Lightbulb, 
  CheckCircle,
  Building2,
  Users,
  DollarSign,
  MapPin,
  Calendar,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import type { DiagnosticResult } from '../types/diagnostic';

interface PresentationSlideProps {
  type: string;
  result: DiagnosticResult;
  slideNumber: number;
  totalSlides: number;
}

function PresentationSlide({ type, result, slideNumber, totalSlides }: PresentationSlideProps) {
  const logoUrl = 'https://res.cloudinary.com/ducd9j4tx/image/upload/v1751168925/Ativo_26_-_Azul_branco_x3quzd.svg';

  const getMaturityLevel = (score: number) => {
    if (score <= 40) return { level: 'Inicial', color: 'text-red-400', bgColor: 'bg-red-500/20' };
    if (score <= 70) return { level: 'Em Desenvolvimento', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' };
    return { level: 'Consolidado', color: 'text-green-400', bgColor: 'bg-green-500/20' };
  };

  const getBestAndWorstPillars = () => {
    console.log('🔍 Calculando melhor e pior desempenho para apresentação...');
    console.log('📊 Pilares recebidos:', result.pillarScores);
    
    // CORRIGIDO: Ordenar por PERCENTUAL DE APROVEITAMENTO (percentageScore)
    const sorted = [...result.pillarScores].sort((a, b) => {
      console.log(`Comparando: ${a.pillarName} (${a.percentageScore}%) vs ${b.pillarName} (${b.percentageScore}%)`);
      return b.percentageScore - a.percentageScore;
    });
    
    console.log('📈 Pilares ordenados por percentual:', sorted.map(p => `${p.pillarName}: ${p.percentageScore}%`));
    
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];
    
    console.log('🏆 Melhor desempenho:', best.pillarName, `(${best.percentageScore}%)`);
    console.log('⚠️ Precisa de atenção:', worst.pillarName, `(${worst.percentageScore}%)`);
    
    return { best, worst };
  };

  const maturity = getMaturityLevel(Math.round(result.totalScore));
  const { best, worst } = getBestAndWorstPillars();

  const renderSlide = () => {
    switch (type) {
      case 'intro':
        return (
          <div className="flex flex-col items-center justify-center h-full text-center px-12 pb-32">
            <img src={logoUrl} alt="Logo" className="w-96 h-auto mb-8" />
            <h1 className="text-6xl font-bold text-white mb-6">
              Diagnóstico Financeiro Empresarial
            </h1>
            <h2 className="text-3xl text-blue-400 mb-8">
              {result.companyData.empresa}
            </h2>
            <div className="text-xl text-gray-300 space-y-2">
              <p>Responsável: {result.companyData.nome}</p>
              <p>Data: {new Date(result.date).toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
        );

      case 'company-info':
        return (
          <div className="p-12 pb-32">
            <div className="flex items-center gap-4 mb-12">
              <Building2 size={48} className="text-blue-500" />
              <h1 className="text-5xl font-bold text-white">Informações da Empresa</h1>
            </div>
            
            <div className="grid grid-cols-2 gap-12">
              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <Building2 size={32} className="text-blue-400" />
                  <div>
                    <p className="text-gray-400 text-lg">Empresa</p>
                    <p className="text-white text-2xl font-semibold">{result.companyData.empresa}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <Users size={32} className="text-green-400" />
                  <div>
                    <p className="text-gray-400 text-lg">Funcionários</p>
                    <p className="text-white text-2xl font-semibold">{result.companyData.numeroFuncionarios}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <DollarSign size={32} className="text-yellow-400" />
                  <div>
                    <p className="text-gray-400 text-lg">Faturamento</p>
                    <p className="text-white text-2xl font-semibold">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(result.companyData.faturamento)}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <Target size={32} className="text-purple-400" />
                  <div>
                    <p className="text-gray-400 text-lg">Segmento</p>
                    <p className="text-white text-2xl font-semibold">{result.companyData.segmento}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <MapPin size={32} className="text-red-400" />
                  <div>
                    <p className="text-gray-400 text-lg">Localização</p>
                    <p className="text-white text-2xl font-semibold">{result.companyData.localizacao}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <Calendar size={32} className="text-orange-400" />
                  <div>
                    <p className="text-gray-400 text-lg">Tempo de Atividade</p>
                    <p className="text-white text-2xl font-semibold">{result.companyData.tempoAtividade}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'score-overview':
        return (
          <div className="p-12 pb-32">
            <div className="flex items-center gap-4 mb-12">
              <TrendingUp size={48} className="text-blue-500" />
              <h1 className="text-5xl font-bold text-white">Pontuação Geral</h1>
            </div>
            
            <div className="grid grid-cols-3 gap-12 mb-16">
              <div className="text-center bg-zinc-800 rounded-2xl p-8">
                <p className="text-6xl font-bold text-blue-400 mb-4">{Math.round(result.totalScore)}</p>
                <p className="text-xl text-gray-300">Pontuação Total</p>
              </div>
              
              <div className="text-center bg-zinc-800 rounded-2xl p-8">
                <p className="text-6xl font-bold text-gray-400 mb-4">{Math.round(result.maxPossibleScore)}</p>
                <p className="text-xl text-gray-300">Pontuação Máxima</p>
              </div>
              
              <div className="text-center bg-zinc-800 rounded-2xl p-8">
                <p className="text-6xl font-bold text-green-400 mb-4">{Math.round(result.percentageScore)}%</p>
                <p className="text-xl text-gray-300">Aproveitamento</p>
              </div>
            </div>
            
            <div className="text-center">
              <div className={`inline-flex items-center gap-3 px-8 py-4 rounded-2xl ${maturity.bgColor}`}>
                <Award size={32} className={maturity.color} />
                <span className={`text-3xl font-bold ${maturity.color}`}>
                  Nível: {maturity.level}
                </span>
              </div>
            </div>
          </div>
        );

      case 'pillars-performance':
        return (
          <div className="p-12 pb-32">
            <div className="flex items-center gap-4 mb-12">
              <BarChart3 size={48} className="text-blue-500" />
              <h1 className="text-5xl font-bold text-white">Desempenho por Pilar</h1>
            </div>
            
            <div className="grid grid-cols-2 gap-8">
              {/* Ordenar pilares por percentual para mostrar melhor primeiro */}
              {[...result.pillarScores]
                .sort((a, b) => b.percentageScore - a.percentageScore)
                .map((pillar, index) => (
                <div key={pillar.pillarId} className="bg-zinc-800 rounded-xl p-6">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-semibold text-white">{pillar.pillarName}</h3>
                      {index === 0 && (
                        <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-xs font-medium">
                          Melhor
                        </span>
                      )}
                      {index === result.pillarScores.length - 1 && (
                        <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded-full text-xs font-medium">
                          Atenção
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-blue-400">
                        {Math.round(pillar.percentageScore)}%
                      </p>
                      <p className="text-sm text-gray-400">{Math.round(pillar.score)}/{pillar.maxPossibleScore} pts</p>
                    </div>
                  </div>
                  <div className="w-full bg-zinc-700 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-1000 ${
                        pillar.percentageScore >= 80 ? 'bg-gradient-to-r from-green-500 to-green-400' :
                        pillar.percentageScore >= 60 ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' :
                        pillar.percentageScore >= 40 ? 'bg-gradient-to-r from-orange-500 to-orange-400' :
                        'bg-gradient-to-r from-red-500 to-red-400'
                      }`}
                      style={{ width: `${pillar.percentageScore}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'maturity-level':
        return (
          <div className="p-12 pb-32">
            <div className="flex items-center gap-4 mb-12">
              <Award size={48} className="text-blue-500" />
              <h1 className="text-5xl font-bold text-white">Análise de Maturidade</h1>
            </div>
            
            <div className="grid grid-cols-2 gap-12 mb-12">
              <div className="bg-green-500/20 rounded-2xl p-8">
                <div className="flex items-center gap-4 mb-6">
                  <ThumbsUp size={40} className="text-green-400" />
                  <h3 className="text-3xl font-bold text-white">Melhor Desempenho</h3>
                </div>
                <p className="text-2xl font-semibold text-green-400 mb-2">{best.pillarName}</p>
                <p className="text-xl text-gray-300">
                  {Math.round(best.score)} pontos ({Math.round(best.percentageScore)}% de aproveitamento)
                </p>
              </div>
              
              <div className="bg-red-500/20 rounded-2xl p-8">
                <div className="flex items-center gap-4 mb-6">
                  <ThumbsDown size={40} className="text-red-400" />
                  <h3 className="text-3xl font-bold text-white">Precisa de Atenção</h3>
                </div>
                <p className="text-2xl font-semibold text-red-400 mb-2">{worst.pillarName}</p>
                <p className="text-xl text-gray-300">
                  {Math.round(worst.score)} pontos ({Math.round(worst.percentageScore)}% de aproveitamento)
                </p>
              </div>
            </div>
            
            <div className={`${maturity.bgColor} rounded-2xl p-8 text-center`}>
              <div className="flex items-center justify-center gap-4 mb-4">
                <Award size={48} className={maturity.color} />
                <h3 className={`text-4xl font-bold ${maturity.color}`}>
                  Nível de Maturidade: {maturity.level}
                </h3>
              </div>
              <p className="text-xl text-gray-300 leading-relaxed">
                {maturity.level === 'Inicial' 
                  ? 'O negócio está começando ou ainda não possui processos bem definidos. Planejamento e estruturação são prioridades.'
                  : maturity.level === 'Em Desenvolvimento'
                  ? 'O negócio já possui alguns processos organizados, mas ainda enfrenta desafios para alcançar estabilidade e crescimento consistente.'
                  : 'O negócio tem processos bem estabelecidos, boa gestão e está em um estágio de expansão ou consolidação no mercado.'
                }
              </p>
            </div>
          </div>
        );

      case 'recommendations':
        return (
          <div className="p-12 pb-32">
            <div className="flex items-center gap-4 mb-12">
              <Lightbulb size={48} className="text-yellow-500" />
              <h1 className="text-5xl font-bold text-white">Recomendações</h1>
            </div>
            
            <div className="bg-yellow-500/20 rounded-2xl p-8 mb-12">
              <p className="text-2xl text-gray-200 leading-relaxed">
                {Math.round(result.totalScore) <= 40
                  ? "Priorize a criação de um planejamento estratégico básico, organize as finanças e defina processos essenciais para o funcionamento do negócio. Considere buscar orientação de um consultor para acelerar essa estruturação."
                  : Math.round(result.totalScore) <= 70
                  ? "Foco em otimizar os processos existentes, investir em capacitação da equipe e melhorar a gestão financeira. Avalie ferramentas que possam automatizar operações e aumentar a eficiência."
                  : "Concentre-se na inovação, expansão de mercado e diversificação de produtos/serviços. Invista em estratégias de marketing e mantenha um controle financeiro rigoroso para sustentar o crescimento."
                }
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-8">
              <div className="bg-zinc-800 rounded-xl p-6">
                <h3 className="text-2xl font-bold text-white mb-4">Próximos Passos</h3>
                <ul className="space-y-3 text-lg text-gray-300">
                  <li className="flex items-center gap-3">
                    <CheckCircle size={20} className="text-green-400" />
                    Focar no pilar "{worst.pillarName}" ({Math.round(worst.percentageScore)}%)
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle size={20} className="text-green-400" />
                    Manter excelência em "{best.pillarName}" ({Math.round(best.percentageScore)}%)
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle size={20} className="text-green-400" />
                    Acompanhar progresso mensalmente
                  </li>
                </ul>
              </div>
              
              <div className="bg-zinc-800 rounded-xl p-6">
                <h3 className="text-2xl font-bold text-white mb-4">Suporte Disponível</h3>
                <ul className="space-y-3 text-lg text-gray-300">
                  <li className="flex items-center gap-3">
                    <CheckCircle size={20} className="text-blue-400" />
                    Consultoria especializada
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle size={20} className="text-blue-400" />
                    Acompanhamento contínuo
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle size={20} className="text-blue-400" />
                    Relatórios de progresso
                  </li>
                </ul>
              </div>
            </div>
          </div>
        );

      case 'conclusion':
        return (
          <div className="flex flex-col items-center justify-center h-full text-center px-12 pb-32">
            <img src={logoUrl} alt="Logo" className="w-80 h-auto mb-8" />
            <h1 className="text-5xl font-bold text-white mb-8">
              Obrigado pela Atenção!
            </h1>
            <div className="bg-zinc-800 rounded-2xl p-8 mb-8">
              <h2 className="text-3xl font-semibold text-blue-400 mb-4">
                {result.companyData.empresa}
              </h2>
              <p className="text-xl text-gray-300 mb-4">
                Pontuação Final: <span className="text-blue-400 font-bold">{Math.round(result.totalScore)} pontos</span>
              </p>
              <p className="text-lg text-gray-400">
                Nível de Maturidade: <span className={`font-semibold ${maturity.color}`}>{maturity.level}</span>
              </p>
            </div>
            <div className="text-xl text-gray-300 space-y-2">
              <p>Estamos prontos para apoiar sua jornada de crescimento</p>
              <p className="text-blue-400 font-semibold">Axory Capital Group</p>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex items-center justify-center h-full">
            <p className="text-white text-2xl">Slide não encontrado</p>
          </div>
        );
    }
  };

  return (
    <div className="h-full bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 relative flex flex-col">
      {/* Conteúdo principal */}
      <div className="flex-1">
        {renderSlide()}
      </div>
      
      {/* Instruções de navegação - posicionadas mais alto e alinhadas à esquerda */}
      <div className="absolute bottom-16 left-6">
        <p className="text-xs text-gray-500">
          Use ← → ou Espaço para navegar • ESC para sair
        </p>
      </div>
      
      {/* Rodapé fixo - centralizado */}
      <div className="absolute bottom-0 left-0 right-0 bg-zinc-900/80 backdrop-blur-sm border-t border-zinc-700 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex-1"></div>
          <div className="text-gray-400 text-sm text-center">
            © {new Date().getFullYear()} Axory Capital Group. Todos os direitos reservados.
          </div>
          <div className="flex-1 flex justify-end">
            <div className="text-gray-500 text-sm">
              {slideNumber} / {totalSlides}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PresentationSlide;