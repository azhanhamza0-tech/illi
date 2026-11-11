import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as jwt from 'jsonwebtoken';

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Server Environment Variables (Must NEVER be exposed to the client)
const MUX_TOKEN_ID = process.env.MUX_TOKEN_ID || '';
const MUX_TOKEN_SECRET = process.env.MUX_TOKEN_SECRET || '';
const MUX_SIGNING_KEY_ID = process.env.MUX_SIGNING_KEY_ID || '';
const MUX_SIGNING_PRIVATE_KEY = (process.env.MUX_SIGNING_PRIVATE_KEY || '').replace(/\\n/g, '\n');

const getMuxAuthHeader = () => {
  const credentials = Buffer.from(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`).toString('base64');
  return `Basic ${credentials}`;
};

/**
 * 1. createMuxUpload
 * Securely calls Mux API to create a Direct Upload URL
 */
export const createMuxUpload = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
  }

  const { movieId, fileName, fileSize, playbackPolicy = 'signed' } = data;
  if (!movieId) {
    throw new functions.https.HttpsError('invalid-argument', 'movieId is required.');
  }

  // Verify Admin or Owner
  const userDoc = await db.collection('users').doc(context.auth.uid).get();
  const userData = userDoc.data();
  const role = userData?.role || 'user';
  if (role !== 'admin' && role !== 'owner') {
    throw new functions.https.HttpsError('permission-denied', 'Only Admins and Owners can upload videos.');
  }

  try {
    const response = await fetch('https://api.mux.com/video/v1/uploads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: getMuxAuthHeader()
      },
      body: JSON.stringify({
        cors_origin: '*',
        new_asset_settings: {
          playback_policy: [playbackPolicy],
          passthrough: JSON.stringify({ movieId, uploadedBy: context.auth.uid })
        }
      })
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error('Mux Direct Upload error:', errBody);
      throw new Error(`Mux API returned ${response.status}: ${errBody}`);
    }

    const resData: any = await response.json();
    const muxUpload = resData.data;

    // Record in Firestore videoUploads
    const uploadRecord = {
      id: muxUpload.id,
      movieId,
      uploadedBy: context.auth.uid,
      muxUploadId: muxUpload.id,
      status: 'waiting',
      fileName: fileName || 'video.mp4',
      fileSize: fileSize || 0,
      uploadUrl: muxUpload.url,
      playbackPolicy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await db.collection('videoUploads').doc(muxUpload.id).set(uploadRecord);

    // Update movie status
    await db.collection('movies').doc(movieId).set(
      {
        videoProvider: 'mux',
        mux: {
          status: 'uploading',
          playbackPolicy
        },
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );

    // Log admin action
    await db.collection('adminLogs').add({
      adminId: context.auth.uid,
      action: 'VIDEO_UPLOAD_STARTED',
      movieId,
      muxAssetId: '',
      timestamp: new Date().toISOString(),
      metadata: { fileName, fileSize, uploadId: muxUpload.id }
    });

    return {
      uploadId: muxUpload.id,
      uploadUrl: muxUpload.url
    };
  } catch (error: any) {
    console.error('Failed to create Mux upload:', error);
    throw new functions.https.HttpsError('internal', error.message || 'Failed to create Mux upload.');
  }
});

/**
 * 2. muxWebhook
 * HTTPS Webhook to receive events from Mux and update Firestore
 */
export const muxWebhook = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const event = req.body;
  const eventType = event?.type;

  console.log('Mux Webhook received event:', eventType);

  try {
    if (eventType === 'video.upload.asset_created') {
      const uploadId = event.data?.id;
      const assetId = event.data?.asset_id;

      if (uploadId) {
        await db.collection('videoUploads').doc(uploadId).set(
          {
            status: 'processing',
            muxAssetId: assetId,
            updatedAt: new Date().toISOString()
          },
          { merge: true }
        );
      }
    } else if (eventType === 'video.asset.ready') {
      const asset = event.data;
      const assetId = asset.id;
      let passthrough: any = {};
      try {
        if (asset.passthrough) passthrough = JSON.parse(asset.passthrough);
      } catch {}

      const movieId = passthrough.movieId;

      // Extract playback ID
      const playbackIds: any[] = asset.playback_ids || [];
      const primaryPlayback = playbackIds[0];
      const playbackId = primaryPlayback?.id || '';
      const playbackPolicy = primaryPlayback?.policy || 'signed';

      const duration = Math.round(asset.duration || 0);
      const width = asset.tracks?.find((t: any) => t.type === 'video')?.max_width || 1920;
      const height = asset.tracks?.find((t: any) => t.type === 'video')?.max_height || 1080;
      const aspectRatio = asset.aspect_ratio || `${width}:${height}`;

      const muxData = {
        assetId,
        playbackId,
        playbackPolicy,
        status: 'ready',
        duration,
        width,
        height,
        aspectRatio,
        updatedAt: new Date().toISOString()
      };

      if (movieId) {
        await db.collection('movies').doc(movieId).set(
          {
            videoProvider: 'mux',
            mux: muxData,
            updatedAt: new Date().toISOString()
          },
          { merge: true }
        );

        // Find and update videoUploads record
        const uploadsSnap = await db.collection('videoUploads').where('movieId', '==', movieId).get();
        uploadsSnap.forEach(async (d) => {
          await d.ref.update({
            status: 'ready',
            playbackId,
            updatedAt: new Date().toISOString()
          });
        });

        // Admin log
        await db.collection('adminLogs').add({
          adminId: passthrough.uploadedBy || 'system',
          action: 'VIDEO_READY',
          movieId,
          muxAssetId: assetId,
          timestamp: new Date().toISOString(),
          metadata: { playbackId, duration, resolution: `${width}x${height}` }
        });
      }
    } else if (eventType === 'video.asset.errored') {
      const asset = event.data;
      let passthrough: any = {};
      try {
        if (asset.passthrough) passthrough = JSON.parse(asset.passthrough);
      } catch {}

      const movieId = passthrough.movieId;
      if (movieId) {
        await db.collection('movies').doc(movieId).set(
          {
            'mux.status': 'errored',
            'mux.errorMessage': asset.errors?.messages?.[0] || 'Mux video processing failed'
          },
          { merge: true }
        );
      }
    }

    res.status(200).send({ received: true });
  } catch (err: any) {
    console.error('Webhook processing error:', err);
    res.status(500).send({ error: err.message });
  }
});

/**
 * 3. getVideoPlaybackToken
 * Validates Free/VIP access on server and creates temporary signed Mux token
 */
export const getVideoPlaybackToken = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'تکایە سەرەتا بچۆ ژوورەوە بۆ سەیرکردنی فیلمەکە.');
  }

  const { movieId } = data;
  if (!movieId) {
    throw new functions.https.HttpsError('invalid-argument', 'movieId is required.');
  }

  const uid = context.auth.uid;

  // 1. Fetch Movie
  const movieDoc = await db.collection('movies').doc(movieId).get();
  if (!movieDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'فیلمەکە لە بنکەدراوە نەدۆزرایەوە.');
  }
  const movie = movieDoc.data()!;

  // 2. Fetch User & Subscription
  const userDoc = await db.collection('users').doc(uid).get();
  const user = userDoc.data() || {};
  const isOwnerOrAdmin = user.role === 'owner' || user.role === 'admin';

  // Determine VIP Status
  const userPackage = user.package || user.subscription?.plan || 'FREE';
  const expiresAt = user.subscription?.expiresAt || user.vipExpiresAt;
  const isVIPActive =
    isOwnerOrAdmin ||
    (userPackage === 'VIP' && (!expiresAt || new Date(expiresAt).getTime() > Date.now()));
  const isVIPExpired =
    userPackage === 'VIP' && Boolean(expiresAt && new Date(expiresAt).getTime() <= Date.now());

  // Determine Movie Access
  const accessType = movie.access?.type || (movie.isVIP ? 'vip' : 'free');

  // VIP Check
  if (accessType === 'vip' && !isVIPActive) {
    return {
      accessStatus: isVIPExpired ? 'vip_expired' : 'vip_required',
      reason: isVIPExpired
        ? 'بەشداریکردنی VIP ـەکەت بەسەرچووە. تکایە نوێی بکەرەوە.'
        : 'ئەم فیلمە تەنها بۆ ئەندامانی VIP بەردەستە.'
    };
  }

  // Free User Daily Limit Check (50 minutes = 3000 seconds)
  const todayStr = new Date().toISOString().slice(0, 10);
  let freeRemainingSeconds = 50 * 60;

  if (!isVIPActive) {
    const usageDoc = await db.collection('watchUsage').doc(`${uid}_${todayStr}`).get();
    const usedSeconds = usageDoc.exists ? usageDoc.data()?.usedSeconds || 0 : 0;
    freeRemainingSeconds = Math.max(0, 50 * 60 - usedSeconds);

    if (freeRemainingSeconds <= 0) {
      return {
        accessStatus: 'free_limit_reached',
        reason: 'کاتی بەخۆڕایی ئەمڕۆت تەواو بووە. بۆ بینینی بێ سنوور VIP بکە.'
      };
    }
  }

  // Playback ID check
  const playbackId = movie.mux?.playbackId || '';
  if (!playbackId) {
    return {
      accessStatus: 'denied',
      reason: 'ڤیدیۆکە هێشتا بە تەواوی ئامادە نییە بۆ پەخش.'
    };
  }

  const playbackPolicy = movie.mux?.playbackPolicy || 'signed';

  // 3. Generate Signed Mux JWT Token if signed
  if (playbackPolicy === 'signed' && MUX_SIGNING_KEY_ID && MUX_SIGNING_PRIVATE_KEY) {
    const tokenLifetimeSeconds = 6 * 3600; // 6 hours
    const token = jwt.sign(
      {
        sub: playbackId,
        aud: 'v',
        exp: Math.floor(Date.now() / 1000) + tokenLifetimeSeconds
      },
      MUX_SIGNING_PRIVATE_KEY,
      {
        algorithm: 'RS256',
        keyid: MUX_SIGNING_KEY_ID
      }
    );

    return {
      playbackId,
      token,
      streamUrl: `https://stream.mux.com/${playbackId}.m3u8?token=${token}`,
      expiresAt: Date.now() + tokenLifetimeSeconds * 1000,
      accessStatus: 'authorized',
      freeRemainingSeconds
    };
  }

  // Public playback fallback
  return {
    playbackId,
    streamUrl: `https://stream.mux.com/${playbackId}.m3u8`,
    accessStatus: 'authorized',
    freeRemainingSeconds
  };
});

