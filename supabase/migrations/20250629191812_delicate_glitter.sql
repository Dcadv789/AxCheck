/*
  # Tabela de Logs de Egress

  1. Nova Tabela
    - `egress_logs`
      - `id` (uuid, chave primária)
      - `user_id` (uuid, referência ao usuário)
      - `operation_type` (text, tipo da operação)
      - `table_name` (text, tabela acessada)
      - `data_size_bytes` (bigint, tamanho em bytes)
      - `endpoint` (text, endpoint acessado)
      - `method` (text, método HTTP)
      - `ip_address` (text, IP do usuário)
      - `user_agent` (text, navegador/dispositivo)
      - `response_time_ms` (integer, tempo de resposta)
      - `status_code` (integer, código de status HTTP)
      - `error_message` (text, mensagem de erro se houver)
      - `metadata` (jsonb, dados adicionais)
      - `created_at` (timestamp)

  2. Segurança
    - Habilita RLS na tabela
    - Adiciona políticas para usuários autenticados
    - Índices para consultas otimizadas

  3. Funções
    - Função para calcular tamanho estimado de dados
    - Trigger para log automático (opcional)
*/

-- Criar tabela de logs de egress
CREATE TABLE egress_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  operation_type text NOT NULL, -- 'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'STORAGE_DOWNLOAD', 'PDF_EXPORT'
  table_name text, -- Nome da tabela acessada
  data_size_bytes bigint NOT NULL DEFAULT 0, -- Tamanho dos dados em bytes
  endpoint text, -- Endpoint/URL acessado
  method text DEFAULT 'GET', -- Método HTTP
  ip_address text, -- IP do usuário
  user_agent text, -- User agent do navegador
  response_time_ms integer, -- Tempo de resposta em milissegundos
  status_code integer DEFAULT 200, -- Código de status HTTP
  error_message text, -- Mensagem de erro se houver
  metadata jsonb, -- Dados adicionais (query params, filtros, etc.)
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE egress_logs ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Usuários podem ver seus próprios logs"
  ON egress_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seus próprios logs"
  ON egress_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Políticas para administradores (opcional)
CREATE POLICY "Admins podem ver todos os logs"
  ON egress_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'admin@dcadvisors.com'
    )
  );

-- Índices para performance
CREATE INDEX idx_egress_logs_user_id ON egress_logs(user_id);
CREATE INDEX idx_egress_logs_created_at ON egress_logs(created_at DESC);
CREATE INDEX idx_egress_logs_operation_type ON egress_logs(operation_type);
CREATE INDEX idx_egress_logs_table_name ON egress_logs(table_name);
CREATE INDEX idx_egress_logs_data_size ON egress_logs(data_size_bytes DESC);

-- Função para calcular tamanho estimado de dados JSON
CREATE OR REPLACE FUNCTION calculate_json_size(data jsonb)
RETURNS bigint AS $$
BEGIN
  -- Estima o tamanho do JSON em bytes
  RETURN length(data::text)::bigint;
END;
$$ LANGUAGE plpgsql;

-- Função para log automático de operações
CREATE OR REPLACE FUNCTION log_egress_operation(
  p_operation_type text,
  p_table_name text DEFAULT NULL,
  p_data_size_bytes bigint DEFAULT 0,
  p_endpoint text DEFAULT NULL,
  p_method text DEFAULT 'GET',
  p_metadata jsonb DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  log_id uuid;
BEGIN
  INSERT INTO egress_logs (
    user_id,
    operation_type,
    table_name,
    data_size_bytes,
    endpoint,
    method,
    metadata
  ) VALUES (
    auth.uid(),
    p_operation_type,
    p_table_name,
    p_data_size_bytes,
    p_endpoint,
    p_method,
    p_metadata
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View para relatórios de egress
CREATE VIEW egress_summary AS
SELECT 
  user_id,
  operation_type,
  table_name,
  COUNT(*) as operation_count,
  SUM(data_size_bytes) as total_bytes,
  AVG(data_size_bytes) as avg_bytes,
  AVG(response_time_ms) as avg_response_time,
  DATE_TRUNC('day', created_at) as date
FROM egress_logs
GROUP BY user_id, operation_type, table_name, DATE_TRUNC('day', created_at)
ORDER BY total_bytes DESC;

-- Política para a view
ALTER VIEW egress_summary OWNER TO postgres;
CREATE POLICY "Usuários podem ver seu próprio resumo"
  ON egress_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);