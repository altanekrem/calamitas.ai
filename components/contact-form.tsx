'use client';

import { CheckCircle2, Send, Trash2 } from 'lucide-react';
import { useState } from 'react';

type FormState = 'idle' | 'submitting' | 'success' | 'error';

export function ContactForm() {
  const [state, setState] = useState<FormState>('idle');
  const [message, setMessage] = useState('');
  const [receipt, setReceipt] = useState<{ id: string; deleteToken: string } | null>(null);

  async function submit(form: HTMLFormElement) {
    setState('submitting');
    setMessage('');
    const payload = Object.fromEntries(new FormData(form).entries());
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json() as { message?: string; id?: string; deleteToken?: string; emailDelivered?: boolean };
      if (!response.ok) throw new Error(result.message ?? 'Form gönderilemedi.');
      form.reset();
      if (result.id && result.deleteToken) setReceipt({ id: result.id, deleteToken: result.deleteToken });
      setState('success');
      setMessage(result.emailDelivered
        ? 'Sponsorluk talebiniz kaydedildi ve calamitasai@gmail.com adresine iletildi.'
        : 'Sponsorluk talebiniz kalıcı olarak kaydedildi. E-posta gönderim hizmeti henüz yapılandırılmadığı için otomatik e-posta iletimi bekliyor.');
    } catch (error) {
      setState('error');
      setMessage(error instanceof Error ? error.message : 'Beklenmeyen bir hata oluştu.');
    }
  }

  async function removeMessage() {
    if (!receipt || !window.confirm('Bu sponsorluk kaydını kalıcı olarak silmek istediğinize emin misiniz?')) return;
    try {
      const response = await fetch(`/api/contact?id=${encodeURIComponent(receipt.id)}&token=${encodeURIComponent(receipt.deleteToken)}`, { method: 'DELETE' });
      const result = await response.json() as { message?: string };
      if (!response.ok) throw new Error(result.message ?? 'Kayıt silinemedi.');
      setReceipt(null);
      setState('idle');
      setMessage('Sponsorluk kaydınız silindi. Daha önce gönderilmiş bir e-posta varsa bu işlem e-postayı geri çekmez.');
    } catch (error) {
      setState('error');
      setMessage(error instanceof Error ? error.message : 'Kayıt silinemedi.');
    }
  }

  return (
    <form className="contact-form sponsor-form" onSubmit={(event) => { event.preventDefault(); void submit(event.currentTarget); }}>
      <div className="form-row">
        <label>Ad soyad<input name="name" autoComplete="name" minLength={2} maxLength={80} required /></label>
        <label>Kurumsal e-posta<input name="email" type="email" autoComplete="email" maxLength={160} required /></label>
      </div>
      <div className="form-row">
        <label>Kurum / marka<input name="organization" autoComplete="organization" minLength={2} maxLength={120} required /></label>
        <label>Telefon <span>(isteğe bağlı)</span><input name="phone" type="tel" autoComplete="tel" maxLength={30} /></label>
      </div>
      <div className="form-row">
        <label>Katkı alanı<select name="sponsorshipType" defaultValue="Finansal destek" required><option>Finansal destek</option><option>Teknik altyapı</option><option>Uydu ve saha verisi</option><option>Donanım ve lojistik</option><option>İletişim ve görünürlük</option><option>Diğer iş birliği</option></select></label>
        <label>Tahmini katkı aralığı<select name="budget" defaultValue="Görüşmede belirlenecek"><option>Görüşmede belirlenecek</option><option>25.000 TL altı</option><option>25.000–100.000 TL</option><option>100.000–500.000 TL</option><option>500.000 TL üzeri</option><option>Ayni / teknik destek</option></select></label>
      </div>
      <label>Öneriniz ve beklentiniz<textarea name="message" rows={7} minLength={20} maxLength={3000} placeholder="Katkı kapsamını, hedeflenen iş birliğini ve uygun iletişim zamanını belirtin." required /></label>
      <label className="consent"><input name="consent" type="checkbox" value="accepted" required /><span>Bilgilerimin sponsorluk ve iş birliği değerlendirmesi amacıyla Calamitas AI proje kayıtlarında saklanmasını kabul ediyorum.</span></label>
      <label className="honeypot" aria-hidden="true">Web sitesi<input name="website" tabIndex={-1} autoComplete="off" /></label>
      <div className="form-footer">
        <p>Form verileri güvenli proje kaydına alınır. Otomatik e-posta gönderimi için doğrulanmış gönderici hizmeti gerekir.</p>
        <button className="submit-button" type="submit" disabled={state === 'submitting'}>{state === 'submitting' ? 'Gönderiliyor…' : <><Send aria-hidden="true" /> Sponsor talebini gönder</>}</button>
      </div>
      {message && <output className={`form-message ${state}`}>{state === 'success' && <CheckCircle2 aria-hidden="true" />}<span>{message}</span>{receipt && <button type="button" onClick={removeMessage}><Trash2 aria-hidden="true" /> Kaydı sil</button>}</output>}
    </form>
  );
}
