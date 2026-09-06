import type { Metadata } from 'next';
import { ExternalLink } from 'lucide-react';
import { LiveSeismicMap } from '@/components/live-seismic-map';
import { SiteFrame } from '@/components/site-frame';

export const metadata: Metadata = {
  title: 'Sismik Harita — CALAMITAS AI',
  description: 'USGS verileriyle dünyadaki son 24 saatlik depremleri gösteren güncel sismik harita.',
};

export default function SeismicPage() {
  return (
    <SiteFrame eyebrow="02 / Sismik Harita" title="Dünyadaki güncel sismik hareketleri tek haritada izleyin." lead="Harita, USGS Earthquake Hazards Program’ın son 24 saatlik GeoJSON akışını kullanır ve güncel veriyi düzenli aralıklarla yeniler." pageClass="seismic-page">
      <section className="page-section">
        <div className="shell right-heading compact"><p className="eyebrow">Canlı veri</p><h2>Son 24 saatte M 2,5 ve üzeri depremler.</h2><p>İşaretlere dokunarak büyüklük, konum, zaman ve kaynak kaydına ulaşabilirsiniz. Bu ekran bilgilendirme amaçlıdır; erken uyarı sistemi değildir.</p></div>
        <div className="shell"><LiveSeismicMap /></div>
        <div className="shell official-source"><span>Veri sağlayıcı: United States Geological Survey (USGS)</span><a href="https://earthquake.usgs.gov/earthquakes/map/" target="_blank" rel="noreferrer">Resmî deprem haritasını aç <ExternalLink aria-hidden="true" /></a></div>
      </section>
    </SiteFrame>
  );
}
