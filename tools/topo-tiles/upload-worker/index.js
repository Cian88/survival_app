/* Worker TEMPORAIRE d'envoi des fichiers de carte vers R2 (envoi en plusieurs parties).
   wrangler r2 object put est limité à 300 Mo ; les fichiers PMTiles font plusieurs dizaines de Go.
   Protégé par le secret UPLOAD_KEY. À supprimer après l'envoi : npx wrangler delete --config tools/topo-tiles/upload-worker/wrangler.json
   Routes (toutes avec ?key=<nom de l'objet>) :
     POST /create            → { uploadId }
     PUT  /part?uploadId&part → { partNumber, etag }   (corps : une partie, 5 Mio à 95 Mio)
     POST /complete?uploadId  → { size, etag }          (corps : [{ partNumber, etag }])
     POST /abort?uploadId
     GET  /head               → { size, etag } ou null */
export default {
  async fetch(req, env) {
    if (!env.UPLOAD_KEY || req.headers.get('authorization') !== `Bearer ${env.UPLOAD_KEY}`) return new Response('interdit', { status: 403 });
    const url = new URL(req.url), key = url.searchParams.get('key'), id = url.searchParams.get('uploadId');
    if (!key) return new Response('paramètre key manquant', { status: 400 });
    const route = `${req.method} ${url.pathname}`;
    try {
      if (route === 'POST /create') {
        const m = await env.CARTES.createMultipartUpload(key, { httpMetadata: { contentType: 'application/octet-stream', cacheControl: 'public, max-age=31536000, immutable' } });
        return Response.json({ uploadId: m.uploadId });
      }
      if (route === 'PUT /part') {
        const part = await env.CARTES.resumeMultipartUpload(key, id).uploadPart(+url.searchParams.get('part'), req.body);
        return Response.json(part);
      }
      if (route === 'POST /complete') {
        const o = await env.CARTES.resumeMultipartUpload(key, id).complete(await req.json());
        return Response.json({ size: o.size, etag: o.etag });
      }
      if (route === 'POST /abort') { await env.CARTES.resumeMultipartUpload(key, id).abort(); return Response.json({ aborted: true }); }
      if (route === 'GET /head') { const o = await env.CARTES.head(key); return Response.json(o ? { size: o.size, etag: o.etag } : null); }
      return new Response('route inconnue', { status: 404 });
    } catch (e) {
      return new Response(String(e && e.message || e), { status: 500 });
    }
  },
};
