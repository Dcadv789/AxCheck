import { useState, useEffect } from 'react';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { DiagnosticResult } from '../types/diagnostic';

export function useResults() {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'results'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        const resultsData = snapshot.docs.map(doc => ({
          ...doc.data() as DiagnosticResult,
          firebaseId: doc.id
        }));
        setResults(resultsData);
        setLoading(false);
      } catch (err) {
        console.error('Erro ao carregar resultados:', err);
        setError('Erro ao carregar resultados');
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const saveResult = async (result: Omit<DiagnosticResult, 'id'>) => {
    try {
      const docRef = await addDoc(collection(db, 'results'), {
        ...result,
        id: crypto.randomUUID(),
        date: new Date().toISOString()
      });
      return docRef.id;
    } catch (err) {
      console.error('Erro ao salvar resultado:', err);
      throw new Error('Erro ao salvar resultado');
    }
  };

  const deleteResult = async (resultId: string) => {
    try {
      await deleteDoc(doc(db, 'results', resultId));
    } catch (err) {
      console.error('Erro ao excluir resultado:', err);
      throw new Error('Erro ao excluir resultado');
    }
  };

  return {
    results,
    loading,
    error,
    saveResult,
    deleteResult
  };
}