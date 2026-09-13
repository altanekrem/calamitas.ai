import type { Metadata } from 'next';
import { ExternalLink } from 'lucide-react';
import { LiveSeismicMap } from '@/components/live-seismic-map';
import { SiteFrame } from '@/components/site-frame';

export const metadata: Metadata = {
  title: 'Sismik Harita — CALAMITAS AI',
  description: 'USGS dünya verileri ve AFAD Türkiye kayıtlarıyla güncel depremleri gösteren etkileşimli sismik harita.',
};

export default function SeismicPage() {
  return (
    <SiteFrame eyebrow="02 / Sismik Harita" title="Dünya ve Türkiye’deki güncel sismik hareketleri ayrıntılı izleyin." lead="Dünya görünümü USGS’nin son 24 saatlik akışını, Türkiye görünümü ise AFAD’ın son yedi günlük ayrıntılı kayıtlarını kullanır. Harita güncel veriyi düzenli aralıklarla yeniler." pageClass="seismic-page">
      <section className="page-section">
        <div className="shell right-heading compact"><p className="eyebrow">Canlı veri</p><h2>Dünya ölçeğinden Türkiye ayrıntısına geçin.</h2><p>Dünya ve Türkiye düğmeleriyle kapsamı değiştirin. Listedeki bir olaya dokunarak konuma yakınlaşabilir; büyüklük, zaman, derinlik ve resmî kaynak kaydını inceleyebilirsiniz.</p></div>
        <div className="shell"><LiveSeismicMap /></div>
        <div className="shell official-source"><span>Veri sağlayıcılar: USGS Earthquake Hazards Program ve T.C. İçişleri Bakanlığı AFAD</span><span className="official-links"><a href="https://earthquake.usgs.gov/earthquakes/map/" target="_blank" rel="noreferrer">USGS haritası <ExternalLink aria-hidden="true" /></a><a href="https://deprem.afad.gov.tr/last-earthquakes.html" target="_blank" rel="noreferrer">AFAD son depremler <ExternalLink aria-hidden="true" /></a></span></div>
      </section>
    </SiteFrame>
  );
}
