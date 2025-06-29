/*
  # Adiciona tabela de resultados de diagnóstico

  1. Nova Tabela
    - `diagnostic_results`
      - `id` (uuid, chave primária)
      - `user_id` (uuid, referência ao usuário)
      - `company_data` (jsonb, dados da empresa)
      - `answers` (jsonb, respostas do diagnóstico)
      - `pillar_scores` (jsonb, pontuações por pilar)
      - `total_score` (numeric, pontuação total)
      - `max_possible_score` (numeric, pontuação máxima possível)
      - `percentage_score` (numeric, percentual atingido)
      - `created_at` (timestamp)

  2. Segurança
    - Habilita RLS na tabela
    - Adiciona políticas para usuários autenticados
*/

-- Criar tabela de resultados
CREATE TABLE IF NOT EXISTS diagnostic_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  company_data jsonb NOT NULL,
  answers jsonb NOT NULL,
  pillar_scores jsonb NOT NULL,
  total_score numeric NOT NULL,
  max_possible_score numeric NOT NULL,
  percentage_score numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE diagnostic_results ENABLE ROW LEVEL SECURITY;

-- Criar políticas de segurança
CREATE POLICY "Usuários podem ver seus próprios resultados"
  ON diagnostic_results
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seus próprios resultados"
  ON diagnostic_results
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Criar índices para melhor performance
CREATE INDEX idx_diagnostic_results_user_id ON diagnostic_results(user_id);
CREATE INDEX idx_diagnostic_results_created_at ON diagnostic_results(created_at DESC);