import type { Metadata } from 'next';
import { InformationCenter, type InformationTopic } from '@/components/information-center';
import { SiteFrame } from '@/components/site-frame';
import topics from '@/lib/information-center.json';

export const metadata: Metadata = {
  title: 'Bilgi Merkezi — CALAMITAS AI',
  description: 'Afet hazırlığı, deprem güvenliği ve teknoloji hakkında görsel bilgi merkezi.',
};

export default function InformationPage() {
  return (
    <SiteFrame eyebrow="04 / Bilgi Merkezi" title="Afete hazırlık bilgisini görsel anlatımlarla keşfedin." lead="Bir konu kartını açın; görseller arasında dokunarak, kaydırarak veya yön tuşlarıyla ilerleyin." pageClass="information-page">
      <section className="page-section">
        <div className="shell right-heading compact"><p className="eyebrow">Afet bilgi merkezi</p><h2>Hazırlık, dayanıklılık ve teknoloji.</h2><p>İçerikler genel bilgilendirme amacı taşır. Acil durumda resmî kurumların güncel yönlendirmelerini izleyin.</p></div>
        <div className="shell"><InformationCenter topics={topics as InformationTopic[]} /></div>
      </section>
    </SiteFrame>
  );
}
