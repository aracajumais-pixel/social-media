/**
 * Automação Gratuita do Google Drive via Google Apps Script
 * Cria a estrutura de pastas e subpastas de clientes no Google Drive com 1 clique
 */

export const APPS_SCRIPT_TEMPLATE = `/**
 * Webhook de Automação de Pastas do Google Drive
 * Social Media 5.0
 * 
 * INSTRUÇÕES:
 * 1. Cole este código em https://script.google.com/
 * 2. Clique em "Implantar" > "Nova implantação"
 * 3. Selecione tipo: "App da Web" (Web App)
 * 4. Configurações:
 *    - Executar como: "Eu" (seu e-mail)
 *    - Quem tem acesso: "Qualquer pessoa" (Anyone)
 * 5. Clique em "Implantar", autorize as permissões do Drive e copie a "URL do app da Web".
 * 6. Cole a URL no Social Media 5.0.
 */

function doPost(e) {
  try {
    var data = {};
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    }
    
    var clientName = data.clientName || "Novo Cliente";
    var subfolders = data.subfolders || [
      "01_Rascunhos",
      "02_Aprovados",
      "03_Inspiracoes_Cliente",
      "04_Recibos_PDF",
      "05_Identidade_Visual"
    ];

    // 1. Procura ou cria a pasta principal "Clientes - Social Media 5.0"
    var rootFolderIterator = DriveApp.getFoldersByName("Clientes - Social Media 5.0");
    var rootFolder;
    if (rootFolderIterator.hasNext()) {
      rootFolder = rootFolderIterator.next();
    } else {
      rootFolder = DriveApp.createFolder("Clientes - Social Media 5.0");
    }

    // 2. Cria a pasta exclusiva para o cliente
    var clientFolder = rootFolder.createFolder(clientName);
    
    // 3. Define permissão como acessível para quem tiver o link (Leitor)
    try {
      clientFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (permErr) {
      // Ignora se restrição de domínio
    }

    // 4. Cria todas as subpastas padronizadas
    var createdSubfolders = {};
    for (var i = 0; i < subfolders.length; i++) {
      var subName = subfolders[i];
      var sub = clientFolder.createFolder(subName);
      createdSubfolders[subName] = sub.getUrl();
    }

    var response = {
      status: "success",
      clientName: clientName,
      folderId: clientFolder.getId(),
      folderUrl: clientFolder.getUrl(),
      subfolders: createdSubfolders,
      timestamp: new Date().toISOString()
    };

    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    var errorResponse = {
      status: "error",
      message: error.toString()
    };
    return ContentService.createTextOutput(JSON.stringify(errorResponse))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "active",
    message: "Webhook Social Media 5.0 para Google Drive está funcionando corretamente!"
  })).setMimeType(ContentService.MimeType.JSON);
}
`;

export interface DriveFolderCreationResult {
  status: 'success' | 'error';
  clientName?: string;
  folderId?: string;
  folderUrl?: string;
  subfolders?: Record<string, string>;
  message?: string;
}

const STORAGE_KEY = 'social_media_drive_webhook_url';

export function getSavedDriveWebhookUrl(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(STORAGE_KEY) || '';
}

export function saveDriveWebhookUrl(url: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, url.trim());
}

/**
 * Dispara o Webhook do Google Apps Script para criar a estrutura no Drive
 */
export async function createDriveFolderForClient(
  clientName: string,
  webhookUrl?: string
): Promise<DriveFolderCreationResult> {
  const targetUrl = webhookUrl || getSavedDriveWebhookUrl();

  if (!targetUrl) {
    throw new Error('URL do Webhook do Google Apps Script não configurada.');
  }

  const payload = {
    clientName,
    subfolders: [
      '01_Rascunhos',
      '02_Aprovados',
      '03_Inspiracoes_Cliente',
      '04_Recibos_PDF',
      '05_Identidade_Visual'
    ]
  };

  const response = await fetch(targetUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Erro na comunicação com o Google Drive (${response.status})`);
  }

  const result: DriveFolderCreationResult = await response.json();
  return result;
}