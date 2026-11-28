-- ============================================================================
-- SOCIAL MEDIA 5.0 - ESTRUTURA COMPLETA + SEGURANÇA RLS + PRIVACIDADE DE DADOS
-- Cole este script inteiro no SQL Editor do Supabase e clique em "Run".
-- ============================================================================

-- 1. TABELA DE PERFIS E FUNÇÕES DE ACESSO (AUTH)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'social_media' CHECK (role IN ('DEVWEBAPP', 'social_media', 'client')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABELA DE CLIENTES
CREATE TABLE IF NOT EXISTS public.clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  company_name TEXT,
  cnpj TEXT,
  address TEXT,
  contact_name TEXT,
  whatsapp_number TEXT,
  email TEXT,
  price_per_post NUMERIC(10,2) DEFAULT 150,
  metrics_access TEXT DEFAULT 'ambos',
  drive_folder_url TEXT,
  logo_url TEXT,
  assigned_social_media_id TEXT,
  assigned_social_media_ids JSONB DEFAULT '[]'::jsonb,
  created_by_social_media_id TEXT,
  status TEXT DEFAULT 'ativo',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS assigned_social_media_ids JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS created_by_social_media_id TEXT;

-- 3. TABELA DE POSTS (RASCUNHOS E CONTEÚDOS)
CREATE TABLE IF NOT EXISTS public.posts (
  id TEXT PRIMARY KEY,
  client_project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  caption TEXT,
  media_url TEXT,
  media_type TEXT DEFAULT 'image',
  social_networks JSONB DEFAULT '[]'::jsonb,
  scheduled_date TEXT,
  status TEXT DEFAULT 'rascunho',
  approval_token TEXT,
  token_expires_at TIMESTAMPTZ,
  comments JSONB DEFAULT '[]'::jsonb,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  social_media_author_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABELA DE AUDITORIA DE COMENTÁRIOS DOS POSTS
CREATE TABLE IF NOT EXISTS public.post_comments_audit (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  post_title TEXT,
  client_id TEXT,
  author_role TEXT NOT NULL,
  author_name TEXT NOT NULL,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABELA DE SOCIAL MEDIAS E TAXAS PERSONALIZADAS
CREATE TABLE IF NOT EXISTS public.social_medias (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  whatsapp TEXT,
  social_profile TEXT,
  pix_key TEXT,
  custom_fee_per_post NUMERIC(10,2),
  assigned_client_ids JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'ativo',
  signature_url TEXT,
  bank_info TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.social_medias ADD COLUMN IF NOT EXISTS assigned_client_ids JSONB DEFAULT '[]'::jsonb;

-- 6. TABELA DE REGISTROS OFICIAIS DE APROVAÇÃO (AUDITORIA DE FATURAMENTO)
CREATE TABLE IF NOT EXISTS public.approval_records (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  post_title TEXT NOT NULL,
  client_project_id TEXT NOT NULL,
  client_name TEXT,
  social_media_id TEXT,
  social_media_name TEXT,
  approved_at TIMESTAMPTZ NOT NULL,
  approved_by_role TEXT NOT NULL,
  approved_by_name TEXT NOT NULL,
  approved_by_phone TEXT,
  approved_by_email TEXT,
  price_per_post_snapshot NUMERIC(10,2) DEFAULT 150,
  fee_per_post_snapshot NUMERIC(10,2) DEFAULT 0.50,
  billing_status TEXT DEFAULT 'computado',
  post_deleted_at TIMESTAMPTZ
);

-- 7. TABELA DE TAREFAS SOLICITADAS PELO CLIENTE
CREATE TABLE IF NOT EXISTS public.client_tasks (
  id TEXT PRIMARY KEY,
  client_project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  deadline TEXT,
  status TEXT DEFAULT 'novo',
  linked_post_id TEXT,
  created_by_role TEXT DEFAULT 'cliente',
  created_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TABELA DE INSPIRAÇÕES E RECIBOS
CREATE TABLE IF NOT EXISTS public.inspirations (
  id TEXT PRIMARY KEY,
  client_project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  type TEXT DEFAULT 'image',
  uploaded_by_role TEXT DEFAULT 'cliente',
  uploaded_by_name TEXT,
  is_used BOOLEAN DEFAULT false,
  used_at TIMESTAMPTZ,
  retention_option TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.receipts (
  id TEXT PRIMARY KEY,
  receipt_number TEXT,
  client_project_id TEXT NOT NULL,
  period TEXT,
  issue_date TEXT,
  due_date TEXT,
  items JSONB DEFAULT '[]'::jsonb,
  subtotal NUMERIC(10,2) DEFAULT 0,
  discount NUMERIC(10,2) DEFAULT 0,
  total_amount NUMERIC(10,2) DEFAULT 0,
  platform_fee_total NUMERIC(10,2) DEFAULT 0,
  payment_method TEXT,
  notes TEXT,
  status TEXT DEFAULT 'rascunho',
  city_state TEXT,
  service_summary_text TEXT,
  custom_receipt_text TEXT,
  social_media_name TEXT,
  social_media_pix TEXT,
  social_media_bank TEXT,
  social_media_cpf_cnpj TEXT,
  social_media_signature_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 9. FUNÇÕES AUXILIARES DE SEGURANÇA E TRIGGER DE PERFIL
-- ============================================================================

CREATE OR REPLACE FUNCTION public.current_user_email()
RETURNS TEXT
LANGUAGE SQL
STABLE
AS $$
  SELECT lower(coalesce(auth.jwt() ->> 'email', ''));
$$;

CREATE OR REPLACE FUNCTION public.current_app_role()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_gestor()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(public.current_app_role() = 'DEVWEBAPP', false);
$$;

CREATE OR REPLACE FUNCTION public.is_my_social_media(sm_id TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(trim(sm_id), '') <> '' AND (
    sm_id = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM public.social_medias sm
      WHERE sm.id = sm_id
        AND (
          lower(coalesce(sm.email, '')) = public.current_user_email()
          OR sm.id = auth.uid()::text
        )
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.is_client_linked_to_my_sm(c_id TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.id = c_id
      AND (
        public.is_my_social_media(c.assigned_social_media_id)
        OR public.is_my_social_media(c.created_by_social_media_id)
        OR EXISTS (
          SELECT 1
          FROM jsonb_array_elements_text(coalesce(c.assigned_social_media_ids, '[]'::jsonb)) AS linked_sm_id
          WHERE public.is_my_social_media(linked_sm_id)
        )
        OR EXISTS (
          SELECT 1
          FROM public.social_medias sm
          WHERE (lower(coalesce(sm.email, '')) = public.current_user_email() OR sm.id = auth.uid()::text)
            AND coalesce(sm.assigned_client_ids, '[]'::jsonb) ? c.id
        )
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.is_my_client(c_id TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_gestor()
    OR public.is_client_linked_to_my_sm(c_id)
    OR EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = c_id
        AND lower(coalesce(c.email, '')) = public.current_user_email()
    );
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  assigned_role TEXT;
  matched_name TEXT;
BEGIN
  -- Todo novo acesso pela tela de login entra com perfil de Social Media (isolado por carteira).
  -- Apenas e-mails previamente cadastrados exclusivamente na tabela de clientes recebem perfil 'client'.
  -- Promoção para Gestor (DEVWEBAPP) é feita manualmente via SQL no final deste script.
  IF EXISTS (SELECT 1 FROM public.social_medias WHERE lower(coalesce(email, '')) = lower(coalesce(new.email, ''))) THEN
    assigned_role := 'social_media';
    SELECT name INTO matched_name FROM public.social_medias WHERE lower(coalesce(email, '')) = lower(coalesce(new.email, '')) LIMIT 1;
  ELSIF EXISTS (SELECT 1 FROM public.clients WHERE lower(coalesce(email, '')) = lower(coalesce(new.email, ''))) THEN
    assigned_role := 'client';
    SELECT coalesce(nullif(contact_name, ''), name) INTO matched_name FROM public.clients WHERE lower(coalesce(email, '')) = lower(coalesce(new.email, '')) LIMIT 1;
  ELSE
    assigned_role := 'social_media';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    coalesce(new.email, ''),
    coalesce(matched_name, new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, ''), '@', 1)),
    assigned_role
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 10. HABILITAR RLS REAL (BLOQUEIO TOTAL PARA VISITANTES ANÔNIMOS)
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_medias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspirations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

-- Remove políticas permissivas antigas ("USING (true)")
DROP POLICY IF EXISTS "Permitir acesso total clientes" ON public.clients;
DROP POLICY IF EXISTS "Permitir acesso total posts" ON public.posts;
DROP POLICY IF EXISTS "Permitir acesso total audit" ON public.post_comments_audit;
DROP POLICY IF EXISTS "Permitir acesso total social_medias" ON public.social_medias;
DROP POLICY IF EXISTS "Permitir acesso total approval_records" ON public.approval_records;
DROP POLICY IF EXISTS "Permitir acesso total client_tasks" ON public.client_tasks;
DROP POLICY IF EXISTS "Permitir acesso total inspirations" ON public.inspirations;
DROP POLICY IF EXISTS "Permitir acesso total receipts" ON public.receipts;

-- Políticas: PROFILES
DROP POLICY IF EXISTS "Profiles leitura autenticada" ON public.profiles;
CREATE POLICY "Profiles leitura autenticada" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_gestor());

DROP POLICY IF EXISTS "Profiles atualizacao proprio ou gestor" ON public.profiles;
CREATE POLICY "Profiles atualizacao proprio ou gestor" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_gestor())
  WITH CHECK (
    public.is_gestor()
    OR (id = auth.uid() AND role = public.current_app_role())
  );

-- Políticas: SOCIAL MEDIAS
DROP POLICY IF EXISTS "Social Medias leitura autenticada" ON public.social_medias;
CREATE POLICY "Social Medias leitura autenticada" ON public.social_medias
  FOR SELECT TO authenticated
  USING (
    public.is_gestor()
    OR public.current_app_role() = 'social_media'
    OR lower(coalesce(email, '')) = public.current_user_email()
    OR id = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM public.clients c
      WHERE lower(coalesce(c.email, '')) = public.current_user_email()
        AND (
          c.assigned_social_media_id = social_medias.id
          OR coalesce(c.assigned_social_media_ids, '[]'::jsonb) ? social_medias.id
        )
    )
  );

DROP POLICY IF EXISTS "Social Medias escrita gestor ou proprio" ON public.social_medias;
CREATE POLICY "Social Medias escrita gestor ou proprio" ON public.social_medias
  FOR ALL TO authenticated
  USING (
    public.is_gestor()
    OR lower(coalesce(email, '')) = public.current_user_email()
    OR id = auth.uid()::text
  )
  WITH CHECK (
    public.is_gestor()
    OR lower(coalesce(email, '')) = public.current_user_email()
    OR id = auth.uid()::text
  );

-- Políticas: CLIENTS
DROP POLICY IF EXISTS "Clients acesso autenticado por vinculo" ON public.clients;
CREATE POLICY "Clients acesso autenticado por vinculo" ON public.clients
  FOR SELECT TO authenticated
  USING (public.is_my_client(id));

DROP POLICY IF EXISTS "Clients escrita autenticada por vinculo" ON public.clients;
CREATE POLICY "Clients escrita autenticada por vinculo" ON public.clients
  FOR ALL TO authenticated
  USING (
    public.is_gestor()
    OR public.is_client_linked_to_my_sm(id)
  )
  WITH CHECK (
    public.is_gestor()
    OR public.is_my_social_media(assigned_social_media_id)
    OR public.is_my_social_media(created_by_social_media_id)
    OR EXISTS (
      SELECT 1
      FROM jsonb_array_elements_text(coalesce(assigned_social_media_ids, '[]'::jsonb)) AS linked_sm_id
      WHERE public.is_my_social_media(linked_sm_id)
    )
    OR public.current_app_role() = 'social_media'
  );

-- Políticas: POSTS
DROP POLICY IF EXISTS "Posts leitura por vinculo" ON public.posts;
CREATE POLICY "Posts leitura por vinculo" ON public.posts
  FOR SELECT TO authenticated
  USING (public.is_my_client(client_project_id));

DROP POLICY IF EXISTS "Posts escrita por vinculo" ON public.posts;
CREATE POLICY "Posts escrita por vinculo" ON public.posts
  FOR ALL TO authenticated
  USING (public.is_my_client(client_project_id))
  WITH CHECK (public.is_my_client(client_project_id));

-- Políticas: TAREFAS (CLIENT TASKS)
DROP POLICY IF EXISTS "Tasks acesso por vinculo" ON public.client_tasks;
CREATE POLICY "Tasks acesso por vinculo" ON public.client_tasks
  FOR ALL TO authenticated
  USING (public.is_my_client(client_project_id))
  WITH CHECK (public.is_my_client(client_project_id));

-- Políticas: INSPIRAÇÕES
DROP POLICY IF EXISTS "Inspirations acesso por vinculo" ON public.inspirations;
CREATE POLICY "Inspirations acesso por vinculo" ON public.inspirations
  FOR ALL TO authenticated
  USING (public.is_my_client(client_project_id))
  WITH CHECK (public.is_my_client(client_project_id));

-- Políticas: AUDITORIA DE COMENTÁRIOS
DROP POLICY IF EXISTS "Comments audit acesso por vinculo" ON public.post_comments_audit;
CREATE POLICY "Comments audit acesso por vinculo" ON public.post_comments_audit
  FOR ALL TO authenticated
  USING (public.is_my_client(client_id))
  WITH CHECK (public.is_my_client(client_id));

-- Políticas: RECIBOS E APROVAÇÕES FINANCEIRAS (Somente Gestor e Social Media vinculado)
DROP POLICY IF EXISTS "Receipts acesso gestor ou sm" ON public.receipts;
CREATE POLICY "Receipts acesso gestor ou sm" ON public.receipts
  FOR ALL TO authenticated
  USING (
    public.is_gestor()
    OR public.is_client_linked_to_my_sm(receipts.client_project_id)
  )
  WITH CHECK (
    public.is_gestor()
    OR public.is_client_linked_to_my_sm(receipts.client_project_id)
  );

DROP POLICY IF EXISTS "Approval records acesso gestor ou sm" ON public.approval_records;
CREATE POLICY "Approval records acesso gestor ou sm" ON public.approval_records
  FOR ALL TO authenticated
  USING (
    public.is_gestor()
    OR public.is_my_social_media(social_media_id)
  )
  WITH CHECK (
    public.is_gestor()
    OR public.is_my_social_media(social_media_id)
  );

-- ============================================================================
-- 11. RPCs PÚBLICAS SEGURAS PARA LINKS DE APROVAÇÃO (/p/:token, /mural/:id, OG)
-- Apenas quem possui o token secreto ou ID do mural acessa aquele registro único.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_og_preview_data(p_token TEXT DEFAULT NULL, p_client_id TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_post RECORD;
  v_client RECORD;
BEGIN
  IF p_token IS NOT NULL AND length(trim(p_token)) > 0 THEN
    SELECT p.title, p.caption, p.media_url, p.client_project_id
      INTO v_post
      FROM public.posts p
      WHERE p.approval_token = trim(p_token)
      LIMIT 1;
    IF FOUND THEN
      SELECT c.name INTO v_client FROM public.clients c WHERE c.id = v_post.client_project_id LIMIT 1;
      RETURN jsonb_build_object(
        'title', coalesce(v_post.title, 'Publicação para Aprovação'),
        'caption', coalesce(v_post.caption, ''),
        'media_url', coalesce(v_post.media_url, ''),
        'client_name', coalesce(v_client.name, '')
      );
    END IF;
  END IF;

  IF p_client_id IS NOT NULL AND length(trim(p_client_id)) > 0 THEN
    SELECT c.name, c.logo_url INTO v_client FROM public.clients c WHERE c.id = trim(p_client_id) LIMIT 1;
    SELECT p.media_url INTO v_post
      FROM public.posts p
      WHERE p.client_project_id = trim(p_client_id) AND coalesce(p.media_url, '') <> ''
      ORDER BY p.created_at DESC
      LIMIT 1;
    IF v_client.name IS NOT NULL THEN
      RETURN jsonb_build_object(
        'client_name', v_client.name,
        'logo_url', coalesce(v_client.logo_url, ''),
        'media_url', coalesce(v_post.media_url, '')
      );
    END IF;
  END IF;

  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_public_approval_post(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_post public.posts%ROWTYPE;
  v_client public.clients%ROWTYPE;
  v_sm public.social_medias%ROWTYPE;
BEGIN
  SELECT * INTO v_post FROM public.posts WHERE approval_token = trim(p_token) LIMIT 1;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_client FROM public.clients WHERE id = v_post.client_project_id LIMIT 1;
  SELECT * INTO v_sm FROM public.social_medias
    WHERE id = coalesce(v_post.social_media_author_id, v_client.assigned_social_media_id)
    LIMIT 1;

  RETURN jsonb_build_object(
    'post', jsonb_build_object(
      'id', v_post.id,
      'clientProjectId', v_post.client_project_id,
      'title', v_post.title,
      'caption', v_post.caption,
      'mediaUrl', v_post.media_url,
      'mediaType', v_post.media_type,
      'socialNetworks', v_post.social_networks,
      'scheduledDate', v_post.scheduled_date,
      'status', v_post.status,
      'approvalToken', v_post.approval_token,
      'tokenExpiresAt', v_post.token_expires_at,
      'comments', v_post.comments,
      'isPublished', v_post.is_published,
      'publishedAt', v_post.published_at,
      'socialMediaAuthorId', v_post.social_media_author_id,
      'createdAt', v_post.created_at,
      'updatedAt', v_post.updated_at
    ),
    'client', CASE WHEN v_client.id IS NOT NULL THEN jsonb_build_object(
      'id', v_client.id,
      'name', v_client.name,
      'contactName', v_client.contact_name,
      'logoUrl', v_client.logo_url,
      'activeSocialNetworks', ARRAY['instagram', 'facebook'],
      'assignedSocialMediaId', v_client.assigned_social_media_id,
      'metricsAccess', v_client.metrics_access
    ) ELSE NULL END,
    'socialMedia', CASE WHEN v_sm.id IS NOT NULL THEN jsonb_build_object(
      'id', v_sm.id,
      'name', v_sm.name,
      'socialProfile', v_sm.social_profile
    ) ELSE NULL END
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_public_approval_action(
  p_token TEXT,
  p_action TEXT,
  p_comment TEXT DEFAULT NULL,
  p_author_name TEXT DEFAULT 'Cliente'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_post public.posts%ROWTYPE;
  v_client public.clients%ROWTYPE;
  v_sm public.social_medias%ROWTYPE;
  v_comments JSONB;
  v_new_comment JSONB;
  v_next_status TEXT;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  SELECT * INTO v_post FROM public.posts WHERE approval_token = trim(p_token) LIMIT 1;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Link não encontrado');
  END IF;

  IF v_post.token_expires_at IS NOT NULL AND v_post.token_expires_at < v_now THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Link expirado');
  END IF;

  SELECT * INTO v_client FROM public.clients WHERE id = v_post.client_project_id LIMIT 1;
  SELECT * INTO v_sm FROM public.social_medias WHERE id = coalesce(v_post.social_media_author_id, v_client.assigned_social_media_id) LIMIT 1;

  v_comments := coalesce(v_post.comments, '[]'::jsonb);
  v_next_status := v_post.status;

  IF p_action = 'approve' THEN
    v_next_status := 'aprovado';
    v_new_comment := jsonb_build_object(
      'id', 'c-appr-' || extract(epoch FROM v_now)::bigint::text,
      'authorRole', 'cliente',
      'authorName', coalesce(nullif(trim(p_author_name), ''), v_client.contact_name, v_client.name, 'Cliente'),
      'text', '🎉 Post aprovado com sucesso! Este conteúdo será programado para postagem.',
      'timestamp', to_char(v_now AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI')
    );
    v_comments := v_comments || jsonb_build_array(v_new_comment);

    INSERT INTO public.approval_records (
      id, post_id, post_title, client_project_id, client_name, social_media_id, social_media_name,
      approved_at, approved_by_role, approved_by_name, price_per_post_snapshot, fee_per_post_snapshot, billing_status
    )
    VALUES (
      'appr-' || v_post.id, v_post.id, v_post.title, v_post.client_project_id, coalesce(v_client.name, 'Cliente'),
      v_sm.id, coalesce(v_sm.name, 'Social Media'), v_now, 'cliente',
      coalesce(nullif(trim(p_author_name), ''), v_client.contact_name, 'Cliente'),
      coalesce(v_client.price_per_post, 150), coalesce(v_sm.custom_fee_per_post, 0.50), 'computado'
    )
    ON CONFLICT (id) DO NOTHING;

  ELSIF p_action = 'request_change' AND length(trim(coalesce(p_comment, ''))) > 0 THEN
    v_next_status := 'alterar';
    v_new_comment := jsonb_build_object(
      'id', 'c-' || extract(epoch FROM v_now)::bigint::text,
      'authorRole', 'cliente',
      'authorName', coalesce(nullif(trim(p_author_name), ''), v_client.contact_name, v_client.name, 'Cliente'),
      'text', '[Instrução de Ajuste]: ' || trim(p_comment),
      'timestamp', to_char(v_now AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI')
    );
    v_comments := v_comments || jsonb_build_array(v_new_comment);

  ELSIF p_action = 'comment' AND length(trim(coalesce(p_comment, ''))) > 0 THEN
    v_new_comment := jsonb_build_object(
      'id', 'c-' || extract(epoch FROM v_now)::bigint::text,
      'authorRole', 'cliente',
      'authorName', coalesce(nullif(trim(p_author_name), ''), v_client.contact_name, v_client.name, 'Cliente'),
      'text', trim(p_comment),
      'timestamp', to_char(v_now AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI')
    );
    v_comments := v_comments || jsonb_build_array(v_new_comment);
  END IF;

  UPDATE public.posts
    SET status = v_next_status,
        comments = v_comments,
        updated_at = v_now
    WHERE id = v_post.id;

  IF v_new_comment IS NOT NULL THEN
    INSERT INTO public.post_comments_audit (id, post_id, post_title, client_id, author_role, author_name, comment_text)
    VALUES (
      v_new_comment ->> 'id',
      v_post.id,
      v_post.title,
      v_post.client_project_id,
      'cliente',
      v_new_comment ->> 'authorName',
      v_new_comment ->> 'text'
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN jsonb_build_object('ok', true, 'status', v_next_status, 'comments', v_comments);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_public_client_mural(p_client_id TEXT, p_sm_id TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client public.clients%ROWTYPE;
  v_sm public.social_medias%ROWTYPE;
  v_posts JSONB;
  v_tasks JSONB;
  v_inspirations JSONB;
BEGIN
  SELECT * INTO v_client FROM public.clients WHERE id = trim(p_client_id) LIMIT 1;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_sm FROM public.social_medias
    WHERE id = coalesce(nullif(trim(p_sm_id), ''), v_client.assigned_social_media_id)
    LIMIT 1;

  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'id', p.id,
    'clientProjectId', p.client_project_id,
    'title', p.title,
    'caption', p.caption,
    'mediaUrl', p.media_url,
    'mediaType', p.media_type,
    'socialNetworks', p.social_networks,
    'scheduledDate', p.scheduled_date,
    'status', p.status,
    'approvalToken', p.approval_token,
    'tokenExpiresAt', p.token_expires_at,
    'comments', p.comments,
    'isPublished', p.is_published,
    'publishedAt', p.published_at,
    'socialMediaAuthorId', p.social_media_author_id,
    'createdAt', p.created_at,
    'updatedAt', p.updated_at
  ) ORDER BY p.created_at DESC), '[]'::jsonb)
  INTO v_posts
  FROM public.posts p
  WHERE p.client_project_id = v_client.id
    AND (
      coalesce(nullif(trim(p_sm_id), ''), v_client.assigned_social_media_id) IS NULL
      OR p.social_media_author_id IS NULL
      OR p.social_media_author_id = coalesce(nullif(trim(p_sm_id), ''), v_client.assigned_social_media_id)
    );

  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'id', t.id,
    'clientProjectId', t.client_project_id,
    'title', t.title,
    'description', t.description,
    'deadline', t.deadline,
    'status', t.status,
    'linkedPostId', t.linked_post_id,
    'createdByRole', t.created_by_role,
    'createdByName', t.created_by_name,
    'createdAt', t.created_at,
    'updatedAt', t.updated_at
  ) ORDER BY t.created_at DESC), '[]'::jsonb)
  INTO v_tasks
  FROM public.client_tasks t
  WHERE t.client_project_id = v_client.id;

  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'id', i.id,
    'clientProjectId', i.client_project_id,
    'title', i.title,
    'description', i.description,
    'url', i.url,
    'type', i.type,
    'category', i.type,
    'uploadedByRole', i.uploaded_by_role,
    'uploadedByName', i.uploaded_by_name,
    'isUsed', i.is_used,
    'usedAt', i.used_at,
    'createdAt', i.created_at
  ) ORDER BY i.created_at DESC), '[]'::jsonb)
  INTO v_inspirations
  FROM public.inspirations i
  WHERE i.client_project_id = v_client.id;

  RETURN jsonb_build_object(
    'client', jsonb_build_object(
      'id', v_client.id,
      'name', v_client.name,
      'contactName', v_client.contact_name,
      'logoUrl', v_client.logo_url,
      'activeSocialNetworks', ARRAY['instagram', 'facebook'],
      'assignedSocialMediaId', v_client.assigned_social_media_id,
      'metricsAccess', v_client.metrics_access
    ),
    'socialMedia', CASE WHEN v_sm.id IS NOT NULL THEN jsonb_build_object(
      'id', v_sm.id,
      'name', v_sm.name,
      'socialProfile', v_sm.social_profile
    ) ELSE NULL END,
    'posts', v_posts,
    'tasks', v_tasks,
    'inspirations', v_inspirations
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_public_mural_task(
  p_client_id TEXT,
  p_id TEXT,
  p_title TEXT,
  p_description TEXT DEFAULT '',
  p_deadline TEXT DEFAULT '',
  p_author_name TEXT DEFAULT 'Cliente'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.clients WHERE id = trim(p_client_id)) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Cliente não encontrado');
  END IF;

  INSERT INTO public.client_tasks (
    id, client_project_id, title, description, deadline, status, created_by_role, created_by_name
  ) VALUES (
    p_id, trim(p_client_id), trim(p_title), coalesce(p_description, ''), coalesce(p_deadline, ''),
    'novo', 'cliente', coalesce(nullif(trim(p_author_name), ''), 'Cliente')
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION public.get_og_preview_data(TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_public_approval_post(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_public_approval_action(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_public_client_mural(TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_public_mural_task(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_og_preview_data(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_approval_post(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_public_approval_action(TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_client_mural(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_public_mural_task(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;

-- Dica: Para promover seu usuário existente a Gestor (DEVWEBAPP) manualmente, rode:
-- INSERT INTO public.profiles (id, email, full_name, role)
-- SELECT id, email, coalesce(raw_user_meta_data->>'full_name', email), 'DEVWEBAPP'
-- FROM auth.users WHERE lower(email) = lower('SEU_EMAIL_AQUI')
-- ON CONFLICT (id) DO UPDATE SET role = 'DEVWEBAPP';
