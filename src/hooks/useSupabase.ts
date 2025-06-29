import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Pillar, Question, DiagnosticResult } from '../types/diagnostic';

export function useSupabase() {
  const fetchPillars = useCallback(async () => {
    const { data: pillars, error } = await supabase
      .from('pillars')
      .select(`
        id,
        name,
        order,
        questions (
          id,
          text,
          points,
          positive_answer,
          answer_type,
          order
        )
      `)
      .order('order');

    if (error) throw error;

    return pillars.map(pillar => ({
      id: pillar.id,
      name: pillar.name,
      questions: pillar.questions.map(q => ({
        id: q.id,
        text: q.text,
        points: q.points,
        positiveAnswer: q.positive_answer,
        answerType: q.answer_type,
      }))
    }));
  }, []);

  const savePillar = useCallback(async (pillar: Omit<Pillar, 'id'>) => {
    const { data, error } = await supabase
      .from('pillars')
      .insert([{
        name: pillar.name,
        order: pillar.order
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }, []);

  const updatePillar = useCallback(async (id: string, pillar: Partial<Pillar>) => {
    const { error } = await supabase
      .from('pillars')
      .update({
        name: pillar.name,
        order: pillar.order
      })
      .eq('id', id);

    if (error) throw error;
  }, []);

  const saveQuestion = useCallback(async (pillarId: string, question: Omit<Question, 'id'>) => {
    const { data, error } = await supabase
      .from('questions')
      .insert([{
        pillar_id: pillarId,
        text: question.text,
        points: question.points,
        positive_answer: question.positiveAnswer,
        answer_type: question.answerType,
        order: question.order
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }, []);

  const updateQuestion = useCallback(async (id: string, question: Partial<Question>) => {
    const { error } = await supabase
      .from('questions')
      .update({
        text: question.text,
        points: question.points,
        positive_answer: question.positiveAnswer,
        answer_type: question.answerType,
        order: question.order
      })
      .eq('id', id);

    if (error) throw error;
  }, []);

  const saveDiagnosticResult = useCallback(async (result: Omit<DiagnosticResult, 'id'>) => {
    const { data, error } = await supabase
      .from('diagnostic_results')
      .insert([{
        user_id: (await supabase.auth.getUser()).data.user?.id,
        company_data: result.companyData,
        answers: result.answers,
        pillar_scores: result.pillarScores,
        total_score: result.totalScore,
        max_possible_score: result.maxPossibleScore,
        percentage_score: result.percentageScore
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }, []);

  const fetchDiagnosticResults = useCallback(async () => {
    const { data: results, error } = await supabase
      .from('diagnostic_results')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return results;
  }, []);

  return {
    fetchPillars,
    savePillar,
    updatePillar,
    saveQuestion,
    updateQuestion,
    saveDiagnosticResult,
    fetchDiagnosticResults
  };
}