'use client';

/* oxlint-disable next/no-html-link-for-pages -- Native anchors bypass a confirmed Vinext Link runtime failure. */
import Image from 'next/image';
import { Menu, Moon, Sun, X } from 'lucide-react';
import { useState } from 'react';

const links = [
  ['Proje Sistemi', '/sistem'],
  ['Sismik Harita', '/sismik-harita'],
  ['Projemiz', '/projemiz'],
  ['Bilgi Merkezi', '/bilgi-merkezi'],
  ['Ekibimiz', '/ekibimiz'],
  ['Calamitas Next', '/calamitas-next'],
  ['İletişim', '/iletisim'],
] as const;

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  function toggleTheme() {
    const nextDark = document.documentElement.dataset.theme !== 'dark';
    document.documentElement.dataset.theme = nextDark ? 'dark' : 'light';
    window.localStorage.setItem('calamitas-theme', nextDark ? 'dark' : 'light');
  }

  return (
    <header className="site-header shell">
      <a className="brand" href="/" aria-label="Calamitas AI ana sayfa">
        <span className="brand-mark">
          <Image src="/brand/calamitas-logo.png" alt="Calamitas AI güncel logosu" width={342} height={342} priority />
        </span>
        <span className="brand-wordmark">
          <b>CALAMITAS AI</b>
          <small>BİR DAKİKA, BİR HAYAT</small>
        </span>
      </a>

      <nav className={menuOpen ? 'is-open' : ''} aria-label="Ana menü">
        {links.map(([label, href]) => (
          <a key={href} href={href} onClick={() => setMenuOpen(false)}>{label}</a>
        ))}
      </nav>

      <div className="header-actions">
        <button className="icon-button" type="button" onClick={toggleTheme} aria-label="Açık veya koyu temaya geç">
          <Sun className="theme-sun" aria-hidden="true" />
          <Moon className="theme-moon" aria-hidden="true" />
        </button>
        <button className="menu-button" type="button" onClick={() => setMenuOpen((value) => !value)} aria-expanded={menuOpen} aria-label="Menüyü aç veya kapat">
          {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </div>
    </header>
  );
}
