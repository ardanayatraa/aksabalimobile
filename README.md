# Aksa Bali — Mobile (Expo / Android)

Phase 0 scaffold: auth lengkap (login + register dengan role picker siswa/pengajar) + tab navigation role-routed + dashboard stub. Konsumsi API web di `/api/mobile/v1/*`.

## Stack

- Expo SDK 52 + Expo Router 4 (file-based routing, mirip Next.js)
- React Native 0.76 + React 18
- TypeScript strict
- NativeWind 4 (Tailwind buat RN, palet Tridatu match dengan web)
- `expo-secure-store` untuk JWT (encrypted storage, bukan AsyncStorage)
- `@tanstack/react-query` untuk caching + retries

## Setup pertama kali

```sh
cd mobile
npm install
cp .env.example .env
```

Edit `.env`, ganti `EXPO_PUBLIC_API_URL` ke IP LAN laptop kamu (bukan `localhost`, karena HP fisik nggak bisa hit localhost laptop):

```env
EXPO_PUBLIC_API_URL=http://192.168.1.10:3000
```

Cara cari IP LAN di Windows: `ipconfig` → lihat "IPv4 Address" di adapter WiFi. Pastikan HP & laptop di WiFi yang sama.

Kalau pakai **emulator Android** (bukan HP fisik), pakai `http://10.0.2.2:3000` — itu alias loopback host machine dari dalam emulator.

## Jalanin

Pastikan **server web nyala dulu** di laptop:

```sh
# di root project (folder kakak dari mobile/)
npm run dev
```

Lalu di `mobile/`:

```sh
npm run start
```

Expo Dev Tools muncul. Pilihan:
- **HP fisik**: install Expo Go dari Play Store, scan QR code yang muncul di terminal
- **Emulator Android**: tekan `a` di terminal Expo (perlu Android Studio + AVD running)

## Flow yang udah jalan

1. **Splash → cek token di SecureStore** → kalau ada, panggil `/api/mobile/v1/auth/me` untuk validasi
2. **Belum login** → `/(auth)/login`
3. **Daftar baru** → `/(auth)/register` dengan **role picker siswa/pengajar**. Admin sengaja nggak dibuka di mobile (lihat catatan di bawah).
4. **Login sukses sebagai siswa** → tab nav `Beranda / Latihan / Game / Profil`
5. **Login sukses sebagai guru** → tab nav `Ruang Guru / Host Game / Profil`
6. **Logout** dari Profil → hapus token + balik ke login

Token disimpan via `expo-secure-store` (Android Keystore / iOS Keychain). Semua API call otomatis attach `Authorization: Bearer <token>` lewat wrapper di [lib/api.ts](lib/api.ts).

## Yang belum ada (roadmap)

| Fase | Lingkup |
|---|---|
| **1** | Tab siswa: catalog + latihan card-based (huruf/swara/angka/kata/membaca — semua **selain** nyurat) |
| **2** | Quiz mode (endpoint `/quiz` udah ada di server) |
| **3** | Game lobby/live/podium siswa (polling 2s) |
| **4** | Host room guru + kontrol soal |
| **5** | **Latihan nyurat (stroke canvas)** — paling kompleks. Port `lib/strokeRecognition.js` ke Skia karena versi web pakai DOM API. |
| **6** | Payment Midtrans (WebView) |

## Kenapa admin nggak ada di mobile

Admin tugasnya kelola konten (CRUD aksara, kategori, lihat statistik global, dll). UI tabel + form panjang nggak fit di mobile. Admin tetap via web di `/admin`. Endpoint `/auth/register` kalau dikirim `role: "admin"` dari mobile akan ditolak server karena nggak ada `adminKey`.

## Layout file

```
mobile/
  app/                          # Expo Router (file = route)
    _layout.tsx                 # root providers + auth gate
    index.tsx                   # redirect by auth state + role
    (auth)/
      _layout.tsx
      login.tsx
      register.tsx              # role picker siswa | pengajar
    (siswa)/
      _layout.tsx               # Tabs nav siswa
      dashboard.tsx
      latihan.tsx               # stub
      game.tsx                  # stub
      profil.tsx
    (guru)/
      _layout.tsx               # Tabs nav guru
      ruang.tsx
      host.tsx                  # stub
      profil.tsx
  components/
    Button.tsx
    Field.tsx
    RolePicker.tsx
  lib/
    api.ts                      # fetch wrapper, base = ${API}/api/mobile/v1
    auth.ts                     # AuthContext + login/register/me/logout
    token.ts                    # SecureStore wrapper
    types.ts                    # User, Role, ApiResponse
  tailwind.config.js            # palet Tridatu (mirror dari web)
  global.css                    # @tailwind directives untuk NativeWind
```

## Catatan

- **Palet warna match web 1:1** — `bg-primary` di mobile = `bg-brick` di web = `#B91C1C` (merah Tridatu). Lihat [tailwind.config.js](tailwind.config.js).
- **Routing** pakai Expo Router. Group folder `(auth)` / `(siswa)` / `(guru)` nggak masuk URL — cuma untuk grup layout. Mirip Next.js route groups.
- **Auth gate** di `app/_layout.tsx`: kalau user belum login, redirect ke `(auth)`. Kalau udah login tapi masih di `(auth)` group, redirect ke home sesuai role.
- **Polling game** nanti pakai pattern yang sama dengan web: `setInterval(refresh, 2000)` di screen yang aktif. Kalau jadi battery issue di production, upgrade ke SSE/WebSocket.

## Build APK untuk testing langsung di HP

Pakai EAS Build (gratis untuk dev):

```sh
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android --profile preview
```

Output: link APK yang bisa di-download & install langsung di HP Android. Nggak perlu Play Store.
