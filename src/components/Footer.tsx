import React, { useState } from 'react';
import { X, ShieldCheck, FileText, Info, Mail, Cookie, Sparkles } from 'lucide-react';

interface InfoModalState {
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

export const Footer: React.FC = () => {
  const [modalData, setModalData] = useState<InfoModalState | null>(null);

  const openInfo = (title: string, icon: React.ReactNode, content: React.ReactNode) => {
    setModalData({ title, icon, content });
  };

  return (
    <>
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-8 px-4 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col items-center justify-center gap-4 text-center">
          
          {/* Main copyright line */}
          <div className="flex items-center justify-center gap-2 text-sm font-medium text-slate-300">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>social media 5.0</span>
            <span className="text-slate-600">•</span>
            <span>© 2026</span>
            <span className="text-slate-600">•</span>
            <span>Todos os direitos reservados</span>
          </div>

          {/* Links & Version line */}
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs text-slate-400">
            <button
              onClick={() =>
                openInfo(
                  'Sobre o Social Media 5.0',
                  <Info className="w-5 h-5 text-indigo-400" />,
                  (
                    <div className="space-y-3 text-slate-300 text-sm">
                      <p>
                        O <strong>Social Media 5.0</strong> é uma plataforma avançada de gestão, planejamento e aprovação de conteúdo para agências e gestores de redes sociais.
                      </p>
                      <p>
                        Desenvolvido com foco em produtividade, métricas integradas, workflow colaborativo com clientes e automação de relatórios.
                      </p>
                    </div>
                  )
                )
              }
              className="hover:text-indigo-400 transition-colors cursor-pointer"
            >
              Sobre
            </button>

            <span className="text-slate-700">|</span>

            <button
              onClick={() =>
                openInfo(
                  'Política de Privacidade',
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />,
                  (
                    <div className="space-y-3 text-slate-300 text-sm">
                      <p>
                        Sua privacidade é prioridade. Todos os dados de clientes, credenciais e mídias enviadas são tratados sob rigorosos padrões de segurança e criptografia.
                      </p>
                      <p>
                        Não compartilhamos informações corporativas nem dados de redes sociais com terceiros sem consentimento explícito.
                      </p>
                    </div>
                  )
                )
              }
              className="hover:text-indigo-400 transition-colors cursor-pointer"
            >
              Política de Privacidade
            </button>

            <span className="text-slate-700">|</span>

            <button
              onClick={() =>
                openInfo(
                  'Termos de Uso',
                  <FileText className="w-5 h-5 text-blue-400" />,
                  (
                    <div className="space-y-3 text-slate-300 text-sm">
                      <p>
                        Ao utilizar a plataforma Social Media 5.0, você concorda com os termos de prestação de serviços, regras de agendamento e uso ético das automações.
                      </p>
                      <p>
                        O sistema reserva-se o direito de realizar atualizações contínuas para melhoria da experiência do usuário.
                      </p>
                    </div>
                  )
                )
              }
              className="hover:text-indigo-400 transition-colors cursor-pointer"
            >
              Termos de Uso
            </button>

            <span className="text-slate-700">|</span>

            <button
              onClick={() =>
                openInfo(
                  'Contato & Suporte',
                  <Mail className="w-5 h-5 text-purple-400" />,
                  (
                    <div className="space-y-3 text-slate-300 text-sm">
                      <p>Need help or have questions?</p>
                      <p>
                        Entre em contato com nossa equipe de atendimento através do e-mail oficial de suporte ou pelo canal do WhatsApp do gestor.
                      </p>
                    </div>
                  )
                )
              }
              className="hover:text-indigo-400 transition-colors cursor-pointer"
            >
              Contato
            </button>

            <span className="text-slate-700">|</span>

            <button
              onClick={() =>
                openInfo(
                  'Política de Cookies',
                  <Cookie className="w-5 h-5 text-amber-400" />,
                  (
                    <div className="space-y-3 text-slate-300 text-sm">
                      <p>
                        Utilizamos cookies e armazenamento local exclusivamente para manter sua sessão ativa, armazenar suas preferências de visualização e acelerar o carregamento da plataforma.
                      </p>
                    </div>
                  )
                )
              }
              className="hover:text-indigo-400 transition-colors cursor-pointer"
            >
              Política de Cookies
            </button>

            <span className="text-slate-700">|</span>

            <span className="bg-slate-800 text-indigo-300 px-2 py-0.5 rounded-full font-mono text-[11px] border border-slate-700">
              Versão 1.0.0
            </span>
          </div>

        </div>
      </footer>

      {/* Info Modal */}
      {modalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative text-slate-100">
            <button
              onClick={() => setModalData(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-slate-800 border border-slate-700 rounded-xl">
                {modalData.icon}
              </div>
              <h3 className="text-lg font-bold text-white">{modalData.title}</h3>
            </div>

            <div className="mb-6">{modalData.content}</div>

            <div className="flex justify-end">
              <button
                onClick={() => setModalData(null)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium text-sm transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
