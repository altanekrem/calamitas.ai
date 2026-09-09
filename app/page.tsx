/* oxlint-disable next/no-html-link-for-pages -- Native anchors bypass a confirmed Vinext Link runtime failure. */
import Image from 'next/image';
import { ArrowRight, BookOpen, Contact, Earth, FlaskConical, Orbit, ScanSearch, Users } from 'lucide-react';
import { ParallaxManager } from '@/components/parallax-manager';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

const destinations = [
  ['/sistem', '01', 'Proje Sistemi', 'Tek afet sonrası görüntüden görev, kaynak ve güvenli rota üreten interaktif operasyon simülasyonu.', FlaskConical],
  ['/sismik-harita', '02', 'Sismik Harita', 'USGS verileriyle dünyadaki son depremleri gösteren canlı harita.', Earth],
  ['/projemiz', '03', 'Projemiz', 'Problemi, çözüm yaklaşımını ve projenin toplumsal hedefini inceleyin.', ScanSearch],
  ['/bilgi-merkezi', '04', 'Bilgi Merkezi', 'Afet hazırlığı içeriklerine kaydırılabilir görsellerle ulaşın.', BookOpen],
  ['/ekibimiz', '05', 'Ekibimiz', 'Calamitas AI geliştirme ekibini ve çalışma alanlarını tanıyın.', Users],
  ['/calamitas-next', '06', 'Calamitas Next', 'Doğrulama, entegrasyon ve çoklu afet hedeflerinden oluşan yol haritası.', Orbit],
  ['/iletisim', '07', 'İletişim', 'Sponsorluk, teknik destek ve kurumsal iş birliği için bize ulaşın.', Contact],
] as const;

export default function Home() {
  return (
    <main>
      <ParallaxManager />
      <section className="hero" id="anasayfa">
        <div className="hero-backdrop" data-parallax="0.035" aria-hidden="true" />
        <SiteHeader />
        <div className="hero-grid shell">
          <div className="hero-copy">
            <p className="status"><span /> Geliştirme prototipi</p>
            <p className="eyebrow">Calamitas AI / Bir Dakika, Bir Hayat</p>
            <h1>Afet verisini <em>saha kararına</em> dönüştürmek.</h1>
            <p className="hero-lead">Uydu ve hava görüntülerinden elde edilen hasar bilgisini önceliklendirme, rota ve görev önerileriyle arama-kurtarma ekiplerine aktarmayı hedefleyen karar destek projesi.</p>
            <div className="hero-actions">
              <a className="button primary" href="/sistem">Proje sistemini aç <ArrowRight aria-hidden="true" /></a>
              <a className="button secondary" href="/projemiz">Projeyi tanı</a>
            </div>
          </div>
          <div className="ops-card parallax-card" data-parallax="-0.055">
            <div className="ops-top"><span><i /> Operasyon akışı</span><b>CAL-72 / PROTOTİP</b></div>
            <div className="ops-map">
              <Image src="/media/afet-sonrasi-analiz.webp" alt="Örnek yapay zekâ hasar analizi" fill sizes="(max-width: 900px) 92vw, 42vw" priority />
              <span className="scan" aria-hidden="true" /><span className="map-label critical">Kritik bölge</span><span className="map-label route">Rota açık</span>
            </div>
            <div className="ops-metrics"><span><small>Veri durumu</small><strong>Fixture</strong><em>resmi sözleşme</em></span><span><small>Çalışma modu</small><strong>Offline</strong><em>hazır</em></span><span><small>Jüri adımları</small><strong>02 / 07</strong><em>bağlı</em></span></div>
          </div>
        </div>
      </section>

      <section className="route-overview">
        <div className="shell route-heading"><p className="eyebrow">Site haritası</p><h2>Her bölüm, kendi sayfasında.</h2><p>İhtiyacınız olan içeriğe doğrudan ulaşın; tüm başlıklar ayrı URL’lerde açılır.</p></div>
        <div className="shell route-grid">
          {destinations.map(([href, number, title, body, Icon]) => (
            <a href={href} key={href} className="route-card">
              <span>{number}</span><Icon aria-hidden="true" /><h3>{title}</h3><p>{body}</p><b>Sayfayı aç <ArrowRight aria-hidden="true" /></b>
            </a>
          ))}
        </div>
      </section>

      <section className="home-statement"><div className="home-statement-image" data-parallax="0.04" aria-hidden="true" /><div className="shell"><p className="eyebrow">Projenin odağı</p><h2>Hasarı göstermekten fazlası: doğru ekibi, doğru zamanda, doğru noktaya yönlendirmek.</h2><a className="button primary" href="/projemiz">Proje yaklaşımını incele <ArrowRight aria-hidden="true" /></a></div></section>
      <SiteFooter />
    </main>
  );
}
