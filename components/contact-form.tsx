'use client';

import { CheckCircle2, Send, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

type FormState = 'idle' | 'submitting' | 'success' | 'error';
type Receipt = { id: string; deleteToken: string; createdAt?: string };
const STORAGE_KEY = 'calamitas-contact-receipts';

export function ContactForm() {
  const [state, setState] = useState<FormState>('idle');
  const [message, setMessage] = useState('');
  const [receipts, setReceipts] = useState<Receipt[]>([]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem('calamitas-contact-receipt');
        if (stored) {
          const parsed = JSON.parse(stored) as Receipt | Receipt[];
          const recovered = (Array.isArray(parsed) ? parsed : [parsed]).filter((item) => item?.id && item?.deleteToken);
          setReceipts(recovered);
          setState('success');
          setMessage('Bu tarayıcıdan daha önce gönderilen sponsorluk kayıtlarını aşağıdan yönetebilirsiniz.');
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(recovered));
          window.localStorage.removeItem('calamitas-contact-receipt');
        }
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
        window.localStorage.removeItem('calamitas-contact-receipt');
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

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
      const result = await response.json() as { message?: string; id?: string; deleteToken?: string; emailStatus?: string; sheetStatus?: string };
      if (!response.ok) throw new Error(result.message ?? 'Form gönderilemedi.');
      form.reset();
      if (result.id && result.deleteToken) {
        const nextReceipt = { id: result.id, deleteToken: result.deleteToken, createdAt: new Date().toISOString() };
        setReceipts((current) => {
          const updated = [...current.filter((item) => item.id !== nextReceipt.id), nextReceipt];
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          return updated;
        });
      }
      setState('success');
      setMessage(result.message ?? 'Sponsorluk talebiniz kaydedildi.');
    } catch (error) {
      setState('error');
      setMessage(error instanceof Error ? error.message : 'Beklenmeyen bir hata oluştu.');
    }
  }

  async function removeMessage(receipt: Receipt) {
    if (!window.confirm('Bu sponsorluk kaydını kalıcı olarak silmek istediğinize emin misiniz?')) return;
    try {
      const response = await fetch('/api/contact', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: receipt.id, token: receipt.deleteToken }),
      });
      const result = await response.json() as { message?: string };
      if (!response.ok) throw new Error(result.message ?? 'Kayıt silinemedi.');
      setReceipts((current) => {
        const updated = current.filter((item) => item.id !== receipt.id);
        if (updated.length) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        else window.localStorage.removeItem(STORAGE_KEY);
        return updated;
      });
      setState('success');
      setMessage('Sponsorluk kaydınız ve bağlı Sheets kaydı silindi ya da silme kuyruğuna alındı. Daha önce gönderilmiş bir e-posta geri çekilemez.');
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
        <p>Form verileri tarih ve saat bilgisiyle güvenli proje kaydına alınır. Sheets veya e-posta bağlantısı geçici olarak kapalıysa aktarım durumu açıkça bildirilir.</p>
        <button className="submit-button" type="submit" disabled={state === 'submitting'}>{state === 'submitting' ? 'Gönderiliyor…' : <><Send aria-hidden="true" /> Sponsor talebini gönder</>}</button>
      </div>
      {(message || receipts.length > 0) && <output className={`form-message ${state}`}>
        {state === 'success' && <CheckCircle2 aria-hidden="true" />}
        <span>{message || 'Bu tarayıcıdan gönderilen sponsorluk kayıtlarını yönetebilirsiniz.'}</span>
        {receipts.map((receipt, index) => <button key={receipt.id} type="button" onClick={() => { void removeMessage(receipt); }} aria-label={`${index + 1}. sponsorluk kaydını sil`}><Trash2 aria-hidden="true" /> {receipts.length === 1 ? 'Kaydı sil' : `${index + 1}. kaydı sil`}</button>)}
      </output>}
    </form>
  );
}
