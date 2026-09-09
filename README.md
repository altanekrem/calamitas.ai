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

## Yapılandırma

`.env.example` dosyasını temel alın:

- `SPONSOR_RECIPIENT_EMAIL`: form bildiriminin hedef alıcısı
- `RESEND_API_KEY`: Resend API anahtarı
- `CONTACT_FROM_EMAIL`: Resend üzerinde doğrulanmış gönderici adresi

`RESEND_API_KEY` ve `CONTACT_FROM_EMAIL` yoksa form D1 veritabanına kaydolur ancak otomatik e-posta göndermez. Form yanıtı bu durumu kullanıcıya açıkça bildirir.

İletişim kayıtlarının şeması `db/schema.ts`, SQL geçişleri `drizzle/` altındadır. Barındırma projesi `.openai/hosting.json` içinde `DB` adlı D1 bağlantısını kullanır.

## Varlıklar ve veri kaynakları

- Marka, ekip ve Bilgi Merkezi dosyaları `public/` altındadır.
- Takım tanıtım dosyası `public/documents/calamitas-ai-tanitim-dosyasi.pdf` yolundadır.
- Dikey tanıtım videosu tekrar üretilebilir:

```bash
node scripts/generate-project-video.mjs
```

- Güncel deprem verisi USGS Earthquake Hazards Program GeoJSON akışından sunucu tarafında alınır. Kaynak bağlantısı harita sayfasında gösterilir.

## Doğrulama

Yayın öncesinde en az şu kontroller yapılmalıdır:

1. `pnpm run build`
2. `node scripts/verify-operation-routes.mjs`
3. Tüm sekiz sayfa ile PDF/video varlıklarında HTTP 200 kontrolü
4. Sponsor formunda oluşturma ve verilen silme anahtarıyla silme
5. Operasyon simülasyonunda yol kapanınca rota çizgisi, personel hareketi, plan sürümü ve güncellenen rota sayısının birlikte değişmesi
