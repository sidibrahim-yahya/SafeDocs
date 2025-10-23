const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const axios = require('axios');
const jwksRsa = require('jwks-rsa');
const jwt = require('jsonwebtoken');

const PORT = process.env.PORT || 8080;
const JWT_SECRET = process.env.SUPABASE_JWT_SECRET; // HS256 secret from Supabase
const AUTH_JWKS_URL = process.env.SUPABASE_JWKS_URL; // RS256 fallback (not used by default Supabase)
const FILE_SERVICE_URL = process.env.FILE_SERVICE_URL || 'http://file-service:8082';
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:5173').split(',');

const app = express();
app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));
app.use(express.json({ limit: '15mb' }));
app.use(morgan('dev'));

// Health
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'api-gateway' }));

// JWT verification middleware using Supabase JWT_SECRET (HS256)
console.log('[gateway] JWT_SECRET configured:', Boolean(JWT_SECRET));
console.log('[gateway] JWKS URL:', AUTH_JWKS_URL);

async function verifyJwt(token) {
  const decoded = jwt.decode(token, { complete: true });
  console.log('[gateway] JWT decoded:', { 
    alg: decoded?.header?.alg, 
    kid: decoded?.header?.kid,
    sub: decoded?.payload?.sub 
  });

  if (!decoded) throw new Error('Invalid token: cannot decode');

  // Supabase uses HS256 by default with JWT_SECRET
  if (decoded.header.alg === 'HS256') {
    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET required for HS256 verification');
    }
    console.log('[gateway] Verifying JWT with HS256 + JWT_SECRET');
    return jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
  }

  // Fallback to RS256 with JWKS (if custom Supabase setup)
  if (decoded.header.alg === 'RS256') {
    console.log('[gateway] Verifying JWT with RS256 + JWKS');
    const jwksClient = jwksRsa({ jwksUri: AUTH_JWKS_URL, cache: true });
    const key = await jwksClient.getSigningKey(decoded.header.kid);
    const signingKey = key.getPublicKey();
    return jwt.verify(token, signingKey, { algorithms: ['RS256'] });
  }

  throw new Error(`Unsupported JWT algorithm: ${decoded.header.alg}`);
}

async function requireAuth(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) {
    console.warn('[gateway] No bearer token in Authorization header');
    return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Missing bearer token' });
  }
  try {
    const payload = await verifyJwt(token);
    req.user = { id: payload.sub, payload };
    console.log('[gateway] JWT verified successfully for user:', payload.sub);
    next();
  } catch (err) {
    console.error('[gateway] JWT verification failed:', err.message, err.stack);
    return res.status(401).json({ code: 'INVALID_TOKEN', message: err.message });
  }
}

// Files - list
app.post('/v1/files/list', requireAuth, async (req, res) => {
  try {
    const r = await axios.post(`${FILE_SERVICE_URL}/internal/files/list`, req.body || {}, {
      headers: { Authorization: req.headers.authorization },
      timeout: 15000,
    });
    res.status(r.status).json(r.data);
  } catch (err) {
    if (err.response) return res.status(err.response.status).json(err.response.data);
    return res.status(500).json({ code: 'FILE_LIST_FAILED', message: err.message });
  }
});

// Files - upload (expects { filename, contentType, base64 })
app.post('/v1/files/upload', requireAuth, async (req, res) => {
  try {
    const r = await axios.post(`${FILE_SERVICE_URL}/internal/files/upload`, req.body || {}, {
      headers: { Authorization: req.headers.authorization },
      timeout: 30000,
    });
    res.status(r.status).json(r.data);
  } catch (err) {
    if (err.response) return res.status(err.response.status).json(err.response.data);
    return res.status(500).json({ code: 'FILE_UPLOAD_FAILED', message: err.message });
  }
});

// Files - delete (expects { path })
app.post('/v1/files/delete', requireAuth, async (req, res) => {
  try {
    const r = await axios.post(`${FILE_SERVICE_URL}/internal/files/delete`, req.body || {}, {
      headers: { Authorization: req.headers.authorization },
      timeout: 15000,
    });
    res.status(r.status).json(r.data);
  } catch (err) {
    if (err.response) return res.status(err.response.status).json(err.response.data);
    return res.status(500).json({ code: 'FILE_DELETE_FAILED', message: err.message });
  }
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[gateway] listening on ${PORT}`);
});


