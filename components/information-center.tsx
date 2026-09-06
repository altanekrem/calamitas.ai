'use client';

import Image from 'next/image';
import { ArrowUpRight, Images } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export type InformationTopic = { slug: string; title: string; images: string[] };

export function InformationCenter({ topics }: { topics: InformationTopic[] }) {
  const [active, setActive] = useState<InformationTopic | null>(null);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(1);

  useEffect(() => {
    if (!api) return;
    const update = () => setCurrent(api.selectedScrollSnap() + 1);
    update();
    api.on('select', update);
    api.on('reInit', update);
    return () => {
      api.off('select', update);
      api.off('reInit', update);
    };
  }, [api]);

  return (
    <>
      <div className="info-grid">
        {topics.map((topic) => (
          <button className="info-card" type="button" key={topic.slug} onClick={() => { setCurrent(1); setActive(topic); }}>
            <span className="info-cover">
              <Image src={topic.images[0]} alt="" fill sizes="(max-width: 700px) 46vw, (max-width: 1000px) 30vw, 270px" />
              <span className="info-count"><Images aria-hidden="true" /> {topic.images.length}</span>
            </span>
            <span className="info-card-body"><b>{topic.title}</b><ArrowUpRight aria-hidden="true" /></span>
          </button>
        ))}
      </div>

      <Dialog open={Boolean(active)} onOpenChange={(open) => !open && setActive(null)}>
        <DialogContent className="info-dialog" showCloseButton>
          {active && (
            <>
              <DialogHeader className="info-dialog-header">
                <DialogTitle>{active.title}</DialogTitle>
                <DialogDescription>Görseller arasında kaydırın veya yön tuşlarını kullanın.</DialogDescription>
              </DialogHeader>
              <Carousel setApi={setApi} opts={{ loop: active.images.length > 1 }} className="info-carousel">
                <CarouselContent>
                  {active.images.map((src, index) => (
                    <CarouselItem key={src}>
                      <div className="info-slide">
                        <Image src={src} alt={`${active.title} — ${index + 1}. görsel`} fill sizes="(max-width: 700px) 92vw, 640px" priority={index === 0} />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {active.images.length > 1 && <><CarouselPrevious /><CarouselNext /></>}
              </Carousel>
              <p className="slide-counter" aria-live="polite">{current} / {active.images.length}</p>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
