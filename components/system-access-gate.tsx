'use client';

import { CheckCircle2, KeyRound, LoaderCircle, LogOut, ShieldCheck, TriangleAlert } from 'lucide-react';
import { useEffect, useState } from 'react';
import { SystemDashboard } from '@/components/system-dashboard';

type AccessState = 'checking' | 'locked' | 'submitting' | 'granted';

export function SystemAccessGate() {
  const [state, setState] = useState<AccessState>('checking');
  const [visitorName, setVisitorName] = useState('');
  const [message, setMessage] = useState('Güvenli oturum denetleniyor…');

  useEffect(() => {
    let cancelled = false;
    async function checkSession() {
      try {
        const response = await fetch('/api/system-access', { cache: 'no-store' });
        const result = await response.json() as { authenticated?: boolean; visitorName?: string };
        if (cancelled) return;
        if (response.ok && result.authenticated) {
          setVisitorName(result.visitorName ?? 'Ziyaretçi');
          setState('granted');
          setMessage('Erişim doğrulandı.');
        } else {
          setState('locked');
          setMessage('Proje sistemine erişmek için bilgilerinizi doğrulayın.');
        }
      } catch {
        if (!cancelled) {
          setState('locked');
          setMessage('Oturum denetlenemedi. Bilgilerinizi girerek yeniden deneyin.');
        }
      }
    }
    void checkSession();
    return () => { cancelled = true; };
  }, []);

  async function signIn(form: HTMLFormElement) {
    setState('submitting');
    setMessage('Bilgiler doğrulanıyor…');
    const payload = Object.fromEntries(new FormData(form).entries());
    try {
      const response = await fetch('/api/system-access', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json() as { message?: string; visitorName?: string };
      if (!response.ok) throw new Error(result.message ?? 'Giriş doğrulanamadı.');
      form.reset();
      setVisitorName(result.visitorName ?? (typeof payload.visitorName === 'string' ? payload.visitorName : 'Ziyaretçi'));
      setState('granted');
      setMessage(result.message ?? 'Giriş başarılı.');
    } catch (error) {
      setState('locked');
      setMessage(error instanceof Error ? error.message : 'Giriş doğrulanamadı.');
    }
  }

  async function signOut() {
    setMessage('Oturum kapatılıyor…');
    try {
      await fetch('/api/system-access', { method: 'DELETE' });
    } finally {
      setVisitorName('');
      setState('locked');
      setMessage('Oturum kapatıldı. Yeniden giriş yapabilirsiniz.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  if (state === 'granted') {
    return (
      <div className="system-access-granted">
        <div className="system-session-bar"><span><CheckCircle2 aria-hidden="true" /><b>{visitorName}</b> adına güvenli erişim açık</span><button type="button" onClick={() => { void signOut(); }}><LogOut aria-hidden="true" /> Oturumu kapat</button></div>
        <SystemDashboard />
      </div>
    );
  }

  return (
    <div className="system-access-shell">
      <section className="system-access-card" aria-labelledby="system-access-title">
        <div className="system-access-icon"><ShieldCheck aria-hidden="true" /></div>
        <p className="eyebrow">Yetkili erişim</p>
        <h2 id="system-access-title">Proje sistemi güvenlik doğrulaması</h2>
        <p>Bu alan, operasyon demonstrasyonunu yetkisiz erişimden ayırır. Adınız ve giriş sonucu; tarih, gün, saat ve cihaz bilgisiyle güvenli proje kaydına alınır.</p>
        {state === 'checking' ? (
          <div className="system-access-loading"><LoaderCircle className="spin" aria-hidden="true" /> Güvenli oturum denetleniyor</div>
        ) : (
          <form className="system-access-form" onSubmit={(event) => { event.preventDefault(); void signIn(event.currentTarget); }}>
            <label>Ziyaretçi adı<input name="visitorName" autoComplete="name" minLength={2} maxLength={80} required /></label>
            <label>Kullanıcı adı<input name="username" autoComplete="username" maxLength={80} required /></label>
            <label>Şifre<input name="password" type="password" autoComplete="current-password" minLength={8} maxLength={128} required /></label>
            <button type="submit" disabled={state === 'submitting'}>{state === 'submitting' ? <><LoaderCircle className="spin" aria-hidden="true" /> Doğrulanıyor…</> : <><KeyRound aria-hidden="true" /> Sisteme güvenli giriş</>}</button>
          </form>
        )}
        <p className={`system-access-message ${state === 'locked' && message.includes('hatalı') ? 'error' : ''}`} aria-live="polite">{state === 'locked' && message.includes('hatalı') && <TriangleAlert aria-hidden="true" />}{message}</p>
      </section>
    </div>
  );
}
