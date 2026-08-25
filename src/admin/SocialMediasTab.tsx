// src/admin/SocialMediasTab.tsx
import React, { useState } from 'react';
import {
  ShieldAlert, DollarSign, TrendingUp, Users, HardDrive,
  CheckCircle2, Plus, Sparkles, ExternalLink, Trash2, Mail, Phone, AlertTriangle, Layers,
  Lock, Unlock, Edit3, Code2, History, BookOpen, FileSpreadsheet, BarChart2, CheckSquare, Clock, Upload, Check, X,
  MessageSquare, Send, MousePointerClick, Database
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ComposedChart, Line, Area
} from 'recharts';
import {
  getSupabaseCredentials, saveSupabaseCredentials, testSupabaseConnection,
  syncAllClientsToSupabase, syncAllPostsToSupabase, syncSocialMediaToSupabase
} from '../lib/supabase';
import { AdminTabSharedProps } from './types';

export const SocialMediasTab: React.FC<AdminTabSharedProps> = (props) => {
  const {
    clients, socialMedias,
    onAddSocialMedia, onDeleteSocialMedia, onToggleBlockSocialMedia
  } = props;

  // Estado local desta aba (antes vivia centralizado no index.tsx)
  const [isAddingSmModal, setIsAddingSmModal] = useState(false);
  const [newSmForm, setNewSmForm] = useState({
    name: '',
    email: '',
    whatsapp: '',
    socialProfile: '',
    pixKey: '',
    assignedClientIds: [] as string[],
    avatarUrl: '',
    customFeePerPost: ''
  });
  const [formError, setFormError] = useState('');

  const handleCreateSmSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSmForm.socialProfile.trim()) {
      setFormError('O Perfil da Rede Social (Instagram/LinkedIn) é um item OBRIGATÓRIO.');
      return;
    }
    const customFee = newSmForm.customFeePerPost.trim() ? parseFloat(newSmForm.customFeePerPost.replace(',', '.')) : undefined;
    onAddSocialMedia({
      ...newSmForm,
      customFeePerPost: isNaN(customFee as number) ? undefined : customFee,
      avatarUrl: newSmForm.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
    });
    setIsAddingSmModal(false);
    setNewSmForm({
      name: '', email: '', whatsapp: '', socialProfile: '', pixKey: '',
      assignedClientIds: [], avatarUrl: '', customFeePerPost: ''
    });
    setFormError('');
  };

  return (
    <>
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                <span>Cadastro & Liberação de Licenças para Social Medias</span>
              </h2>
              <p className="text-xs text-slate-400">Você como Gestor pode cadastrar e vender o sistema para múltiplos Social Medias</p>
            </div>

            <button
              onClick={() => setIsAddingSmModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Novo Social Media</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {socialMedias.map(sm => {
              const assignedClientsList = clients.filter(c => sm.assignedClientIds.includes(c.id));
              const isBlocked = sm.status === 'bloqueado';

              return (
                <div key={sm.id} className={`p-5 rounded-2xl border space-y-4 transition-all ${isBlocked ? 'bg-rose-950/30 border-rose-800/50' : 'bg-slate-950 border-slate-800'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={sm.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                        alt={sm.name}
                        className="w-12 h-12 rounded-2xl object-cover border border-slate-700"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-white text-sm">{sm.name}</h3>
                          {isBlocked && (
                            <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.2 rounded font-bold">
                              SUSPENSO
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <Mail className="w-3.5 h-3.5 text-slate-500" /> {sm.email}
                        </p>
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-emerald-400" /> {sm.whatsapp}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onToggleBlockSocialMedia(sm.id)}
                        className={`p-2 rounded-xl text-xs font-bold transition-all ${isBlocked ? 'bg-emerald-600 text-white' : 'bg-rose-950/60 text-rose-300 hover:bg-rose-600 hover:text-white'}`}
                        title={isBlocked ? 'Desbloquear Acesso' : 'Bloquear por Informações Falsas'}
                      >
                        {isBlocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      </button>

                      {socialMedias.length > 1 && (
                        <button
                          onClick={() => onDeleteSocialMedia(sm.id)}
                          className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-all"
                          title="Excluir cadastro"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Mandatory Social Profile Badge */}
                  <div className="bg-slate-900 p-3 rounded-xl border border-indigo-500/30 flex items-center justify-between gap-2">
                    <div className="text-[11px] text-slate-300 font-bold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span>Perfil Obrigatório:</span>
                    </div>
                    <a
                      href={sm.socialProfile.startsWith('http') ? sm.socialProfile : `https://${sm.socialProfile}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 truncate max-w-[200px]"
                    >
                      <span className="truncate">{sm.socialProfile}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </div>

                  {/* Pix & Clients */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-bold">Chave Pix:</span>
                      <span className="text-slate-200 font-mono text-[11px] truncate block">{sm.pixKey}</span>
                    </div>

                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-bold">Clientes Alocados ({assignedClientsList.length}):</span>
                      <span className="text-slate-200 font-bold text-[11px] truncate block">
                        {assignedClientsList.length > 0 
                          ? assignedClientsList.map(c => c.name).join(', ') 
                          : 'Nenhum cliente'}
                      </span>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      {isAddingSmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                <span>Novo Cadastro de Social Media</span>
              </h2>
              <button onClick={() => setIsAddingSmModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-xs text-rose-300 font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSmSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Nome Completo do Profissional:</label>
                <input
                  type="text"
                  required
                  value={newSmForm.name}
                  onChange={(e) => setNewSmForm({ ...newSmForm, name: e.target.value })}
                  placeholder="Ex: Camila Rocha"
                  className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Perfil de Rede Social (Instagram / LinkedIn) <span className="text-rose-400 font-extrabold">*ITEM OBRIGATÓRIO*</span>:
                </label>
                <input
                  type="text"
                  required
                  value={newSmForm.socialProfile}
                  onChange={(e) => setNewSmForm({ ...newSmForm, socialProfile: e.target.value })}
                  placeholder="instagram.com/camila_socialmedia ou linkedin.com/in/camila"
                  className="w-full bg-slate-950 text-white p-3 rounded-xl border border-indigo-500/50 focus:outline-none focus:border-indigo-500 font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">E-mail de Acesso:</label>
                  <input
                    type="email"
                    required
                    value={newSmForm.email}
                    onChange={(e) => setNewSmForm({ ...newSmForm, email: e.target.value })}
                    placeholder="camila@agencia.com"
                    className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">WhatsApp (Com DDD):</label>
                  <input
                    type="text"
                    required
                    value={newSmForm.whatsapp}
                    onChange={(e) => setNewSmForm({ ...newSmForm, whatsapp: e.target.value })}
                    placeholder="5511999998888"
                    className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Chave Pix para Pagamento de Comissão:</label>
                <input
                  type="text"
                  required
                  value={newSmForm.pixKey}
                  onChange={(e) => setNewSmForm({ ...newSmForm, pixKey: e.target.value })}
                  placeholder="E-mail, CPF ou Telefone Pix"
                  className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Taxa Customizada por Post (R$) <span className="text-slate-500 font-normal">(Opcional)</span>:
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  value={newSmForm.customFeePerPost}
                  onChange={(e) => setNewSmForm({ ...newSmForm, customFeePerPost: e.target.value })}
                  placeholder={`Em branco = usa taxa padrão R$ ${feePerPost.toFixed(2)}`}
                  className="w-full bg-slate-950 text-amber-300 font-mono font-bold p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Clientes Atribuídos Inicialmente:</label>
                <div className="space-y-1.5 max-h-32 overflow-y-auto bg-slate-950 p-3 rounded-xl border border-slate-800">
                  {clients.map(client => {
                    const isChecked = newSmForm.assignedClientIds.includes(client.id);
                    return (
                      <label key={client.id} className="flex items-center justify-between text-xs text-slate-300 cursor-pointer p-1 hover:bg-slate-900 rounded">
                        <span>{client.name}</span>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewSmForm({ ...newSmForm, assignedClientIds: [...newSmForm.assignedClientIds, client.id] });
                            } else {
                              setNewSmForm({ ...newSmForm, assignedClientIds: newSmForm.assignedClientIds.filter(id => id !== client.id) });
                            }
                          }}
                          className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddingSmModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20"
                >
                  Confirmar Cadastro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Upload SaaS Payment Proof */}
    </>
  );
};
