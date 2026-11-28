import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  ClientProject, PostItem, UserRole, SupabaseUserRole, UserProfile,
  BillingReceipt, ApprovalRecord, ClientTask, TaskStatus, SocialMediaUser, InspirationFile
} from '../types';

const env = (import.meta as unknown as { env?: Record<string, string> }).env || {};

export function getSupabaseCredentials() {
  const url = env.VITE_SUPABASE_URL || (typeof localStorage !== 'undefined' ? localStorage.getItem('social_saas_supabase_url') || localStorage.getItem('VITE_SUPABASE_URL') || '' : '');
  const key = env.VITE_SUPABASE_ANON_KEY || (typeof localStorage !== 'undefined' ? localStorage.getItem('social_saas_supabase_key') || localStorage.getItem('VITE_SUPABASE_ANON_KEY') || '' : '');
  return { url: url.trim(), key: key.trim() };
}

export function saveSupabaseCredentials(url: string, key: string) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('social_saas_supabase_url', url.trim());
    localStorage.setItem('social_saas_supabase_key', key.trim());
  }
}

let cachedClient: SupabaseClient | null = null;
let lastUrl = '';
let lastKey = '';

export function getSupabaseClient(): SupabaseClient | null {
  const { url, key } = getSupabaseCredentials();
  if (!url || !key) return null;

  if (cachedClient && url === lastUrl && key === lastKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, key);
    lastUrl = url;
    lastKey = key;
    return cachedClient;
  } catch (err) {
    console.warn('Erro ao inicializar cliente do Supabase:', err);
    return null;
  }
}

export function hasSupabaseCredentials(): boolean {
  const { url, key } = getSupabaseCredentials();
  return Boolean(url && key);
}

export const isSupabaseConfigured = hasSupabaseCredentials();

export const supabase = getSupabaseClient();

/**
 * Testa a conexão com o Supabase executando uma consulta simples.
 */
