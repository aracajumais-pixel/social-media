import React, { useEffect, useMemo, useState } from 'react';
import {
  BirthdayAuditLog,
  BirthdayBackground,
  BirthdayClientAuthSession,
  BirthdayElementSet,
  BirthdayGroup,
  BirthdayMessage,
  BirthdayPerson,
  BirthdayPhotoTransform,
  ClientProject,
  PostItem,
  SocialMediaUser,
  UserRole,
} from '../types';
import {
  BirthdayInteractiveCanvas,
  EditableBirthdayElementKey,
} from './BirthdayInteractiveCanvas';
import {
  computeAutoFaceFraming,
  detectPngTransparentCutout,
  fileToOptimizedDataUrl,
  formatBirthdayDay,
  formatBirthdayMonthShort,
  getDefaultElementSet,
  PORTUGUESE_MONTHS_SHORT,
  renderBirthdayArtToDataUrl,
} from '../utils/birthdayCanvas';
import { getSupabaseClient, isSupabaseConfigured, uploadMediaToSupabase } from '../lib/supabase';
import {
  Cake,
  Upload,
  Plus,
  Trash2,
  Sparkles,
  Download,
  Send,
  Users,
  Image as ImageIcon,
  MessageSquareHeart,
  Lock,
  LogOut,
  History,
  CheckCircle2,
  Wand2,
  RotateCcw,
  SlidersHorizontal,
  UserCheck,
  AlertCircle,
  Loader2,
  Layers,
  ShieldCheck,
} from 'lucide-react';

const MAX_BACKGROUNDS = 10;
const MAX_GROUPS = 10;
const MAX_MESSAGES = 10;

interface BirthdaysSectionProps {
  client: ClientProject;
  currentUserRole: UserRole;
  responsibleSm?: SocialMediaUser;
  backgrounds: BirthdayBackground[];
  groups: BirthdayGroup[];
  messages: BirthdayMessage[];
  people: BirthdayPerson[];
  auditLogs: BirthdayAuditLog[];
  clientSession: BirthdayClientAuthSession | null;
  onClientLogin: (session: BirthdayClientAuthSession) => void;
  onClientLogout: () => void;
  onSaveBackground: (bg: BirthdayBackground) => void;
  onUpdateBackground: (bg: BirthdayBackground) => void;
  onDeleteBackground: (bgId: string) => void;
  onSaveGroup: (group: BirthdayGroup) => void;
  onUpdateGroup: (group: BirthdayGroup) => void;
  onDeleteGroup: (groupId: string) => void;
  onSaveMessage: (msg: BirthdayMessage) => void;
  onUpdateMessage: (msg: BirthdayMessage) => void;
  onDeleteMessage: (msgId: string) => void;
  onSavePerson: (person: BirthdayPerson) => void;
  onUpdatePerson: (person: BirthdayPerson) => void;
  onDeletePerson: (personId: string) => void;
  onRecordAudit: (entry: Omit<BirthdayAuditLog, 'id' | 'timestamp' | 'clientProjectId'>) => void;
  onSendArtToMural: (post: Omit<PostItem, 'id' | 'createdAt' | 'updatedAt' | 'comments'>) => void;
}

type SubView = 'studio' | 'frames' | 'messages' | 'audit';

