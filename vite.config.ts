import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import https from 'https';

function proxyGoogleDriveStream(targetUrl: string, reqHeaders: any, clientRes: any, maxRedirects = 3) {
  if (maxRedirects < 0) {
    clientRes.statusCode = 502;
    clientRes.end('Too many redirects');
    return;
  }

  const parsed = new URL(targetUrl);
  const options = {
    hostname: parsed.hostname,
    port: parsed.port || 443,
    path: parsed.pathname + parsed.search,
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      ...(reqHeaders['range'] ? { 'range': reqHeaders['range'] } : {})
    }
  };

  const proxyReq = https.request(options, (proxyRes) => {
    if (proxyRes.statusCode && proxyRes.statusCode >= 300 && proxyRes.statusCode < 400 && proxyRes.headers.location) {
      const redirectUrl = new URL(proxyRes.headers.location, targetUrl).href;
      return proxyGoogleDriveStream(redirectUrl, reqHeaders, clientRes, maxRedirects - 1);
    }

    clientRes.statusCode = proxyRes.statusCode || 200;
    clientRes.setHeader('Content-Type', proxyRes.headers['content-type'] || 'video/mp4');
    clientRes.setHeader('Accept-Ranges', 'bytes');
    clientRes.setHeader('Access-Control-Allow-Origin', '*');
    clientRes.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    clientRes.setHeader('Access-Control-Allow-Headers', 'Range, Authorization, Content-Type');
    clientRes.setHeader('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges');
    if (proxyRes.headers['content-range']) clientRes.setHeader('Content-Range', proxyRes.headers['content-range']);
    if (proxyRes.headers['content-length']) clientRes.setHeader('Content-Length', proxyRes.headers['content-length']);

    proxyRes.pipe(clientRes);
  });

  proxyReq.on('error', (err) => {
    if (!clientRes.headersSent) {
      clientRes.statusCode = 502;
      clientRes.end('Proxy error: ' + err.message);
    }
  });

  proxyReq.end();
}

function muxDevServerPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'mux-dev-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';

        // Google Drive Streaming Proxy with Range Support (HTML5 video playback)
        if (url.startsWith('/api/proxy/drive/')) {
          if (req.method === 'OPTIONS') {
            res.statusCode = 204;
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Range, Authorization, Content-Type');
            res.end();
            return;
          }

          const match = url.match(/\/api\/proxy\/drive\/([a-zA-Z0-9_-]+)/);
          const fileId = match ? match[1] : '';
          if (!fileId) {
            res.statusCode = 400;
            res.end('Missing fileId');
            return;
          }
          const targetUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t`;
          proxyGoogleDriveStream(targetUrl, req.headers, res);
          return;
        }

        // Handle Direct Upload URL creation
        if (url.startsWith('/api/mux/upload') && req.method === 'POST') {
          let bodyStr = '';
          req.on('data', (chunk) => {
            bodyStr += chunk;
          });

          req.on('end', async () => {
            try {
              const body = JSON.parse(bodyStr || '{}');
              const { movieId, playbackPolicy = 'signed', fileName, fileSize } = body;
              const uploadId = `upload_${Date.now()}`;

              // Check if real Mux credentials are provided
              const tokenId = env.MUX_TOKEN_ID || process.env.MUX_TOKEN_ID;
              const tokenSecret = env.MUX_TOKEN_SECRET || process.env.MUX_TOKEN_SECRET;

              if (tokenId && tokenSecret) {
                const authHeader = 'Basic ' + Buffer.from(`${tokenId}:${tokenSecret}`).toString('base64');
                const muxResponse = await fetch('https://api.mux.com/video/v1/uploads', {
                  method: 'POST',
                  headers: {
                    Authorization: authHeader,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    cors_origin: '*',
                    new_asset_settings: {
                      playback_policy: [playbackPolicy],
                      passthrough: JSON.stringify({ movieId, uploadId })
                    }
                  })
                });

                if (muxResponse.ok) {
                  const muxData = await muxResponse.json();
                  res.setHeader('Content-Type', 'application/json');
                  res.end(
                    JSON.stringify({
                      uploadUrl: muxData.data.url,
                      uploadId: muxData.data.id,
                      assetId: muxData.data.asset_id
                    })
                  );
                  return;
                } else {
                  const errText = await muxResponse.text();
                  console.warn('Mux API Direct Upload error:', errText);
                }
              }

              // Local dev mock upload fallback
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  uploadUrl: `/api/mux/mock-upload?uploadId=${uploadId}&movieId=${encodeURIComponent(movieId || '')}`,
                  uploadId: uploadId,
                  status: 'waiting'
                })
              );
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        // Mock upload endpoint to accept binary file during dev testing
        if (url.startsWith('/api/mux/mock-upload') && req.method === 'PUT') {
          req.on('data', () => {});
          req.on('end', () => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ status: 'uploaded' }));
          });
          return;
        }

        // Handle Upload Status Polling (Crucial for Localhost where Mux webhooks cannot reach)
        if (url.startsWith('/api/mux/check-upload') && req.method === 'GET') {
          const parsedUrl = new URL(req.url || '', `http://${req.headers.host}`);
          const uploadId = parsedUrl.searchParams.get('uploadId');
          let assetId = parsedUrl.searchParams.get('assetId');

          const tokenId = env.MUX_TOKEN_ID || process.env.MUX_TOKEN_ID;
          const tokenSecret = env.MUX_TOKEN_SECRET || process.env.MUX_TOKEN_SECRET;

          if (!tokenId || !tokenSecret) {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ status: 'mock_ready', playbackId: 'v69Un5gjKqHg00QJChGnOBtSBivVu0102z' }));
            return;
          }

          const authHeader = 'Basic ' + Buffer.from(`${tokenId}:${tokenSecret}`).toString('base64');

          try {
            // 1. If we have uploadId and don't have assetId, check upload status
            if (uploadId && !assetId) {
              const uploadRes = await fetch(`https://api.mux.com/video/v1/uploads/${uploadId}`, {
                headers: { Authorization: authHeader }
              });
              if (uploadRes.ok) {
                const uploadData: any = await uploadRes.json();
                const upload = uploadData.data;

                if (upload.status === 'errored') {
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ status: 'errored', error: upload.error?.message || 'Upload failed' }));
                  return;
                }

                if (upload.asset_id) {
                  assetId = upload.asset_id;
                } else {
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ status: upload.status || 'waiting' }));
                  return;
                }
              }
            }

            // 2. If we have assetId, check asset status
            if (assetId) {
              const assetRes = await fetch(`https://api.mux.com/video/v1/assets/${assetId}`, {
                headers: { Authorization: authHeader }
              });

              if (assetRes.ok) {
                const assetData: any = await assetRes.json();
                const asset = assetData.data;

                if (asset.status === 'ready') {
                  const primaryPlayback = asset.playback_ids?.[0];
                  const playbackId = primaryPlayback?.id || '';
                  const playbackPolicy = primaryPlayback?.policy || 'public';
                  const videoTrack = asset.tracks?.find((t: any) => t.type === 'video');

                  res.setHeader('Content-Type', 'application/json');
                  res.end(
                    JSON.stringify({
                      status: 'ready',
                      assetId: asset.id,
                      playbackId,
                      playbackPolicy,
                      duration: asset.duration || 0,
                      aspectRatio: asset.aspect_ratio || '16:9',
                      width: videoTrack?.max_width || 1920,
                      height: videoTrack?.max_height || 1080
                    })
                  );
                  return;
                } else if (asset.status === 'errored') {
                  res.setHeader('Content-Type', 'application/json');
                  res.end(
                    JSON.stringify({
                      status: 'errored',
                      assetId: asset.id,
                      error: asset.errors?.messages?.[0] || 'Asset processing failed'
                    })
                  );
                  return;
                } else {
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ status: 'processing', assetId: asset.id }));
                  return;
                }
              }
            }

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ status: 'waiting' }));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        // Handle Listing Mux Assets in user account
        if (url.startsWith('/api/mux/list-assets') && req.method === 'GET') {
          const tokenId = env.MUX_TOKEN_ID || process.env.MUX_TOKEN_ID;
          const tokenSecret = env.MUX_TOKEN_SECRET || process.env.MUX_TOKEN_SECRET;

          if (!tokenId || !tokenSecret) {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ assets: [] }));
            return;
          }

          try {
            const authHeader = 'Basic ' + Buffer.from(`${tokenId}:${tokenSecret}`).toString('base64');
            const listRes = await fetch('https://api.mux.com/video/v1/assets?limit=25', {
              headers: { Authorization: authHeader }
            });

            if (!listRes.ok) {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ assets: [] }));
              return;
            }

            const listData: any = await listRes.json();
            const assets = (listData.data || []).map((a: any) => ({
              assetId: a.id,
              status: a.status,
              playbackId: a.playback_ids?.[0]?.id || '',
              playbackPolicy: a.playback_ids?.[0]?.policy || 'public',
              duration: a.duration || 0,
              title: a.meta?.title || a.meta?.name || '',
              createdAt: a.created_at ? new Date(a.created_at * 1000).toISOString() : ''
            }));

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ assets }));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message, assets: [] }));
          }
          return;
        }

        // Handle Playback ID verification and info
        if (url.startsWith('/api/mux/asset-info') && req.method === 'GET') {
          const parsedUrl = new URL(req.url || '', `http://${req.headers.host}`);
          const playbackId = parsedUrl.searchParams.get('playbackId');
          const assetIdParam = parsedUrl.searchParams.get('assetId');

          const tokenId = env.MUX_TOKEN_ID || process.env.MUX_TOKEN_ID;
          const tokenSecret = env.MUX_TOKEN_SECRET || process.env.MUX_TOKEN_SECRET;

          if (!tokenId || !tokenSecret) {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ valid: true, playbackId }));
            return;
          }

          const authHeader = 'Basic ' + Buffer.from(`${tokenId}:${tokenSecret}`).toString('base64');

          try {
            let assetId = assetIdParam;
            let playbackPolicy = 'public';

            if (playbackId) {
              const pbRes = await fetch(`https://api.mux.com/video/v1/playback-ids/${playbackId}`, {
                headers: { Authorization: authHeader }
              });
              if (pbRes.ok) {
                const pbData: any = await pbRes.json();
                assetId = pbData.data?.object?.id;
                playbackPolicy = pbData.data?.policy || 'public';
              }
            }

            if (assetId) {
              const assetRes = await fetch(`https://api.mux.com/video/v1/assets/${assetId}`, {
                headers: { Authorization: authHeader }
              });
              if (assetRes.ok) {
                const assetData: any = await assetRes.json();
                const asset = assetData.data;
                const videoTrack = asset.tracks?.find((t: any) => t.type === 'video');

                res.setHeader('Content-Type', 'application/json');
                res.end(
                  JSON.stringify({
                    valid: true,
                    status: asset.status,
                    assetId: asset.id,
                    playbackId: playbackId || asset.playback_ids?.[0]?.id,
                    playbackPolicy: playbackPolicy || asset.playback_ids?.[0]?.policy,
                    duration: asset.duration || 0,
                    aspectRatio: asset.aspect_ratio || '16:9',
                    width: videoTrack?.max_width || 1920,
                    height: videoTrack?.max_height || 1080
                  })
                );
                return;
              }
            }

            // Test if the stream exists directly on Mux CDN
            if (playbackId) {
              const testStream = await fetch(`https://stream.mux.com/${playbackId}.m3u8`, { method: 'HEAD' });
              if (testStream.ok) {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ valid: true, playbackId, playbackPolicy: 'public', status: 'ready' }));
                return;
              }
            }

            // If we reached here, the Playback ID does NOT exist in Mux!
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              valid: false,
              playbackId,
              error: 'ئەم Playback ID ـیە لە سێرڤەری Mux بوونی نییە (404 Not Found).'
            }));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message, valid: false }));
          }
          return;
        }

        // Handle Playback Token generation
        if (url.startsWith('/api/mux/token') && req.method === 'POST') {
          let bodyStr = '';
          req.on('data', (chunk) => {
            bodyStr += chunk;
          });

          req.on('end', async () => {
            try {
              const body = JSON.parse(bodyStr || '{}');
              const { movieId, playbackId: reqPlaybackId, policy: reqPolicy } = body;

              const effectivePlaybackId = reqPlaybackId || 'JxKXEh8rMc8vq1p9X6nJl00kbI00q5aMFmNqkvdkejk5o';

              const tokenId = env.MUX_TOKEN_ID || process.env.MUX_TOKEN_ID;
              const tokenSecret = env.MUX_TOKEN_SECRET || process.env.MUX_TOKEN_SECRET;

              let determinedPolicy = reqPolicy;

              // If policy wasn't explicitly public, check with Mux API to avoid 400 Bad Request on public IDs
              if (determinedPolicy !== 'public' && tokenId && tokenSecret && effectivePlaybackId) {
                try {
                  const authHeader = 'Basic ' + Buffer.from(`${tokenId}:${tokenSecret}`).toString('base64');
                  const pbRes = await fetch(`https://api.mux.com/video/v1/playback-ids/${effectivePlaybackId}`, {
                    headers: { Authorization: authHeader }
                  });
                  if (pbRes.ok) {
                    const pbData: any = await pbRes.json();
                    if (pbData.data?.policy === 'public') {
                      determinedPolicy = 'public';
                    } else if (pbData.data?.policy === 'signed') {
                      determinedPolicy = 'signed';
                    }
                  }
                } catch (e) {
                  console.warn('Playback ID policy check note:', e);
                }
              }

              // If policy is public, NEVER send a token because Mux will return 400 Bad Request
              if (determinedPolicy === 'public') {
                res.setHeader('Content-Type', 'application/json');
                res.end(
                  JSON.stringify({
                    allowed: true,
                    playbackId: effectivePlaybackId,
                    policy: 'public',
                    streamUrl: `https://stream.mux.com/${effectivePlaybackId}.m3u8`
                  })
                );
                return;
              }

              // Check if signing key is present
              const signingKeyId = env.MUX_SIGNING_KEY_ID || process.env.MUX_SIGNING_KEY_ID;
              const privateKey = env.MUX_SIGNING_PRIVATE_KEY || process.env.MUX_SIGNING_PRIVATE_KEY;

              let token: string | undefined = undefined;
              const exp = Math.floor(Date.now() / 1000) + 12 * 60 * 60; // 12 hours

              if (signingKeyId && privateKey) {
                const jwt = await import('jsonwebtoken');
                token = jwt.default.sign(
                  {
                    sub: effectivePlaybackId, // Must match the exact playback ID
                    aud: 'v',
                    exp
                  },
                  privateKey.replace(/\\n/g, '\n'),
                  {
                    algorithm: 'RS256',
                    keyid: signingKeyId
                  }
                );
              }

              const streamUrl = token
                ? `https://stream.mux.com/${effectivePlaybackId}.m3u8?token=${token}`
                : `https://stream.mux.com/${effectivePlaybackId}.m3u8`;

              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  allowed: true,
                  playbackId: effectivePlaybackId,
                  policy: 'signed',
                  token: token,
                  streamUrl,
                  expiresAt: exp
                })
              );
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        // Handle Mux Asset Deletion
        if (url.startsWith('/api/mux/asset/') && req.method === 'DELETE') {
          const tokenId = env.MUX_TOKEN_ID || process.env.MUX_TOKEN_ID;
          const tokenSecret = env.MUX_TOKEN_SECRET || process.env.MUX_TOKEN_SECRET;
          const assetId = url.split('/api/mux/asset/')[1]?.split('?')[0];

          if (tokenId && tokenSecret && assetId && !assetId.startsWith('upload_')) {
            try {
              const authHeader = 'Basic ' + Buffer.from(`${tokenId}:${tokenSecret}`).toString('base64');
              await fetch(`https://api.mux.com/video/v1/assets/${assetId}`, {
                method: 'DELETE',
                headers: { Authorization: authHeader }
              });
            } catch (e) {
              console.warn('Failed to delete asset from Mux:', e);
            }
          }

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true, message: 'Asset deleted' }));
          return;
        }

        next();
      });
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react(), muxDevServerPlugin(env)],
    server: {
      port: 5173,
      host: true,
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:5000',
          changeOrigin: true
        }
      }
    },
  };
});
