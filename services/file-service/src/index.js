const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { createClient } = require('@supabase/supabase-js');

const PORT = process.env.PORT || 8082;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const STORAGE_BUCKET = process.env.STORAGE_BUCKET || 'premier_tp';
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:5173').split(',');

const app = express();
app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));
app.use(express.json({ limit: '30mb' }));
app.use(morgan('dev'));

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'file-service' }));

function getUserId(req) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    return payload.sub || null;
  } catch {
    return null;
  }
}

function createAuthenticatedClient(token) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

app.post('/internal/files/list', async (req, res) => {
  const userId = getUserId(req);
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!userId || !token) return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Missing or invalid token' });
  
  try {
    const authClient = createAuthenticatedClient(token);
    const { data, error } = await authClient.from('files').select('*').eq('user_id', userId);
    if (error) {
      const { data: listed, error: listError } = await authClient.storage.from(STORAGE_BUCKET).list(userId, {
        limit: 100, sortBy: { column: 'name', order: 'asc' }
      });
      if (listError) return res.status(500).json({ code: 'STORAGE_LIST_ERROR', message: listError.message });
      const mapped = (listed || []).map((f) => ({ id: `${userId}/${f.name}`, filename: f.name, path: `${userId}/${f.name}` }));
      return res.json({ items: mapped });
    }
    return res.json({ items: data || [] });
  } catch (err) {
    return res.status(500).json({ code: 'LIST_FAILED', message: err.message });
  }
});

app.post('/internal/files/upload', async (req, res) => {
  const userId = getUserId(req);
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!userId || !token) return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Missing or invalid token' });
  const { filename, contentType, base64 } = req.body || {};
  if (!filename || !base64) return res.status(400).json({ code: 'BAD_REQUEST', message: 'filename and base64 are required' });

  const sanitized = filename
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-');
  const path = `${userId}/${sanitized}`;

  try {
    const authClient = createAuthenticatedClient(token);
    const buffer = Buffer.from(base64, 'base64');
    const { data, error } = await authClient.storage.from(STORAGE_BUCKET).upload(path, buffer, {
      contentType: contentType || 'application/octet-stream', upsert: true
    });
    if (error) {
      return res.status(400).json({ code: 'UPLOAD_ERROR', message: error.message });
    }

    await authClient.from('files').insert([{ user_id: userId, filename: sanitized, path }]).then(({ error: insertError }) => {
      if (insertError) {
      }
    });

    return res.status(201).json({ path, data });
  } catch (err) {
    return res.status(500).json({ code: 'UPLOAD_FAILED', message: err.message });
  }
});

app.post('/internal/files/delete', async (req, res) => {
  const userId = getUserId(req);
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!userId || !token) return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Missing or invalid token' });
  
  const { path } = req.body || {};
  if (!path) return res.status(400).json({ code: 'BAD_REQUEST', message: 'path is required' });

  if (!path.startsWith(`${userId}/`)) {
    return res.status(403).json({ code: 'FORBIDDEN', message: 'Cannot delete files from other users' });
  }

  try {
    const authClient = createAuthenticatedClient(token);
    
    const { error: storageError } = await authClient.storage.from(STORAGE_BUCKET).remove([path]);
    if (storageError) {
      return res.status(400).json({ code: 'DELETE_ERROR', message: storageError.message });
    }

    await authClient.from('files').delete().eq('path', path).then(({ error: deleteError }) => {
      if (deleteError) {
      }
    });

    return res.status(200).json({ success: true, path });
  } catch (err) {
    return res.status(500).json({ code: 'DELETE_FAILED', message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`[file-service] listening on ${PORT}`);
});