export async function testSupabaseConnection(): Promise<{ success: boolean; message: string }> {
  const client = getSupabaseClient();
  const { url, key } = getSupabaseCredentials();

  if (!url || !key) {
    return {
      success: false,
      message: 'Chaves do Supabase não encontradas. Configure a URL e a Anon Key no painel ou nas variáveis de ambiente.'
    };
  }

  if (!client) {
    return {
      success: false,
      message: 'Não foi possível inicializar o SDK do Supabase. Verifique a formatação da URL.'
    };
  }

  try {
    // Tenta uma consulta simples à tabela clients ou post_comments_audit
    const { error } = await client.from('clients').select('id').limit(1);

    if (error) {
      if (error.code === '42P01') {
        return {
          success: false,
          message: `Conectado ao Supabase! Porém, a tabela "clients" não existe no seu banco de dados. Execute o script SQL no Supabase Editor para criar as tabelas.`
        };
      }
      return {
        success: false,
        message: `Erro na resposta do Supabase: ${error.message} (Código: ${error.code})`
      };
    }

    return {
      success: true,
      message: `✓ Conexão estabelecida com sucesso com o Supabase! (${url})`
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Falha ao conectar: ${err?.message || 'Erro desconhecido'}`
    };
  }
}

function normalizeClientSocialMediaIdsFromRow(row: any): string[] {
  const ids = new Set<string>();
  if (Array.isArray(row?.assigned_social_media_ids)) {
    for (const id of row.assigned_social_media_ids) {
      const clean = String(id || '').trim();
      if (clean) ids.add(clean);
    }
  }
  if (row?.assigned_social_media_id) {
    const clean = String(row.assigned_social_media_id).trim();
    if (clean) ids.add(clean);
  }
  if (row?.created_by_social_media_id) {
    const clean = String(row.created_by_social_media_id).trim();
    if (clean) ids.add(clean);
  }
  return Array.from(ids);
}

/**
 * Sincroniza dados do Cliente para a tabela `clients` no Supabase.
 */
export async function syncClientToSupabase(client: ClientProject) {
  const clientDb = getSupabaseClient();
  if (!clientDb) return null;
  try {
    const linkedSet = new Set<string>(
      Array.isArray(client.assignedSocialMediaIds) ? client.assignedSocialMediaIds.filter(Boolean) : []
    );
    if (client.assignedSocialMediaId) linkedSet.add(client.assignedSocialMediaId);
    if (client.createdBySocialMediaId) linkedSet.add(client.createdBySocialMediaId);

    if (linkedSet.size === 0) {
      const { data: sessionData } = await clientDb.auth.getSession();
      if (sessionData?.session?.user?.id) {
        linkedSet.add(sessionData.session.user.id);
      }
    }

    const assignedSocialMediaIds = Array.from(linkedSet);
    const primarySocialMediaId = client.assignedSocialMediaId || assignedSocialMediaIds[0] || null;
    const createdBySocialMediaId = client.createdBySocialMediaId || primarySocialMediaId || null;

    const basePayload = {
      id: client.id,
      name: client.name || '',
      company_name: client.companyName || '',
      cnpj: client.cnpj || '',
      address: client.address || '',
      contact_name: client.contactName || '',
      whatsapp_number: client.whatsappNumber || '',
      email: client.email || '',
      price_per_post: client.pricePerPost ?? 0,
      metrics_access: client.metricsAccess || 'ambos',
      drive_folder_url: client.googleDriveFolderUrl || '',
      logo_url: client.logoUrl || '',
      assigned_social_media_id: primarySocialMediaId,
      status: client.status || 'ativo'
    };

    const { data, error } = await clientDb
      .from('clients')
      .upsert([{
        ...basePayload,
        assigned_social_media_ids: assignedSocialMediaIds,
        created_by_social_media_id: createdBySocialMediaId
      }]);
    if (error) {
      const msg = String(error.message || '').toLowerCase();
      if (
        error.code === 'PGRST204' ||
        msg.includes('column') ||
        msg.includes('assigned_social_media_ids') ||
        msg.includes('created_by_social_media_id')
      ) {
        const retry = await clientDb.from('clients').upsert([basePayload]);
        if (retry.error) {
          console.warn('Erro ao sincronizar Cliente no Supabase (retry):', retry.error.message);
        } else {
          console.log('✓ Cliente sincronizado no Supabase (colunas base)!', client.id);
        }
        return retry.data;
      }
      console.warn('Erro ao sincronizar Cliente no Supabase:', error.message);
    } else {
      console.log('✓ Cliente sincronizado no Supabase com sucesso!', client.id);
    }
    return data;
  } catch (err) {
    console.warn('Falha ao conectar com Supabase:', err);
    return null;
  }
}

/**
 * Sincroniza todos os clientes ativos para o Supabase.
 */
export async function syncAllClientsToSupabase(clientsList: ClientProject[]) {
  const clientDb = getSupabaseClient();
  if (!clientDb || clientsList.length === 0) return;
  for (const client of clientsList) {
    await syncClientToSupabase(client);
  }
}

/**
 * Busca a lista de clientes salva no Supabase.
 */
export async function fetchClientsFromSupabase(): Promise<ClientProject[] | null> {
  const clientDb = getSupabaseClient();
  if (!clientDb) return null;
  try {
    const { data, error } = await clientDb.from('clients').select('*');
    if (error) {
      console.warn('Erro ao buscar clientes no Supabase:', error.message);
      return null;
    }
    if (data && data.length > 0) {
      return data.map((row: any) => {
        const smIds = normalizeClientSocialMediaIdsFromRow(row);
        return {
          id: row.id,
          name: row.name || 'Cliente Sem Nome',
          companyName: row.company_name || row.name || '',
          cnpj: row.cnpj || '',
          address: row.address || '',
          contactName: row.contact_name || '',
          whatsappNumber: row.whatsapp_number || '',
          email: row.email || '',
          pricePerPost: Number(row.price_per_post || 150),
          metricsAccess: row.metrics_access || 'ambos',
          googleDriveFolderUrl: row.drive_folder_url || row.google_drive_folder_url || '',
          logoUrl: row.logo_url || '',
          activeSocialNetworks: ['instagram', 'facebook'],
          assignedSocialMediaId: row.assigned_social_media_id || smIds[0] || undefined,
          assignedSocialMediaIds: smIds,
          createdBySocialMediaId: row.created_by_social_media_id || row.assigned_social_media_id || undefined,
          status: row.status || 'ativo'
        };
      });
    }
    return null;
  } catch (err) {
    console.warn('Falha ao consultar clientes do Supabase:', err);
    return null;
  }
}

/**
 * Remove um cliente do Supabase pelo ID.
 */
export async function deleteClientFromSupabase(clientId: string): Promise<boolean> {
  const clientDb = getSupabaseClient();
  if (!clientDb || !clientId) return false;
  try {
    const { error } = await clientDb
      .from('clients')
      .delete()
      .eq('id', clientId);

    if (error) {
      console.warn('Erro ao deletar cliente no Supabase:', error.message);
      return false;
    }
    console.log('✓ Cliente removido do Supabase com sucesso:', clientId);
    return true;
  } catch (err) {
    console.warn('Falha ao conectar com Supabase para excluir cliente:', err);
    return false;
  }
}

/**
 * Realiza a busca de clientes diretamente na tabela `clients` do Supabase.
 */
export async function searchClientsInSupabase(searchQuery: string): Promise<ClientProject[] | null> {
  const clientDb = getSupabaseClient();
  if (!clientDb) return null;
  const q = searchQuery.trim();
  if (!q) return fetchClientsFromSupabase();

  try {
    const { data, error } = await clientDb
      .from('clients')
      .select('*')
      .or(`name.ilike.%${q}%,company_name.ilike.%${q}%,contact_name.ilike.%${q}%,email.ilike.%${q}%,cnpj.ilike.%${q}%`);

    if (error) {
      console.warn('Erro ao pesquisar clientes no Supabase:', error.message);
      return null;
    }

    if (data && data.length > 0) {
      return data.map((row: any) => {
        const smIds = normalizeClientSocialMediaIdsFromRow(row);
        return {
          id: row.id,
          name: row.name || 'Cliente Sem Nome',
          companyName: row.company_name || row.name || '',
          cnpj: row.cnpj || '',
          address: row.address || '',
          contactName: row.contact_name || '',
          whatsappNumber: row.whatsapp_number || '',
          email: row.email || '',
          pricePerPost: Number(row.price_per_post || 150),
          metricsAccess: row.metrics_access || 'ambos',
          googleDriveFolderUrl: row.drive_folder_url || row.google_drive_folder_url || '',
          logoUrl: row.logo_url || '',
          activeSocialNetworks: ['instagram', 'facebook'],
          assignedSocialMediaId: row.assigned_social_media_id || smIds[0] || undefined,
          assignedSocialMediaIds: smIds,
          createdBySocialMediaId: row.created_by_social_media_id || row.assigned_social_media_id || undefined,
          status: row.status || 'ativo'
        };
      });
    }
    return [];
  } catch (err) {
    console.warn('Falha na busca de clientes no Supabase:', err);
    return null;
  }
}

/**
 * Sincroniza um Post / Rascunho para a tabela `posts` no Supabase.
 */
export async function syncPostToSupabase(post: PostItem) {
  const clientDb = getSupabaseClient();
  if (!clientDb) return null;
  try {
    const payload = {
      id: post.id,
      client_project_id: post.clientProjectId,
      title: post.title,
      caption: post.caption || '',
      media_url: post.mediaUrl || '',
      media_type: post.mediaType || 'image',
      social_networks: post.socialNetworks || [],
      scheduled_date: post.scheduledDate || '',
      status: post.status || 'rascunho',
      approval_token: post.approvalToken || null,
      token_expires_at: post.tokenExpiresAt || null,
      comments: post.comments || [],
      is_published: post.isPublished || false,
      published_at: post.publishedAt || null,
      social_media_author_id: post.socialMediaAuthorId || null,
      created_at: post.createdAt || new Date().toISOString(),
      updated_at: post.updatedAt || new Date().toISOString()
    };

    const { data, error } = await clientDb
      .from('posts')
      .upsert([payload]);

    if (error) {
      console.warn('Erro ao sincronizar Post no Supabase:', error.message);
    } else {
      console.log('✓ Post sincronizado no Supabase com sucesso!', post.id);
    }
    return data;
  } catch (err) {
    console.warn('Falha ao conectar com Supabase ao salvar post:', err);
    return null;
  }
}

/**
 * Sincroniza todos os posts da aplicação com o Supabase.
 */
export async function syncAllPostsToSupabase(postsList: PostItem[]) {
  const clientDb = getSupabaseClient();
  if (!clientDb || postsList.length === 0) return;
  for (const post of postsList) {
    await syncPostToSupabase(post);
  }
}

/**
 * Busca a lista de posts salva no Supabase.
 */
export async function fetchPostsFromSupabase(): Promise<PostItem[] | null> {
  const clientDb = getSupabaseClient();
  if (!clientDb) return null;
  try {
    const { data, error } = await clientDb.from('posts').select('*');
    if (error) {
      console.warn('Erro ao buscar posts no Supabase:', error.message);
      return null;
    }
    if (data && data.length > 0) {
      return data.map((row: any) => ({
        id: row.id,
        clientProjectId: row.client_project_id || '',
        title: row.title || 'Post sem título',
        caption: row.caption || '',
        mediaUrl: row.media_url || '',
        mediaType: row.media_type || 'image',
        socialNetworks: Array.isArray(row.social_networks) ? row.social_networks : ['instagram'],
        scheduledDate: row.scheduled_date || '',
        status: row.status || 'rascunho',
        approvalToken: row.approval_token || undefined,
        tokenExpiresAt: row.token_expires_at || undefined,
        comments: Array.isArray(row.comments) ? row.comments : [],
        isPublished: Boolean(row.is_published),
        publishedAt: row.published_at || undefined,
        socialMediaAuthorId: row.social_media_author_id || undefined,
        createdAt: row.created_at || new Date().toISOString(),
        updatedAt: row.updated_at || new Date().toISOString()
      }));
    }
    return null;
  } catch (err) {
    console.warn('Falha ao consultar posts do Supabase:', err);
    return null;
  }
}

/**
 * Remove um post do Supabase pelo ID.
 */
export async function deletePostFromSupabase(postId: string): Promise<boolean> {
  const clientDb = getSupabaseClient();
  if (!clientDb || !postId) return false;
  try {
    const { error } = await clientDb
      .from('posts')
      .delete()
      .eq('id', postId);

    if (error) {
      console.warn('Erro ao deletar post no Supabase:', error.message);
      return false;
    }
    console.log('✓ Post removido do Supabase com sucesso:', postId);
    return true;
  } catch (err) {
    console.warn('Falha ao conectar com Supabase para excluir post:', err);
    return false;
  }
}

/**
 * Persiste um comentário no Supabase para fins de auditoria do Social Media / Gestor.
 */
export async function auditPostCommentToSupabase(comment: {
  id: string;
  postId: string;
  postTitle?: string;
  clientId?: string;
  authorRole: string;
  authorName: string;
  text: string;
}) {
  const clientDb = getSupabaseClient();
  if (!clientDb) return null;
  try {
    const { data, error } = await clientDb
      .from('post_comments_audit')
      .insert([{
        id: comment.id,
        post_id: comment.postId,
        post_title: comment.postTitle || '',
        client_id: comment.clientId || '',
        author_role: comment.authorRole,
        author_name: comment.authorName,
        comment_text: comment.text
      }]);
    if (error) {
      console.warn('Erro ao gravar comentário na auditoria Supabase:', error.message);
    }
    return data;
  } catch (err) {
    console.warn('Falha na integração com Supabase:', err);
    return null;
  }
}

/**
 * Sincroniza dados de Social Media e taxas customizadas para o Supabase.
 */
export async function syncSocialMediaToSupabase(sm: {
  id: string;
  name: string;
  email: string;
  whatsapp?: string;
  socialProfile?: string;
  pixKey?: string;
  customFeePerPost?: number;
  assignedClientIds?: string[];
  status?: string;
  signatureUrl?: string;
  bankInfo?: string;
}) {
  const clientDb = getSupabaseClient();
  if (!clientDb) return null;
  const basePayload = {
    id: sm.id,
    name: sm.name,
    email: sm.email || 'socialmedia@agencia.com',
    whatsapp: sm.whatsapp || '',
    social_profile: sm.socialProfile || '',
    pix_key: sm.pixKey || '',
    custom_fee_per_post: sm.customFeePerPost ?? null,
    status: sm.status || 'ativo'
  };
  try {
    const { data, error } = await clientDb
      .from('social_medias')
      .upsert([{
        ...basePayload,
        assigned_client_ids: Array.isArray(sm.assignedClientIds) ? sm.assignedClientIds : [],
        signature_url: sm.signatureUrl || null,
        bank_info: sm.bankInfo || null
      }]);
    if (error) {
      const msg = String(error.message || '').toLowerCase();
      if (
        error.code === 'PGRST204' ||
        msg.includes('column') ||
        msg.includes('signature_url') ||
        msg.includes('bank_info') ||
        msg.includes('assigned_client_ids')
      ) {
        const retry = await clientDb.from('social_medias').upsert([basePayload]);
        if (retry.error) {
          console.warn('Erro ao sincronizar Social Media no Supabase (retry):', retry.error.message);
        } else {
          console.log('✓ Social Media sincronizado no Supabase (colunas base)!', sm.id);
        }
        return retry.data;
      }
      console.warn('Erro ao sincronizar Social Media no Supabase:', error.message);
    } else {
      console.log('✓ Social Media sincronizado no Supabase com sucesso!', sm.id);
    }
    return data;
  } catch (err) {
    console.warn('Falha ao conectar com Supabase:', err);
    return null;
  }
}

/**
 * Sincroniza todos os Social Medias ativos para o Supabase.
 */
export async function syncAllSocialMediasToSupabase(smList: SocialMediaUser[]) {
  const clientDb = getSupabaseClient();
  if (!clientDb || smList.length === 0) return;
  for (const sm of smList) {
    await syncSocialMediaToSupabase(sm);
  }
}

/**
 * Remove um Social Media da tabela social_medias no Supabase.
 */
export async function deleteSocialMediaFromSupabase(smId: string) {
  const clientDb = getSupabaseClient();
  if (!clientDb || !smId) return null;
  try {
    const { data, error } = await clientDb
      .from('social_medias')
      .delete()
      .eq('id', smId);
    if (error) console.warn('Erro ao deletar Social Media no Supabase:', error.message);
    return data;
  } catch (err) {
    console.warn('Falha ao conectar com Supabase ao excluir social media:', err);
    return null;
  }
}

/**
 * Mapeia a função do Supabase ('DEVWEBAPP' | 'social_media' | 'client') para a função da aplicação ('gestor' | 'social_media' | 'cliente').
 */
export function mapSupabaseRoleToAppRole(role?: string): UserRole {
  if (role === 'DEVWEBAPP') return 'gestor';
  if (role === 'social_media') return 'social_media';
  return 'cliente';
}

/**
 * Mapeia a função da aplicação ('gestor' | 'social_media' | 'cliente') para a função do Supabase ('DEVWEBAPP' | 'social_media' | 'client').
 */
export function mapAppRoleToSupabaseRole(role?: UserRole): SupabaseUserRole {
  if (role === 'gestor') return 'DEVWEBAPP';
  if (role === 'social_media') return 'social_media';
  return 'client';
}

/**
 * Busca o perfil do usuário na tabela `profiles` do Supabase pelo ID de autenticação.
 */
export async function fetchUserProfileFromSupabase(userId: string): Promise<UserProfile | null> {
  const clientDb = getSupabaseClient();
  if (!clientDb || !userId) return null;
  try {
    const { data, error } = await clientDb
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.warn('Erro ao buscar perfil do usuário no Supabase:', error.message);
      return null;
    }

    if (data) {
      return {
        id: data.id,
        email: data.email,
        fullName: data.full_name || '',
        role: mapSupabaseRoleToAppRole(data.role),
        supabaseRole: data.role as SupabaseUserRole,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    }
    return null;
  } catch (err) {
    console.warn('Falha ao consultar perfil no Supabase:', err);
    return null;
  }
}

/**
 * Sincroniza ou atualiza um perfil de usuário na tabela `profiles` do Supabase.
 */
export async function syncUserProfileToSupabase(profile: {
  id: string;
  email: string;
  fullName?: string;
  role: UserRole | SupabaseUserRole;
}) {
  const clientDb = getSupabaseClient();
  if (!clientDb || !profile.id) return null;
  try {
    const dbRole: SupabaseUserRole = (profile.role === 'DEVWEBAPP' || profile.role === 'client')
      ? (profile.role as SupabaseUserRole)
      : mapAppRoleToSupabaseRole(profile.role as UserRole);

    const payload = {
      id: profile.id,
      email: profile.email,
      full_name: profile.fullName || '',
      role: dbRole,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await clientDb
      .from('profiles')
      .upsert([payload]);

    if (error) {
      console.warn('Erro ao sincronizar perfil no Supabase:', error.message);
    } else {
      console.log('✓ Perfil sincronizado no Supabase com sucesso!', profile.id);
    }
    return data;
  } catch (err) {
    console.warn('Falha ao conectar com Supabase ao salvar perfil:', err);
    return null;
  }
}

export interface SignUpParams {
  email: string;
  password: string;
  fullName: string;
  role: SupabaseUserRole | UserRole;
}

/**
 * Cadastra um novo usuário no Supabase Auth enviando os metadados (full_name e role)
 * para disparar a trigger `on_auth_user_created` no banco de dados e alimentar a tabela `profiles`.
 */
export async function registerUser({ email, password, fullName, role }: SignUpParams) {
  const clientDb = getSupabaseClient();
  if (!clientDb) {
    throw new Error('Cliente do Supabase não configurado. Verifique VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.');
  }

  const dbRole: SupabaseUserRole = (role === 'DEVWEBAPP' || role === 'client')
    ? (role as SupabaseUserRole)
    : mapAppRoleToSupabaseRole(role as UserRole);

  const { data, error } = await clientDb.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: dbRole
      }
    }
  });

  if (error) {
    console.error('Erro ao cadastrar usuário no Supabase:', error.message);
    throw error;
  }

  return data;
}

/**
 * Faz upload de um arquivo para o Supabase Storage (Bucket 'media')
 * e retorna a URL pública direta da CDN.
 */
export async function uploadMediaToSupabase(
  file: File,
  folder: string = 'posts'
): Promise<{ success: boolean; url?: string; path?: string; error?: string }> {
  const clientDb = getSupabaseClient();
  if (!clientDb) {
    return {
      success: false,
      error: 'Cliente Supabase não configurado. Verifique as variáveis de ambiente.'
    };
  }

  try {
    const timestamp = Date.now();
    const cleanFileName = file.name
      .toLowerCase()
      .replace(/[^a-z0-9.]/g, '-')
      .replace(/-+/g, '-');
    const filePath = `${folder}/${timestamp}-${cleanFileName}`;

    const { data, error } = await clientDb.storage
      .from('media')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type
      });

    if (error) {
      console.error('Erro no upload para Supabase Storage:', error);
      return { success: false, error: error.message };
    }

    const { data: publicUrlData } = clientDb.storage
      .from('media')
      .getPublicUrl(data.path);

    if (!publicUrlData?.publicUrl) {
      return { success: false, error: 'Não foi possível gerar a URL pública da mídia.' };
    }

    return {
      success: true,
      url: publicUrlData.publicUrl,
      path: data.path
    };
  } catch (err: any) {
    console.error('Falha inesperada no upload para Supabase:', err);
    return { success: false, error: err?.message || 'Erro inesperado durante o upload.' };
  }
}

/**
 * Sincroniza um recibo gerado (com a URL da assinatura digitalizada e dados bancários) no Supabase.
 */
export async function syncReceiptToSupabase(receipt: BillingReceipt) {
  const clientDb = getSupabaseClient();
  if (!clientDb || !receipt.id) return null;

  try {
    const payload = {
      id: receipt.id,
      receipt_number: receipt.receiptNumber,
      client_project_id: receipt.clientProjectId,
      period: receipt.period,
      issue_date: receipt.issueDate,
      due_date: receipt.dueDate,
      items: receipt.items,
      subtotal: receipt.subtotal,
      discount: receipt.discount,
      total_amount: receipt.totalAmount,
      platform_fee_total: receipt.platformFeeTotal,
      payment_method: receipt.paymentMethod,
      notes: receipt.notes,
      status: receipt.status,
      city_state: receipt.cityState || null,
      service_summary_text: receipt.serviceSummaryText || null,
      custom_receipt_text: receipt.customReceiptText || null,
      social_media_name: receipt.socialMediaName || null,
      social_media_pix: receipt.socialMediaPix || null,
      social_media_bank: receipt.socialMediaBank || null,
      social_media_cpf_cnpj: receipt.socialMediaCpfCnpj || null,
      social_media_signature_url: receipt.socialMediaSignatureUrl || null,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await clientDb
      .from('receipts')
      .upsert([payload]);

    if (error) {
      console.warn('Aviso ao sincronizar Recibo no Supabase (tabela receipts):', error.message);
    } else {
      console.log('✓ Recibo com assinatura sincronizado no Supabase com sucesso!', receipt.id);
    }
    return data;
  } catch (err) {
    console.warn('Falha ao conectar com Supabase ao salvar recibo:', err);
    return null;
  }
}

/**
 * Sincroniza um Registro Oficial de Aprovação na tabela `approval_records` do Supabase
 * para auditoria e computação de faturamento (anti-drible mesmo se o post for excluído).
 */
export async function syncApprovalRecordToSupabase(record: ApprovalRecord) {
  const clientDb = getSupabaseClient();
  if (!clientDb || !record.id) return null;

  try {
    const payload = {
      id: record.id,
      post_id: record.postId,
      post_title: record.postTitle,
      client_project_id: record.clientProjectId,
      client_name: record.clientName,
      social_media_id: record.socialMediaId || null,
      social_media_name: record.socialMediaName || null,
      approved_at: record.approvedAt,
      approved_by_role: record.approvedByRole,
      approved_by_name: record.approvedByName,
      approved_by_phone: record.approvedByPhone || null,
      approved_by_email: record.approvedByEmail || null,
      price_per_post_snapshot: record.pricePerPostSnapshot,
      fee_per_post_snapshot: record.feePerPostSnapshot,
      billing_status: record.billingStatus,
      post_deleted_at: record.postDeletedAt || null
    };

    const { data, error } = await clientDb
      .from('approval_records')
      .upsert([payload]);

    if (error) {
      console.warn('Aviso ao sincronizar registro de aprovação (tabela approval_records):', error.message);
    } else {
      console.log('✓ Registro de aprovação auditado no Supabase:', record.id);
    }
    return data;
  } catch (err) {
    console.warn('Falha ao conectar com Supabase ao salvar registro de aprovação:', err);
    return null;
  }
}

/**
 * Busca os registros oficiais de aprovação no Supabase para computação de faturamento.
 */
export async function fetchApprovalRecordsFromSupabase(): Promise<ApprovalRecord[] | null> {
  const clientDb = getSupabaseClient();
  if (!clientDb) return null;
  try {
    const { data, error } = await clientDb.from('approval_records').select('*');
    if (error) {
      console.warn('Aviso ao buscar registros de aprovação no Supabase:', error.message);
      return null;
    }
    if (data && data.length > 0) {
      return data.map((row: any) => ({
        id: row.id,
        postId: row.post_id,
        postTitle: row.post_title || 'Projeto',
        clientProjectId: row.client_project_id || '',
        clientName: row.client_name || '',
        socialMediaId: row.social_media_id || undefined,
        socialMediaName: row.social_media_name || undefined,
        approvedAt: row.approved_at || new Date().toISOString(),
        approvedByRole: (row.approved_by_role as UserRole) || 'cliente',
        approvedByName: row.approved_by_name || 'Cliente',
        approvedByPhone: row.approved_by_phone || undefined,
        approvedByEmail: row.approved_by_email || undefined,
        pricePerPostSnapshot: Number(row.price_per_post_snapshot || 150),
        feePerPostSnapshot: Number(row.fee_per_post_snapshot || 0.50),
        billingStatus: row.billing_status === 'faturado' ? 'faturado' : 'computado',
        postDeletedAt: row.post_deleted_at || undefined
      }));
    }
    return [];
  } catch (err) {
    console.warn('Falha ao consultar approval_records no Supabase:', err);
    return null;
  }
}

/**
 * Busca todos os Social Medias salvos na tabela `social_medias` do Supabase.
 */
export async function fetchSocialMediasFromSupabase(): Promise<SocialMediaUser[] | null> {
  const clientDb = getSupabaseClient();
  if (!clientDb) return null;
  try {
    const { data, error } = await clientDb.from('social_medias').select('*');
    if (error) {
      console.warn('Aviso ao buscar social_medias no Supabase:', error.message);
      return null;
    }
    if (!data) return [];
    return data.map((row: any) => ({
      id: row.id,
      name: row.name || 'Social Media',
      email: row.email || '',
      whatsapp: row.whatsapp || '',
      socialProfile: row.social_profile || '',
      pixKey: row.pix_key || '',
      assignedClientIds: Array.isArray(row.assigned_client_ids) ? row.assigned_client_ids : [],
      totalPostsCreated: 0,
      status: row.status === 'bloqueado' ? 'bloqueado' : 'ativo',
      customFeePerPost: row.custom_fee_per_post !== null && row.custom_fee_per_post !== undefined
        ? Number(row.custom_fee_per_post)
        : undefined,
      signatureUrl: row.signature_url || undefined,
      bankInfo: row.bank_info || undefined
    }));
  } catch (err) {
    console.warn('Falha ao consultar social_medias no Supabase:', err);
    return null;
  }
}

function isMissingRelationError(error: any): boolean {
  const msg = String(error?.message || '').toLowerCase();
  const code = String(error?.code || '');
  return (
    code === '42P01' ||
    code === 'PGRST205' ||
    msg.includes('does not exist') ||
    msg.includes('could not find the table') ||
    msg.includes('schema cache')
  );
}

/**
 * Sincroniza uma Tarefa Solicitada pelo Cliente na tabela `client_tasks` do Supabase.
 */
export async function syncTaskToSupabase(task: ClientTask): Promise<{ success: boolean; missingTable?: boolean; error?: string }> {
  const clientDb = getSupabaseClient();
  if (!clientDb || !task.id) return { success: false };

  try {
    const payload = {
      id: task.id,
      client_project_id: task.clientProjectId,
      title: task.title,
      description: task.description || '',
      deadline: task.deadline || '',
      status: task.status || 'novo',
      linked_post_id: task.linkedPostId || null,
      created_by_role: task.createdByRole || 'cliente',
      created_by_name: task.createdByName || 'Cliente',
      created_at: task.createdAt || new Date().toISOString(),
      updated_at: task.updatedAt || new Date().toISOString()
    };

    const { error } = await clientDb.from('client_tasks').upsert([payload]);
    if (error) {
      console.warn('Erro ao sincronizar Tarefa no Supabase (tabela client_tasks):', error.message);
      return {
        success: false,
        missingTable: isMissingRelationError(error),
        error: error.message
      };
    }
    return { success: true };
  } catch (err: any) {
    console.warn('Falha ao conectar com Supabase ao salvar tarefa:', err);
    return { success: false, error: err?.message };
  }
}

export async function syncAllTasksToSupabase(tasksList: ClientTask[]): Promise<{ missingTable?: boolean }> {
  const clientDb = getSupabaseClient();
  if (!clientDb || tasksList.length === 0) return {};
  let missingTable = false;
  for (const t of tasksList) {
    const res = await syncTaskToSupabase(t);
    if (res.missingTable) {
      missingTable = true;
      break;
    }
  }
  return { missingTable };
}

/**
 * Busca todas as Tarefas Solicitadas pelo Cliente na tabela `client_tasks` do Supabase.
 */
export async function fetchTasksFromSupabase(): Promise<{ tasks: ClientTask[] | null; missingTable?: boolean }> {
  const clientDb = getSupabaseClient();
  if (!clientDb) return { tasks: null };

  try {
    const { data, error } = await clientDb
      .from('client_tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Aviso ao buscar tarefas no Supabase (client_tasks):', error.message);
      return { tasks: null, missingTable: isMissingRelationError(error) };
    }

    if (!data) return { tasks: [] };
    return {
      tasks: data.map((row: any) => ({
        id: row.id,
        clientProjectId: row.client_project_id || '',
        title: row.title || 'Tarefa sem título',
        description: row.description || '',
        deadline: row.deadline || '',
        status: (row.status as TaskStatus) || 'novo',
        linkedPostId: row.linked_post_id || undefined,
        createdByRole: (row.created_by_role as UserRole) || 'cliente',
        createdByName: row.created_by_name || undefined,
        createdAt: row.created_at || new Date().toISOString(),
        updatedAt: row.updated_at || undefined
      }))
    };
  } catch (err) {
    console.warn('Falha ao consultar client_tasks no Supabase:', err);
    return { tasks: null };
  }
}

/**
 * Remove uma tarefa da tabela `client_tasks` do Supabase pelo ID.
 */
export async function deleteTaskFromSupabase(taskId: string): Promise<boolean> {
  const clientDb = getSupabaseClient();
  if (!clientDb || !taskId) return false;
  try {
    const { error } = await clientDb.from('client_tasks').delete().eq('id', taskId);
    if (error) {
      console.warn('Erro ao deletar tarefa no Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Falha ao conectar com Supabase para excluir tarefa:', err);
    return false;
  }
}

/**
 * Sincroniza uma Inspiração na tabela `inspirations` do Supabase.
 */
export async function syncInspirationToSupabase(insp: InspirationFile) {
  const clientDb = getSupabaseClient();
  if (!clientDb || !insp.id) return null;
  try {
    const { data, error } = await clientDb.from('inspirations').upsert([{
      id: insp.id,
      client_project_id: insp.clientProjectId,
      title: insp.title,
      description: insp.description || '',
      url: insp.url,
      type: insp.category || insp.type || 'Referência Geral',
      uploaded_by_role: insp.uploadedByRole,
      uploaded_by_name: insp.uploadedByName,
      is_used: Boolean(insp.isUsed),
      used_at: insp.usedAt || null,
      retention_option: insp.retentionOption || null,
      expires_at: insp.expiresAt || null,
      created_at: insp.createdAt || new Date().toISOString()
    }]);
    if (error) console.warn('Aviso ao sincronizar inspiração no Supabase:', error.message);
    return data;
  } catch {
    return null;
  }
}

export async function fetchInspirationsFromSupabase(): Promise<InspirationFile[] | null> {
  const clientDb = getSupabaseClient();
  if (!clientDb) return null;
  try {
    const { data, error } = await clientDb.from('inspirations').select('*');
    if (error) return null;
    if (!data) return [];
    return data.map((row: any) => ({
      id: row.id,
      clientProjectId: row.client_project_id || '',
      title: row.title || 'Inspiração',
      description: row.description || undefined,
      url: row.url || '',
      type: row.type || 'Referência Geral',
      category: row.type || 'Referência Geral',
      uploadedByRole: (row.uploaded_by_role as UserRole) || 'cliente',
      uploadedByName: row.uploaded_by_name || 'Cliente',
      createdAt: row.created_at || new Date().toISOString(),
      isUsed: Boolean(row.is_used),
      usedAt: row.used_at || undefined,
      retentionOption: row.retention_option || undefined,
      expiresAt: row.expires_at || undefined
    }));
  } catch {
    return null;
  }
}

export async function deleteInspirationFromSupabase(id: string): Promise<boolean> {
  const clientDb = getSupabaseClient();
  if (!clientDb || !id) return false;
  try {
    const { error } = await clientDb.from('inspirations').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

export async function fetchReceiptsFromSupabase(): Promise<BillingReceipt[] | null> {
  const clientDb = getSupabaseClient();
  if (!clientDb) return null;
  try {
    const { data, error } = await clientDb.from('receipts').select('*');
    if (error) return null;
    if (!data) return [];
    return data.map((row: any) => ({
      id: row.id,
      receiptNumber: row.receipt_number || '',
      clientProjectId: row.client_project_id || '',
      period: row.period || '',
      issueDate: row.issue_date || '',
      dueDate: row.due_date || '',
      items: Array.isArray(row.items) ? row.items : [],
      subtotal: Number(row.subtotal || 0),
      discount: Number(row.discount || 0),
      totalAmount: Number(row.total_amount || 0),
      platformFeeTotal: Number(row.platform_fee_total || 0),
      paymentMethod: row.payment_method || 'Pix',
      notes: row.notes || '',
      status: row.status || 'rascunho',
      cityState: row.city_state || undefined,
      serviceSummaryText: row.service_summary_text || undefined,
      customReceiptText: row.custom_receipt_text || undefined,
      socialMediaName: row.social_media_name || undefined,
      socialMediaPix: row.social_media_pix || undefined,
      socialMediaBank: row.social_media_bank || undefined,
      socialMediaCpfCnpj: row.social_media_cpf_cnpj || undefined,
      socialMediaSignatureUrl: row.social_media_signature_url || undefined
    }));
  } catch {
    return null;
  }
}

export async function resolveAuthenticatedAppRole(user: {
  id: string;
  email?: string;
  user_metadata?: Record<string, any>;
}): Promise<{ role: UserRole; fullName: string }> {
  const fallbackName = String(
    user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário'
  ).trim();

  const clientDb = getSupabaseClient();
  if (!clientDb) {
    return { role: 'social_media', fullName: fallbackName };
  }

  try {
    const { data, error } = await clientDb
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .maybeSingle();

    if (!error && data?.role) {
      return {
        role: mapSupabaseRoleToAppRole(data.role),
        fullName: (data.full_name || fallbackName).trim()
      };
    }
  } catch {
    // continua para resolução segura
  }

  // Se criado sem registro em profiles, prioriza vínculo na tabela social_medias / clients; caso contrário entra sempre como social_media
  let resolvedRole: UserRole = 'social_media';
  let resolvedName = fallbackName;
  const userEmail = (user.email || '').trim().toLowerCase();
  if (userEmail) {
    try {
      const { data: smRow } = await clientDb
        .from('social_medias')
        .select('id, name')
        .ilike('email', userEmail)
        .limit(1)
        .maybeSingle();
      if (smRow) {
        resolvedRole = 'social_media';
        resolvedName = smRow.name || fallbackName;
      } else {
        const { data: clientRow } = await clientDb
          .from('clients')
          .select('id, contact_name, name')
          .ilike('email', userEmail)
          .limit(1)
          .maybeSingle();
        if (clientRow) {
          resolvedRole = 'cliente';
          resolvedName = clientRow.contact_name || clientRow.name || fallbackName;
        }
      }
    } catch {
      // ignore
    }
  }

  // Garante criação do perfil caso o usuário já existisse no Auth antes da tabela profiles
  if (user.id && userEmail) {
    try {
      await clientDb.from('profiles').insert([{
        id: user.id,
        email: userEmail,
        full_name: resolvedName,
        role: mapAppRoleToSupabaseRole(resolvedRole)
      }]);
    } catch {
      // ignore (ex: RLS ou perfil já existente)
    }
  }

  return {
    role: resolvedRole,
    fullName: resolvedName
  };
}

export async function fetchPublicPostByTokenFromSupabase(token: string): Promise<{
  post: PostItem | null;
  client: ClientProject | null;
  socialMedia: SocialMediaUser | null;
}> {
  const clientDb = getSupabaseClient();
  const cleanToken = (token || '').trim();
  if (!clientDb || !cleanToken) {
    return { post: null, client: null, socialMedia: null };
  }

  // 1. Tenta RPC segura (SECURITY DEFINER) — funciona mesmo com RLS estrita bloqueando SELECT anônimo
  try {
    const { data, error } = await clientDb.rpc('get_public_approval_post', { p_token: cleanToken });
    if (!error && data && typeof data === 'object' && (data as any).post) {
      const payload = data as any;
      const p = payload.post;
      const c = payload.client;
      const sm = payload.socialMedia;
      return {
        post: {
          id: p.id,
          clientProjectId: p.clientProjectId || '',
          title: p.title || 'Post para Aprovação',
          caption: p.caption || '',
          mediaUrl: p.mediaUrl || '',
          mediaType: p.mediaType || 'image',
          socialNetworks: Array.isArray(p.socialNetworks) ? p.socialNetworks : ['instagram'],
          scheduledDate: p.scheduledDate || '',
          status: p.status || 'rascunho',
          approvalToken: p.approvalToken || cleanToken,
          tokenExpiresAt: p.tokenExpiresAt || undefined,
          comments: Array.isArray(p.comments) ? p.comments : [],
          isPublished: Boolean(p.isPublished),
          publishedAt: p.publishedAt || undefined,
          socialMediaAuthorId: p.socialMediaAuthorId || undefined,
          createdAt: p.createdAt || new Date().toISOString(),
          updatedAt: p.updatedAt || new Date().toISOString()
        },
        client: c
          ? {
              id: c.id,
              name: c.name || 'Cliente',
              companyName: c.name || '',
              cnpj: '',
              address: '',
              contactName: c.contactName || c.name || 'Cliente',
              whatsappNumber: '',
              email: '',
              pricePerPost: 0,
              metricsAccess: c.metricsAccess || 'cliente',
              logoUrl: c.logoUrl || '',
              activeSocialNetworks: Array.isArray(c.activeSocialNetworks) ? c.activeSocialNetworks : ['instagram', 'facebook'],
              assignedSocialMediaId: c.assignedSocialMediaId || undefined
            }
          : null,
        socialMedia: sm
          ? {
              id: sm.id,
              name: sm.name || 'Social Media',
              email: '',
              whatsapp: '',
              socialProfile: sm.socialProfile || '',
              pixKey: '',
              assignedClientIds: [],
              totalPostsCreated: 0
            }
          : null
      };
    }
  } catch {
    // tenta consulta direta filtrada como contingência
  }

  // 2. Fallback restrito por approval_token (nunca lista todos os posts/clientes)
  try {
    const { data: postRow, error } = await clientDb
      .from('posts')
      .select('*')
      .eq('approval_token', cleanToken)
      .limit(1)
      .maybeSingle();

    if (error || !postRow) {
      return { post: null, client: null, socialMedia: null };
    }

    const mappedPost: PostItem = {
      id: postRow.id,
      clientProjectId: postRow.client_project_id || '',
      title: postRow.title || 'Post para Aprovação',
      caption: postRow.caption || '',
      mediaUrl: postRow.media_url || '',
      mediaType: postRow.media_type || 'image',
      socialNetworks: Array.isArray(postRow.social_networks) ? postRow.social_networks : ['instagram'],
      scheduledDate: postRow.scheduled_date || '',
      status: postRow.status || 'rascunho',
      approvalToken: postRow.approval_token || undefined,
      tokenExpiresAt: postRow.token_expires_at || undefined,
      comments: Array.isArray(postRow.comments) ? postRow.comments : [],
      isPublished: Boolean(postRow.is_published),
      publishedAt: postRow.published_at || undefined,
      socialMediaAuthorId: postRow.social_media_author_id || undefined,
      createdAt: postRow.created_at || new Date().toISOString(),
      updatedAt: postRow.updated_at || new Date().toISOString()
    };

    let mappedClient: ClientProject | null = null;
    if (mappedPost.clientProjectId) {
      const { data: cRow } = await clientDb
        .from('clients')
        .select('id, name, contact_name, logo_url, assigned_social_media_id, metrics_access')
        .eq('id', mappedPost.clientProjectId)
        .limit(1)
        .maybeSingle();
      if (cRow) {
        mappedClient = {
          id: cRow.id,
          name: cRow.name || 'Cliente',
          companyName: cRow.name || '',
          cnpj: '',
          address: '',
          contactName: cRow.contact_name || '',
          whatsappNumber: '',
          email: '',
          pricePerPost: 0,
          metricsAccess: cRow.metrics_access || 'cliente',
          logoUrl: cRow.logo_url || '',
          activeSocialNetworks: ['instagram', 'facebook'],
          assignedSocialMediaId: cRow.assigned_social_media_id || undefined
        };
      }
    }

    let mappedSm: SocialMediaUser | null = null;
    const smId = mappedPost.socialMediaAuthorId || mappedClient?.assignedSocialMediaId;
    if (smId) {
      const { data: smRow } = await clientDb
        .from('social_medias')
        .select('id, name, social_profile')
        .eq('id', smId)
        .limit(1)
        .maybeSingle();
      if (smRow) {
        mappedSm = {
          id: smRow.id,
          name: smRow.name || 'Social Media',
          email: '',
          whatsapp: '',
          socialProfile: smRow.social_profile || '',
          pixKey: '',
          assignedClientIds: [],
          totalPostsCreated: 0
        };
      }
    }

    return { post: mappedPost, client: mappedClient, socialMedia: mappedSm };
  } catch {
    return { post: null, client: null, socialMedia: null };
  }
}

export async function submitPublicApprovalActionToSupabase(params: {
  token: string;
  action: 'approve' | 'request_change' | 'comment';
  comment?: string;
  authorName?: string;
}): Promise<{ ok: boolean; handledByRpc?: boolean }> {
  const clientDb = getSupabaseClient();
  if (!clientDb || !params.token) return { ok: false };

  try {
    const { data, error } = await clientDb.rpc('submit_public_approval_action', {
      p_token: params.token,
      p_action: params.action,
      p_comment: params.comment || null,
      p_author_name: params.authorName || 'Cliente'
    });
    if (!error && (data as any)?.ok) {
      return { ok: true, handledByRpc: true };
    }
  } catch {
    // usa fallback de sincronização se RPC ainda não existe
  }
  return { ok: false, handledByRpc: false };
}

export async function fetchPublicMuralByClientFromSupabase(
  clientId: string,
  smId?: string
): Promise<{
  client: ClientProject | null;
  socialMedia: SocialMediaUser | null;
  posts: PostItem[];
  tasks: ClientTask[];
  inspirations: InspirationFile[];
}> {
  const clientDb = getSupabaseClient();
  const cleanClientId = (clientId || '').trim();
  const cleanSmId = (smId || '').trim();
  if (!clientDb || !cleanClientId) {
    return { client: null, socialMedia: null, posts: [], tasks: [], inspirations: [] };
  }

  // 1. Tenta RPC segura primeiro
  try {
    const { data, error } = await clientDb.rpc('get_public_client_mural', {
      p_client_id: cleanClientId,
      p_sm_id: cleanSmId || null
    });
    if (!error && data && typeof data === 'object' && (data as any).client) {
      const payload = data as any;
      const c = payload.client;
      const sm = payload.socialMedia;
      return {
        client: {
          id: c.id,
          name: c.name || 'Cliente',
          companyName: c.name || '',
          cnpj: '',
          address: '',
          contactName: c.contactName || c.name || 'Cliente',
          whatsappNumber: '',
          email: '',
          pricePerPost: 0,
          metricsAccess: c.metricsAccess || 'cliente',
          logoUrl: c.logoUrl || '',
          activeSocialNetworks: Array.isArray(c.activeSocialNetworks) ? c.activeSocialNetworks : ['instagram', 'facebook'],
          assignedSocialMediaId: c.assignedSocialMediaId || undefined
        },
        socialMedia: sm
          ? {
              id: sm.id,
              name: sm.name || 'Social Media',
              email: '',
              whatsapp: '',
              socialProfile: sm.socialProfile || '',
              pixKey: '',
              assignedClientIds: [],
              totalPostsCreated: 0
            }
          : null,
        posts: Array.isArray(payload.posts) ? payload.posts : [],
        tasks: Array.isArray(payload.tasks) ? payload.tasks : [],
        inspirations: Array.isArray(payload.inspirations) ? payload.inspirations : []
      };
    }
  } catch {
    // tenta fallback filtrado por client_id
  }

  // 2. Fallback restrito exclusivamente ao clientId solicitado
  try {
    const { data: cRow } = await clientDb
      .from('clients')
      .select('id, name, contact_name, logo_url, assigned_social_media_id, metrics_access')
      .eq('id', cleanClientId)
      .limit(1)
      .maybeSingle();

    if (!cRow) {
      return { client: null, socialMedia: null, posts: [], tasks: [], inspirations: [] };
    }

    const mappedClient: ClientProject = {
      id: cRow.id,
      name: cRow.name || 'Cliente',
      companyName: cRow.name || '',
      cnpj: '',
      address: '',
      contactName: cRow.contact_name || '',
      whatsappNumber: '',
      email: '',
      pricePerPost: 0,
      metricsAccess: cRow.metrics_access || 'cliente',
      logoUrl: cRow.logo_url || '',
      activeSocialNetworks: ['instagram', 'facebook'],
      assignedSocialMediaId: cRow.assigned_social_media_id || undefined
    };

    const targetSmId = cleanSmId || mappedClient.assignedSocialMediaId;
    const [postsRes, tasksRes, inspRes, smRes] = await Promise.all([
      clientDb.from('posts').select('*').eq('client_project_id', cleanClientId),
      clientDb.from('client_tasks').select('*').eq('client_project_id', cleanClientId).order('created_at', { ascending: false }),
      clientDb.from('inspirations').select('*').eq('client_project_id', cleanClientId),
      targetSmId
        ? clientDb.from('social_medias').select('id, name, social_profile').eq('id', targetSmId).limit(1).maybeSingle()
        : Promise.resolve({ data: null })
    ]);

    const mappedPosts: PostItem[] = (postsRes.data || []).map((row: any) => ({
      id: row.id,
      clientProjectId: row.client_project_id || cleanClientId,
      title: row.title || 'Post sem título',
      caption: row.caption || '',
      mediaUrl: row.media_url || '',
      mediaType: row.media_type || 'image',
      socialNetworks: Array.isArray(row.social_networks) ? row.social_networks : ['instagram'],
      scheduledDate: row.scheduled_date || '',
      status: row.status || 'rascunho',
      approvalToken: row.approval_token || undefined,
      tokenExpiresAt: row.token_expires_at || undefined,
      comments: Array.isArray(row.comments) ? row.comments : [],
      isPublished: Boolean(row.is_published),
      publishedAt: row.published_at || undefined,
      socialMediaAuthorId: row.social_media_author_id || undefined,
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at || new Date().toISOString()
    }));

    const mappedTasks: ClientTask[] = (tasksRes.data || []).map((row: any) => ({
      id: row.id,
      clientProjectId: row.client_project_id || cleanClientId,
      title: row.title || 'Tarefa',
      description: row.description || '',
      deadline: row.deadline || '',
      status: (row.status as TaskStatus) || 'novo',
      linkedPostId: row.linked_post_id || undefined,
      createdByRole: (row.created_by_role as UserRole) || 'cliente',
      createdByName: row.created_by_name || undefined,
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at || undefined
    }));

    const mappedInspirations: InspirationFile[] = (inspRes.data || []).map((row: any) => ({
      id: row.id,
      clientProjectId: row.client_project_id || cleanClientId,
      title: row.title || 'Inspiração',
      description: row.description || undefined,
      url: row.url || '',
      type: row.type || 'Referência Geral',
      category: row.type || 'Referência Geral',
      uploadedByRole: (row.uploaded_by_role as UserRole) || 'cliente',
      uploadedByName: row.uploaded_by_name || 'Cliente',
      createdAt: row.created_at || new Date().toISOString(),
      isUsed: Boolean(row.is_used),
      usedAt: row.used_at || undefined
    }));

    const smData = (smRes as any)?.data;
    const mappedSm: SocialMediaUser | null = smData
      ? {
          id: smData.id,
          name: smData.name || 'Social Media',
          email: '',
          whatsapp: '',
          socialProfile: smData.social_profile || '',
          pixKey: '',
          assignedClientIds: [],
          totalPostsCreated: 0
        }
      : null;

    return {
      client: mappedClient,
      socialMedia: mappedSm,
      posts: mappedPosts,
      tasks: mappedTasks,
      inspirations: mappedInspirations
    };
  } catch {
    return { client: null, socialMedia: null, posts: [], tasks: [], inspirations: [] };
  }
}

export async function submitPublicMuralTaskToSupabase(params: {
  clientId: string;
  id: string;
  title: string;
  description?: string;
  deadline?: string;
  authorName?: string;
}): Promise<{ ok: boolean; handledByRpc?: boolean }> {
  const clientDb = getSupabaseClient();
  if (!clientDb || !params.clientId) return { ok: false };
  try {
    const { data, error } = await clientDb.rpc('submit_public_mural_task', {
      p_client_id: params.clientId,
      p_id: params.id,
      p_title: params.title,
      p_description: params.description || '',
      p_deadline: params.deadline || '',
      p_author_name: params.authorName || 'Cliente'
    });
    if (!error && (data as any)?.ok) {
      return { ok: true, handledByRpc: true };
    }
  } catch {
    // fallback
  }
  return { ok: false, handledByRpc: false };
}


