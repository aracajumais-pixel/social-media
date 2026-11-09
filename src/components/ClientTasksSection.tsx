import React, { useState } from 'react';
import { ClientTask, TaskStatus, UserRole, ClientProject, PostItem } from '../types';
import { 
  ClipboardList, Plus, Calendar, Clock, CheckCircle2, AlertCircle, 
  Search, Sparkles, ArrowRight, Edit3, Trash2, X, Check, Building2, UserCheck, Layers, ExternalLink
} from 'lucide-react';

interface ClientTasksSectionProps {
  tasks: ClientTask[];
  client: ClientProject;
  currentUserRole: UserRole;
  posts: PostItem[];
  onAddTask: (task: Omit<ClientTask, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateTask: (task: ClientTask) => void;
  onDeleteTask: (taskId: string) => void;
  onConvertTaskToPost: (task: ClientTask) => void;
  onOpenPostDetails?: (postId: string) => void;
}

export const ClientTasksSection: React.FC<ClientTasksSectionProps> = ({
  tasks,
  client,
  currentUserRole,
  posts,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onConvertTaskToPost,
  onOpenPostDetails
}) => {
  const [statusFilter, setStatusFilter] = useState<'todos' | TaskStatus>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ClientTask | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<ClientTask | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDeadline, setFormDeadline] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().slice(0, 16);
  });
  const [formStatus, setFormStatus] = useState<TaskStatus>('novo');

  // Filter tasks for this client
  const clientTasks = tasks.filter(t => t.clientProjectId === client.id);

  const filteredTasks = clientTasks.filter(t => {
    const matchesStatus = statusFilter === 'todos' 
      ? true 
      : statusFilter === 'atendido'
      ? (t.status === 'atendido' || t.status === 'concluido')
      : t.status === statusFilter;

    const matchesSearch = searchQuery.trim() === ''
      ? true
      : t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const countNovos = clientTasks.filter(t => t.status === 'novo').length;
  const countEmAndamento = clientTasks.filter(t => t.status === 'em_andamento').length;
  const countAtendidos = clientTasks.filter(t => t.status === 'atendido' || t.status === 'concluido').length;

  const handleOpenCreateModal = () => {
    setEditingTask(null);
    setFormTitle('');
    setFormDescription('');
    const d = new Date();
    d.setDate(d.getDate() + 3);
    setFormDeadline(d.toISOString().slice(0, 16));
    setFormStatus('novo');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (task: ClientTask) => {
    setEditingTask(task);
    setFormTitle(task.title);
    setFormDescription(task.description);
    setFormDeadline(task.deadline ? task.deadline.slice(0, 16) : '');
    setFormStatus(task.status);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDescription.trim()) return;

    if (editingTask) {
      onUpdateTask({
        ...editingTask,
        title: formTitle.trim(),
        description: formDescription.trim(),
        deadline: formDeadline,
        status: formStatus,
        updatedAt: new Date().toISOString()
      });
    } else {
      const creatorName = currentUserRole === 'cliente'
        ? (client.contactName || 'Cliente')
        : currentUserRole === 'social_media' ? 'Social Media' : 'Gestor';

      onAddTask({
        clientProjectId: client.id,
        title: formTitle.trim(),
        description: formDescription.trim(),
        deadline: formDeadline,
        status: 'novo',
        createdByRole: currentUserRole,
        createdByName: creatorName
      });
    }

    handleCloseModal();
  };

  const handleQuickStatusChange = (task: ClientTask, newStatus: TaskStatus) => {
    onUpdateTask({
      ...task,
      status: newStatus,
      updatedAt: new Date().toISOString()
    });
  };

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'novo':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5" />
            <span>Novo</span>
          </span>
        );
      case 'em_andamento':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Em Andamento</span>
          </span>
        );
      case 'atendido':
      case 'concluido':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{status === 'concluido' ? 'Concluído' : 'Atendido'}</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header da Seção de Tarefas */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/40 to-indigo-950/50 border border-amber-500/30 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-600/20 border border-amber-500/40 flex items-center justify-center shrink-0">
            <ClipboardList className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full">
                Solicitações & Briefings do Cliente
              </span>
              <span className="text-xs text-slate-400">• {client.name}</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white mt-0.5">
              Tarefas Solicitadas pelo Cliente
            </h2>
            <p className="text-xs text-slate-300">
              O cliente solicita a demanda com prazo e descrição. O Social Media pode converter diretamente em um projeto de postagem!
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-600/25 transition-all shrink-0 hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          <span>+ Solicitar Nova Tarefa</span>
        </button>
      </div>

      {/* Toolbar: Filtros & Busca */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-xl">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar nas tarefas e descrições..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 text-xs text-white pl-10 pr-4 py-2.5 rounded-2xl border border-slate-800 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <button
            type="button"
            onClick={() => setStatusFilter('todos')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              statusFilter === 'todos'
                ? 'bg-amber-600 text-slate-950 font-black'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Todas ({clientTasks.length})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('novo')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === 'novo'
                ? 'bg-amber-500 text-slate-950 font-black'
                : 'bg-slate-950 text-amber-400 hover:text-white border border-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Novas ({countNovos})</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('em_andamento')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === 'em_andamento'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-950 text-indigo-400 hover:text-white border border-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Em Andamento ({countEmAndamento})</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('atendido')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === 'atendido'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-950 text-emerald-400 hover:text-white border border-slate-800'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Atendidas ({countAtendidos})</span>
          </button>
        </div>

      </div>

      {/* Grid de Tarefas */}
      {filteredTasks.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
          <ClipboardList className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-slate-300 font-bold text-sm">Nenhuma tarefa encontrada</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {clientTasks.length === 0
              ? 'O cliente ainda não cadastrou tarefas. Clique em "+ Solicitar Nova Tarefa" para registrar a primeira solicitação.'
              : 'Nenhuma tarefa corresponde ao filtro atual.'}
          </p>
          {clientTasks.length === 0 && (
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Primeira Solicitação</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTasks.map(task => {
            const linkedPost = task.linkedPostId ? posts.find(p => p.id === task.linkedPostId) : null;
            const isCompleted = task.status === 'atendido' || task.status === 'concluido';
            const deadlineDate = task.deadline ? new Date(task.deadline) : null;
            const isLate = deadlineDate && !isCompleted && deadlineDate.getTime() < Date.now();

            return (
              <div
                key={task.id}
                className={`bg-slate-900 border rounded-3xl p-5 flex flex-col justify-between space-y-4 shadow-xl transition-all hover:border-slate-700 ${
                  isCompleted
                    ? 'border-emerald-500/30 bg-slate-900/90'
                    : task.status === 'em_andamento'
                    ? 'border-indigo-500/40 bg-slate-900'
                    : 'border-amber-500/40 bg-slate-900'
                }`}
              >
                <div className="space-y-3">
                  
                  {/* Top Bar on Task: Status & Deadline */}
                  <div className="flex items-center justify-between gap-2">
                    {getStatusBadge(task.status)}

                    {task.deadline && (
                      <div className={`text-[11px] font-semibold flex items-center gap-1 px-2.5 py-1 rounded-xl border ${
                        isLate
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : isCompleted
                          ? 'bg-slate-950 text-slate-400 border-slate-800'
                          : 'bg-slate-950 text-amber-300 border-slate-800'
                      }`}>
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                          {deadlineDate?.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isLate && <span className="text-[10px] font-black uppercase text-rose-400 ml-1">Atrasado</span>}
                      </div>
                    )}
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-base font-bold text-white leading-tight">
                      {task.title}
                    </h3>
                    <p className="text-xs text-slate-300 mt-2 leading-relaxed whitespace-pre-line bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80">
                      {task.description}
                    </p>
                  </div>

                  {/* Solicitante & Data */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{task.createdByName || task.createdByRole}</span>
                    </span>
                    <span>
                      {new Date(task.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>

                  {/* Projeto Vinculado (Se já existir) */}
                  {linkedPost && (
                    <div className="bg-indigo-950/30 border border-indigo-500/30 p-2.5 rounded-2xl flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <Layers className="w-4 h-4 text-indigo-400 shrink-0" />
                        <div className="min-w-0">
                          <span className="text-[10px] text-indigo-300 block font-semibold">Projeto Atrelado:</span>
                          <span className="text-white font-bold truncate block">{linkedPost.title}</span>
                        </div>
                      </div>

                      {onOpenPostDetails && (
                        <button
                          type="button"
                          onClick={() => onOpenPostDetails(linkedPost.id)}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] rounded-lg shrink-0 flex items-center gap-1"
                          title="Abrir detalhes deste post"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Ver Post</span>
                        </button>
                      )}
                    </div>
                  )}

                </div>

                {/* Ações da Tarefa */}
                <div className="pt-3 border-t border-slate-800 space-y-2">
                  
                  {/* Botão de Converter em Projeto para Social Media e Gestor */}
                  {(currentUserRole === 'social_media' || currentUserRole === 'gestor') && !isCompleted && (
                    <button
                      type="button"
                      onClick={() => onConvertTaskToPost(task)}
                      className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition-all hover:scale-[1.01]"
                      title="Transformar esta tarefa em um projeto de postagem no mural"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>
                        {task.status === 'em_andamento' ? 'Criar Novo Projeto para Esta Tarefa' : 'Transformar em Projeto'}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Quick Status Selector & Edit/Delete */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleQuickStatusChange(task, 'novo')}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                          task.status === 'novo' ? 'bg-amber-600 text-slate-950 font-black' : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                        title="Marcar como Novo"
                      >
                        Novo
                      </button>

                      <button
                        type="button"
                        onClick={() => handleQuickStatusChange(task, 'em_andamento')}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                          task.status === 'em_andamento' ? 'bg-indigo-600 text-white font-black' : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                        title="Marcar como Em Andamento"
                      >
                        Andamento
                      </button>

                      <button
                        type="button"
                        onClick={() => handleQuickStatusChange(task, 'atendido')}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                          task.status === 'atendido' || task.status === 'concluido'
                            ? 'bg-emerald-600 text-white font-black'
                            : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                        title="Marcar como Atendido"
                      >
                        Atendido
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(task)}
                        className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-amber-400 border border-slate-800 transition-colors"
                        title="Editar Tarefa"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setTaskToDelete(task)}
                        className="p-1.5 rounded-lg bg-slate-950 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-slate-800 transition-colors"
                        title="Excluir Tarefa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Criação / Edição de Tarefa */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
          onClick={handleCloseModal}
        >
          <div 
            className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-5 animate-fade-in my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-600/20 text-amber-400 border border-amber-500/30">
                  <ClipboardList className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingTask ? 'Editar Solicitação do Cliente' : 'Nova Solicitação do Cliente'}
                  </h3>
                  <p className="text-xs text-slate-400">Cliente: {client.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Título da Tarefa / Tema do Post *:</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ex: Criar post sobre promoção de Dia dos Pais"
                  className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Prazo de Entrega / Data Limite *:</label>
                <input
                  type="datetime-local"
                  required
                  value={formDeadline}
                  onChange={(e) => setFormDeadline(e.target.value)}
                  className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Descrição Detalhada / Briefing *:</label>
                <textarea
                  required
                  rows={4}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Descreva o que o cliente quer que seja comunicado, texto principal, cores ou orientações específicas..."
                  className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500 leading-relaxed"
                />
              </div>

              {editingTask && (
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Status da Tarefa:</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as TaskStatus)}
                    className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:outline-none cursor-pointer capitalize font-bold"
                  >
                    <option value="novo">Novo (Aguardando Projeto)</option>
                    <option value="em_andamento">Em Andamento (Projeto Criado)</option>
                    <option value="atendido">Atendido / Concluído</option>
                  </select>
                </div>
              )}

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-amber-600/25 transition-all"
                >
                  {editingTask ? 'Salvar Alterações' : 'Cadastrar Solicitação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {taskToDelete && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md"
          onClick={() => setTaskToDelete(null)}
        >
          <div 
            className="bg-slate-900 border border-rose-500/50 rounded-3xl w-full max-w-sm p-5 space-y-4 shadow-2xl relative text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-500/20 border border-rose-500/30 rounded-2xl text-rose-400">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Excluir Tarefa</h3>
                <p className="text-[11px] text-slate-400">Ação irreversível</p>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              Tem certeza de que deseja apagar a tarefa <strong className="text-white">"{taskToDelete.title}"</strong>?
            </p>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setTaskToDelete(null)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteTask(taskToDelete.id);
                  setTaskToDelete(null);
                }}
                className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
