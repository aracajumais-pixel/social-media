// src/admin/ClientsTab.tsx
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

export const ClientsTab: React.FC<AdminTabSharedProps> = (props) => {
  const {
    clients, socialMedias, onToggleBlockClient, onAddClient
  } = props;

  // Estado local desta aba (antes vivia centralizado no index.tsx)
  const [isAddingClientModal, setIsAddingClientModal] = useState(false);
  const [newClientForm, setNewClientForm] = useState({
    name: '',
    companyName: '',
    cnpj: '',
    address: '',
    contactName: '',
    whatsappNumber: '',
    email: '',
    pricePerPost: 150,
    googleDriveFolderUrl: '',
    logoUrl: '',
    assignedSocialMediaId: socialMedias[0]?.id || ''
  });

  return (
    <>
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-cyan-400" />
                  <span>Acompanhamento Auditável por Perfil de Empresa (Clientes)</span>
                </h2>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold">
                  ⚡ Sync Supabase Ativo
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Inspeção direta de mídias, redes vinculadas, capacidade do Google Drive e sincronia automática com Supabase DB</p>
            </div>

            <button
              onClick={() => setIsAddingClientModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Novo Cliente</span>
            </button>
          </div>

          <div className="bg-slate-950 p-3 rounded-2xl border border-indigo-500/30 text-xs text-slate-300 max-w-md my-4">
            <span className="font-bold text-indigo-400 flex items-center gap-1.5 mb-1">
              <HardDrive className="w-4 h-4 text-indigo-400" />
              <span>Fluxo de Criação do Google Drive:</span>
            </span>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Você como <strong>Gestor</strong> ou o Social Media cadastra a URL da pasta mãe no painel de Configurações do Cliente. O sistema gerencia a capacidade de armazenamento em GB para cada cliente.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clients.map(client => {
              const clientPosts = posts.filter(p => p.clientProjectId === client.id);
              const published = clientPosts.filter(p => p.isPublished).length;
              const assignedSm = socialMedias.find(sm => sm.id === client.assignedSocialMediaId);
              const isBlocked = client.status === 'bloqueado';

              const usedGB = client.driveStorageUsedGB || 4.2;
              const limitGB = client.driveStorageLimitGB || 15.0;
              const pctUsed = Math.min(100, Math.round((usedGB / limitGB) * 100));

              return (
                <div key={client.id} className={`p-5 rounded-2xl border space-y-4 transition-all ${isBlocked ? 'bg-rose-950/30 border-rose-800/50' : 'bg-slate-950 border-slate-800'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img src={client.logoUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80'} alt="" className="w-10 h-10 rounded-xl object-cover border border-slate-700" />
                      <div>
                        <h3 className="font-bold text-white text-sm">{client.name}</h3>
                        <p className="text-[11px] text-slate-400">{client.companyName}</p>
                        <p className="text-[10px] text-slate-500 font-mono">CNPJ: {client.cnpj}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => onToggleBlockClient(client.id)}
                      className={`p-2 rounded-xl text-xs font-bold transition-all ${isBlocked ? 'bg-emerald-600 text-white' : 'bg-rose-950/60 text-rose-300 hover:bg-rose-600 hover:text-white'}`}
                      title={isBlocked ? 'Desbloquear Empresa' : 'Bloquear Empresa'}
                    >
                      {isBlocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Volume stats */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-400">Total Posts</div>
                      <div className="text-sm font-black text-white">{clientPosts.length}</div>
                    </div>
                    <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-400">Publicados</div>
                      <div className="text-sm font-black text-emerald-400">{published}</div>
                    </div>
                    <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-400">Preço/Post</div>
                      <div className="text-sm font-black text-amber-300 font-mono">R${client.pricePerPost}</div>
                    </div>
                  </div>

                  {/* Drive Capacity Meter */}
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-slate-300 flex items-center gap-1">
                        <HardDrive className="w-3.5 h-3.5 text-cyan-400" /> Capacidade Drive:
                      </span>
                      <span className="text-cyan-300 font-mono">
                        {usedGB.toFixed(1)} GB / {limitGB.toFixed(1)} GB ({pctUsed}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          pctUsed > 80 ? 'bg-rose-500' : pctUsed > 50 ? 'bg-amber-400' : 'bg-cyan-400'
                        }`}
                        style={{ width: `${pctUsed}%` }}
                      />
                    </div>
                  </div>

                  {/* Drive Link & Assigned Social Media */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-300 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-slate-400 font-bold">Social Media Responsável:</span>
                      <span className="font-bold text-purple-300">{assignedSm?.name || 'Não atribuído'}</span>
                    </div>

                    {client.googleDriveFolderUrl && (
                      <a
                        href={client.googleDriveFolderUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between text-slate-300 bg-slate-900 p-2.5 rounded-xl border border-indigo-500/30 hover:border-indigo-500 text-xs font-bold text-indigo-400"
                      >
                        <span className="flex items-center gap-1.5">
                          <HardDrive className="w-4 h-4 text-indigo-400" />
                          <span>Google Drive do Cliente</span>
                        </span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      {/* Modal: Cadastrar Novo Cliente */}
      {isAddingClientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-cyan-400" />
                <span>Cadastrar Novo Cliente (Persistência no Supabase)</span>
              </h3>
              <button onClick={() => setIsAddingClientModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newClientForm.name.trim()) return;
                const created: ClientProject = {
                  id: `client-${Date.now()}`,
                  name: newClientForm.name.trim(),
                  companyName: newClientForm.companyName.trim() || newClientForm.name.trim(),
                  cnpj: newClientForm.cnpj.trim() || '00.000.000/0001-00',
                  address: newClientForm.address.trim() || 'Endereço Comercial',
                  contactName: newClientForm.contactName.trim() || 'Contato Principal',
                  whatsappNumber: newClientForm.whatsappNumber.trim() || '5511999998888',
                  email: newClientForm.email.trim() || 'contato@cliente.com',
                  pricePerPost: Number(newClientForm.pricePerPost) || 150,
                  metricsAccess: 'ambos',
                  googleDriveFolderUrl: newClientForm.googleDriveFolderUrl.trim(),
                  logoUrl: newClientForm.logoUrl.trim(),
                  activeSocialNetworks: ['instagram', 'facebook'],
                  assignedSocialMediaId: newClientForm.assignedSocialMediaId || undefined,
                  status: 'ativo',
                  driveStorageUsedGB: 0.5,
                  driveStorageLimitGB: 15.0
                };
                try {
                  if (onAddClient) {
                    onAddClient(created);
                  }
                } catch (err) {
                  console.error('Erro ao adicionar cliente:', err);
                } finally {
                  setIsAddingClientModal(false);
                  setNewClientForm({
                    name: '',
                    companyName: '',
                    cnpj: '',
                    address: '',
                    contactName: '',
                    whatsappNumber: '',
                    email: '',
                    pricePerPost: 150,
                    googleDriveFolderUrl: '',
                    logoUrl: '',
                    assignedSocialMediaId: socialMedias[0]?.id || ''
                  });
                }
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block text-slate-300 font-bold mb-1">Nome Fantasia do Cliente *:</label>
                <input
                  type="text"
                  required
                  value={newClientForm.name}
                  onChange={(e) => setNewClientForm({ ...newClientForm, name: e.target.value })}
                  placeholder="Ex: Padaria & Confeitaria Solar"
                  className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Razão Social:</label>
                  <input
                    type="text"
                    value={newClientForm.companyName}
                    onChange={(e) => setNewClientForm({ ...newClientForm, companyName: e.target.value })}
                    placeholder="Ex: Solar Alimentos LTDA"
                    className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">CNPJ / CPF:</label>
                  <input
                    type="text"
                    value={newClientForm.cnpj}
                    onChange={(e) => setNewClientForm({ ...newClientForm, cnpj: e.target.value })}
                    placeholder="00.000.000/0001-00"
                    className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Contato Principal:</label>
                  <input
                    type="text"
                    value={newClientForm.contactName}
                    onChange={(e) => setNewClientForm({ ...newClientForm, contactName: e.target.value })}
                    placeholder="Ex: Carlos Silva"
                    className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">WhatsApp (com DDD):</label>
                  <input
                    type="text"
                    value={newClientForm.whatsappNumber}
                    onChange={(e) => setNewClientForm({ ...newClientForm, whatsappNumber: e.target.value })}
                    placeholder="5511999998888"
                    className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">E-mail do Cliente:</label>
                  <input
                    type="email"
                    value={newClientForm.email}
                    onChange={(e) => setNewClientForm({ ...newClientForm, email: e.target.value })}
                    placeholder="contato@cliente.com"
                    className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Valor/Post (R$):</label>
                  <input
                    type="number"
                    value={newClientForm.pricePerPost}
                    onChange={(e) => setNewClientForm({ ...newClientForm, pricePerPost: Number(e.target.value) })}
                    className="w-full bg-slate-950 text-emerald-400 font-bold p-3 rounded-xl border border-slate-800 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Link da Logomarca (Drive ou Imagem Direct):</label>
                <input
                  type="url"
                  value={newClientForm.logoUrl}
                  onChange={(e) => setNewClientForm({ ...newClientForm, logoUrl: e.target.value })}
                  placeholder="https://drive.google.com/file/d/... ou https://..."
                  className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">URL Pasta Google Drive:</label>
                <input
                  type="url"
                  value={newClientForm.googleDriveFolderUrl}
                  onChange={(e) => setNewClientForm({ ...newClientForm, googleDriveFolderUrl: e.target.value })}
                  placeholder="https://drive.google.com/drive/folders/..."
                  className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Social Media Responsável:</label>
                <select
                  value={newClientForm.assignedSocialMediaId}
                  onChange={(e) => setNewClientForm({ ...newClientForm, assignedSocialMediaId: e.target.value })}
                  className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="">Nenhum Alocado</option>
                  {socialMedias.map(sm => (
                    <option key={sm.id} value={sm.id}>{sm.name} ({sm.email})</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddingClientModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-cyan-600/20"
                >
                  Salvar Cliente e Sincronizar Supabase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </>
  );
};
