import type { Metadata } from 'next';
import Image from 'next/image';
import { ArrowUpRight, FileText } from 'lucide-react';
import { SiteFrame } from '@/components/site-frame';

export const metadata: Metadata = {
  title: 'Ekibimiz — CALAMITAS AI',
  description: 'Calamitas AI geliştirme ekibi, proje sorumlulukları ve sosyal bağlantıları.',
};

const team = [
  {
    name: 'Kemal Ersay',
    title: 'Danışman',
    role: 'Akademik rehberlik, yöntem doğrulaması ve geliştirme süreci danışmanlığı',
    image: '/team/kemal-ersay.jpg',
    focus: 'center 42%',
    linkedin: 'https://www.linkedin.com/in/kemal-ersay-a00139242/',
    instagram: 'https://www.instagram.com/ersaykemal/',
  },
  {
    name: 'Ayşegül Balım Yabacı',
    title: 'Takım Kaptanı',
    role: 'Proje koordinasyonu, ürün vizyonu ve ekip yönetimi',
    image: '/team/aysegul-balim-yabaci.jpg',
    focus: 'center 34%',
    linkedin: 'https://www.linkedin.com/in/a-balimyabaci/',
    instagram: 'https://www.instagram.com/a.balimyabaci/',
  },
  {
    name: 'Ömer Tuncer',
    title: 'Algoritma Geliştiricisi',
    role: 'Görüntü analizi, model geliştirme ve müdahale önceliklendirme yaklaşımı',
    image: '/team/omer-tuncer-hd.webp',
    focus: 'center 38%',
    linkedin: 'https://www.linkedin.com/in/%C3%B6mer-tuncer-805714300/',
    instagram: 'https://www.instagram.com/tuncer_omer_/',
  },
  {
    name: 'Altan Ekrem Özkan',
    title: 'Yazılım Geliştiricisi',
    role: 'Web, sunucu mimarisi ve sistem entegrasyonu',
    image: '/team/altan-ekrem-ozkan.jpg',
    focus: 'center 45%',
    linkedin: 'https://www.linkedin.com/in/altan-ekrem-%C3%B6zkan-78a81126b/',
    instagram: 'https://www.instagram.com/altanozkan06/',
  },
  {
    name: 'Eray Taha Yılmaz',
    title: 'İletişim Sorumlusu',
    role: 'Proje iletişimi, paydaş ilişkileri ve görünürlük çalışmaları',
    image: '/team/eray-taha-yilmaz.jpg',
    focus: '38% 42%',
    linkedin: 'https://www.linkedin.com/in/eray-taha-y%C4%B1lmaz-3425b62b2/',
    instagram: 'https://www.instagram.com/ery.thay/',
  },
] as const;

export default function TeamPage() {
  return (
    <SiteFrame eyebrow="05 / Ekibimiz" title="Teknolojiyi toplumsal faydaya dönüştürmek için birlikte çalışıyoruz." lead="Araştırma, algoritma, yazılım, iletişim ve danışmanlık sorumluluklarını aynı hedef etrafında birleştiren Calamitas AI ekibi." pageClass="team-page">
      <section className="page-section">
        <div className="shell right-heading compact"><p className="eyebrow">Proje takımı</p><h2>Farklı sorumluluklar, tek amaç.</h2></div>
        <div className="shell team-list">
          {team.map((member, index) => (
            <article className="team-row" key={member.name}>
              <div className="team-row-copy">
                <span>0{index + 1} / {member.title}</span>
                <h3>{member.name}</h3>
                <p>{member.role}</p>
                <div className="team-socials">
                  <a href={member.linkedin} target="_blank" rel="noreferrer" aria-label={`${member.name} LinkedIn profili`}><span className="social-mark" aria-hidden="true">in</span> LinkedIn <ArrowUpRight aria-hidden="true" /></a>
                  <a href={member.instagram} target="_blank" rel="noreferrer" aria-label={`${member.name} Instagram profili`}><span className="social-mark instagram-mark" aria-hidden="true">◎</span> Instagram <ArrowUpRight aria-hidden="true" /></a>
                </div>
              </div>
              <div className="team-row-photo"><Image src={member.image} alt={member.name} fill sizes="(max-width: 700px) 92vw, 425px" style={{ objectPosition: member.focus }} /></div>
            </article>
          ))}
        </div>
        <a className="shell team-document-card" href="/documents/calamitas-ai-tanitim-dosyasi.pdf" target="_blank" rel="noreferrer">
          <FileText aria-hidden="true" />
          <span><small>13 sayfalık proje dosyası</small><strong>Takım tanıtım dosyamıza ulaşabilirsiniz.</strong></span>
          <ArrowUpRight aria-hidden="true" />
        </a>
      </section>
    </SiteFrame>
  );
}
