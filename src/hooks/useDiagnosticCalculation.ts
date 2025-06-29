import { useCallback } from 'react';
import { DiagnosticResult, CompanyData, Pillar, PillarScore } from '../types/diagnostic';
import { supabase } from '../lib/supabase';
import { useEgressLogger } from './useEgressLogger';

export function useDiagnosticCalculation() {
  const { logDataFetch } = useEgressLogger();

  const calculateScore = useCallback((answers: Record<string, string>, pillars: Pillar[]): {
    pillarScores: PillarScore[];
    totalScore: number;
    maxPossibleScore: number;
    percentageScore: number;
  } => {
    let totalScore = 0;
    let maxPossibleScore = 0;

    const pillarScores = pillars.map(pillar => {
      let pillarScore = 0;
      let pillarMaxScore = 0;

      pillar.questions.forEach(question => {
        const answer = answers[question.id];
        pillarMaxScore += question.points;

        if (answer === question.positiveAnswer) {
          pillarScore += question.points;
        } else if (answer === 'PARCIALMENTE') {
          pillarScore += question.points / 2;
        }
      });

      totalScore += pillarScore;
      maxPossibleScore += pillarMaxScore;

      return {
        pillarId: pillar.id,
        pillarName: pillar.name,
        score: pillarScore,
        maxPossibleScore: pillarMaxScore,
        percentageScore: pillarMaxScore > 0 ? (pillarScore / pillarMaxScore) * 100 : 0
      };
    });

    return {
      pillarScores,
      totalScore,
      maxPossibleScore,
      percentageScore: maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0
    };
  }, []);

  const saveDiagnosticResult = useCallback(async (
    companyData: CompanyData,
    answers: Record<string, string>,
    pillars: Pillar[]
  ) => {
    const startTime = Date.now();
    
    try {
      const { pillarScores, totalScore, maxPossibleScore, percentageScore } = calculateScore(answers, pillars);

      const result: Omit<DiagnosticResult, 'id'> = {
        date: new Date().toISOString(),
        companyData,
        answers,
        pillarScores,
        totalScore,
        maxPossibleScore,
        percentageScore
      };

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('diagnostic_results')
        .insert([{
          user_id: user.id,
          company_data: companyData,
          answers,
          pillar_scores: pillarScores,
          total_score: totalScore,
          max_possible_score: maxPossibleScore,
          percentage_score: percentageScore
        }])
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar no Supabase:', error);
        throw error;
      }

      const responseTime = Date.now() - startTime;
      
      // Log do egress para inserção
      await logDataFetch('diagnostic_results', data, responseTime);

      console.log('Resultado salvo com sucesso:', data);

      return {
        id: data.id,
        ...result
      };
    } catch (error) {
      console.error('Erro ao salvar resultado:', error);
      throw error;
    }
  }, [calculateScore, logDataFetch]);

  const fetchResults = useCallback(async (): Promise<DiagnosticResult[]> => {
    const startTime = Date.now();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('Usuário não autenticado');
        return [];
      }

      console.log('Buscando resultados para o usuário:', user.id);

      const { data, error } = await supabase
        .from('diagnostic_results')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar resultados:', error);
        throw error;
      }

      const responseTime = Date.now() - startTime;
      
      // Log do egress para busca
      await logDataFetch('diagnostic_results', data || [], responseTime);

      console.log('Resultados encontrados:', data);

      if (!data || data.length === 0) {
        console.log('Nenhum resultado encontrado');
        return [];
      }

      const results = data.map(result => ({
        id: result.id,
        date: result.created_at,
        companyData: result.company_data,
        answers: result.answers,
        pillarScores: result.pillar_scores,
        totalScore: result.total_score,
        maxPossibleScore: result.max_possible_score,
        percentageScore: result.percentage_score
      }));

      console.log('Resultados formatados:', results);
      return results;
    } catch (error) {
      console.error('Erro ao buscar resultados:', error);
      return [];
    }
  }, [logDataFetch]);

  return {
    calculateScore,
    saveDiagnosticResult,
    fetchResults
  };
}