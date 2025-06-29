import { useState, useEffect } from 'react';
import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Pillar } from '../types/diagnostic';

export function usePillars() {
  const [pillars, setPillars] = useState<Pillar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'pillars'), orderBy('id', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        const pillarsData = snapshot.docs.map(doc => ({
          ...doc.data() as Pillar,
          firebaseId: doc.id
        }));
        setPillars(pillarsData);
        setLoading(false);
      } catch (err) {
        console.error('Erro ao carregar pilares:', err);
        setError('Erro ao carregar pilares');
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const addPillar = async (pillar: Omit<Pillar, 'id'>) => {
    try {
      const lastPillar = pillars[pillars.length - 1];
      const newId = lastPillar ? lastPillar.id + 1 : 1;
      
      await addDoc(collection(db, 'pillars'), {
        ...pillar,
        id: newId,
        questions: []
      });
    } catch (err) {
      console.error('Erro ao adicionar pilar:', err);
      throw new Error('Erro ao adicionar pilar');
    }
  };

  const updatePillar = async (pillarId: string, data: Partial<Pillar>) => {
    try {
      const docRef = doc(db, 'pillars', pillarId);
      await updateDoc(docRef, data);
    } catch (err) {
      console.error('Erro ao atualizar pilar:', err);
      throw new Error('Erro ao atualizar pilar');
    }
  };

  const deletePillar = async (pillarId: string) => {
    try {
      await deleteDoc(doc(db, 'pillars', pillarId));
    } catch (err) {
      console.error('Erro ao excluir pilar:', err);
      throw new Error('Erro ao excluir pilar');
    }
  };

  const addQuestion = async (pillarId: string, question: any) => {
    try {
      const pillar = pillars.find(p => p.firebaseId === pillarId);
      if (!pillar) throw new Error('Pilar não encontrado');

      const docRef = doc(db, 'pillars', pillarId);
      await updateDoc(docRef, {
        questions: [...pillar.questions, question]
      });
    } catch (err) {
      console.error('Erro ao adicionar pergunta:', err);
      throw new Error('Erro ao adicionar pergunta');
    }
  };

  const updateQuestion = async (pillarId: string, questionId: string, questionData: any) => {
    try {
      const pillar = pillars.find(p => p.firebaseId === pillarId);
      if (!pillar) throw new Error('Pilar não encontrado');

      const updatedQuestions = pillar.questions.map(q => 
        q.id === questionId ? { ...q, ...questionData } : q
      );

      const docRef = doc(db, 'pillars', pillarId);
      await updateDoc(docRef, { questions: updatedQuestions });
    } catch (err) {
      console.error('Erro ao atualizar pergunta:', err);
      throw new Error('Erro ao atualizar pergunta');
    }
  };

  const deleteQuestion = async (pillarId: string, questionId: string) => {
    try {
      const pillar = pillars.find(p => p.firebaseId === pillarId);
      if (!pillar) throw new Error('Pilar não encontrado');

      const updatedQuestions = pillar.questions.filter(q => q.id !== questionId);

      const docRef = doc(db, 'pillars', pillarId);
      await updateDoc(docRef, { questions: updatedQuestions });
    } catch (err) {
      console.error('Erro ao excluir pergunta:', err);
      throw new Error('Erro ao excluir pergunta');
    }
  };

  return {
    pillars,
    loading,
    error,
    addPillar,
    updatePillar,
    deletePillar,
    addQuestion,
    updateQuestion,
    deleteQuestion
  };
}