export const BirthdaysSection: React.FC<BirthdaysSectionProps> = ({
  client,
  currentUserRole,
  responsibleSm,
  backgrounds,
  groups,
  messages,
  people,
  auditLogs,
  clientSession,
  onClientLogin,
  onClientLogout,
  onSaveBackground,
  onUpdateBackground,
  onDeleteBackground,
  onSaveGroup,
  onUpdateGroup,
  onDeleteGroup,
  onSaveMessage,
  onUpdateMessage,
  onDeleteMessage,
  onSavePerson,
  onUpdatePerson,
  onDeletePerson,
  onRecordAudit,
  onSendArtToMural,
}) => {
  const [subView, setSubView] = useState<SubView>('studio');
  const [activeGroupFilter, setActiveGroupFilter] = useState<string>('todos');
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(people[0]?.id || null);
  const [selectedElement, setSelectedElement] = useState<EditableBirthdayElementKey | null>(null);

  // Client Login Form State (Auditoria)
  const [loginName, setLoginName] = useState(client.contactName || '');
  const [loginEmail, setLoginEmail] = useState(client.email || '');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // New Person Form State
  const [newName, setNewName] = useState('');
  const [newDay, setNewDay] = useState<number>(new Date().getDate());
  const [newMonth, setNewMonth] = useState<number>(new Date().getMonth() + 1);
  const [newGroupId, setNewGroupId] = useState<string>(groups[0]?.id || '');
  const [newMessageId, setNewMessageId] = useState<string>(messages[0]?.id || '');
  const [newPhotoUrl, setNewPhotoUrl] = useState<string>('');
  const [newPhotoTransform, setNewPhotoTransform] = useState<BirthdayPhotoTransform>({
    scale: 1.1,
    offsetX: 0,
    offsetY: 0,
  });
  const [isFramingPhoto, setIsFramingPhoto] = useState(false);
  const [framingStatus, setFramingStatus] = useState<string | null>(null);

  // New Background State (associado diretamente a um grupo existente)
  const [selectedBgGroupId, setSelectedBgGroupId] = useState<string>(groups[0]?.id || '');
  const [isUploadingBg, setIsUploadingBg] = useState(false);
  const [bgAiBusyId, setBgAiBusyId] = useState<string | null>(null);

  // New Group State
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupBgId, setNewGroupBgId] = useState<string>(backgrounds[0]?.id || '');

  // New Message State
  const [newMsgTitle, setNewMsgTitle] = useState('');
  const [newMsgText, setNewMsgText] = useState('');
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);

  // Export / Batch State
  const [isExporting, setIsExporting] = useState(false);
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);

  useEffect(() => {
    setLoginName(client.contactName || '');
    setLoginEmail(client.email || '');
    setLoginPassword('');
    setLoginError(null);
    setActiveGroupFilter('todos');
    setSelectedPersonId(null);
    setSelectedElement(null);
  }, [client.id, client.contactName, client.email]);

  useEffect(() => {
    if ((!newGroupId || !groups.some((g) => g.id === newGroupId)) && groups[0]?.id) {
      setNewGroupId(groups[0].id);
    }
  }, [groups, newGroupId]);

  useEffect(() => {
    if ((!newMessageId || !messages.some((m) => m.id === newMessageId)) && messages[0]?.id) {
      setNewMessageId(messages[0].id);
    }
  }, [messages, newMessageId]);

  useEffect(() => {
    if ((!newGroupBgId || !backgrounds.some((b) => b.id === newGroupBgId)) && backgrounds[0]?.id) {
      setNewGroupBgId(backgrounds[0].id);
    }
  }, [backgrounds, newGroupBgId]);

  useEffect(() => {
    if ((!selectedBgGroupId || !groups.some((g) => g.id === selectedBgGroupId)) && groups[0]?.id) {
      setSelectedBgGroupId(groups[0].id);
    }
  }, [groups, selectedBgGroupId]);

  const notify = (text: string) => {
    setFeedbackBanner(text);
    setTimeout(() => setFeedbackBanner(null), 5000);
  };

  // Identidade atual para auditoria
  const actorIdentity = useMemo(() => {
    if (currentUserRole === 'cliente') {
      return {
        name: clientSession?.name || client.contactName || 'Cliente',
        email: clientSession?.email || client.email,
        role: 'cliente' as UserRole,
      };
    }
    if (currentUserRole === 'social_media') {
      return {
        name: responsibleSm?.name || 'Social Media',
        email: responsibleSm?.email,
        role: 'social_media' as UserRole,
      };
    }
    return {
      name: 'Gestor da Agência',
      email: undefined,
      role: 'gestor' as UserRole,
    };
  }, [currentUserRole, clientSession, client, responsibleSm]);

  // ============================================================
  // DADOS DERIVADOS DO ESTÚDIO VISUAL (declarados antes de qualquer return)
  // ============================================================
  const filteredPeople = useMemo(() => {
    if (activeGroupFilter === 'todos') return people;
    return people.filter((p) => p.groupId === activeGroupFilter);
  }, [people, activeGroupFilter]);

  const activePerson = useMemo(() => {
    return (
      people.find((p) => p.id === selectedPersonId) ||
      filteredPeople[0] ||
      people[0] ||
      null
    );
  }, [people, filteredPeople, selectedPersonId]);

  const activeGroup = useMemo(() => {
    if (!activePerson) return groups[0] || null;
    return groups.find((g) => g.id === activePerson.groupId) || groups[0] || null;
  }, [activePerson, groups]);

  const activeBackground = useMemo(() => {
    if (activeGroup) {
      const bg = backgrounds.find((b) => b.id === activeGroup.backgroundId);
      if (bg) return bg;
    }
    return backgrounds[0] || null;
  }, [activeGroup, backgrounds]);

  const activeMessage = useMemo(() => {
    if (!activePerson) return messages[0] || null;
    return messages.find((m) => m.id === activePerson.messageId) || messages[0] || null;
  }, [activePerson, messages]);

  const activeElements: BirthdayElementSet = useMemo(() => {
    if (activePerson?.elementOverrides) return activePerson.elementOverrides;
    if (activeBackground?.defaultElements) return activeBackground.defaultElements;
    return getDefaultElementSet({ x: 20, y: 14, width: 60, height: 50 });
  }, [activePerson, activeBackground]);

  // ============================================================
  // PORTÃO DE LOGIN OBRIGATÓRIO PARA CLIENTE (AUDITORIA)
  // ============================================================
  const isClientLogged =
    currentUserRole !== 'cliente' ||
    (!!clientSession && clientSession.clientId === client.id);

  const handleClientAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const trimmedName = loginName.trim();
    const trimmedEmail = loginEmail.trim().toLowerCase();

    if (!trimmedName || !trimmedEmail.includes('@')) {
      setLoginError('Informe seu nome completo e um e-mail válido para registro de auditoria.');
      return;
    }
    if (loginPassword.trim().length < 4) {
      setLoginError('Digite sua senha de acesso (mínimo 4 caracteres).');
      return;
    }

    setIsLoggingIn(true);
    try {
      let method: 'supabase' | 'audit_login' = 'audit_login';
      if (isSupabaseConfigured && loginPassword.trim().length >= 6) {
        const sb = getSupabaseClient();
        if (sb) {
          const { data, error } = await sb.auth.signInWithPassword({
            email: trimmedEmail,
            password: loginPassword,
          });
          if (!error && data?.user) {
            method = 'supabase';
          } else {
            // Se não existir no Supabase Auth, ainda valida fluxo local vinculado ao cliente para não travar operação do cliente
            const { data: signUpData } = await sb.auth.signUp({
              email: trimmedEmail,
              password: loginPassword,
              options: { data: { full_name: trimmedName, role: 'client' } },
            });
            if (signUpData?.user) {
              method = 'supabase';
            }
          }
        }
      }

      const session: BirthdayClientAuthSession = {
        clientId: client.id,
        name: trimmedName,
        email: trimmedEmail,
        authenticatedAt: new Date().toISOString(),
        method,
      };
      onClientLogin(session);
      onRecordAudit({
        actorName: trimmedName,
        actorEmail: trimmedEmail,
        actorRole: 'cliente',
        action: 'Autenticou acesso em Aniversariantes',
        targetType: 'login_cliente',
        targetLabel: client.name,
        details: `Login confirmado (${method === 'supabase' ? 'Supabase Auth' : 'Registro Auditado'})`,
      });
    } catch (err: any) {
      setLoginError(err?.message || 'Não foi possível validar o login.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (!isClientLogged) {
    return (
      <div className="max-w-lg mx-auto my-8 bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-white">Login Obrigatório para Aniversariantes</h2>
            <p className="text-xs text-slate-400">
              Para editar aniversariantes, fundos ou mensagens de <strong>{client.name}</strong>, entre identificado para o registro de auditoria.
            </p>
          </div>
        </div>

        <form onSubmit={handleClientAuthSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Seu Nome *</label>
            <input
              type="text"
              required
              value={loginName}
              onChange={(e) => setLoginName(e.target.value)}
              placeholder="Ex: Maria Aparecida (Secretária)"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">E-mail de Acesso *</label>
            <input
              type="email"
              required
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="seuemail@paroquia.com.br"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Senha *</label>
            <input
              type="password"
              required
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder="Mínimo 4 caracteres"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {loginError && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{loginError}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
          >
            {isLoggingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            <span>Entrar e Habilitar Auditoria</span>
          </button>
        </form>
      </div>
    );
  }

  // ============================================================
  // HANDLERS: PLANOS DE FUNDO PNG (LIMITE 10)
  // ============================================================
  const analyzeBackgroundWithAI = async (bg: BirthdayBackground, imageBase64?: string) => {
    setBgAiBusyId(bg.id);
    try {
      const payloadImage = imageBase64 || bg.imageUrl;
      const res = await fetch('/api/birthdays/analyze-background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          backgroundBase64: payloadImage,
          backgroundMimeType: 'image/png',
          cutoutRect: bg.cutoutRect,
        }),
      });
      if (!res.ok) throw new Error('Falha na análise IA do plano de fundo.');
      const data = await res.json();
      if (data?.elements) {
        const updatedBg: BirthdayBackground = {
          ...bg,
          defaultElements: data.elements,
          aiAnalysisNotes: data.notes || 'Textos posicionados fora de elementos do plano de fundo.',
        };
        onUpdateBackground(updatedBg);
        notify(
          data.source === 'gemini'
            ? '✨ IA analisou o plano de fundo e posicionou Data, Nome e Mensagem em áreas livres!'
            : '✓ Textos posicionados em áreas seguras ao redor do recorte da foto.'
        );
      }
    } catch (err) {
      console.warn('Aviso ao analisar plano de fundo:', err);
    } finally {
      setBgAiBusyId(null);
    }
  };

  const handleUploadBackgroundPng = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (backgrounds.length >= MAX_BACKGROUNDS) {
      notify(`Limite máximo de ${MAX_BACKGROUNDS} planos de fundo atingido.`);
      return;
    }

    setIsUploadingBg(true);
    try {
      // Sempre preserva transparência PNG no DataURL para o recorte alpha
      const optimized = await fileToOptimizedDataUrl(file, 1400, true);
      const detected = await detectPngTransparentCutout(optimized.dataUrl);
      const initialElements = getDefaultElementSet(detected.cutoutRect);

      let storedUrl = optimized.dataUrl;
      if (isSupabaseConfigured) {
        const uploaded = await uploadMediaToSupabase(file, `birthdays-frames/${client.id}`);
        if (uploaded.success && uploaded.url) {
          storedUrl = uploaded.url;
        }
      }

      const targetGroup = groups.find((g) => g.id === selectedBgGroupId) || groups[0];
      const bgTitle = targetGroup
        ? targetGroup.name
        : file.name.replace(/\.[^.]+$/, '') || `Fundo ${backgrounds.length + 1}`;
      const newBg: BirthdayBackground = {
        id: `bg-${Date.now()}`,
        clientProjectId: client.id,
        name: bgTitle,
        imageUrl: storedUrl,
        width: detected.width,
        height: detected.height,
        cutoutRect: detected.cutoutRect,
        defaultElements: initialElements,
        createdAt: new Date().toISOString(),
        createdByName: actorIdentity.name,
      };

      onSaveBackground(newBg);
      if (targetGroup) {
        onUpdateGroup({
          ...targetGroup,
          backgroundId: newBg.id,
        });
      }
      if (!newGroupBgId) setNewGroupBgId(newBg.id);

      onRecordAudit({
        actorName: actorIdentity.name,
        actorEmail: actorIdentity.email,
        actorRole: actorIdentity.role,
        action: 'Incluiu Plano de Fundo PNG',
        targetType: 'plano_de_fundo',
        targetLabel: newBg.name,
        details: `${targetGroup ? `Grupo associado: ${targetGroup.name} • ` : ''}Área transparente detectada: ${detected.cutoutRect.width.toFixed(0)}% x ${detected.cutoutRect.height.toFixed(0)}%`,
      });

      // Chama IA para analisar elementos visuais do plano de fundo PNG e evitar sobreposição de textos
      await analyzeBackgroundWithAI(newBg, optimized.dataUrl);
    } catch (err) {
      console.error('Erro no upload de plano de fundo PNG:', err);
      notify('Erro ao processar arquivo PNG. Verifique se é uma imagem PNG válida com área transparente.');
    } finally {
      setIsUploadingBg(false);
    }
  };

  // ============================================================
  // HANDLERS: GRUPOS (LIMITE 10)
  // ============================================================
  const handleAddGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (groups.length >= MAX_GROUPS) return;
    const trimmed = newGroupName.trim();
    if (!trimmed) return;

    const chosenBg = newGroupBgId || backgrounds[0]?.id || '';
    const grp: BirthdayGroup = {
      id: `grp-${Date.now()}`,
      clientProjectId: client.id,
      name: trimmed,
      backgroundId: chosenBg,
      defaultMessageId: messages[0]?.id,
      createdAt: new Date().toISOString(),
    };
    onSaveGroup(grp);
    setNewGroupName('');
    if (!newGroupId) setNewGroupId(grp.id);

    onRecordAudit({
      actorName: actorIdentity.name,
      actorEmail: actorIdentity.email,
      actorRole: actorIdentity.role,
      action: 'Incluiu Grupo de Aniversariantes',
      targetType: 'grupo',
      targetLabel: grp.name,
    });
    notify(`Grupo "${grp.name}" incluído (${groups.length + 1}/${MAX_GROUPS}).`);
  };

  // ============================================================
  // HANDLERS: MENSAGENS DE PARABÉNS (LIMITE 10)
  // ============================================================
  const handleSaveMessageForm = (e: React.FormEvent) => {
    e.preventDefault();
    const title = newMsgTitle.trim() || `Mensagem ${messages.length + 1}`;
    const text = newMsgText.trim();
    if (!text) return;

    if (editingMsgId) {
      const existing = messages.find((m) => m.id === editingMsgId);
      if (existing) {
        onUpdateMessage({ ...existing, title, text });
        onRecordAudit({
          actorName: actorIdentity.name,
          actorEmail: actorIdentity.email,
          actorRole: actorIdentity.role,
          action: 'Editou Mensagem de Parabéns',
          targetType: 'mensagem',
          targetLabel: title,
        });
      }
      setEditingMsgId(null);
    } else {
      if (messages.length >= MAX_MESSAGES) return;
      const msg: BirthdayMessage = {
        id: `msg-${Date.now()}`,
        clientProjectId: client.id,
        title,
        text,
        createdAt: new Date().toISOString(),
      };
      onSaveMessage(msg);
      if (!newMessageId) setNewMessageId(msg.id);
      onRecordAudit({
        actorName: actorIdentity.name,
        actorEmail: actorIdentity.email,
        actorRole: actorIdentity.role,
        action: 'Incluiu Mensagem de Parabéns',
        targetType: 'mensagem',
        targetLabel: title,
      });
    }

    setNewMsgTitle('');
    setNewMsgText('');
    notify('Mensagem salva com sucesso!');
  };

  // ============================================================
  // HANDLERS: UPLOAD DE FOTO & ENQUADRAMENTO IA
  // ============================================================
  const runAiFaceFraming = async (
    photoBase64OrUrl: string,
    targetBackground?: BirthdayBackground
  ): Promise<BirthdayPhotoTransform> => {
    setIsFramingPhoto(true);
    setFramingStatus('IA analisando o rosto para enquadrar na área transparente...');
    try {
      const res = await fetch('/api/birthdays/analyze-framing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personPhotoBase64: photoBase64OrUrl,
          cutoutRect: targetBackground?.cutoutRect,
        }),
      });
      if (!res.ok) throw new Error('Erro na resposta da IA');
      const data = await res.json();
      const transform = computeAutoFaceFraming(
        data.faceBox || { ymin: 120, xmin: 280, ymax: 620, xmax: 720 },
        data.notes
      );
      setFramingStatus(
        data.source === 'gemini'
          ? '✨ Rosto detectado e enquadrado automaticamente pela IA!'
          : '✓ Enquadramento automático aplicado.'
      );
      return transform;
    } catch {
      const fallback = computeAutoFaceFraming(
        { ymin: 120, xmin: 280, ymax: 620, xmax: 720 },
        'Centralização padrão aplicada.'
      );
      setFramingStatus('✓ Centralização padrão aplicada.');
      return fallback;
    } finally {
      setIsFramingPhoto(false);
    }
  };

  const handlePersonPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setIsFramingPhoto(true);
    try {
      const optimized = await fileToOptimizedDataUrl(file, 1200, false);
      let finalUrl = optimized.dataUrl;
      if (isSupabaseConfigured) {
        const uploaded = await uploadMediaToSupabase(file, `birthdays-people/${client.id}`);
        if (uploaded.success && uploaded.url) {
          finalUrl = uploaded.url;
        }
      }

      setNewPhotoUrl(finalUrl);
      const chosenGroup = groups.find((g) => g.id === (newGroupId || groups[0]?.id));
      const chosenBg = backgrounds.find((b) => b.id === chosenGroup?.backgroundId) || backgrounds[0];
      const aiTransform = await runAiFaceFraming(optimized.dataUrl, chosenBg);
      setNewPhotoTransform(aiTransform);
    } catch (err) {
      console.error('Erro ao processar foto do aniversariante:', err);
      notify('Não foi possível carregar a foto. Tente outra imagem JPG ou PNG.');
    } finally {
      setIsFramingPhoto(false);
    }
  };

  const handleCreateBirthdayPerson = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newName.trim();
    if (!cleanName) return;
    if (!newPhotoUrl) {
      notify('Envie a foto da pessoa para que a IA faça o enquadramento no plano de fundo.');
      return;
    }

    const effectiveGroupId = newGroupId || groups[0]?.id || '';
    const effectiveMsgId = newMessageId || messages[0]?.id || '';

    const newPerson: BirthdayPerson = {
      id: `bday-${Date.now()}`,
      clientProjectId: client.id,
      name: cleanName,
      birthDay: Math.max(1, Math.min(31, Number(newDay) || 1)),
      birthMonth: Math.max(1, Math.min(12, Number(newMonth) || 1)),
      groupId: effectiveGroupId,
      messageId: effectiveMsgId,
      photoUrl: newPhotoUrl,
      photoTransform: newPhotoTransform,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdByName: actorIdentity.name,
      createdByRole: actorIdentity.role,
    };

    onSavePerson(newPerson);
    setSelectedPersonId(newPerson.id);
    setNewName('');
    setNewPhotoUrl('');
    setFramingStatus(null);

    const groupObj = groups.find((g) => g.id === effectiveGroupId);
    onRecordAudit({
      actorName: actorIdentity.name,
      actorEmail: actorIdentity.email,
      actorRole: actorIdentity.role,
      action: 'Cadastrou Aniversariante com Enquadramento IA',
      targetType: 'aniversariante',
      targetLabel: `${newPerson.name} (${formatBirthdayDay(newPerson.birthDay)}/${formatBirthdayMonthShort(newPerson.birthMonth)})`,
      details: `Grupo: ${groupObj?.name || 'Sem grupo'}`,
    });
    notify(`Arte individual de "${newPerson.name}" criada e enquadrada no grupo "${groupObj?.name || ''}"!`);
  };


  const handleUpdateActiveElements = (updated: BirthdayElementSet) => {
    if (!activePerson) return;
    onUpdatePerson({
      ...activePerson,
      elementOverrides: updated,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleApplyElementsToGroup = () => {
    if (!activeBackground || !activePerson) return;
    const elementsToShare = activePerson.elementOverrides || activeBackground.defaultElements;
    onUpdateBackground({
      ...activeBackground,
      defaultElements: elementsToShare,
    });
    // Limpa overrides individuais das pessoas deste grupo que usam o mesmo fundo para herdarem o padrão alinhado
    const groupIdsUsingBg = new Set(
      groups.filter((g) => g.backgroundId === activeBackground.id).map((g) => g.id)
    );
    people.forEach((p) => {
      if (groupIdsUsingBg.has(p.groupId) && p.elementOverrides) {
        onUpdatePerson({
          ...p,
          elementOverrides: undefined,
          updatedAt: new Date().toISOString(),
        });
      }
    });
    onRecordAudit({
      actorName: actorIdentity.name,
      actorEmail: actorIdentity.email,
      actorRole: actorIdentity.role,
      action: 'Aplicou posicionamento de textos para todo o grupo',
      targetType: 'plano_de_fundo',
      targetLabel: activeBackground.name,
    });
    notify('Posição, tamanho e rotação salvos como padrão para todas as artes individuais deste plano de fundo!');
  };

  const handleDownloadIndividualPng = async (personToExport: BirthdayPerson) => {
    const grp = groups.find((g) => g.id === personToExport.groupId);
    const bg = backgrounds.find((b) => b.id === grp?.backgroundId) || backgrounds[0];
    const msg = messages.find((m) => m.id === personToExport.messageId) || messages[0];
    if (!bg) {
      notify('Selecione um plano de fundo PNG para o grupo antes de baixar.');
      return;
    }

    setIsExporting(true);
    try {
      const dataUrl = await renderBirthdayArtToDataUrl({
        background: bg,
        person: personToExport,
        messageText: msg?.text || '',
      });

      const a = document.createElement('a');
      a.href = dataUrl;
      const safeName = personToExport.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      a.download = `aniversario-${safeName}-${formatBirthdayDay(personToExport.birthDay)}-${formatBirthdayMonthShort(personToExport.birthMonth)}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      onRecordAudit({
        actorName: actorIdentity.name,
        actorEmail: actorIdentity.email,
        actorRole: actorIdentity.role,
        action: 'Baixou arte individual PNG',
        targetType: 'arte_exportada',
        targetLabel: personToExport.name,
      });
    } catch (err) {
      console.error('Erro ao exportar arte PNG:', err);
      notify('Erro ao gerar PNG da arte. Verifique se a imagem de fundo permite exportação.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadBatchGroupPngs = async () => {
    if (filteredPeople.length === 0) return;
    setIsExporting(true);
    try {
      for (let i = 0; i < filteredPeople.length; i++) {
        await handleDownloadIndividualPng(filteredPeople[i]);
        // Pequeno intervalo para o navegador processar cada download individual
        await new Promise((r) => setTimeout(r, 250));
      }
      notify(`${filteredPeople.length} arte(s) individual(is) geradas e baixadas!`);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePublishArtToMural = async (personToPublish: BirthdayPerson) => {
    const grp = groups.find((g) => g.id === personToPublish.groupId);
    const bg = backgrounds.find((b) => b.id === grp?.backgroundId) || backgrounds[0];
    const msg = messages.find((m) => m.id === personToPublish.messageId) || messages[0];
    if (!bg) return;

    setIsExporting(true);
    try {
      const dataUrl = await renderBirthdayArtToDataUrl({
        background: bg,
        person: personToPublish,
        messageText: msg?.text || '',
      });

      const dayStr = formatBirthdayDay(personToPublish.birthDay);
      const monthStr = formatBirthdayMonthShort(personToPublish.birthMonth);

      onSendArtToMural({
        clientProjectId: client.id,
        title: `Aniversariante ${dayStr}/${monthStr} — ${personToPublish.name}`,
        caption: `Parabéns, ${personToPublish.name}!\n\n${msg?.text || 'Desejamos muitas felicidades, saúde e bênçãos no seu dia!'}`,
        mediaUrl: dataUrl,
        mediaType: 'image',
        socialNetworks: client.activeSocialNetworks?.length ? client.activeSocialNetworks : ['instagram'],
        scheduledDate: new Date().toISOString().slice(0, 16),
        status: 'rascunho',
      });

      onRecordAudit({
        actorName: actorIdentity.name,
        actorEmail: actorIdentity.email,
        actorRole: actorIdentity.role,
        action: 'Enviou arte individual para o Mural',
        targetType: 'arte_exportada',
        targetLabel: personToPublish.name,
      });
      notify(`Arte individual de "${personToPublish.name}" enviada para o Mural de aprovações!`);
    } catch (err) {
      console.error('Erro ao enviar arte para o Mural:', err);
      notify('Não foi possível renderizar a arte para o Mural.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho do Módulo Aniversariantes + Identidade Logada para Auditoria */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 border border-indigo-500/30 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-pink-500/20 text-white shrink-0">
            <Cake className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-extrabold text-white">Aniversariantes — {client.name}</h2>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <UserCheck className="w-3 h-3" />
                Auditado: {actorIdentity.name}
                {actorIdentity.email ? ` (${actorIdentity.email})` : ''}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSubView('studio')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              subView === 'studio'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Estúdio & Aniversariantes ({people.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSubView('frames')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              subView === 'frames'
                ? 'bg-pink-600 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Planos de Fundo ({backgrounds.length}/{MAX_BACKGROUNDS}) & Grupos ({groups.length}/{MAX_GROUPS})</span>
          </button>

          <button
            type="button"
            onClick={() => setSubView('messages')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              subView === 'messages'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700'
            }`}
          >
            <MessageSquareHeart className="w-3.5 h-3.5" />
            <span>Mensagens ({messages.length}/{MAX_MESSAGES})</span>
          </button>

          <button
            type="button"
            onClick={() => setSubView('audit')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              subView === 'audit'
                ? 'bg-amber-600 text-slate-950 shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Auditoria ({auditLogs.length})</span>
          </button>

          {currentUserRole === 'cliente' && clientSession && (
            <button
              type="button"
              onClick={() => {
                onRecordAudit({
                  actorName: clientSession.name,
                  actorEmail: clientSession.email,
                  actorRole: 'cliente',
                  action: 'Encerrou sessão em Aniversariantes',
                  targetType: 'login_cliente',
                  targetLabel: client.name,
                });
                onClientLogout();
              }}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5"
              title="Sair da conta logada do cliente"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair</span>
            </button>
          )}
        </div>
      </div>

      {feedbackBanner && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-200 text-xs font-semibold flex items-center justify-between gap-2 shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedbackBanner}</span>
          </div>
          <button type="button" onClick={() => setFeedbackBanner(null)} className="text-emerald-300 hover:text-white font-bold">
            ✕
          </button>
        </div>
      )}

      {/* ============================================================ */}
      {/* SUBVIEW 1: ESTÚDIO & CADASTRO DE ANIVERSARIANTES             */}
      {/* ============================================================ */}
      {subView === 'studio' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* COLUNA ESQUERDA: Cadastro + Lista Individual */}
          <div className="lg:col-span-5 space-y-5">
            {/* Card: Cadastrar Aniversariante */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-pink-400" />
                  <span>Novo Aniversariante</span>
                </h3>
                <span className="text-[11px] text-slate-400">1 arte individual gerada</span>
              </div>

              <form onSubmit={handleCreateBirthdayPerson} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Nome do Aniversariante *</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Ex: Maria Clara"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Dia *</label>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      required
                      value={newDay}
                      onChange={(e) => setNewDay(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Mês *</label>
                    <select
                      value={newMonth}
                      onChange={(e) => setNewMonth(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    >
                      {PORTUGUESE_MONTHS_SHORT.map((m, idx) => (
                        <option key={m} value={idx + 1}>
                          {idx + 1} - {m}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Grupo (Define o Plano de Fundo) *</label>
                    <select
                      value={newGroupId}
                      onChange={(e) => setNewGroupId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500"
                    >
                      {groups.map((g) => {
                        const bg = backgrounds.find((b) => b.id === g.backgroundId);
                        return (
                          <option key={g.id} value={g.id}>
                            {g.name} ({bg?.name || 'Sem fundo'})
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Mensagem de Parabéns</label>
                    <select
                      value={newMessageId}
                      onChange={(e) => setNewMessageId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500"
                    >
                      {messages.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Upload da Foto da Pessoa */}
                <div className="bg-slate-950 border border-dashed border-slate-700 rounded-2xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-white block">Foto da Pessoa *</span>
                    </div>
                    <label className="cursor-pointer px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all">
                      {isFramingPhoto ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                      <span>{newPhotoUrl ? 'Trocar Foto' : 'Enviar Foto'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePersonPhotoUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {newPhotoUrl && (
                    <div className="flex items-center gap-3 pt-1">
                      <img
                        src={newPhotoUrl}
                        alt="Prévia foto"
                        className="w-14 h-14 rounded-xl object-cover border border-slate-700"
                      />
                      <div className="text-[11px] text-emerald-300 flex-1">
                        {framingStatus || 'Foto pronta e enquadrada.'}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isFramingPhoto || backgrounds.length === 0 || groups.length === 0}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 disabled:opacity-50 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all"
                >
                  <Wand2 className="w-4 h-4" />
                  <span>Gerar Arte Individual</span>
                </button>
              </form>
            </div>

            {/* Card: Lista de Aniversariantes Cadastrados (filtrável por grupo) */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-400" />
                  <span>Artes Individuais ({filteredPeople.length})</span>
                </h3>

                {filteredPeople.length > 0 && (
                  <button
                    type="button"
                    onClick={handleDownloadBatchGroupPngs}
                    disabled={isExporting}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Baixar Todas ({filteredPeople.length})</span>
                  </button>
                )}
              </div>

              {/* Filtro por Grupo */}
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveGroupFilter('todos')}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all ${
                    activeGroupFilter === 'todos'
                      ? 'bg-indigo-600 text-white border-indigo-500'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  Todos ({people.length})
                </button>
                {groups.map((grp) => {
                  const count = people.filter((p) => p.groupId === grp.id).length;
                  return (
                    <button
                      key={grp.id}
                      type="button"
                      onClick={() => setActiveGroupFilter(grp.id)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all ${
                        activeGroupFilter === grp.id
                          ? 'bg-pink-600 text-white border-pink-500'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {grp.name} ({count})
                    </button>
                  );
                })}
              </div>

              {filteredPeople.length === 0 ? (
                <div className="p-6 text-center rounded-2xl bg-slate-950/60 border border-slate-800 text-xs text-slate-500">
                  Nenhum aniversariante neste filtro. Cadastre ao lado para gerar a arte individual automaticamente.
                </div>
              ) : (
                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {filteredPeople.map((person) => {
                    const grp = groups.find((g) => g.id === person.groupId);
                    const isSelected = activePerson?.id === person.id;
                    return (
                      <div
                        key={person.id}
                        onClick={() => {
                          setSelectedPersonId(person.id);
                          setSelectedElement(null);
                        }}
                        className={`p-3 rounded-2xl border cursor-pointer flex items-center justify-between gap-3 transition-all ${
                          isSelected
                            ? 'bg-indigo-950/50 border-indigo-500 shadow-md'
                            : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={person.photoUrl}
                            alt={person.name}
                            className="w-11 h-11 rounded-xl object-cover border border-slate-700 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">{person.name}</p>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                              <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-200 font-bold">
                                {formatBirthdayDay(person.birthDay)} {formatBirthdayMonthShort(person.birthMonth)}
                              </span>
                              <span className="truncate">• {grp?.name || 'Sem grupo'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadIndividualPng(person);
                            }}
                            title="Baixar arte individual PNG"
                            className="p-2 rounded-lg bg-slate-800 hover:bg-emerald-600/30 text-emerald-400 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(`Excluir aniversariante "${person.name}"?`)) {
                                onDeletePerson(person.id);
                                onRecordAudit({
                                  actorName: actorIdentity.name,
                                  actorEmail: actorIdentity.email,
                                  actorRole: actorIdentity.role,
                                  action: 'Excluiu Aniversariante',
                                  targetType: 'aniversariante',
                                  targetLabel: person.name,
                                });
                              }
                            }}
                            title="Excluir aniversariante"
                            className="p-2 rounded-lg bg-slate-800 hover:bg-rose-600/30 text-rose-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* COLUNA DIREITA: ESTÚDIO INTERATIVO (ARRRASTAR, REDIMENSIONAR PELOS PONTINHOS, GIRAR SEPARADAMENTE) */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-5">
            {!activeBackground ? (
              <div className="p-10 text-center space-y-3">
                <ImageIcon className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="text-sm font-bold text-white">Nenhum Plano de Fundo PNG cadastrado</h3>
                <p className="text-xs text-slate-400">
                  Vá para a aba <strong>Planos de Fundo & Grupos</strong> e envie um arquivo PNG com espaço transparente.
                </p>
              </div>
            ) : !activePerson ? (
              <div className="p-10 text-center space-y-3">
                <Cake className="w-10 h-10 text-pink-400/60 mx-auto" />
                <h3 className="text-sm font-bold text-white">Cadastre um aniversariante para visualizar e editar o layout</h3>
                <p className="text-xs text-slate-400">
                  Cada aniversariante gera 1 arte individual usando o plano de fundo PNG do seu grupo ({groups.map((g) => g.name).join(', ')}).
                </p>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold text-white">{activePerson.name}</h3>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {formatBirthdayDay(activePerson.birthDay)} {formatBirthdayMonthShort(activePerson.birthMonth)}
                      </span>
                      {activeGroup && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                          {activeGroup.name}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Fundo: <strong className="text-slate-200">{activeBackground.name}</strong>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => analyzeBackgroundWithAI(activeBackground)}
                      disabled={bgAiBusyId === activeBackground.id}
                      className="px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-200 text-xs font-bold flex items-center gap-1.5"
                      title="Pedir à IA para evitar elementos visuais do plano de fundo"
                    >
                      {bgAiBusyId === activeBackground.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                      <span>IA: Posicionar sem Sobrepôr</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleApplyElementsToGroup}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5"
                      title="Salvar este alinhamento como padrão de todo o grupo que usa este PNG"
                    >
                      <Layers className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Aplicar ao Grupo</span>
                    </button>
                  </div>
                </div>

                {/* Palco Interativo */}
                <BirthdayInteractiveCanvas
                  background={activeBackground}
                  person={activePerson}
                  messageText={activeMessage?.text || ''}
                  elements={activeElements}
                  selectedElement={selectedElement}
                  onSelectElement={setSelectedElement}
                  onChangeElements={handleUpdateActiveElements}
                />

                {/* Controles Precisos do Objeto Selecionado + Ajuste Fino da Foto */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                  {/* Painel do Objeto Selecionado (Data / Nome / Mensagem) */}
                  <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
                        <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Objeto Selecionado</span>
                      </span>
                      <div className="flex items-center gap-1">
                        {(['date', 'name', 'message'] as EditableBirthdayElementKey[]).map((k) => (
                          <button
                            key={k}
                            type="button"
                            onClick={() => setSelectedElement(k)}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                              selectedElement === k
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            {k === 'date' ? 'Data' : k === 'name' ? 'Nome' : 'Mensagem'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {selectedElement ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-slate-300">
                          <span>Tamanho ({Math.round(activeElements[selectedElement].scale * 100)}%)</span>
                          <input
                            type="range"
                            min={0.45}
                            max={2.4}
                            step={0.05}
                            value={activeElements[selectedElement].scale}
                            onChange={(e) =>
                              handleUpdateActiveElements({
                                ...activeElements,
                                [selectedElement]: {
                                  ...activeElements[selectedElement],
                                  scale: Number(e.target.value),
                                },
                              })
                            }
                            className="w-36 accent-indigo-500"
                          />
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-300">
                          <span>Rotação ({activeElements[selectedElement].rotation.toFixed(0)}°)</span>
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min={-45}
                              max={45}
                              step={1}
                              value={activeElements[selectedElement].rotation}
                              onChange={(e) =>
                                handleUpdateActiveElements({
                                  ...activeElements,
                                  [selectedElement]: {
                                    ...activeElements[selectedElement],
                                    rotation: Number(e.target.value),
                                  },
                                })
                              }
                              className="w-28 accent-indigo-500"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateActiveElements({
                                  ...activeElements,
                                  [selectedElement]: {
                                    ...activeElements[selectedElement],
                                    rotation: 0,
                                  },
                                })
                              }
                              title="Zerar rotação"
                              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                            >
                              <RotateCcw className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {selectedElement !== 'date' && (
                          <div className="flex items-center justify-between text-[11px] text-slate-300">
                            <span>Largura da Caixa ({Math.round(activeElements[selectedElement].widthPct)}%)</span>
                            <input
                              type="range"
                              min={25}
                              max={92}
                              step={1}
                              value={activeElements[selectedElement].widthPct}
                              onChange={(e) =>
                                handleUpdateActiveElements({
                                  ...activeElements,
                                  [selectedElement]: {
                                    ...activeElements[selectedElement],
                                    widthPct: Number(e.target.value),
                                  },
                                })
                              }
                              className="w-36 accent-indigo-500"
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-500">
                        Selecione Data, Nome ou Mensagem.
                      </p>
                    )}
                  </div>

                  {/* Painel de Grupo, Mensagem & Enquadramento da Foto na Janela Transparente */}
                  <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-white">Foto, Grupo & Mensagem</span>
                      <button
                        type="button"
                        onClick={async () => {
                          const framed = await runAiFaceFraming(activePerson.photoUrl, activeBackground);
                          onUpdatePerson({ ...activePerson, photoTransform: framed, updatedAt: new Date().toISOString() });
                        }}
                        disabled={isFramingPhoto}
                        className="px-2 py-1 rounded-lg bg-indigo-600/25 hover:bg-indigo-600/40 text-indigo-300 text-[10px] font-bold flex items-center gap-1"
                      >
                        {isFramingPhoto ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                        <span>Re-enquadrar IA</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={activePerson.groupId}
                        onChange={(e) => {
                          onUpdatePerson({ ...activePerson, groupId: e.target.value, updatedAt: new Date().toISOString() });
                        }}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-white"
                      >
                        {groups.map((g) => (
                          <option key={g.id} value={g.id}>
                            Grupo: {g.name}
                          </option>
                        ))}
                      </select>

                      <select
                        value={activePerson.messageId}
                        onChange={(e) => {
                          onUpdatePerson({ ...activePerson, messageId: e.target.value, updatedAt: new Date().toISOString() });
                        }}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-white"
                      >
                        {messages.map((m) => (
                          <option key={m.id} value={m.id}>
                            Msg: {m.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-300">
                      <span>Zoom Rosto ({Math.round((activePerson.photoTransform?.scale || 1) * 100)}%)</span>
                      <input
                        type="range"
                        min={0.9}
                        max={2.4}
                        step={0.05}
                        value={activePerson.photoTransform?.scale || 1}
                        onChange={(e) =>
                          onUpdatePerson({
                            ...activePerson,
                            photoTransform: { ...activePerson.photoTransform, scale: Number(e.target.value) },
                          })
                        }
                        className="w-32 accent-pink-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                      <label className="flex items-center justify-between gap-1">
                        <span>H:</span>
                        <input
                          type="range"
                          min={-45}
                          max={45}
                          step={1}
                          value={activePerson.photoTransform?.offsetX || 0}
                          onChange={(e) =>
                            onUpdatePerson({
                              ...activePerson,
                              photoTransform: { ...activePerson.photoTransform, offsetX: Number(e.target.value) },
                            })
                          }
                          className="w-full accent-pink-500"
                        />
                      </label>
                      <label className="flex items-center justify-between gap-1">
                        <span>V:</span>
                        <input
                          type="range"
                          min={-45}
                          max={45}
                          step={1}
                          value={activePerson.photoTransform?.offsetY || 0}
                          onChange={(e) =>
                            onUpdatePerson({
                              ...activePerson,
                              photoTransform: { ...activePerson.photoTransform, offsetY: Number(e.target.value) },
                            })
                          }
                          className="w-full accent-pink-500"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Botões Finais da Arte Individual */}
                <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => handleDownloadIndividualPng(activePerson)}
                    disabled={isExporting}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20"
                  >
                    {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    <span>Baixar Arte Individual (PNG)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePublishArtToMural(activePerson)}
                    disabled={isExporting}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/20"
                  >
                    <Send className="w-4 h-4" />
                    <span>Enviar Arte para o Mural</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SUBVIEW 2: PLANOS DE FUNDO PNG (10) & GRUPOS (10)            */}
      {/* ============================================================ */}
      {subView === 'frames' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card Planos de Fundo PNG (Limite 10) */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-pink-400" />
                  <span>Planos de Fundo PNG ({backgrounds.length}/{MAX_BACKGROUNDS})</span>
                </h3>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex-1">
                <select
                  value={selectedBgGroupId}
                  onChange={(e) => setSelectedBgGroupId(e.target.value)}
                  disabled={backgrounds.length >= MAX_BACKGROUNDS || groups.length === 0}
                  aria-label="Selecionar grupo para associar ao plano de fundo"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-semibold focus:outline-none focus:border-pink-500 disabled:opacity-50 cursor-pointer"
                >
                  {groups.length === 0 ? (
                    <option value="">Cadastre um grupo ao lado primeiro</option>
                  ) : (
                    groups.map((grp) => (
                      <option key={grp.id} value={grp.id}>
                        Grupo: {grp.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <label
                className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shrink-0 transition-all ${
                  backgrounds.length >= MAX_BACKGROUNDS || groups.length === 0
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-pink-600 hover:bg-pink-500 text-white cursor-pointer shadow-lg shadow-pink-600/20'
                }`}
              >
                {isUploadingBg ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                <span>
                  {backgrounds.length >= MAX_BACKGROUNDS ? 'Limite 10/10 Atingido' : 'Incluir Plano de Fundo PNG'}
                </span>
                <input
                  type="file"
                  accept="image/png"
                  disabled={backgrounds.length >= MAX_BACKGROUNDS || groups.length === 0 || isUploadingBg}
                  onChange={handleUploadBackgroundPng}
                  className="hidden"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[520px] overflow-y-auto pr-1">
              {backgrounds.map((bg) => {
                const linkedGroups = groups.filter((g) => g.backgroundId === bg.id);
                return (
                <div key={bg.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-3 space-y-2.5">
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-[repeating-conic-gradient(#1e293b_0%_25%,#0f172a_0%_50%)] bg-[length:16px_16px] border border-slate-800">
                    <img src={bg.imageUrl} alt={bg.name} className="w-full h-full object-contain" />
                    <div
                      className="absolute border-2 border-dashed border-emerald-400/80 bg-emerald-500/10 pointer-events-none rounded"
                      style={{
                        left: `${bg.cutoutRect.x}%`,
                        top: `${bg.cutoutRect.y}%`,
                        width: `${bg.cutoutRect.width}%`,
                        height: `${bg.cutoutRect.height}%`,
                      }}
                      title="Área transparente detectada para o rosto"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{bg.name}</p>
                      {linkedGroups.length > 0 && (
                        <p className="text-[10px] text-pink-300 font-semibold truncate">
                          Grupo: {linkedGroups.map((g) => g.name).join(', ')}
                        </p>
                      )}
                      <p className="text-[10px] text-emerald-400 truncate">
                        Janela: {bg.cutoutRect.width.toFixed(0)}% × {bg.cutoutRect.height.toFixed(0)}%
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => analyzeBackgroundWithAI(bg)}
                        disabled={bgAiBusyId === bg.id}
                        title="IA analisar área livre de elementos"
                        className="p-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/40 text-purple-300"
                      >
                        {bgAiBusyId === bg.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (backgrounds.length <= 1) {
                            notify('Mantenha pelo menos 1 plano de fundo ativo.');
                            return;
                          }
                          if (window.confirm(`Excluir plano de fundo "${bg.name}"?`)) {
                            onDeleteBackground(bg.id);
                            onRecordAudit({
                              actorName: actorIdentity.name,
                              actorEmail: actorIdentity.email,
                              actorRole: actorIdentity.role,
                              action: 'Excluiu Plano de Fundo PNG',
                              targetType: 'plano_de_fundo',
                              targetLabel: bg.name,
                            });
                          }
                        }}
                        title="Excluir plano de fundo"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600/30 text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          </div>

          {/* Card Grupos de Aniversariantes (Limite 10) */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                <span>Grupos de Aniversariantes ({groups.length}/{MAX_GROUPS})</span>
              </h3>
            </div>

            <form onSubmit={handleAddGroup} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Nome do grupo (Ex: Jovens)"
                  disabled={groups.length >= MAX_GROUPS}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                />
                <select
                  value={newGroupBgId}
                  onChange={(e) => setNewGroupBgId(e.target.value)}
                  disabled={groups.length >= MAX_GROUPS}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {backgrounds.map((bg) => (
                    <option key={bg.id} value={bg.id}>
                      Fundo: {bg.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={groups.length >= MAX_GROUPS || !newGroupName.trim()}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>{groups.length >= MAX_GROUPS ? 'Limite 10/10 Grupos Atingido' : 'Incluir Grupo'}</span>
              </button>
            </form>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {groups.map((grp) => {
                const count = people.filter((p) => p.groupId === grp.id).length;
                return (
                  <div key={grp.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        value={grp.name}
                        onChange={(e) => onUpdateGroup({ ...grp, name: e.target.value })}
                        className="bg-transparent text-sm font-bold text-white focus:outline-none focus:border-b border-indigo-500 w-full"
                      />
                      <span className="text-[11px] text-slate-400">{count} aniversariante(s) neste grupo</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={grp.backgroundId}
                        onChange={(e) => {
                          const nextBgId = e.target.value;
                          onUpdateGroup({ ...grp, backgroundId: nextBgId });
                          const bgName = backgrounds.find((b) => b.id === nextBgId)?.name || '';
                          onRecordAudit({
                            actorName: actorIdentity.name,
                            actorEmail: actorIdentity.email,
                            actorRole: actorIdentity.role,
                            action: 'Alterou Plano de Fundo do Grupo',
                            targetType: 'grupo',
                            targetLabel: `${grp.name} -> ${bgName}`,
                          });
                        }}
                        className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                      >
                        {backgrounds.map((bg) => (
                          <option key={bg.id} value={bg.id}>
                            {bg.name}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => {
                          if (groups.length <= 1) {
                            notify('Mantenha pelo menos 1 grupo ativo.');
                            return;
                          }
                          if (window.confirm(`Excluir grupo "${grp.name}"?`)) {
                            onDeleteGroup(grp.id);
                            onRecordAudit({
                              actorName: actorIdentity.name,
                              actorEmail: actorIdentity.email,
                              actorRole: actorIdentity.role,
                              action: 'Excluiu Grupo',
                              targetType: 'grupo',
                              targetLabel: grp.name,
                            });
                          }
                        }}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-rose-600/30 text-rose-400"
                        title="Excluir grupo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SUBVIEW 3: MENSAGENS DE PARABÉNS (LIMITE 10)                 */}
      {/* ============================================================ */}
      {subView === 'messages' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <MessageSquareHeart className="w-4 h-4 text-purple-400" />
              <span>{editingMsgId ? 'Editar Mensagem' : `Incluir Mensagem (${messages.length}/${MAX_MESSAGES})`}</span>
            </h3>

            <form onSubmit={handleSaveMessageForm} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Título / Identificação</label>
                <input
                  type="text"
                  value={newMsgTitle}
                  onChange={(e) => setNewMsgTitle(e.target.value)}
                  placeholder="Ex: Bênçãos e Alegria"
                  disabled={!editingMsgId && messages.length >= MAX_MESSAGES}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-purple-500 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Texto da Mensagem *</label>
                <textarea
                  rows={4}
                  required
                  value={newMsgText}
                  onChange={(e) => setNewMsgText(e.target.value)}
                  placeholder="Que Deus abençoe grandemente a sua vida com saúde, paz e muitas alegrias!"
                  disabled={!editingMsgId && messages.length >= MAX_MESSAGES}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-purple-500 disabled:opacity-50"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={!editingMsgId && messages.length >= MAX_MESSAGES}
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>
                    {editingMsgId
                      ? 'Salvar Alterações'
                      : messages.length >= MAX_MESSAGES
                      ? 'Limite 10/10 Mensagens Atingido'
                      : 'Incluir Mensagem'}
                  </span>
                </button>
                {editingMsgId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingMsgId(null);
                      setNewMsgTitle('');
                      setNewMsgText('');
                    }}
                    className="px-3 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
            <h3 className="text-sm font-extrabold text-white">Mensagens Cadastradas ({messages.length}/{MAX_MESSAGES})</h3>
            {messages.map((msg) => (
              <div key={msg.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <h4 className="text-xs font-extrabold text-purple-300">{msg.title}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{msg.text}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingMsgId(msg.id);
                      setNewMsgTitle(msg.title);
                      setNewMsgText(msg.text);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (messages.length <= 1) {
                        notify('Mantenha pelo menos 1 mensagem cadastrada.');
                        return;
                      }
                      if (window.confirm(`Excluir mensagem "${msg.title}"?`)) {
                        onDeleteMessage(msg.id);
                        onRecordAudit({
                          actorName: actorIdentity.name,
                          actorEmail: actorIdentity.email,
                          actorRole: actorIdentity.role,
                          action: 'Excluiu Mensagem de Parabéns',
                          targetType: 'mensagem',
                          targetLabel: msg.title,
                        });
                      }
                    }}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600/30 text-rose-400"
                    title="Excluir mensagem"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SUBVIEW 4: REGISTROS DE AUDITORIA                            */}
      {/* ============================================================ */}
      {subView === 'audit' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <History className="w-4 h-4 text-amber-400" />
                <span>Registro de Auditoria — Aniversariantes</span>
              </h3>
            </div>
            <span className="text-xs font-bold text-slate-300 bg-slate-800 px-3 py-1 rounded-full">
              {auditLogs.length} registro(s)
            </span>
          </div>

          {auditLogs.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-slate-950 rounded-2xl border border-slate-800">
              Nenhuma movimentação registrada ainda.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                    <th className="py-2.5 px-3">Data / Hora</th>
                    <th className="py-2.5 px-3">Usuário / Perfil</th>
                    <th className="py-2.5 px-3">Ação</th>
                    <th className="py-2.5 px-3">Item</th>
                    <th className="py-2.5 px-3">Detalhes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/30">
                      <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('pt-BR')}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-white block">{log.actorName}</span>
                        <span className="text-[10px] text-slate-400">
                          {log.actorRole === 'cliente' ? 'Cliente' : log.actorRole === 'social_media' ? 'Social Media' : 'Gestor'}
                          {log.actorEmail ? ` • ${log.actorEmail}` : ''}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-indigo-300">{log.action}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-200">{log.targetLabel}</td>
                      <td className="py-2.5 px-3 text-slate-400">{log.details || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
