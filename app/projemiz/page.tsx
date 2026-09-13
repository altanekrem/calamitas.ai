/* oxlint-disable next/no-html-link-for-pages -- Native anchors bypass a confirmed Vinext Link runtime failure. */
import type { Metadata } from 'next';
import Image from 'next/image';
import {
  ArrowRight,
  BrainCircuit,
  ClipboardCheck,
  FileImage,
  LocateFixed,
  MapPinned,
  PackageCheck,
  RefreshCw,
  Satellite,
  Smartphone,
  UsersRound,
} from 'lucide-react';
import { SiteFrame } from '@/components/site-frame';

export const metadata: Metadata = {
  title: 'Projemiz — CALAMITAS AI',
  description: 'Calamitas AI projesinin tek görüntüden kişiye özel görev ve güvenli rotaya uzanan afet operasyon yaklaşımı.',
};

const flow = [
  [FileImage, 'Tek güncel görüntü', 'Afet sonrası uydu, İHA veya hava görüntüsü sisteme alınır.'],
  [Satellite, 'Otomatik referans', 'Konuma uygun geçmiş görüntü arka planda bulunur ve hizalanır.'],
  [BrainCircuit, 'Hasar analizi', 'Yapılar için hasar şiddeti, güven ve çevresel risk katmanları üretilir.'],
  [ClipboardCheck, 'Müdahale ihtiyacı', 'Öncelik, kapasite, gerekli roller, ekipman ve giriş noktaları belirlenir.'],
  [UsersRound, 'Kaynak havuzu', 'Müsait personel, ekip, araç, ekipman ve son yetkili konum birlikte değerlendirilir.'],
  [LocateFixed, 'Rol eşleştirme', 'Yetkinlik, uygunluk, görev durumu, mesafe ve erişim koşulları puanlanır.'],
  [MapPinned, 'Güvenli güzergâh', 'Kapalı yol, enkaz, köprü, trafik ve araç tipiyle ana ve alternatif rota hesaplanır.'],
  [PackageCheck, 'Kişisel görev paketi', 'Hedef, ekip, giriş, rota, risk, ekipman ve uyarılar kişiye özel hazırlanır.'],
  [Smartphone, 'Saha durumu', 'Görev kabulü, intikal, varış, görev ve yardım bildirimleri merkeze aktarılır.'],
  [RefreshCw, 'Dinamik yeniden planlama', 'Yeni hasar veya kapanmada görevler açık sürüm değişikliğiyle yeniden optimize edilir.'],
] as const;

const videoSteps = ['Sorun', 'Afet sonrası görüntü', 'Yapay zekâ analizi', 'Hasar haritası', 'Müdahale ihtiyacı', 'Personel ve kaynaklar', 'Akıllı eşleştirme', 'Kişiye özel rotalar', 'Saha cihazı', 'Yeniden planlama'];

export default function ProjectPage() {
  return (
    <SiteFrame eyebrow="03 / Projemiz" title="Bir dakikanın değerini, veriden canlı operasyona uzanan bir sisteme dönüştürmek." lead="Calamitas AI; afet sonrası hasar bilgisini müdahale ihtiyacı, kaynak eşleştirmesi, kişiye özel güvenli rota ve dinamik görev planına dönüştürmeyi hedefleyen öğrenci geliştirme projesidir." pageClass="project-page">
      <section className="page-section">
        <div className="shell right-heading"><p className="eyebrow">Problem</p><h2>Afet sonrasında asıl soru yalnızca “hasar nerede?” değildir.</h2><p>Büyük ölçekli afetlerde tespit, öncelik, personel, ekipman ve erişim verileri farklı kanallarda kalabilir. Proje; özellikle ilk 72 saatte görüntüden saha kararına uzanan bu kopukluğu azaltmaya odaklanır.</p></div>
        <div className="shell project-feature">
          <div className="project-image"><Image src="/media/sistem-enkaz-ornek-v2.webp" alt="Afet sonrası yüksek çözünürlüklü örnek enkaz görüntüsü" fill sizes="(max-width: 900px) 92vw, 50vw" /></div>
          <div><p className="eyebrow">Çözüm yaklaşımı</p><h3>Tek görüntüyü, uygulanabilir ve güncellenebilir bir operasyon planına dönüştürmek.</h3><p>Kullanıcı yalnızca güncel afet görüntüsünü yükler. Hedeflenen sistem geçmiş referansı konumdan bulur; hasar ve müdahale ihtiyacını çıkarır; personel ile kaynakları eşleştirir; her görevli için ana ve alternatif rota içeren görev paketi üretir.</p><p>Yeni yol kapanması, hasar veya yardım bildirimi geldiğinde plan sessizce değiştirilmez; yeni sürüm oluşturulur ve etkilenen ekiplere değişiklik özeti iletilir.</p><p className="project-caveat">Web sitesindeki operasyon paneli sentetik verilerle çalışan interaktif demonstrasyondur. Gerçek afet kullanımından önce doğrulanmış veri, kurum entegrasyonu, saha testi, güvenlik denetimi ve yetkili insan onayı gerekir.</p></div>
        </div>
      </section>

      <section className="page-section process-band">
        <div className="shell right-heading"><p className="eyebrow">Uçtan uca sistem</p><h2>Görüntüden kişisel göreve uzanan on aşamalı karar zinciri.</h2></div>
        <div className="shell project-flow">{flow.map(([Icon, title, body], index) => <article key={title}><span>{String(index + 1).padStart(2, '0')}</span><Icon aria-hidden="true" /><h3>{title}</h3><p>{body}</p></article>)}</div>
      </section>

      <section className="page-section project-video-section">
        <div className="shell project-video-layout">
          <div className="project-video-copy"><p className="eyebrow">9:16 proje tanıtımı</p><h2>Uçtan uca proje akışı, dikey anlatımda.</h2><p>Sorundan dinamik yeniden planlamaya uzanan proje anlatımı, ürün demonstrasyonundan ayrı bir tanıtım videosu olarak hazırlandı.</p><ol>{videoSteps.map((step, index) => <li key={step}><span>{String(index + 1).padStart(2, '0')}</span>{step}</li>)}</ol></div>
          <figure className="vertical-video-frame">
            <video controls muted loop playsInline preload="metadata" poster="/media/calamitas-project-video-poster.webp" aria-label="Calamitas AI dikey proje tanıtım videosu">
              <source src="/media/calamitas-project-intro.webm" type="video/webm" />
              Tarayıcınız WebM videosunu desteklemiyor. Yan bölümde video akışının metin özeti yer alır.
            </video>
            <figcaption>Sessiz hareketli grafik · 9:16 · Proje tanıtımı</figcaption>
          </figure>
        </div>
      </section>

      <section className="page-section">
        <div className="shell project-story">
          <div><p className="eyebrow">Toplumsal amaç</p><h2>Teknik hedefin merkezinde insan hayatı var.</h2></div>
          <div><p>Proje, yardımın en çok ihtiyaç duyulan bölgelere daha hızlı ulaşmasına katkı sağlamayı; insan, araç ve ekipman kaynaklarını değişen saha koşullarına göre daha planlı kullanmayı amaçlar.</p><p>Calamitas AI’nin geliştirme motivasyonu, ekip içindeki 6 Şubat depremi deneyimi ve afet sırasında yaşanan belirsizlikten doğmuştur. Öğrenciler araştırma, veri toplama, kodlama ve test süreçlerinde aktif rol almıştır.</p><a className="text-link" href="/calamitas-next">Gelecek fazlarını incele <ArrowRight aria-hidden="true" /></a></div>
        </div>
      </section>
    </SiteFrame>
  );
}
