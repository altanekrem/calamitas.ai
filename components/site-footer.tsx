/* oxlint-disable next/no-html-link-for-pages -- Native anchors bypass a confirmed Vinext Link runtime failure. */
import Image from 'next/image';
import { Mail, MapPinned, ShieldCheck } from 'lucide-react';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell footer-main">
        <div className="footer-identity">
          <a className="footer-brand" href="/">
            <Image src="/brand/calamitas-logo-compact.png" alt="Calamitas AI güncel logosu" width={260} height={260} />
            <span><b>CALAMITAS AI</b><small>BİR DAKİKA, BİR HAYAT</small></span>
          </a>
          <p>Tek afet sonrası görüntüden hasar ve müdahale ihtiyacına; kaynak eşleştirmesinden kişiye özel güvenli rota ve dinamik görev planına uzanan öğrenci geliştirme projesi.</p>
          <div className="footer-badges">
            <span><ShieldCheck aria-hidden="true" /> İnsan denetimli karar yaklaşımı</span>
            <span><MapPinned aria-hidden="true" /> Harita tabanlı saha yönlendirmesi</span>
          </div>
        </div>
        <div className="footer-contact">
          <h2>Destek ve iş birliği</h2>
          <p>Kurumsal iş birliği, veri desteği, teknik altyapı ve sponsorluk görüşmeleri için özel iletişim formunu kullanın.</p>
          <a className="footer-cta" href="/iletisim"><Mail aria-hidden="true" /> Sponsor formunu aç</a>
          <small>Proje ekranları prototip niteliğindedir; resmî erken uyarı veya operasyon sistemi değildir.</small>
        </div>
      </div>
      <div className="footer-bottom"><div className="shell"><span>© {new Date().getFullYear()} Calamitas AI</span><span>Bir Dakika, Bir Hayat</span><a href="/">Ana sayfa</a></div></div>
    </footer>
  );
}
