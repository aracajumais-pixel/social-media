import React from 'react';
import { ClientProject } from '../types';
import { X, HardDrive, FolderCheck, ExternalLink, ShieldCheck, FileCheck, Lightbulb } from 'lucide-react';

interface StorageDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: ClientProject;
}

export const StorageDriveModal: React.FC<StorageDriveModalProps> = ({
  isOpen,
  onClose,
  client
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl my-8 p-6 space-y-6">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-600/20 text-emerald-300 border border-emerald-500/30">
              <HardDrive className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Central do Google Drive do Cliente</h2>
              <p className="text-xs text-slate-400">Armazenamento temporário e definitivo de mídias</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 text-xs">
          
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-sm">{client.name}</span>
              <span className="text-[11px] text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-full font-bold border border-emerald-800/40">
                Google Drive Conectado
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
              Todos os arquivos pesados, vídeos em 4K e fotos brutas ficam organizados na pasta oficial do Google Drive desta empresa cliente, garantindo privacidade e sem poluir o aplicativo.
            </p>
          </div>

          {/* Folder Structure */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-300">Estrutura de Pastas Automatizada:</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  <div className="text-[10px] text-slate-400">Histórico de fechamentos</div>
                </div>
              </div>
            </div>
          </div>

          {/* Open Link */}
          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <a
              href={client.googleDriveFolderUrl || 'https://drive.google.com'}
              target="_blank"
              rel="noreferrer"
              className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
            >
              <span>Acessar Pasta no Google Drive</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

        </div>

      </div>
    </div>
  );
};
