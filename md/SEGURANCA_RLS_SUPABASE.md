# 🔐 Segurança, Login e Regras de Privacidade (RLS) no Supabase

Para garantir privacidade total tanto na tela inicial (`https://social-media-six-ashy.vercel.app/`) quanto diretamente no banco de dados Supabase, siga estes passos:

1. Acesse seu projeto no **Supabase** → **SQL Editor** → **New Query**.
2. Copie e execute o SQL completo disponível dentro da aba **Painel Admin → Banco de Dados / Supabase** (botão **Copiar Script SQL Completo**) ou abaixo.
3. Esse script:
   - Cria a tabela `public.profiles` e a trigger automática que define permissões (`DEVWEBAPP` para o Gestor, `social_media` para Social Medias, `client` para Clientes).
   - **Remove as antigas políticas abertas (`USING (true)`)** e bloqueia **100%** qualquer leitura anônima (`anon`) nas tabelas `clients`, `social_medias`, `posts`, `receipts`, `approval_records`, `client_tasks`, `inspirations` e `post_comments_audit`.
   - Cria funções RPC `SECURITY DEFINER` exclusivas (`get_public_approval_post`, `submit_public_approval_action`, `get_public_client_mural`, `submit_public_mural_task`, `get_og_preview_data`) para que apenas quem possui o link secreto do post (`/p/:token`) ou do mural (`/mural/:clientId`) consiga aprovar/visualizar aquele conteúdo específico, sem nunca expor outros clientes ou dados financeiros.

### Promover seu e-mail principal a Gestor (`DEVWEBAPP`)
Caso sua conta de administrador já exista no Supabase Authentication antes de rodar o script, execute também:

```sql
INSERT INTO public.profiles (id, email, full_name, role)
SELECT id, email, coalesce(raw_user_meta_data->>'full_name', email), 'DEVWEBAPP'
FROM auth.users
WHERE lower(email) = lower('SEU_EMAIL_DE_GESTOR@exemplo.com')
ON CONFLICT (id) DO UPDATE SET role = 'DEVWEBAPP';
```

### Garantir que o Social Media veja apenas os seus clientes
No cadastro do Social Media dentro do painel, utilize o **mesmo e-mail** com o qual ele faz login no Supabase Auth. As regras de RLS vinculam automaticamente `social_medias.email` ao e-mail autenticado no token JWT.
