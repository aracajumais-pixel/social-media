// src/lib/drive.ts
// Rotina do Google Drive — isolada de propósito.
// ⚠️ Não alterar este arquivo sem autorização explícita de Wla.
import { getSupabaseClient } from './supabase';

// ===== Google Drive: criação de pastas e listagem de arquivos (via Edge Functions) =====

export async function createClientDriveFolder(clientName: string): Promise<{
  folderId: string;
  folderUrl: string;
  subfolders: Record<string, { id: string; url: string }>;
} | null> {
  const clientDb = getSupabaseClient();
  if (!clientDb) return null;
  try {
    const { data, error } = await clientDb.functions.invoke('create-client-drive-folder', {
      body: { clientName }
    });
    if (error) {
      console.warn('Erro ao criar pasta do cliente no Drive:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('Erro ao chamar create-client-drive-folder:', err);
    return null;
  }
}

export interface DriveFileInfo {
  id: string;
  name: string;
  webViewLink: string;
  thumbnailLink?: string;
  mimeType: string;
}

export async function listDriveFiles(folderId: string): Promise<DriveFileInfo[]> {
  const clientDb = getSupabaseClient();
  if (!clientDb) return [];
  try {
    const { data, error } = await clientDb.functions.invoke('list-drive-files', {
      body: { folderId }
    });
    if (error) {
      console.warn('Erro ao listar arquivos do Drive:', error.message);
      return [];
    }
    return data?.files || [];
  } catch (err) {
    console.warn('Erro ao chamar list-drive-files:', err);
    return [];
  }
}

export async function deleteClientFromSupabase(clientId: string): Promise<boolean> {
  const clientDb = getSupabaseClient();
  if (!clientDb) return false;
  try {
    const { error } = await clientDb.from('clients').delete().eq('id', clientId);
    if (error) {
      console.warn('Erro ao excluir cliente no Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Erro ao chamar deleteClientFromSupabase:', err);
    return false;
  }
}

export async function deletePostFromSupabase(postId: string): Promise<boolean> {
  const clientDb = getSupabaseClient();
  if (!clientDb) return false;
  try {
    const { error } = await clientDb.from('posts').delete().eq('id', postId);
    if (error) {
      console.warn('Erro ao excluir post no Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Erro ao chamar deletePostFromSupabase:', err);
    return false;
  }
}

export async function uploadFileToDrive(
  file: File,
  folderId: string
): Promise<DriveFileInfo | null> {
  const clientDb = getSupabaseClient();
  if (!clientDb) return null;

  const fileBase64: string = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  try {
    const { data, error } = await clientDb.functions.invoke('upload-drive-file', {
      body: {
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        fileBase64,
        folderId
      }
    });
    if (error) {
      console.warn('Erro ao subir arquivo pro Drive:', error.message);
      return null;
    }
    return data?.file || null;
  } catch (err) {
    console.warn('Erro ao chamar uploadFileToDrive:', err);
    return null;
  }
}
