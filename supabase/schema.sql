-- =====================================================================
-- SCRIPT DE MIGRAÇÃO SQL PARA O SUPABASE
-- Professor Virtual de Física (MUV) - Sistema com Análise Bloom
-- =====================================================================

-- Habilitar a extensão para geração de UUID se necessário
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabela de Perfis de Alunos (vinculada ao Supabase Auth)
CREATE TABLE IF NOT EXISTS public.perfis_alunos (
    id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
    nome_completo TEXT,
    data_cadastro TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS (Row Level Security) para Perfis
ALTER TABLE public.perfis_alunos ENABLE ROW LEVEL SECURITY;

-- 2. Tabela de Sessões de Aula
CREATE TABLE IF NOT EXISTS public.sessoes_aula (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    aluno_id UUID REFERENCES public.perfis_alunos(id) ON DELETE CASCADE NOT NULL,
    data_inicio TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    data_fim TIMESTAMP WITH TIME ZONE,
    progresso INTEGER DEFAULT 0 NOT NULL
);

-- Habilitar RLS para Sessões
ALTER TABLE public.sessoes_aula ENABLE ROW LEVEL SECURITY;

-- 3. Tabela de Respostas do Aluno
CREATE TABLE IF NOT EXISTS public.respostas_alunos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sessao_id UUID REFERENCES public.sessoes_aula(id) ON DELETE CASCADE NOT NULL,
    passo INTEGER NOT NULL,
    pergunta TEXT NOT NULL,
    resposta TEXT NOT NULL,
    nivel_bloom TEXT NOT NULL,
    score INTEGER NOT NULL,
    data_resposta TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS para Respostas
ALTER TABLE public.respostas_alunos ENABLE ROW LEVEL SECURITY;

-- 4. Tabela de Análise Bloom por Sessão
CREATE TABLE IF NOT EXISTS public.analise_bloom (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sessao_id UUID REFERENCES public.sessoes_aula(id) ON DELETE CASCADE NOT NULL,
    score_lembrar INTEGER DEFAULT 0 NOT NULL,
    score_compreender INTEGER DEFAULT 0 NOT NULL,
    score_aplicar INTEGER DEFAULT 0 NOT NULL,
    score_analisar INTEGER DEFAULT 0 NOT NULL,
    score_avaliar INTEGER DEFAULT 0 NOT NULL,
    score_criar INTEGER DEFAULT 0 NOT NULL,
    recomendacoes TEXT,
    data_analise TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS para Análise Bloom
ALTER TABLE public.analise_bloom ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- POLÍTICAS DE SEGURANÇA (ROW LEVEL SECURITY)
-- Isso garante que os alunos só acessem seus próprios dados
-- =====================================================================

-- Políticas para Perfis de Alunos
CREATE POLICY "Alunos podem visualizar seus próprios perfis" ON public.perfis_alunos
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Alunos podem inserir seus próprios perfis" ON public.perfis_alunos
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Alunos podem atualizar seus próprios perfis" ON public.perfis_alunos
    FOR UPDATE USING (auth.uid() = id);

-- Políticas para Sessões de Aula
CREATE POLICY "Alunos podem visualizar suas próprias sessões" ON public.sessoes_aula
    FOR SELECT USING (auth.uid() = aluno_id);

CREATE POLICY "Alunos podem criar suas próprias sessões" ON public.sessoes_aula
    FOR INSERT WITH CHECK (auth.uid() = aluno_id);

CREATE POLICY "Alunos podem atualizar suas próprias sessões" ON public.sessoes_aula
    FOR UPDATE USING (auth.uid() = aluno_id);

-- Políticas para Respostas dos Alunos
CREATE POLICY "Alunos podem visualizar suas respostas" ON public.respostas_alunos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.sessoes_aula
            WHERE sessoes_aula.id = respostas_alunos.sessao_id
            AND sessoes_aula.aluno_id = auth.uid()
        )
    );

CREATE POLICY "Alunos podem inserir suas respostas" ON public.respostas_alunos
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.sessoes_aula
            WHERE sessoes_aula.id = respostas_alunos.sessao_id
            AND sessoes_aula.aluno_id = auth.uid()
        )
    );

-- Políticas para Análise Bloom
CREATE POLICY "Alunos podem visualizar suas análises" ON public.analise_bloom
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.sessoes_aula
            WHERE sessoes_aula.id = analise_bloom.sessao_id
            AND sessoes_aula.aluno_id = auth.uid()
        )
    );

CREATE POLICY "Alunos podem inserir suas análises" ON public.analise_bloom
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.sessoes_aula
            WHERE sessoes_aula.id = analise_bloom.sessao_id
            AND sessoes_aula.aluno_id = auth.uid()
        )
    );

-- =====================================================================
-- TRIGGER PARA ATUALIZAR PERFIS DE FORMA AUTOMÁTICA
-- Quando um usuário se registra na tabela auth.users, cria o perfil correspondente
-- =====================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, nome, turma, role, status)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'nome', 'Usuário'),
        COALESCE(new.raw_user_meta_data->>'turma', 'Geral'),
        COALESCE(new.raw_user_meta_data->>'role', 'aluno'),
        CASE WHEN coalesce(new.raw_user_meta_data->>'role', 'aluno') = 'admin' THEN 'aprovado' ELSE 'pendente' END
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
