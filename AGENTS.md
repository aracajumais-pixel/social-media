# Diretrizes de Desenvolvimento do Projeto

## REGRA CRÍTICA E MANDATÓRIA (Drive Media Helper)
- **PROIBIDO alterar o módulo de tratamento automático de mídias do Google Drive** (`src/utils/driveHelper.ts`, `DriveImage.tsx` ou lógicas correlatas de conversão de links/embeds do Google Drive) sem autorização prévia e explícita do usuário.
- Se houver necessidade ou solicitação relacionada a mídias do Drive, **SEMPRE pergunte e peça confirmação** antes de fazer qualquer modificação nesse bloco de código.
