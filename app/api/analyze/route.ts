import { isJurySimulationResult } from '@/lib/jury-simulation';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const backendUrl = process.env.BACKEND_ANALYZE_URL;
  if (!backendUrl) {
    return Response.json(
      { error: 'BACKEND_ANALYZE_URL yapılandırılmadan analiz başlatılamaz.' },
      { status: 503 },
    );
  }

  const incoming = await request.formData();
  const image = incoming.get('image') ?? incoming.get('file') ?? incoming.get('after');
  if (!(image instanceof File)) {
    return Response.json({ error: 'Analiz için görüntü dosyası gönderilmelidir.' }, { status: 400 });
  }

  const upstream = new FormData();
  upstream.append('image', image, image.name);
  const before = incoming.get('before');
  if (before instanceof File) upstream.append('before', before, before.name);
  const location = incoming.get('location');
  if (typeof location === 'string') upstream.append('location', location);

  let response: Response;
  try {
    response = await fetch(backendUrl, { method: 'POST', body: upstream });
  } catch {
    return Response.json({ error: 'Backend analiz servisine bağlanılamadı.' }, { status: 502 });
  }

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    return Response.json(
      { error: 'Backend analiz isteğini reddetti.', details: payload },
      { status: response.status },
    );
  }
  if (!isJurySimulationResult(payload)) {
    return Response.json(
      { error: 'Backend cevabı JurySimulationResult sözleşmesine uymuyor.' },
      { status: 502 },
    );
  }

  return Response.json(payload);
}
