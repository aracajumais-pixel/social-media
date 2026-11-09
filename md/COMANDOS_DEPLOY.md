# 🚀 Guia de Comandos: Build e Deploy pelo Git (PowerShell)

### 📂 Passo 0: Acessar a Pasta do Projeto no PowerShell
```powershell
cd C:\5social-media
```

---

## 📌 Passo 1: Gerar a Versão de Produção (Build)

Antes de enviar as alterações, execute o comando de build para compilar e validar os arquivos do projeto:

```powershell
npm run build
```

> **Resultado esperado:** Esse comando valida todo o TypeScript e gera a pasta otimizada `dist`. Se finalizar sem erros, o projeto está 100% pronto para o deploy.

---

## 🚀 Passo 2: Comandos para Deploy pelo Git

A sua Vercel (`https://social-media-six-ashy.vercel.app/`) está conectada ao seu repositório no **GitHub/Git**. Para que o site em produção seja atualizado automaticamente, envie os novos códigos com a sequência:

```powershell
git status
git add .
git commit -m "Atualizacao: isolamento de clientes por social media e rascunhos exclusivos"
git push origin main
```

*(Caso a sua branch principal se chame `master` em vez de `main`, utilize: `git push origin master`)*

---

### 💡 Dica: Caso queira enviar tudo de uma vez em uma única linha no PowerShell:

```powershell
cd C:\5social-media; npm run build; git add .; git commit -m "Deploy atualizacao sistema"; git push
```

---

## ⚡ Alternativa Direta: Deploy Imediato via Vercel CLI (Sem depender do Git)

Se você quiser atualizar a Vercel na mesma hora pelo terminal sem passar pelo Git:

```powershell
npx vercel --prod
```

---

## ⚠️ Lembrete de Variáveis de Ambiente na Vercel

Certifique-se de que as variáveis abaixo continuam cadastradas em **Project Settings > Environment Variables** na Vercel:

- `VITE_SUPABASE_URL` = *(Sua URL do Supabase)*
- `VITE_SUPABASE_ANON_KEY` = *(Sua chave anon pública do Supabase)*
- `GEMINI_API_KEY` = *(Sua chave do Google Gemini)*
