import type { Metadata } from 'next';
import { ArrowUpRight, FileText, Handshake, Mail, ServerCog } from 'lucide-react';
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
        <div className="shell right-heading compact"><p className="eyebrow">Sponsor iletişimi</p><h2>İhtiyacı ve katkı alanını açıkça belirtin.</h2><p>Form gönderimleri tarih ve saat bilgisiyle proje kayıtlarına kalıcı olarak alınır; Google Sheets aktarımı bağlantı durumuna göre eşzamanlı ya da sıralı biçimde tamamlanır. E-posta bildirimi yapılandırıldığında talepler altanekrem06@gmail.com adresine yönlendirilir.</p></div>
        <div className="shell sponsor-layout">
          <aside className="sponsor-options">
            <a className="sponsor-document-link" href="/documents/calamitas-ai-sponsorluk-dosyasi.pdf" target="_blank" rel="noreferrer"><FileText aria-hidden="true" /><span><small>PDF / 13 sayfa</small><strong>Sponsorluk dosyamıza ulaşabilirsiniz.</strong></span><ArrowUpRight aria-hidden="true" /></a>
            <article><Handshake aria-hidden="true" /><div><h3>Sponsorluk</h3><p>Finansal destek, donanım, bulut kaynağı ve saha ekipmanı katkıları.</p></div></article>
            <article><ServerCog aria-hidden="true" /><div><h3>Teknik ortaklık</h3><p>Uydu verisi, yapay zekâ altyapısı, güvenlik ve kurum entegrasyonu.</p></div></article>
            <article><Mail aria-hidden="true" /><div><h3>Doğrudan yönlendirme</h3><p>Formun hedef alıcısı: altanekrem06@gmail.com</p></div></article>
          </aside>
          <ContactForm />
        </div>
      </section>
    </SiteFrame>
  );
}