/**
 * 4. deleteMuxAsset
 * Securely deletes a video asset from Mux and removes reference from Firestore
 */
export const deleteMuxAsset = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
  }

  const { movieId } = data;
  if (!movieId) {
    throw new functions.https.HttpsError('invalid-argument', 'movieId is required.');
  }

  // Verify Admin or Owner
  const userDoc = await db.collection('users').doc(context.auth.uid).get();
  const role = userDoc.data()?.role || 'user';
  if (role !== 'admin' && role !== 'owner') {
    throw new functions.https.HttpsError('permission-denied', 'Only Admins and Owners can delete videos.');
  }

  const movieDoc = await db.collection('movies').doc(movieId).get();
  if (!movieDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Movie not found.');
  }

  const assetId = movieDoc.data()?.mux?.assetId;

  // Delete from Mux if assetId exists
  if (assetId) {
    try {
      await fetch(`https://api.mux.com/video/v1/assets/${assetId}`, {
        method: 'DELETE',
        headers: {
          Authorization: getMuxAuthHeader()
        }
      });
    } catch (err) {
      console.warn('Could not delete Mux asset:', err);
    }
  }

  // Remove Mux info from movie document
  await db.collection('movies').doc(movieId).update({
    mux: admin.firestore.FieldValue.delete(),
    videoProvider: 'direct'
  });

  // Log admin action
  await db.collection('adminLogs').add({
    adminId: context.auth.uid,
    action: 'VIDEO_DELETED',
    movieId,
    muxAssetId: assetId || '',
    timestamp: new Date().toISOString()
  });

  return { success: true };
});
