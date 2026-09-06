# Calamitas AI — Bir Dakika, Bir Hayat

Calamitas AI için çok sayfalı tanıtım sitesi ve sentetik verilerle çalışan afet operasyon demonstrasyonu. Proje; tek afet sonrası görüntüden hasar ve müdahale ihtiyacına, personel/kaynak eşleştirmesinden kişiye özel ana–alternatif rotaya ve sürümlü yeniden planlamaya uzanan hedef sistemi anlatır.

> Operasyon paneli bir web demonstrasyonudur; gerçek afet kararı, resmî uyarı veya saha yönlendirmesi üretmez.

## Sayfalar

- `/sistem`: tek görüntü yükleme ve 42 bina / 36 personelli interaktif operasyon simülasyonu
- `/sismik-harita`: USGS verilerini kullanan güncel deprem haritası
- `/projemiz`: uçtan uca sistem anlatısı ve 9:16 proje tanıtım videosu
- `/bilgi-merkezi`: kaydırılabilir afet bilinçlendirme serileri
- `/ekibimiz`: ekip, görevler, sosyal bağlantılar ve tanıtım PDF’si
- `/calamitas-next`: doğrulama, Jetson yerel çalışma ve senkronizasyon yol haritası
- `/iletisim`: D1 üzerinde kalıcı kayıt ve kullanıcı tarafından silme destekli sponsorluk formu

## Yerel çalışma

Gereksinim: Node.js 22.13 veya üzeri ve pnpm.

```bash
pnpm install
pnpm run dev
```

Üretim derlemesi:

```bash
pnpm run build
```
