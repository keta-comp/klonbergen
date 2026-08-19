# Taklifnoma yaratish oqimi — SÚWRETLER va SHABLON bosqichlarini olib tashlash + Kuyov-birinchi tartib

**Sana:** 2026-08-20
**Loyiha:** Vowly — `toyxana-dream-hub-main`
**Natija:** TypeScript ✅ · Production build ✅ · Orphan kod yo'q ✅

---

## 1. Nima o'zgartirildi

Taklifnoma (invitation) yaratish sehrgaridagi **"05 SÚWRETLER"** (galereya) va
**"06 SHABLON"** (shablon) bosqichlari to'liq olib tashlandi. Foydalanuvchi endi
faqat 4 ta bosqichdan o'tadi: **JUFTLIK → SANA → MANZIL → TAKLIF MATNI**, so'nggi
bosqichda "Yaratish" tugmasi bilan yakunlaydi. Premium Vowly dizayni avtomatik
qo'llaniladi (shablon tanlash yo'q).

### O'zgartirilgan fayllar

| Fayl | O'zgarish |
|------|-----------|
| `src/pages/InvitationBuilder.tsx` | `STEPS` 6→4 ta; `StepId` dan `gallery`/`template` olib tashlandi; `validate()` Record dan olib tashlandi; `handleCreate` payloadidan `coverImage`/`galleryImages`/`templateId` olib tashlandi; `GalleryForm`/`TemplateSelector` import va render olib tashlandi; eski URL `?step=gallery` / `?step=template` → oxirgi valid bosqichga redirect; `ImagePlus` re-export olib tashlandi |
| `src/components/invitation/builder/forms/index.tsx` | `GalleryForm`, `TemplateSelector`, `TEMPLATES` o'chirildi; `CoupleForm` maydon tartibi **Kuyov-birinchi** qilib o'zgartirildi; placeholderlar i18n (`groomPh`/`bridePh`) |
| `src/components/invitation/builder/types.ts` | `BuilderState` dan `coverImage`/`galleryImages`/`templateId` olib tashlandi; `InvitationTemplateId` export o'chirildi; `BuilderStepMeta.id` 4 kalitga qisqartirildi |
| `src/hooks/useInvitations.ts` | `InvitationDraft`/`InvitationExtras` dan `coverImage`/`galleryImages`/`templateId` olib tashlandi; o'lik `uploadPhotos()` o'chirildi; yaratishda `photos: []`; `templateId` localStorage'dan olib tashlandi; `InvitationTemplateId` export o'chirildi |
| `src/i18n/locales/{en,uz,ru,kaa}.json` | `builder.steps.gallery` / `builder.steps.template` o'chirildi; `builder.couple.t1`/`t2` almashtirildi (**Kuyov birinchi**) |

---

## 2. Kuyov-birinchi (Kuyov → 1, Kelin → 2) tekshiruvi

Talab: nom tartibi form, preview, invitation, guest page, admin, DB mapping,
archive va share/SEO'da bir xil bo'lishi kerak. "Kelin-Kuyov" yorlig'i o'zi
saqlanib qoldi (faqat tartib o'zgartirildi).

| Sirt | Holat | Izoh |
|------|-------|------|
| **CoupleForm (builder)** | ✅ o'zgartirildi | Sarlavha `t1 & t2` → "Kuyov & Kelin"; maydonlar Kuyov→Kelin |
| **InvitationPreview** | ✅ allaqachon to'g'ri | `{groom} & {bride}` (02 va 04 ekranlar) |
| **GuestHero** | ✅ allaqachon to'g'ri | `[groom, bride].join(' & ')` |
| **GuestPage (SEO/share)** | ✅ allaqachon to'g'ri | `${groom_name} & ${bride_name}` |
| **ArchiveDetailPage** | ✅ allaqachon to'g'ri | `${groom_name} & ${bride_name}` |
| **DB mapping (slug)** | ✅ allaqachon to'g'ri | `makeSlug(groomName, brideName)` |
| **Admin (BrideGroomEditor)** | ✅ o'zgarishsiz | Birikkan "Kelin & Kuyov" matni yo'q — alohida maydonlar; `kelin-kuyov` route yorlig'i saqlangan |
| **"Kelin-Kuyov" yorlig'i** | ✅ saqlangan | Route `kelin-kuyov` o'zgarmagan |

---

## 3. Routing tozaligi

- Faol bosqich URL dan keladi (`?step=<id>`) — refresh, deep link va brauzer
  Orqa/Oldingi tugmalari uchun bitta manba.
- Eski havolalar `?step=gallery` yoki `?step=template` (yoki har qanday
  noma'lum id) avtomatik ravishda **oxirgi valid bosqichga** (`message`) redirect
  qilinadi — sehrgar mavjud bo'lmagan ekranga tushmaydi.
- `StepIndicator` bosqich raqamlarini avtomatik hisoblaydi (01–04).

---

## 4. JONLI PREVIEW va dizayn

- JONLI PREVIEW o'zgarishsiz — foydalanuvchi yozganida real vaqtda yangilanadi.
- Premium minimalist Vowly estetikasi (krem fon, serif, minimal chegaralar,
  premium bo'shliq) saqlanib qoldi. Faqat oqim soddalashtirildi.

---

## 5. QA natijalari

| Tekshiruv | Natija |
|-----------|--------|
| `bunx tsc --noEmit` | ✅ PASS (exit 0) |
| `vite build` (Node 22) | ✅ PASS (`✓ built in ~7s`) |
| Orphan kod | ✅ Yo'q — `GalleryForm`, `TemplateSelector`, `InvitationTemplateId`, `coverImage`, `galleryImages`, `templateId`, `builder.gallery.*`, `builder.template.*` hamma joydan olib tashlandi |
| Konsol xatosi | ✅ Aniqlanmadi (build vaqti) |

**Eslatma:** `src/components/invitation/templates.ts` dagi `TEMPLATES` — bu
**boshqa**, taklifnoma vizual stillari uchun bo'lgan konstanta (guest/invitation
sahifalari uni ishlatadi); olib tashlanmadi. Shuningdek `index.css` da
`inv-uploader` / `inv-template` kabi klasslar o'lik qoldi — ular funksional xato
keltirmaydi, lekin istasangiz keyinchalik tozalash mumkin.

---

## 6. Qo'lda tekshirish tavsiyasi (sandbox Playwright bloklagani uchun)

Avtomatik E2E sandbox tomonidan bloklangan. Quyidagilarni qo'lda tekshiring:
- Navigatsiya: Next / Back / Save / Preview / URL `?step=` / Refresh / brauzer
  Orqa-Oldingi, mobil (360/390/414px) va desktopda.
- Eski havolalar (`?step=gallery`, `?step=template`) oxirgi bosqichga redirect.
- CoupleForm da Kuyov maydoni birinchi, preview "Kuyov & Kelin" ko'rsatadi.
