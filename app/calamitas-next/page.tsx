/* oxlint-disable next/no-html-link-for-pages -- Native anchors bypass a confirmed Vinext Link runtime failure. */
import type { Metadata } from 'next';
import {
  ArrowRight,
  Cloud,
  Cpu,
  DatabaseZap,
  Network,
  Radar,
  RefreshCw,
  Satellite,
  Smartphone,
  TestTubeDiagonal,
  WifiOff,
} from 'lucide-react';
import { SiteFrame } from '@/components/site-frame';

export const metadata: Metadata = {
  title: 'Calamitas Next — CALAMITAS AI',
  description: 'Calamitas AI projesinin tek görüntü modeli, Jetson yerel çalışma, saha cihazı ve kurumsal entegrasyon yol haritası.',
};

const roadmap = [
  [TestTubeDiagonal, '01', 'Tek görüntü modelini doğrulama', 'Farklı afet ve coğrafyalarda hasar, ihtiyaç ve belirsizlik çıktıları için ölçülebilir başarı kriterleri ile uzman incelemesi.'],
  [Satellite, '02', 'Otomatik geçmiş referansı', 'Güncel görüntünün koordinatından uygun geçmiş uydu veya hava görüntüsünü bulma, hizalama ve kalite kontrolü.'],
  [DatabaseZap, '03', 'Yetkili veri katmanı', 'Personel, ekip, araç, ekipman, yol kapanması ve risk verilerinin rol bazlı erişim ve denetim kaydıyla yönetilmesi.'],
  [Smartphone, '04', 'Saha görev cihazı', 'Görev kabulü, intikal, varış, tamamlama ve yardım bildirimlerinin kişisel görev paketiyle birlikte sahada test edilmesi.'],
  [Cpu, '05', 'Jetson yerel operasyon modu', 'Bağlantı kesildiğinde görüntü analizi, yerel harita ve görev planının Jetson tabanlı saha merkezinde sürdürülebilmesi.'],
  [Network, '06', 'Kurumsal entegrasyon', 'Afet yönetimi kurumlarıyla güvenli veri paylaşımı, yetkilendirme, birlikte çalışabilirlik ve yetkili insan onayı.'],
  [Radar, '07', 'Çoklu afet karar ağı', 'Depremden sonra sel, yangın ve heyelan için ayrı veri, risk, erişim ve müdahale modelleri.'],
] as const;

export default function NextPage() {
  return (
    <SiteFrame eyebrow="06 / Calamitas Next" title="Prototipten çevrimdışı dayanıklı, doğrulanmış afet operasyon ağına." lead="Gelecek fazları; yeni özellik eklemekten önce veri güvenliği, model doğrulaması, saha kabulü, yerel çalışma ve insan denetimini güçlendirecek biçimde planlanır." pageClass="next-page">
      <section className="page-section next-roadmap-section">
        <div className="shell right-heading"><p className="eyebrow">Gelecek planı</p><h2>Her faz, ayrı doğrulama ve kabul ölçütüyle ilerleyecek.</h2><p>Aşağıdaki maddeler planlanan geliştirme alanlarıdır; bugün çalışan operasyonel özellikler olarak sunulmamaktadır.</p></div>
        <div className="shell next-roadmap">{roadmap.map(([Icon, number, title, body]) => <article key={number}><span>{number}</span><Icon aria-hidden="true" /><div><h3>{title}</h3><p>{body}</p></div></article>)}</div>
      </section>

      <section className="page-section offline-architecture-section">
        <div className="shell right-heading"><p className="eyebrow">Merkez + saha mimarisi</p><h2>İnternet kesildiğinde operasyon verisi kaybolmamalı.</h2><p>Hedeflenen mimari, bulut merkezini Jetson tabanlı yerel işlem birimiyle tamamlar. Yetkili bağlantı geri geldiğinde yerel değişiklikler çakışma ve sürüm kontrolüyle merkeze aktarılır.</p></div>
        <div className="shell offline-architecture-grid">
          <article><Cloud aria-hidden="true" /><span>Merkez / bulut</span><h3>Ortak operasyon görünümü</h3><p>Kurum verileri, yetkilendirme, merkezi model, plan sürümleri ve ekipler arası koordinasyon.</p></article>
          <article><WifiOff aria-hidden="true" /><span>Yerel / Jetson</span><h3>Bağlantısız çalışma</h3><p>Sınırlı bölgede görüntü analizi, yerel harita, görev atama, saha cihazı iletişimi ve güvenli kayıt kuyruğu.</p></article>
          <article><RefreshCw aria-hidden="true" /><span>Yeniden bağlantı</span><h3>Denetimli eşitleme</h3><p>Merkez ve saha değişikliklerini zaman damgası, yetki ve plan sürümüyle karşılaştıran, sessiz değişiklik yapmayan senkronizasyon.</p></article>
        </div>
      </section>

      <section className="next-callout"><div className="shell"><div><p className="eyebrow">Birlikte geliştirelim</p><h2>Veri, altyapı ve saha doğrulama ortaklıkları yol haritasını hızlandırabilir.</h2></div><a className="button primary" href="/iletisim">Sponsor ve iş birliği formu <ArrowRight aria-hidden="true" /></a></div></section>
    </SiteFrame>
  );
}
