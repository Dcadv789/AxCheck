import React, { useState, useEffect } from 'react';
import { Plus, PlusCircle, Pencil, Trash2 } from 'lucide-react';
import LogoUpload from '../components/LogoUpload';
import { supabase } from '../lib/supabase';

interface Question {
  id: string;
  text: string;
  points: number;
  positiveAnswer: 'SIM' | 'NÃO';
  answerType: 'BINARY' | 'TERNARY';
  order: number;
}

interface Pillar {
  id: string;
  name: string;
  order: number;
  questions: Question[];
}

function Backoffice() {
  const [pillars, setPillars] = useState<Pillar[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isNewQuestion, setIsNewQuestion] = useState(false);
  const [editingPillarId, setEditingPillarId] = useState<string | null>(null);
  const [editingPillarName, setEditingPillarName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPillars();
  }, []);

  const fetchPillars = async () => {
    try {
      const { data: pillarsData, error: pillarsError } = await supabase
        .from('pillars')
        .select('*')
        .order('order');

      if (pillarsError) throw pillarsError;

      const pillarsWithQuestions = await Promise.all(
        pillarsData.map(async (pillar) => {
          const { data: questionsData, error: questionsError } = await supabase
            .from('questions')
            .select('*')
            .eq('pillar_id', pillar.id)
            .order('order');

          if (questionsError) throw questionsError;

          return {
            ...pillar,
            questions: questionsData.map(q => ({
              id: q.id,
              text: q.text,
              points: q.points,
              positiveAnswer: q.positive_answer,
              answerType: q.answer_type,
              order: q.order
            }))
          };
        })
      );

      setPillars(pillarsWithQuestions);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao buscar pilares:', error);
      setLoading(false);
    }
  };

  const addPillar = async () => {
    try {
      const newOrder = pillars.length + 1;
      const { data, error } = await supabase
        .from('pillars')
        .insert([
          {
            name: `Pilar ${newOrder}`,
            order: newOrder
          }
        ])
        .select()
        .single();

      if (error) throw error;

      const newPillar: Pillar = {
        id: data.id,
        name: data.name,
        order: data.order,
        questions: []
      };

      setPillars([...pillars, newPillar]);
    } catch (error) {
      console.error('Erro ao adicionar pilar:', error);
    }
  };

  const deletePillar = async (pillarId: string) => {
    try {
      const { error } = await supabase
        .from('pillars')
        .delete()
        .eq('id', pillarId);

      if (error) throw error;

      setPillars(pillars.filter(p => p.id !== pillarId));
    } catch (error) {
      console.error('Erro ao excluir pilar:', error);
    }
  };

  const deleteQuestion = async (questionId: string) => {
    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', questionId);

      if (error) throw error;

      setPillars(pillars.map(pillar => ({
        ...pillar,
        questions: pillar.questions.filter(q => q.id !== questionId)
      })));
    } catch (error) {
      console.error('Erro ao excluir pergunta:', error);
    }
  };

  const startEditingPillar = (pillar: Pillar) => {
    setEditingPillarId(pillar.id);
    setEditingPillarName(pillar.name);
  };

  const savePillarName = async () => {
    if (editingPillarId === null) return;

    try {
      const { error } = await supabase
        .from('pillars')
        .update({ name: editingPillarName })
        .eq('id', editingPillarId);

      if (error) throw error;

      setPillars(pillars.map(pillar =>
        pillar.id === editingPillarId
          ? { ...pillar, name: editingPillarName }
          : pillar
      ));

      setEditingPillarId(null);
      setEditingPillarName('');
    } catch (error) {
      console.error('Erro ao salvar nome do pilar:', error);
    }
  };

  const addQuestion = (pillarId: string) => {
    const pillar = pillars.find(p => p.id === pillarId);
    if (!pillar) return;

    const newOrder = pillar.questions.length + 1;
    const newQuestion: Question = {
      id: '',
      text: `Pergunta ${pillar.order}.${newOrder}`,
      points: 1,
      positiveAnswer: 'SIM',
      answerType: 'BINARY',
      order: newOrder
    };
    setIsNewQuestion(true);
    setEditingQuestion({ ...newQuestion, id: pillarId });
  };

  const editQuestion = (question: Question) => {
    setIsNewQuestion(false);
    setEditingQuestion(question);
  };

  const saveQuestion = async () => {
    if (!editingQuestion) return;

    try {
      const pillarId = isNewQuestion ? editingQuestion.id : editingQuestion.id.split('.')[0];
      const pillar = pillars.find(p => p.id === pillarId);
      if (!pillar) return;

      const questionData = {
        pillar_id: pillarId,
        text: editingQuestion.text,
        points: editingQuestion.points,
        positive_answer: editingQuestion.positiveAnswer,
        answer_type: editingQuestion.answerType,
        order: editingQuestion.order
      };

      if (isNewQuestion) {
        const { data, error } = await supabase
          .from('questions')
          .insert([questionData])
          .select()
          .single();

        if (error) throw error;

        setPillars(pillars.map(p => {
          if (p.id === pillarId) {
            return {
              ...p,
              questions: [...p.questions, {
                id: data.id,
                text: data.text,
                points: data.points,
                positiveAnswer: data.positive_answer,
                answerType: data.answer_type,
                order: data.order
              }]
            };
          }
          return p;
        }));
      } else {
        const { error } = await supabase
          .from('questions')
          .update(questionData)
          .eq('id', editingQuestion.id);

        if (error) throw error;

        setPillars(pillars.map(p => {
          if (p.id === pillarId) {
            return {
              ...p,
              questions: p.questions.map(q =>
                q.id === editingQuestion.id ? editingQuestion : q
              )
            };
          }
          return p;
        }));
      }

      setEditingQuestion(null);
      setIsNewQuestion(false);
    } catch (error) {
      console.error('Erro ao salvar pergunta:', error);
    }
  };

  const getQuestionDisplayId = (pillar: Pillar, question: Question) => {
    return `${pillar.order}.${question.order}`;
  };

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
        <h1 className="text-3xl font-bold text-white mb-3">Backoffice</h1>
        <p className="text-gray-400">Gerencie diagnósticos, usuários e configurações do sistema em um só lugar.</p>
      </div>

      <div className="bg-zinc-900 rounded-lg p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-white">Pilares do Diagnóstico</h2>
          <button
            onClick={addPillar}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus size={20} />
            Adicionar Pilar
          </button>
        </div>

        {editingQuestion && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-zinc-800 rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-medium text-white mb-4">
                {isNewQuestion ? 'Configurar Nova Pergunta' : 'Editar Pergunta'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Texto da Pergunta
                  </label>
                  <input
                    type="text"
                    value={editingQuestion.text}
                    onChange={(e) => setEditingQuestion({
                      ...editingQuestion,
                      text: e.target.value
                    })}
                    className="w-full bg-zinc-700 text-white rounded-lg px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Pontuação da Pergunta
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editingQuestion.points}
                    onChange={(e) => setEditingQuestion({
                      ...editingQuestion,
                      points: parseInt(e.target.value) || 1
                    })}
                    className="w-full bg-zinc-700 text-white rounded-lg px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Resposta Positiva
                  </label>
                  <select
                    value={editingQuestion.positiveAnswer}
                    onChange={(e) => setEditingQuestion({
                      ...editingQuestion,
                      positiveAnswer: e.target.value as 'SIM' | 'NÃO'
                    })}
                    className="w-full bg-zinc-700 text-white rounded-lg px-3 py-2"
                  >
                    <option value="SIM">SIM</option>
                    <option value="NÃO">NÃO</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Tipo de Resposta
                  </label>
                  <select
                    value={editingQuestion.answerType}
                    onChange={(e) => setEditingQuestion({
                      ...editingQuestion,
                      answerType: e.target.value as 'BINARY' | 'TERNARY'
                    })}
                    className="w-full bg-zinc-700 text-white rounded-lg px-3 py-2"
                  >
                    <option value="BINARY">Sim/Não</option>
                    <option value="TERNARY">Sim/Não/Parcialmente</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => {
                      setEditingQuestion(null);
                      setIsNewQuestion(false);
                    }}
                    className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={saveQuestion}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {pillars.map(pillar => (
            <div key={pillar.id} className="bg-zinc-800 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                {editingPillarId === pillar.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editingPillarName}
                      onChange={(e) => setEditingPillarName(e.target.value)}
                      className="bg-zinc-700 text-white rounded-lg px-3 py-2 border border-zinc-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="Nome do pilar"
                      autoFocus
                    />
                    <button
                      onClick={savePillarName}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg transition-colors"
                    >
                      Salvar
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <h3 className="text-xl font-medium text-white">
                      {pillar.order}. {pillar.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEditingPillar(pillar)}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => deletePillar(pillar.id)}
                        className="text-red-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                )}
                <button
                  onClick={() => addQuestion(pillar.id)}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <PlusCircle size={20} />
                  Adicionar Pergunta
                </button>
              </div>

              {pillar.questions.length > 0 ? (
                <div className="space-y-3">
                  {pillar.questions.map(question => (
                    <div
                      key={question.id}
                      className="bg-zinc-700 rounded-lg p-4"
                    >
                      <div className="flex items-start gap-4">
                        <span className="text-gray-300 font-medium w-[60px] flex-shrink-0">
                          {getQuestionDisplayId(pillar, question)}
                        </span>
                        <div className="flex-grow">
                          <div className="flex items-start justify-between gap-4">
                            <span className="text-white">
                              {question.text}
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => editQuestion(question)}
                                className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                onClick={() => deleteQuestion(question.id)}
                                className="text-red-500 hover:text-red-400 transition-colors flex-shrink-0"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-4 mt-3 text-sm text-gray-400">
                            <p>Pontos: {question.points}</p>
                            <p>Resposta positiva: {question.positiveAnswer}</p>
                            <p>Tipo: {question.answerType === 'BINARY' ? 'Sim/Não' : 'Sim/Não/Parcialmente'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm italic">
                  Nenhuma pergunta adicionada neste pilar
                </p>
              )}
            </div>
          ))}

          {pillars.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-400">
                Nenhum pilar adicionado. Clique no botão acima para começar.
              </p>
            </div>
          )}
        </div>
      </div>

      <LogoUpload />
    </div>
  );
}

export default Backoffice;