import React, { useState, useEffect } from 'react';
import { ClientProject } from '../types';
import { 
  X, 
  HardDrive, 
  FolderCheck, 
  ExternalLink, 
  ShieldCheck, 
  FileCheck, 
  Lightbulb, 
  Sparkles, 
  Copy, 
  Check, 
  Settings, 
  Play, 
  Loader2, 
  AlertCircle,
  FolderPlus,
  HelpCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { 
  APPS_SCRIPT_TEMPLATE, 
  getSavedDriveWebhookUrl, 
  saveDriveWebhookUrl, 
  createDriveFolderForClient,
  DriveFolderCreationResult
} from '../utils/driveAutomation';

interface StorageDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: ClientProject;
  onUpdateClient?: (updated: ClientProject) => void;
}

export const StorageDriveModal: React.FC<StorageDriveModalProps> = ({
  isOpen,
  onClose,
  client,
  onUpdateClient
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'status' | 'automacao' | 'tutorial'>('status');
  const [webhookUrl, setWebhookUrl] = useState(() => getSavedDriveWebhookUrl());
  const [isSavingWebhook, setIsSavingWebhook] = useState(false);
  const [webhookSavedSuccess, setWebhookSavedSuccess] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  // Automation Execution State
  const [isCreatingFolders, setIsCreatingFolders] = useState(false);
  const [creationResult, setCreationResult] = useState<DriveFolderCreationResult | null>(null);
  const [creationError, setCreationError] = useState<string | null>(null);

  const handleSaveWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingWebhook(true);
    saveDriveWebhookUrl(webhookUrl);
    setTimeout(() => {
      setIsSavingWebhook(false);
      setWebhookSavedSuccess(true);
      setTimeout(() => setWebhookSavedSuccess(false), 3000);
    }, 400);
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_TEMPLATE);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 3000);
  };

  const handleExecuteAutomation = async () => {
    if (!client || !client.name) return;
    setIsCreatingFolders(true);
    setCreationResult(null);
    setCreationError(null);

    try {
      const result = await createDriveFolderForClient(client.name, webhookUrl);

      if (result.status === 'success' && result.folderUrl) {
        setCreationResult(result);

        // Se tiver callback para atualizar o cliente, salva o link novo da pasta
        if (onUpdateClient) {
          const updatedClient: ClientProject = {
            ...client,
            googleDriveFolderUrl: result.folderUrl
          };
          onUpdateClient(updatedClient);
        }
      } else {
        setCreationError(result.message || 'Ocorreu um erro ao criar as pastas no Google Drive.');
      }
    } catch (err: any) {
      setCreationError(
        err.message || 'Falha na conexão com o Webhook. Verifique se o script foi implantado como "Qualquer pessoa" (Anyone).'
      );
    } finally {
      setIsCreatingFolders(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl my-8 p-6 space-y-5">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-600/20 text-emerald-300 border border-emerald-500/30">
              <HardDrive className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Central do Google Drive</span>
                <span className="text-[11px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 rounded-full font-mono">
                  {client.name}
                </span>
              </h2>
              <p className="text-xs text-slate-400">Armazenamento organizado e automação 100% gratuita</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800 gap-1 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('status')}
            className={`flex-1 py-2 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'status'
                ? 'bg-slate-800 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderCheck className="w-4 h-4 text-emerald-400" />
            <span>Estrutura & Link</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('automacao')}
            className={`flex-1 py-2 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'automacao'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Automação (1 Clique)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tutorial')}
            className={`flex-1 py-2 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'tutorial'
                ? 'bg-slate-800 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            <span>Passo a Passo Grátis</span>
          </button>
        </div>

        {/* TAB 1: STATUS & LINKS */}
        {activeTab === 'status' && (
          <div className="space-y-4 text-xs">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">{client.name}</span>
                <span className={`text-[11px] px-2.5 py-1 rounded-full font-bold border ${
                  client.googleDriveFolderUrl
                    ? 'text-emerald-400 bg-emerald-950 border-emerald-800/40'
                    : 'text-amber-400 bg-amber-950 border-amber-800/40'
                }`}>
                  {client.googleDriveFolderUrl ? 'Google Drive Vinculado' : 'Sem Link Definido'}
                </span>
              </div>

              {/* Storage Progress Bar */}
              <div className="space-y-1 bg-slate-900 p-3 rounded-xl border border-slate-800">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-slate-300">Volume de Armazenamento Ocupado:</span>
                  <span className="text-cyan-300 font-mono">
                    {(client.driveStorageUsedGB || 4.2).toFixed(1)} GB / {(client.driveStorageLimitGB || 15.0).toFixed(1)} GB (
                    {(((client.driveStorageUsedGB || 4.2) / (client.driveStorageLimitGB || 15.0)) * 100).toFixed(0)}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (((client.driveStorageUsedGB || 4.2) / (client.driveStorageLimitGB || 15.0)) * 100))}%` }}
                  />
                </div>
              </div>

              <p className="text-slate-300 leading-relaxed text-[11px]">
                Todos os arquivos pesados, vídeos e fotos ficam organizados na pasta oficial do Google Drive do cliente, mantendo o sistema leve e rápido.
              </p>
            </div>

            {/* Folder Structure Preview */}
            <div className="space-y-2">
              <h3 className="font-bold text-slate-300">Estrutura de Pastas Padrão:</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center gap-3">
                  <FolderCheck className="w-5 h-5 text-amber-400 shrink-0" />
                  <div>
                    <div className="font-bold text-white">/01_Rascunhos</div>
                    <div className="text-[10px] text-slate-400">Artes e mídias em aprovação</div>
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center gap-3">
                  <FileCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <div className="font-bold text-white">/02_Aprovados</div>
                    <div className="text-[10px] text-slate-400">Mídias prontas para agendamento</div>
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center gap-3">
                  <Lightbulb className="w-5 h-5 text-purple-400 shrink-0" />
                  <div>
                    <div className="font-bold text-white">/03_Inspirações_Cliente</div>
                    <div className="text-[10px] text-slate-400">Modelos e referências enviadas</div>
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0" />
                  <div>
                    <div className="font-bold text-white">/04_Recibos_PDF</div>
                    <div className="text-[10px] text-slate-400">Histórico de fechamentos e comprovantes</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('automacao')}
                className="px-4 py-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-bold text-xs flex items-center gap-2 transition-all"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Automatizar Criação de Pastas</span>
              </button>

              <a
                href={client.googleDriveFolderUrl || 'https://drive.google.com'}
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
              >
                <span>Acessar Pasta no Google Drive</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        )}

        {/* TAB 2: AUTOMAÇÃO 1-CLIQUE */}
        {activeTab === 'automacao' && (
          <div className="space-y-4 text-xs">
            
            {/* Webhook Config Form */}
            <form onSubmit={handleSaveWebhook} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-200 flex items-center gap-2">
                  <Settings className="w-4 h-4 text-indigo-400" />
                  <span>URL do Webhook do Google Apps Script:</span>
                </label>
                {webhookSavedSuccess && (
                  <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Salvo!
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://script.google.com/macros/s/.../exec"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="flex-1 bg-slate-900 text-white px-3 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
                />
                <button
                  type="submit"
                  disabled={isSavingWebhook}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl transition-all"
                >
                  {isSavingWebhook ? 'Salvando...' : 'Salvar URL'}
                </button>
              </div>

              <p className="text-[11px] text-slate-400">
                Ainda não tem a URL? Veja na aba <strong>"Passo a Passo Grátis"</strong> como criar o seu script gratuito em 2 minutos.
              </p>
            </form>

            {/* Execute Automation Card */}
            <div className="bg-gradient-to-br from-indigo-950/40 via-slate-950 to-purple-950/40 p-5 rounded-2xl border border-indigo-500/30 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <FolderPlus className="w-4 h-4 text-indigo-400" />
                    <span>Criar Estrutura de Pastas para: <strong className="text-indigo-300">{client.name}</strong></span>
                  </h4>
                  <p className="text-[11px] text-slate-300">
                    O script criará a pasta principal <strong>"{client.name}"</strong> e as 5 subpastas (Rascunhos, Aprovados, Inspirações, Recibos e Identidade Visual) no seu Google Drive e vinculará o link ao cliente.
                  </p>
                </div>
              </div>

              {/* Feedback messages */}
              {creationError && (
                <div className="p-3 bg-red-950/60 border border-red-800/60 rounded-xl text-red-300 flex items-start gap-2 text-[11px]">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                  <div>
                    <strong>Erro na automação:</strong> {creationError}
                  </div>
                </div>
              )}

              {creationResult && creationResult.status === 'success' && (
                <div className="p-4 bg-emerald-950/60 border border-emerald-800/60 rounded-xl space-y-2 text-emerald-200 animate-fadeIn">
                  <div className="flex items-center gap-2 font-bold text-sm text-emerald-300">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Pastas Criadas com Sucesso no Google Drive!</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    A estrutura de pastas foi gerada e o link oficial já foi vinculado ao cliente <strong>{client.name}</strong>.
                  </p>
                  {creationResult.folderUrl && (
                    <div className="pt-1">
                      <a
                        href={creationResult.folderUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 underline"
                      >
                        Abrir Pasta Criada no Google Drive
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Action Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleExecuteAutomation}
                  disabled={isCreatingFolders || !webhookUrl.trim()}
                  className={`px-5 py-3 rounded-2xl font-extrabold text-xs flex items-center gap-2 shadow-lg transition-all ${
                    !webhookUrl.trim()
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : isCreatingFolders
                      ? 'bg-indigo-700 text-white cursor-wait'
                      : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-600/30 hover:scale-[1.02]'
                  }`}
                >
                  {isCreatingFolders ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Criando pastas no Google Drive...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current text-white" />
                      <span>Gerar Pastas no Google Drive Agora</span>
                    </>
                  )}
                </button>
              </div>

            </div>

          </div>
        )}

        {/* TAB 3: TUTORIAL PASSO A PASSO & CÓDIGO */}
        {activeTab === 'tutorial' && (
          <div className="space-y-4 text-xs max-h-[60vh] overflow-y-auto pr-1">
            
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Como Configurar o Script Gratuito em 3 Passos:</span>
              </h4>

              <ol className="list-decimal list-inside space-y-2 text-slate-300 text-[11px] leading-relaxed">
                <li>
                  Acesse o site gratuito: <a href="https://script.google.com/" target="_blank" rel="noreferrer" className="text-indigo-400 font-bold underline">script.google.com</a> (conecte com sua conta Google onde quer criar as pastas).
                </li>
                <li>
                  Clique em <strong>"Novo projeto"</strong>, apague qualquer código existente e cole o código abaixo.
                </li>
                <li>
                  No topo direito, clique em <strong>Implantar &gt; Nova implantação</strong>:
                  <ul className="list-disc list-inside pl-4 mt-1 space-y-1 text-slate-400">
                    <li>Selecione o tipo: <strong>App da Web</strong></li>
                    <li>Executar como: <strong>Eu (seu e-mail)</strong></li>
                    <li>Quem tem acesso: <strong>Qualquer pessoa (Anyone)</strong></li>
                  </ul>
                </li>
                <li>
                  Clique em <strong>Implantar</strong>, autorize as permissões do Drive e copie a <strong>URL do app da Web</strong> (termina com <code>/exec</code>).
                </li>
                <li>
                  Cole essa URL na aba <strong>"Automação (1 Clique)"</strong> aqui no sistema e salve!
                </li>
              </ol>
            </div>

            {/* Code Box with Copy Button */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300">Código do Google Apps Script (100% Gratuito):</span>
                <button
                  type="button"
                  onClick={handleCopyScript}
                  className="px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1.5 transition-all text-[11px]"
                >
                  {copiedScript ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedScript ? 'Código Copiado!' : 'Copiar Código'}</span>
                </button>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-56 leading-relaxed">
                <pre>{APPS_SCRIPT_TEMPLATE}</pre>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
