const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const jwksRsa = require('jwks-rsa');
const jwt = require('jsonwebtoken');

const PORT = process.env.PORT || 8081;
const AUTH_JWKS_URL = process.env.SUPABASE_JWKS_URL;
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:5173').split(',');

const app = express();
app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'auth-service' }));

const jwksClient = jwksRsa({ jwksUri: AUTH_JWKS_URL, cache: true });
async function verifyJwt(token) {
  const decoded = jwt.decode(token, { complete: true });
  if (!decoded || !decoded.header || !decoded.header.kid) throw new Error('Invalid token');
  const key = await jwksClient.getSigningKey(decoded.header.kid);
  const signingKey = key.getPublicKey();
  return jwt.verify(token, signingKey, { algorithms: ['RS256'] });
}

app.post('/internal/verify', async (req, res) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Missing bearer token' });
  try {
    const payload = await verifyJwt(token);
    return res.json({ valid: true, sub: payload.sub, payload });
  } catch (err) {
    return res.status(401).json({ valid: false, message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`[auth-service] listening on ${PORT}`);
});
