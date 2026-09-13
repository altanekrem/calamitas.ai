# Calamitas AI — Bir Dakika, Bir Hayat

Calamitas AI için çok sayfalı tanıtım sitesi ve sentetik verilerle çalışan afet operasyon demonstrasyonu. Proje; tek afet sonrası görüntüden hasar ve müdahale ihtiyacına, personel/kaynak eşleştirmesinden kişiye özel ana–alternatif rotaya ve sürümlü yeniden planlamaya uzanan hedef sistemi anlatır.

> Operasyon paneli bir web demonstrasyonudur; gerçek afet kararı, resmî uyarı veya saha yönlendirmesi üretmez.

## Sayfalar

- `/sistem`: giriş denetimi sonrasında açılan; tek görüntü yükleme, manuel yol kapatma ve 42 bina / 36 personelli interaktif operasyon simülasyonu
- `/sismik-harita`: USGS dünya akışı ile AFAD Türkiye kayıtlarını ayrı kapsamlarla gösteren güncel deprem haritası
- `/projemiz`: uçtan uca sistem anlatısı ve 9:16 proje tanıtım videosu
- `/bilgi-merkezi`: kaydırılabilir afet bilinçlendirme serileri
- `/ekibimiz`: ekip, görevler, sosyal bağlantılar ve tanıtım PDF’si
- `/calamitas-next`: doğrulama, Jetson yerel çalışma ve senkronizasyon yol haritası
- `/iletisim`: D1 üzerinde kalıcı kayıt, Sheets aktarım kuyruğu ve kullanıcı tarafından silme destekli sponsorluk formu

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
- `GOOGLE_LOGIN_SHEETS_WEBHOOK_URL` ve `GOOGLE_LOGIN_SHEETS_WEBHOOK_SECRET`: giriş kayıtları tablosuna bağlı Apps Script dağıtımı
- `GOOGLE_SPONSOR_SHEETS_WEBHOOK_URL` ve `GOOGLE_SPONSOR_SHEETS_WEBHOOK_SECRET`: sponsor formu tablosuna bağlı Apps Script dağıtımı
- `GOOGLE_SHEETS_WEBHOOK_URL` ve `GOOGLE_SHEETS_WEBHOOK_SECRET`: yalnızca eski, tek-webhook kurulumu için geriye dönük yedek

`RESEND_API_KEY` ve `CONTACT_FROM_EMAIL` yoksa form D1 veritabanına kaydolur ancak otomatik e-posta göndermez. Form yanıtı bu durumu kullanıcıya açıkça bildirir.

İletişim kayıtları, proje sistemi giriş denemeleri, sekiz saatlik erişim oturumları ve Sheets aktarım kuyruğunun şeması `db/schema.ts`; SQL geçişleri `drizzle/` altındadır. Barındırma projesi `.openai/hosting.json` içinde `DB` adlı D1 bağlantısını kullanır. Giriş formu kısa süredeki başarısız denemeleri, sponsor formu da aynı e-posta adresinden tekrarlanan gönderimleri sınırlar.

## Google Sheets bağlantısı

Google’ın Apps Script web uygulamaları, bağlı dosyayı `doPost` içinde doğrudan açarken tüm e-tablolar yetkisi ister. Calamitas AI bu geniş yetkiyi kullanmaz. Bunun yerine her hedef Google Sheet içinde ayrı bir bağlı Apps Script projesi ve yalnız `spreadsheets.currentonly` kapsamı kullanılır:

1. Giriş ve sponsor Google Sheet dosyalarının her birinde **Uzantılar → Apps Komut Dosyası** yoluyla ayrı bir proje oluşturun.
2. Her projeye `integrations/google-sheets-webhook.gs` ile `integrations/appsscript.json` içeriğini ekleyin.
3. Proje ayarlarında `CALAMITAS_SPREADSHEET_ID` değerini o projenin bağlı olduğu tablo kimliği, `CALAMITAS_WEBHOOK_SECRET` değerini de o projeye özel uzun ve rastgele sır olarak tanımlayın.
4. Her projede `drainQueue` işlevi için dakikada bir çalışan zaman tabanlı tetikleyici ekleyin. Bu tetikleyici, yalnızca bağlı olduğu Google Sheet’e yazar.
5. Her projeyi sahibi olarak çalışan ve herkesin erişebildiği web uygulaması biçiminde dağıtın. Webhook adresleri ve ayrı sırlar, karşılık gelen `GOOGLE_LOGIN_*` ve `GOOGLE_SPONSOR_*` üretim değişkenlerine eklenir.

Anonim web uçları yalnız paylaşılan sır, sabit tablo kimliği, sabit sekme adı ve sabit başlık şeması uyuştuğunda işi kabul eder. `doPost` doğrudan tabloya erişmez; işi Google tarafındaki Script Properties kuyruğuna alır. Dakikalık bağlı tetikleyici bu kuyruğu en fazla yaklaşık bir dakika gecikmeyle işler. Bu nedenle site yanıtı “aktarıldı” yerine “aktarım güvenli kuyruğa kabul edildi” der. Script Properties sınırları nedeniyle her proje en fazla 50 bekleyen iş ve iş başına 8 KB’tan küçük veri kabul eder; site tarafındaki D1 kuyruğu dolu veya erişilemeyen webhookları yeniden dener.

Webhook bilinmeyen işlemleri reddeder, yalnız hedef sekmeyi oluşturur, başlık şemasını doğrular, hücre başındaki formül karakterlerini veri olarak nötrleştirir ve kayıt numarasıyla yinelenen satırları önler. Kullanıcı sponsor kaydını sildiğinde silme işi de aynı güvenli kuyruğa girer. Webhook etkin değilse site kayıtları D1’de kalıcıdır fakat Google Sheets’e ulaşmış sayılmaz.

## Varlıklar ve veri kaynakları

- Marka, ekip ve Bilgi Merkezi dosyaları `public/` altındadır.
- Takım tanıtım dosyası `public/documents/calamitas-ai-tanitim-dosyasi.pdf` yolundadır.
- Gerçek sponsorluk dosyası `public/documents/calamitas-ai-sponsorluk-dosyasi.pdf` yolundadır.
- Dikey tanıtım videosu tekrar üretilebilir:

```bash
node scripts/generate-project-video.mjs
```

- Dünya deprem verisi USGS Earthquake Hazards Program GeoJSON akışından, Türkiye ayrıntısı AFAD olay servisinden sunucu tarafında alınır. Kaynak bağlantıları harita sayfasında gösterilir.

## Doğrulama

Yayın öncesinde en az şu kontroller yapılmalıdır:

1. `pnpm run build`
2. `node scripts/verify-operation-routes.mjs`
3. Tüm sekiz sayfa ile PDF/video varlıklarında HTTP 200 kontrolü
4. Sponsor formunda oluşturma ve verilen silme anahtarıyla silme
5. Operasyon simülasyonunda haritadan yol noktası kapatılıp yeniden açıldığında rota çizgisi, erişilebilirlik, personel hareketi, plan sürümü ve güncellenen rota sayısının birlikte değişmesi
6. Hatalı ve doğru proje sistemi girişlerinin D1 denetim kaydına yazılması; doğru girişte oturumun açılıp çıkışta kapanması
7. Dünya/Türkiye deprem kapsamı geçişi, listedeki olayın harita açılır penceresini açması ve veri yenileme düğmesi
