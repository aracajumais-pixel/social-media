// supabase/functions/upload-drive-file/index.ts
//
// Recebe um arquivo (em base64) do navegador do social media e sobe ele
// direto para uma pasta específica do Google Drive (normalmente 01_Rascunhos),
// usando a Service Account. Pensado para imagens — vídeos continuam pelo
// upload manual no Drive (arquivos grandes podem esbarrar no limite de
// tamanho de requisição da Edge Function).
//
// Chamada esperada (POST):
//   { "fileName": "foto.jpg", "mimeType": "image/jpeg", "fileBase64": "...", "folderId": "..." }
//
// Resposta:
//   { "success": true, "file": { "id", "webViewLink", "thumbnailLink", "mimeType" } }

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

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const { fileName, mimeType, fileBase64, folderId } = await req.json();
    if (!fileName || !mimeType || !fileBase64 || !folderId) {
      return new Response(
        JSON.stringify({ error: 'fileName, mimeType, fileBase64 e folderId são obrigatórios' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    const serviceAccountRaw = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY');
    if (!serviceAccountRaw) {
      throw new Error('Secret GOOGLE_SERVICE_ACCOUNT_KEY não configurado.');
    }

    const serviceAccount = JSON.parse(serviceAccountRaw);
    const accessToken = await getAccessToken(serviceAccount);

    // Decodifica o base64 (sem o prefixo "data:image/...;base64,", se vier assim)
    const cleanBase64 = fileBase64.includes(',') ? fileBase64.split(',')[1] : fileBase64;
    const binary = atob(cleanBase64);
    const fileBytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) fileBytes[i] = binary.charCodeAt(i);

    // Monta o corpo multipart/related exigido pelo Drive API pra criar arquivo com conteúdo + metadados juntos
    const boundary = `social_approve_${Date.now()}`;
    const metadata = JSON.stringify({ name: fileName, parents: [folderId] });
    const encoder = new TextEncoder();

    const preamble = encoder.encode(
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`
    );
    const closing = encoder.encode(`\r\n--${boundary}--`);

    const body = new Uint8Array(preamble.length + fileBytes.length + closing.length);
    body.set(preamble, 0);
    body.set(fileBytes, preamble.length);
    body.set(closing, preamble.length + fileBytes.length);

    const uploadResponse = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,thumbnailLink,mimeType',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body,
      }
    );

    const uploadData = await uploadResponse.json();
    if (!uploadResponse.ok) {
      throw new Error(`Erro ao subir arquivo pro Drive: ${JSON.stringify(uploadData)}`);
    }

    return new Response(
      JSON.stringify({ success: true, file: uploadData }),
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
