'use client';

import { useEffect } from 'react';

export function ParallaxManager() {
  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduceMotion.matches) return;

    const targets = Array.from(document.querySelectorAll<HTMLElement>('[data-parallax]'));
    let frame = 0;

    const update = () => {
      const viewportCenter = window.innerHeight / 2;
      targets.forEach((target) => {
        const rect = target.getBoundingClientRect();
        const speed = Number(target.dataset.parallax ?? '0.08');
        const offset = Math.max(-52, Math.min(52, (rect.top + rect.height / 2 - viewportCenter) * speed));
        target.style.setProperty('--parallax-y', `${offset.toFixed(1)}px`);
      });
      frame = 0;
    };

    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
