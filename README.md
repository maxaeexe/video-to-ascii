# video-to-ascii

Web tabanli, istemci tarafinda calisan gercek zamanli video ve animasyon ASCII donusturucu.

HTML5, CSS3 ve modern JavaScript (ES6+) kullanilarak gelistirilmistir. Harici kutuphaneye veya sunucu tarafi islemeye ihtiyac duymaz; butun donusum tarayicinin Canvas ve grafik islem birimi uzerinden yapilir.

## Yenilikler ve Ozellikler

- Dogrudan ve En Yuksek Kalitede Indirme: Ekran veya video kaydi alma zorunlulugu olmadan, mevcut ayarlarinizla videoyu bastan sona yuksek cozunurlukte (25 Mbps VP9 WebM) ASCII animasyona donusturur ve bittiginde otomatik olarak indirir.
- Orijinal Ses destegi: Donusturulen ve indirilen ASCII video icerisinde videonun orijinal ses parcasi korunur.
- Sabit Orijinal En/Boy Orani: Yuklenen videonun cozunurlugu ve en/boy orani (16:9, 9:16 dikey video, 4:3 vb.) otomatik olarak algilanir ve karakter geometrisi bozulmadan sabit olarak korunur.
- Istemci Tarafinda Calisma: Video dosyalari sunucuya yuklenmez, tarayici icerisinde yerel olarak donusturulur.
- Surukle ve Birak: MP4, WebM, MOV ve benzeri video formatlarini destekler.
- Hazir Demo ve Kamera: Video yuklemeden once test etmek icin dahili prosedurel 3D demo veya web kamerasi secenekleri mevcuttur.
- Goruntuleme Modlari:
  - Canvas Modu: Yuksek performansli ve net gorsel cikti.
  - Saf Metin Modu (pre): Kopyalanabilir ham ASCII karakter ciktisi.
- Karakter Setleri: Ayrintili, standart, blok golgeli, minimalist, ikili kod (binary), nokta deseni ve ozel tanimli karakter dizileri.
- Renk Secenekleri: Klasik siyah & beyaz, yumusak gumus gri, koyu komur, gercek piksel rengi (RGB) ve ters (beyaz zemin) modlari.
- Ayarlar: Cozunurluk (sutun sayisi), kontrast, parlaklik, negatif (invert) ve Sobel kenar algilama filtreleri.
- Disa Aktarma:
  - Dogrudan WebM formatinda yuksek kaliteli ASCII video donusturme ve indirme.
  - Aktif kareyi metin olarak panoya kopyalama.
  - Aktif kareyi PNG resmi olarak indirme.
- Oynatma Kontrolleri: Oynat, duraklat, basa sar, ilerleme cubugu, dongu modu, ses seviyesi ve oynatma hizi secenekleri.

## Klavye Kisayollari

- Bosluk (Space): Oynat / Duraklat
- F: Tam ekran modunu ac / kapat
- M: Sesi ac / kapat

## Calistirma

Herhangi bir kurulum gerektirmez. `index.html` dosyasini modern bir web tarayicisinda acmaniz yeterlidir.

Istege bagli olarak yerel sunucu ile calistirmak icin:

```bash
# Python ile
python -m http.server 8080

# veya Node.js ile
npx serve .
```

Tarayicinizda `http://localhost:8080` adresine giderek uygulamayi kullanabilirsiniz.
