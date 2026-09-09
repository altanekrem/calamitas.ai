import type { Metadata } from 'next';
import { ArrowUpRight, FileQuestion, FileText, Handshake, Mail, ServerCog } from 'lucide-react';
import { ContactForm } from '@/components/contact-form';
import { SiteFrame } from '@/components/site-frame';

export const metadata: Metadata = {
  title: 'İletişim ve Sponsorluk — CALAMITAS AI',
  description: 'Calamitas AI sponsorluk, teknik destek, veri ortaklığı ve kurumsal iş birliği formu.',
};

export default function ContactPage() {
  return (
    <SiteFrame eyebrow="07 / İletişim" title="Sponsorluk ve iş birliğiyle daha güçlü bir afet teknolojisi geliştirelim." lead="Maddi destek, teknik altyapı, veri erişimi, saha doğrulama veya iletişim ortaklığı için proje ekibine doğrudan ulaşın." pageClass="contact-page">
      <section className="page-section">
        <div className="shell right-heading compact"><p className="eyebrow">Sponsor iletişimi</p><h2>İhtiyacı ve katkı alanını açıkça belirtin.</h2><p>Form gönderimleri proje kayıtlarına kalıcı olarak alınır. Güvenli e-posta hizmeti yapılandırıldığında bildirimler calamitasai@gmail.com adresine yönlendirilir.</p></div>
        <div className="shell sponsor-layout">
          <aside className="sponsor-options">
            <a className="sponsor-document-link" href="/documents/calamitas-ai-tanitim-dosyasi.pdf" target="_blank" rel="noreferrer"><FileText aria-hidden="true" /><span><small>PDF / 13 sayfa</small><strong>Takım tanıtım dosyamıza ulaşabilirsiniz.</strong></span><ArrowUpRight aria-hidden="true" /></a>
            <a className="sponsor-document-link" href="mailto:calamitasai@gmail.com?subject=Calamitas%20AI%20Sponsorluk%20Dosyas%C4%B1%20Talebi"><FileQuestion aria-hidden="true" /><span><small>E-posta talebi</small><strong>Sponsorluk dosyasını ekibimizden talep edin.</strong></span><ArrowUpRight aria-hidden="true" /></a>
            <article><Handshake aria-hidden="true" /><div><h3>Sponsorluk</h3><p>Finansal destek, donanım, bulut kaynağı ve saha ekipmanı katkıları.</p></div></article>
            <article><ServerCog aria-hidden="true" /><div><h3>Teknik ortaklık</h3><p>Uydu verisi, yapay zekâ altyapısı, güvenlik ve kurum entegrasyonu.</p></div></article>
            <article><Mail aria-hidden="true" /><div><h3>Doğrudan yönlendirme</h3><p>Formun hedef alıcısı: calamitasai@gmail.com</p></div></article>
          </aside>
          <ContactForm />
        </div>
      </section>
    </SiteFrame>
  );
}
