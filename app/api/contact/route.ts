import { env } from 'cloudflare:workers';
import { deleteContactMessage, isContactRateLimited, saveContactMessage, updateContactDeliveryStatus } from '@/lib/contact-store';
import { queueSheetRow } from '@/lib/google-sheets-sync';
import { formatIstanbulParts } from '@/lib/system-access-store';

const sponsorshipTypes = new Set(['Finansal destek', 'Teknik altyapı', 'Uydu ve saha verisi', 'Donanım ve lojistik', 'İletişim ve görünürlük', 'Diğer iş birliği']);
const budgetRanges = new Set(['Görüşmede belirlenecek', '25.000 TL altı', '25.000–100.000 TL', '100.000–500.000 TL', '500.000 TL üzeri', 'Ayni / teknik destek']);

function text(value: unknown) { return typeof value === 'string' ? value.trim() : ''; }

async function deliverSponsorEmail(id: string, input: { name: string; email: string; organization: string; phone: string | null; sponsorshipType: string; budget: string; message: string }) {
  const apiKey = env.RESEND_API_KEY;
  const from = env.CONTACT_FROM_EMAIL;
  const recipient = env.SPONSOR_RECIPIENT_EMAIL || 'altanekrem06@gmail.com';
  if (!apiKey || !from) return 'not_configured' as const;

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
    headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json', 'idempotency-key': `sponsor/${id}` },
    body: JSON.stringify({
      from,
      to: [recipient],
      reply_to: input.email,
      subject: `Calamitas AI sponsorluk talebi — ${input.organization}`,
      text: content,
    }),
  });
  return response.ok ? 'delivered' as const : 'failed' as const;
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
    if (await isContactRateLimited(email)) return Response.json({ message: 'Bu e-posta adresiyle kısa sürede çok sayıda talep gönderildi. Lütfen 10 dakika sonra yeniden deneyin.' }, { status: 429 });

    const storedMessage = [
      `Katkı alanı: ${sponsorshipType}`,
      `Tahmini katkı aralığı: ${budget}`,
      `Telefon: ${phone ?? 'Belirtilmedi'}`,
      '',
      message,
    ].join('\n');
    const receipt = await saveContactMessage({ name, email, organization, phone, sponsorshipType, budget, subject: 'Sponsorluk', message: storedMessage });
    const local = formatIstanbulParts(new Date(receipt.createdAt));
    let sheetStatus = 'queued';
    try {
      const sheetResult = await queueSheetRow({
        spreadsheetId: '1OdILim7PzmtZSHK1CJHj9dueujT0RmVeOWPx0VEoTCY',
        sheetName: 'Sponsor Formu',
        headers: ['Kayıt No', 'Tarih', 'Saat', 'Ad Soyad', 'E-posta', 'Kurum / Marka', 'Telefon', 'Katkı Alanı', 'Tahmini Katkı Aralığı', 'Mesaj'],
        row: [receipt.id, local.date, local.time, name, email, organization, phone ?? '', sponsorshipType, budget, message],
      });
      sheetStatus = sheetResult.accepted ? 'accepted' : 'queued';
    } catch {
      sheetStatus = 'queue_failed';
    }

    let emailStatus: 'not_configured' | 'delivered' | 'failed' = 'not_configured';
    try {
      emailStatus = await deliverSponsorEmail(receipt.id, { name, email, organization, phone, sponsorshipType, budget, message });
    } catch {
      emailStatus = 'failed';
    }
    try {
      await updateContactDeliveryStatus(receipt.id, emailStatus, sheetStatus);
    } catch {
      // The submission itself is already durable; delivery status can be reconciled later.
    }

    const sheetMessage = sheetStatus === 'accepted'
      ? 'Google Sheets aktarımı güvenli kuyruğa kabul edildi'
      : sheetStatus === 'queued'
        ? 'Google Sheets aktarımı site kuyruğunda bekliyor'
        : 'Google Sheets aktarım kuyruğu geçici olarak oluşturulamadı';
    const emailMessage = emailStatus === 'delivered'
      ? 'e-posta iletildi'
      : emailStatus === 'failed'
        ? 'e-posta iletimi başarısız oldu'
        : 'e-posta hizmeti henüz yapılandırılmadı';
    const messageText = `Talep kalıcı olarak kaydedildi; ${sheetMessage} ve ${emailMessage}.`;
    return Response.json({ ...receipt, emailStatus, sheetStatus, message: messageText }, { status: 201 });
  } catch {
    return Response.json({ message: 'Talep şu anda kaydedilemedi. Lütfen daha sonra yeniden deneyin.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const id = text(body.id);
    const token = text(body.token);
    if (!id || !token) return Response.json({ message: 'Silme bilgisi eksik.' }, { status: 400 });
    const deleted = await deleteContactMessage(id, token);
    return deleted ? Response.json({ message: 'Sponsorluk kaydı silindi.' }) : Response.json({ message: 'Kayıt bulunamadı veya silme anahtarı geçersiz.' }, { status: 404 });
  } catch {
    return Response.json({ message: 'Kayıt şu anda silinemedi.' }, { status: 500 });
  }
}
