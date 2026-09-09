import type { ReactNode } from 'react';
import { ParallaxManager } from '@/components/parallax-manager';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

type SiteFrameProps = {
  eyebrow: string;
  title: string;
  lead: string;
  children: ReactNode;
  pageClass?: string;
};

export function SiteFrame({ eyebrow, title, lead, children, pageClass = '' }: SiteFrameProps) {
  return (
    <main className={`site-page ${pageClass}`.trim()}>
      <ParallaxManager />
      <section className="page-banner">
        <div className="page-banner-backdrop" data-parallax="0.035" aria-hidden="true" />
        <SiteHeader />
        <div className="shell page-banner-copy">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p>{lead}</p>
        </div>
      </section>
      {children}
      <SiteFooter />
    </main>
  );
}
