# Diretrizes de Desenvolvimento do Projeto

## REGRA CRÍTICA E MANDATÓRIA (Drive Media Helper)
- **PROIBIDO alterar o módulo de tratamento automático de mídias do Google Drive** (`src/utils/driveHelper.ts`, `DriveImage.tsx` ou lógicas correlatas de conversão de links/embeds do Google Drive) sem autorização prévia e explícita do usuário.
- Se houver necessidade ou solicitação relacionada a mídias do Drive, **SEMPRE pergunte e peça confirmação** antes de fazer qualquer modificação nesse bloco de código.

## REGRA CRÍTICA DE CHAVES E VARIÁVEIS DE AMBIENTE
- **PROIBIDO alterar ou remover as chaves e variáveis de ambiente** (`GEMINI_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) sem permissão prévia e explícita do usuário.
- Mantenha sempre a integridade e segurança de todas as chaves configuradas.
