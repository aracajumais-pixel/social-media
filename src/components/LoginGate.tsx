import React, { useState, useEffect } from 'react';
import {
  Lock, Mail, Sparkles, ShieldCheck, ArrowRight,
  Eye, EyeOff, AlertCircle, CheckCircle2, Loader2
} from 'lucide-react';
import {
  getSupabaseClient,
  hasSupabaseCredentials,
  registerUser,
  resolveAuthenticatedAppRole
} from '../lib/supabase';
import {
  fetchServerAuthStatus,
  loginLocalServerAccount
} from '../lib/serverSync';
import { UserRole } from '../types';

export interface AuthenticatedSessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  provider: 'supabase' | 'local_server';
  serverToken?: string;
}

interface LoginGateProps {
  onAuthenticated: (user: AuthenticatedSessionUser) => void;
}

export const LoginGate: React.FC<LoginGateProps> = ({ onAuthenticated }) => {
  const sbConfigured = hasSupabaseCredentials();

  const [mode, setMode] = useState<'login' | 'reset'>('login');
  const [checkingLocalStatus, setCheckingLocalStatus] = useState<boolean>(!sbConfigured);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (sbConfigured) return;
    let active = true;
    (async () => {
      setCheckingLocalStatus(true);
      await fetchServerAuthStatus();
      if (!active) return;
      setCheckingLocalStatus(false);
    })();
    return () => {
      active = false;
    };
  }, [sbConfigured]);

  const handleSupabaseLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Informe um e-mail válido.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMsg('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    const sb = getSupabaseClient();
    if (!sb) {
      setErrorMsg('Configuração do Supabase indisponível.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await sb.auth.signInWithPassword({
        email: cleanEmail,
        password
      });

      if (!error && data?.user) {
        const resolved = await resolveAuthenticatedAppRole({
          id: data.user.id,
          email: data.user.email,
          user_metadata: data.user.user_metadata
        });

        onAuthenticated({
          id: data.user.id,
          email: data.user.email || cleanEmail,
          name: resolved.fullName,
          role: resolved.role,
          provider: 'supabase'
        });
        return;
      }

      const msg = String(error?.message || '').toLowerCase();
      if (msg.includes('email not confirmed')) {
        setErrorMsg('E-mail ainda não confirmado. Verifique sua caixa de entrada.');
        return;
      }

      // Primeiro acesso automático: se as credenciais não existem ainda, registra conta e senha sem precisar clicar em "Criar Conta"
      if (msg.includes('invalid login credentials') || msg.includes('user not found')) {
        const defaultName = cleanEmail.split('@')[0] || 'Usuário';
        try {
          const signUpData = await registerUser({
            email: cleanEmail,
            password,
            fullName: defaultName,
            role: 'social_media'
          });

          const isFakeExistingUser =
            Array.isArray(signUpData?.user?.identities) && signUpData.user.identities.length === 0;

          if (isFakeExistingUser) {
            setErrorMsg('E-mail ou senha incorretos.');
            return;
          }

          if (signUpData?.session && signUpData?.user) {
            const resolved = await resolveAuthenticatedAppRole({
              id: signUpData.user.id,
              email: signUpData.user.email,
              user_metadata: signUpData.user.user_metadata
            });
            onAuthenticated({
              id: signUpData.user.id,
              email: signUpData.user.email || cleanEmail,
              name: resolved.fullName || defaultName,
              role: resolved.role,
              provider: 'supabase'
            });
            return;
          }

          if (signUpData?.user) {
            setSuccessMsg('Primeiro acesso registrado com sucesso! Verifique seu e-mail para confirmar e entrar.');
            setPassword('');
            return;
          }
        } catch (signUpErr: any) {
          const sMsg = String(signUpErr?.message || '').toLowerCase();
          if (sMsg.includes('already registered') || sMsg.includes('already exists')) {
            setErrorMsg('E-mail ou senha incorretos.');
          } else {
            setErrorMsg(signUpErr?.message || 'E-mail ou senha incorretos.');
          }
          return;
        }
      }

      setErrorMsg(error?.message || 'Não foi possível entrar. Tente novamente.');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro inesperado ao autenticar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSupabaseReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Informe o e-mail cadastrado para recuperar a senha.');
      return;
    }

    const sb = getSupabaseClient();
    if (!sb) return;

    setIsSubmitting(true);
    try {
      const { error } = await sb.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined
      });
      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccessMsg('Enviamos um link de redefinição de senha para o seu e-mail.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro ao enviar e-mail de recuperação.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLocalServerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Informe um e-mail válido.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await loginLocalServerAccount({ email: cleanEmail, password });
      if (!res.ok || !res.token || !res.user) {
        setErrorMsg(res.error || 'E-mail ou senha inválidos.');
        return;
      }
      onAuthenticated({
        id: res.user.id,
        email: res.user.email,
        name: res.user.name,
        role: res.user.role,
        provider: 'local_server',
        serverToken: res.token
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle Ambient Glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[540px] h-[540px] rounded-full bg-indigo-600/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 right-1/4 w-[420px] h-[420px] rounded-full bg-purple-600/10 blur-3xl" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-xl shadow-indigo-600/30">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">
              Social Media 5.0
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Plataforma Privada de Gestão & Aprovação de Conteúdo
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/30 text-[11px] font-semibold text-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Acesso Restrito • Protegido por Login</span>
          </div>
        </div>

        {/* Auth Card */}
        <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5">
          {checkingLocalStatus ? (
            <div className="py-10 flex flex-col items-center justify-center gap-3 text-slate-400 text-xs">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
              <span>Verificando autenticação do ambiente...</span>
            </div>
          ) : sbConfigured ? (
            <>
              <div className="space-y-1">
                <h2 className="text-sm font-bold text-white">
                  {mode === 'reset' ? 'Recuperar Senha' : 'Entrar no Sistema'}
                </h2>
                <p className="text-xs text-slate-400">
                  {mode === 'reset'
                    ? 'Informe seu e-mail cadastrado para receber o link de redefinição.'
                    : 'Digite seu e-mail e senha. No primeiro acesso, sua conta e senha são registradas automaticamente.'}
                </p>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-2xl bg-rose-950/70 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 rounded-2xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 text-xs flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}

              {mode === 'login' && (
                <form onSubmit={handleSupabaseLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      E-mail de Acesso
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu@email.com"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Senha (mínimo 6 caracteres)
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setMode('reset');
                        setErrorMsg(null);
                        setSuccessMsg(null);
                      }}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                    >
                      Esqueci minha senha
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Validando acesso...</span>
                      </>
                    ) : (
                      <>
                        <span>Acessar Painel</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {mode === 'reset' && (
                <form onSubmit={handleSupabaseReset} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      E-mail
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu@email.com"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? 'Enviando...' : 'Enviar Link de Recuperação'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="w-full py-2 text-xs text-slate-400 hover:text-white font-semibold"
                  >
                    Voltar para Login
                  </button>
                </form>
              )}
            </>
          ) : (
            <form onSubmit={handleLocalServerSubmit} className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-sm font-bold text-white">Entrar no Sistema</h2>
                <p className="text-xs text-slate-400">
                  Digite seu e-mail e senha de Social Media. No primeiro acesso, sua conta e senha são registradas automaticamente.
                </p>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-2xl bg-rose-950/70 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  E-mail de Acesso
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Senha (mínimo 6 caracteres)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Validando acesso...' : 'Acessar Painel'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-[11px] text-slate-500">
          Clientes aprovam conteúdos exclusivamente pelo link individual enviado via WhatsApp.
        </p>
      </div>
    </div>
  );
};
