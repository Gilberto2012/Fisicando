-- =====================================================================
-- SCRIPT DE MIGRAÇÃO SQL PARA O SUPABASE
-- Professor Virtual de Física (MUV) - Sistema com Análise Bloom
-- =====================================================================

-- Habilitar a extensão para geração de UUID se necessário
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabela de Perfis de Usuários (vinculada ao Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
    nome TEXT,
    email TEXT,
    role TEXT DEFAULT 'aluno',
    turma TEXT DEFAULT 'Geral',
    status TEXT DEFAULT 'pendente',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS (Row Level Security) para Perfis
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Tabela de Sessões de Aula
CREATE TABLE IF NOT EXISTS public.sessoes_aula (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    aluno_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
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

-- 5. Tabela de Aulas (Criadas pelo Professor)
CREATE TABLE IF NOT EXISTS public.aulas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    professor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    topic TEXT NOT NULL,
    series TEXT,
    code TEXT UNIQUE NOT NULL,
    questions JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.aulas ENABLE ROW LEVEL SECURITY;

-- 6. Tabela de Aulas Atribuídas (Ligação entre Aula e Turma/Aluno)
CREATE TABLE IF NOT EXISTS public.aulas_atribuidas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    aula_id UUID REFERENCES public.aulas(id) ON DELETE CASCADE NOT NULL,
    turma TEXT,
    aluno_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    atribuido_por UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CHECK (turma IS NOT NULL OR aluno_id IS NOT NULL)
);

ALTER TABLE public.aulas_atribuidas ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- FUNÇÃO DE SEGURANÇA (SECURITY DEFINER)
-- Evita a recursão infinita ao checar RLS na tabela profiles
-- =====================================================================
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  retval text;
BEGIN
  SELECT role INTO retval FROM public.profiles WHERE id = user_id;
  RETURN retval;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_status(user_id uuid)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  retval text;
BEGIN
  SELECT status INTO retval FROM public.profiles WHERE id = user_id;
  RETURN retval;
END;
$$;

-- =====================================================================
-- POLÍTICAS DE SEGURANÇA (ROW LEVEL SECURITY)
-- =====================================================================

-- Políticas para Perfis
CREATE POLICY "Docentes aprovados visualizam todos os perfis" ON public.profiles
    FOR SELECT USING (
        (public.get_user_role(auth.uid()) IN ('professor', 'admin') AND public.get_user_status(auth.uid()) = 'aprovado')
        OR auth.uid() = id
    );

CREATE POLICY "Docentes aprovados atualizam status de usuários" ON public.profiles
    FOR UPDATE USING (
        (public.get_user_role(auth.uid()) IN ('professor', 'admin') AND public.get_user_status(auth.uid()) = 'aprovado')
        OR auth.uid() = id
    );

CREATE POLICY "Usuários leem próprio perfil" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Usuários inserem próprio perfil" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Políticas para Sessões de Aula
CREATE POLICY "Alunos podem visualizar suas próprias sessões" ON public.sessoes_aula
    FOR SELECT USING (auth.uid() = aluno_id);

CREATE POLICY "Alunos podem criar suas próprias sessões" ON public.sessoes_aula
    FOR INSERT WITH CHECK (auth.uid() = aluno_id);

CREATE POLICY "Alunos atualizam resumos das sessões" ON public.sessoes_aula
    FOR UPDATE USING (auth.uid() = aluno_id);

-- Políticas para Aulas
CREATE POLICY "Docentes gerenciam aulas" ON public.aulas
    FOR ALL USING (public.get_user_role(auth.uid()) IN ('professor', 'admin'));

CREATE POLICY "Alunos visualizam aulas" ON public.aulas
    FOR SELECT USING (true);

-- Políticas para Atribuições de Aulas
CREATE POLICY "Docentes gerenciam atribuicoes" ON public.aulas_atribuidas
    FOR ALL USING (public.get_user_role(auth.uid()) IN ('professor', 'admin'));

CREATE POLICY "Alunos visualizam atribuicoes" ON public.aulas_atribuidas
    FOR SELECT USING (
        aluno_id = auth.uid() OR 
        turma IN (SELECT p.turma FROM public.profiles p WHERE p.id = auth.uid())
    );

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
-- =====================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, nome, email, turma, role, status)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'nome', 'Usuário'),
        new.email,
        COALESCE(new.raw_user_meta_data->>'turma', 'Geral'),
        COALESCE(new.raw_user_meta_data->>'role', 'aluno'),
        CASE WHEN coalesce(new.raw_user_meta_data->>'role', 'aluno') = 'admin' THEN 'aprovado' ELSE 'pendente' END
    )
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
