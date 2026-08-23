// supabase/functions/create-client-drive-folder/index.ts
//
// Cria, no Google Drive, uma pasta para o cliente (dentro da pasta raiz
// compartilhada com a Service Account) e as 4 subpastas padrão:
// 01_Rascunhos, 02_Aprovados, 03_Inspirações_Cliente, 04_Recibos_PDF.
//
// Chamada esperada (POST):
//   { "clientName": "Nome do Cliente Ltda" }
//
// Resposta:
//   { "success": true, "folderId": "...", "folderUrl": "https://drive.google.com/drive/folders/..." }

const SUBFOLDERS = [
  '01_Rascunhos',
  '02_Aprovados',
  '03_Inspirações_Cliente',
  '04_Recibos_PDF',
];

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function base64UrlEncode(data: Uint8Array | string): string {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

async function getAccessToken(serviceAccount: {
  client_email: string;
  private_key: string;
}): Promise<string> {
  const nowSeconds = Math.floor(Date.now() / 1000);

  const header = { alg: 'RS256', typ: 'JWT' };
  const claims = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/drive',
    aud: 'https://oauth2.googleapis.com/token',
    iat: nowSeconds,
    exp: nowSeconds + 3600,
  };

  const unsignedToken = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(
    JSON.stringify(claims)
  )}`;

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(serviceAccount.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  );

  const jwt = `${unsignedToken}.${base64UrlEncode(new Uint8Array(signature))}`;

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  const tokenData = await tokenResponse.json();
  if (!tokenResponse.ok) {
    throw new Error(`Erro ao obter access token do Google: ${JSON.stringify(tokenData)}`);
  }
  return tokenData.access_token;
}

async function createDriveFolder(
  accessToken: string,
  name: string,
  parentId: string
): Promise<{ id: string; webViewLink: string }> {
  const response = await fetch(
    'https://www.googleapis.com/drive/v3/files?fields=id,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentId],
      }),
    }
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Erro ao criar pasta "${name}" no Drive: ${JSON.stringify(data)}`);
  }
  return data;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const { clientName } = await req.json();
    if (!clientName || typeof clientName !== 'string') {
      return new Response(JSON.stringify({ error: 'clientName é obrigatório' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const serviceAccountRaw = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY');
    const rootFolderId = Deno.env.get('GOOGLE_DRIVE_ROOT_FOLDER_ID');

    if (!serviceAccountRaw || !rootFolderId) {
      throw new Error(
        'Secrets GOOGLE_SERVICE_ACCOUNT_KEY / GOOGLE_DRIVE_ROOT_FOLDER_ID não configurados.'
      );
    }

    const serviceAccount = JSON.parse(serviceAccountRaw);
    const accessToken = await getAccessToken(serviceAccount);

    // 1. Cria a pasta do cliente dentro da pasta raiz
    const clientFolder = await createDriveFolder(accessToken, clientName, rootFolderId);

    // 2. Cria as 4 subpastas padrão dentro da pasta do cliente
    for (const subfolderName of SUBFOLDERS) {
      await createDriveFolder(accessToken, subfolderName, clientFolder.id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        folderId: clientFolder.id,
        folderUrl: clientFolder.webViewLink,
      }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
});