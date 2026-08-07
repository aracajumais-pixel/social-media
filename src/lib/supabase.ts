import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ClientProject, PostItem } from '../types';

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

export const isSupabaseConfigured = Boolean(getSupabaseCredentials().url && getSupabaseCredentials().key);

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

/**
 * Sincroniza dados do Cliente para a tabela `clients` no Supabase.
 */
export async function syncClientToSupabase(client: ClientProject) {
  const clientDb = getSupabaseClient();
  if (!clientDb) return null;
  try {
    const payload = {
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
      assigned_social_media_id: client.assignedSocialMediaId || null,
      status: client.status || 'ativo'
    };
    const { data, error } = await clientDb
      .from('clients')
      .upsert([payload]);
    if (error) {
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
      return data.map((row: any) => ({
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
        assignedSocialMediaId: row.assigned_social_media_id || undefined,
        status: row.status || 'ativo'
      }));
    }
    return null;
  } catch (err) {
    console.warn('Falha ao consultar clientes do Supabase:', err);
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
  status?: string;
}) {
  const clientDb = getSupabaseClient();
  if (!clientDb) return null;
  try {
    const { data, error } = await clientDb
      .from('social_medias')
      .upsert([{
        id: sm.id,
        name: sm.name,
        email: sm.email,
        whatsapp: sm.whatsapp,
        social_profile: sm.socialProfile,
        pix_key: sm.pixKey,
        custom_fee_per_post: sm.customFeePerPost ?? null,
        status: sm.status || 'ativo'
      }]);
    if (error) console.warn('Erro ao sincronizar Social Media no Supabase:', error.message);
    return data;
  } catch (err) {
    console.warn('Falha ao conectar com Supabase:', err);
    return null;
  }
}

