import type { Metadata } from 'next';
import { SiteFrame } from '@/components/site-frame';
import { SystemDashboard } from '@/components/system-dashboard';

export const metadata: Metadata = {
  title: 'Proje Sistemi — CALAMITAS AI',
  description: 'Tek afet sonrası görüntüyle başlayan interaktif afet operasyon simülasyonu.',
};

export default function SystemPage() {
  return (
    <SiteFrame eyebrow="01 / Proje Sistemi" title="Tek görüntüden canlı operasyon planına." lead="Afet sonrası görüntüyü yükleyin; hasar analizi, personel eşleştirme, kişiye özel rota ve dinamik yeniden planlama zincirini interaktif simülasyonda izleyin." pageClass="system-page">
      <section className="page-section"><div className="shell"><SystemDashboard /></div></section>
    </SiteFrame>
  );
}
