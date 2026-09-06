import { env } from 'cloudflare:workers';
import { deleteContactMessage, saveContactMessage } from '@/lib/contact-store';

const sponsorshipTypes = new Set(['Finansal destek', 'Teknik altyapı', 'Uydu ve saha verisi', 'Donanım ve lojistik', 'İletişim ve görünürlük', 'Diğer iş birliği']);
const budgetRanges = new Set(['Görüşmede belirlenecek', '25.000 TL altı', '25.000–100.000 TL', '100.000–500.000 TL', '500.000 TL üzeri', 'Ayni / teknik destek']);

function text(value: unknown) { return typeof value === 'string' ? value.trim() : ''; }

async function deliverSponsorEmail(input: { name: string; email: string; organization: string; phone: string | null; sponsorshipType: string; budget: string; message: string }) {
  const apiKey = env.RESEND_API_KEY;
  const from = env.CONTACT_FROM_EMAIL;
  const recipient = env.SPONSOR_RECIPIENT_EMAIL || 'calamitasai@gmail.com';
  if (!apiKey || !from) return false;

  const content = [
    'Yeni Calamitas AI sponsorluk talebi',
    '',
    `Ad soyad: ${input.name}`,
    `E-posta: ${input.email}`,
    `Kurum / marka: ${input.organization}`,
    `Telefon: ${input.phone ?? 'Belirtilmedi'}`,
    `Katkı alanı: ${input.sponsorshipType}`,
    `Tahmini katkı aralığı: ${input.budget}`,
    '',
    'Mesaj:',
    input.message,
  ].join('\n');

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [recipient],
      reply_to: input.email,
      subject: `Calamitas AI sponsorluk talebi — ${input.organization}`,
      text: content,
    }),
  });
  return response.ok;
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    if (text(body.website)) return Response.json({ message: 'Talep alındı.' });
    const name = text(body.name);
    const email = text(body.email).toLowerCase();
    const organization = text(body.organization);
    const phone = text(body.phone) || null;
    const sponsorshipType = text(body.sponsorshipType);
    const budget = text(body.budget);
    const message = text(body.message);
    const consent = text(body.consent);

    if (name.length < 2 || name.length > 80) return Response.json({ message: 'Ad soyad alanını kontrol edin.' }, { status: 400 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 160) return Response.json({ message: 'Geçerli bir e-posta adresi girin.' }, { status: 400 });
    if (organization.length < 2 || organization.length > 120) return Response.json({ message: 'Kurum veya marka adını kontrol edin.' }, { status: 400 });
    if (phone && phone.length > 30) return Response.json({ message: 'Telefon numarası çok uzun.' }, { status: 400 });
    if (!sponsorshipTypes.has(sponsorshipType)) return Response.json({ message: 'Geçerli bir katkı alanı seçin.' }, { status: 400 });
    if (!budgetRanges.has(budget)) return Response.json({ message: 'Geçerli bir katkı aralığı seçin.' }, { status: 400 });
    if (message.length < 20 || message.length > 3000) return Response.json({ message: 'Mesaj 20–3000 karakter arasında olmalıdır.' }, { status: 400 });
    if (consent !== 'accepted') return Response.json({ message: 'Veri saklama onayı gereklidir.' }, { status: 400 });

    const storedMessage = [
      `Katkı alanı: ${sponsorshipType}`,
      `Tahmini katkı aralığı: ${budget}`,
      `Telefon: ${phone ?? 'Belirtilmedi'}`,
      '',
      message,
    ].join('\n');
    const receipt = await saveContactMessage({ name, email, organization, subject: 'Sponsorluk', message: storedMessage });
    let emailDelivered = false;
    try {
      emailDelivered = await deliverSponsorEmail({ name, email, organization, phone, sponsorshipType, budget, message });
    } catch {
      emailDelivered = false;
    }
    return Response.json({ ...receipt, emailDelivered, message: emailDelivered ? 'Talep kaydedildi ve e-posta iletildi.' : 'Talep kaydedildi; e-posta iletimi yapılandırılmadı.' }, { status: 201 });
  } catch {
    return Response.json({ message: 'Talep şu anda kaydedilemedi. Lütfen daha sonra yeniden deneyin.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id') ?? '';
    const token = url.searchParams.get('token') ?? '';
    if (!id || !token) return Response.json({ message: 'Silme bilgisi eksik.' }, { status: 400 });
    const deleted = await deleteContactMessage(id, token);
    return deleted ? Response.json({ message: 'Sponsorluk kaydı silindi.' }) : Response.json({ message: 'Kayıt bulunamadı veya silme anahtarı geçersiz.' }, { status: 404 });
  } catch {
    return Response.json({ message: 'Kayıt şu anda silinemedi.' }, { status: 500 });
  }
}
