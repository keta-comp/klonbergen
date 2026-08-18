/* One-off i18n merge: add archive + modal + account keys to all 4 locales. */
import { readFileSync, writeFileSync } from "fs";

const files = {
  uz: "src/i18n/locales/uz.json",
  en: "src/i18n/locales/en.json",
  ru: "src/i18n/locales/ru.json",
  kaa: "src/i18n/locales/kaa.json",
};

const patches = {
  uz: JSON.parse(`{
    "admin": {
      "archive": {
        "title": "TO'YLAR ARXIVI",
        "subtitle": "Tugallangan to'ylar ro'yxati. Barcha ma'lumotlar saqlanadi.",
        "searchPh": "To'y qidirish...",
        "loading": "Yuklanmoqda...",
        "emptyTitle": "Hozircha arxivlangan to'y yo'q",
        "emptyDesc": "Birinchi to'y 00:00 da avtomatik arxivlanadi.",
        "fetching": "Yangilanmoqda...",
        "status": "Arxivlangan",
        "coverAlt": "to'y",
        "weddingFallback": "To'y",
        "viewBtn": "Arxivni ko'rish",
        "zipBtn": "ZIP yuklab olish",
        "more": "Ko'proq",
        "openDetails": "Tafsilotlarni ochish",
        "rezip": "ZIP qayta yuklab olish",
        "guestUnit": "mehmon",
        "photoUnit": "surat",
        "scanUnit": "scan",
        "zipReady": "ZIP tayyor — yuklandi",
        "zipError": "ZIP tayyorlashda xato",
        "backToArchive": "Arxivga qaytish",
        "notFoundTitle": "Arxiv topilmadi",
        "notFoundDesc": "Bu to'y arxivi mavjud emas yoki o'chirilgan.",
        "completedBadge": "TO'Y YAKUNLANGAN",
        "sections": {
          "info": "To'y ma'lumotlari",
          "program": "Dastur",
          "menu": "Taomlar",
          "artists": "Artistlar",
          "couple": "Kelin & Kuyov",
          "qr": "QR stollar",
          "rsvp": "RSVP javoblari",
          "gallery": "Galereya (bannerlar)",
          "moments": "To'y suratlari"
        },
        "infoTitle": "To'y ma'lumotlari",
        "statGuests": "Mehmonlar",
        "statRsvp": "RSVP",
        "statPhotos": "Suratlar",
        "statScans": "QR scanlar",
        "pairBride": "Kelin",
        "pairGroom": "Kuyov",
        "pairWeddingDate": "To'y sanasi",
        "pairArchived": "Arxivlangan",
        "pairHall": "Hall",
        "pairArchiveType": "Arxiv turi",
        "qrHint": "QR kodlar har bir to'y uchun dinamik tarzda yaratiladi. Yangi kodlar uchun {link} sahifasiga o'ting.",
        "qrLinkText": "/admin/qr",
        "qrId": "QR kodlar yaratish uchun joriy ID: {id}",
        "empty": {
          "program": "Bu to'y uchun dastur kiritilmagan.",
          "menu": "Menyu kiritilmagan.",
          "artists": "Artistlar qo'shilmagan.",
          "couple": "Kelin & kuyov fotosuratlari kiritilmagan.",
          "rsvp": "Hech qanday RSVP kelmagan.",
          "gallery": "Bannerlar kiritilmagan.",
          "moments": "Mehmonlar surati yuklamagan."
        },
        "rsvpAttending": "Keladi",
        "rsvpNotAttending": "Kela olmaydi",
        "rsvpGuestUnit": "kishi",
        "rsvpTable": "Stol",
        "footer": "VOWLY arxivi — yakunlangan to'y ma'lumotlari.",
        "anonGuest": "Anonim mehmon"
      },
      "account": {
        "noAccess": "Kirish qabul qilinmagan",
        "notLinked": "Sizning akkauntingiz hech qaysi to'yxonaga bog'lanmagan. Super admin sizni admin qilishi kerak."
      },
      "menu": {
        "today": "Búgingi",
        "archived": "Arxiv"
      },
      "rsvp": {
        "title": "RSVP javoblari",
        "subtitle": "Mehmonlarning tasdiqlash javoblari.",
        "deleted": "RSVP o'chirildi",
        "totalGuests": "Jami mehmon",
        "loading": "Yuklanmoqda...",
        "empty": "Hozircha hech qanday RSVP kelmagan.",
        "colGuest": "Mehmon",
        "colStatus": "Holat",
        "colCount": "Kishi",
        "colTable": "Stol",
        "colMessage": "Xabar"
      }
    },
    "superadmin": {
      "halls": {
        "add_modal": {
          "created": "To'yxona qo'shildi!",
          "created_with_admin": "To'yxona va admin yaratildi!",
          "created_intro": "To'yxona yaratildi. Admin ma'lumotlarini adminga yuboring:",
          "copy": "Nusxalash",
          "copy_success": "Nusxalandi",
          "close": "Yopish",
          "cancel": "Bekor qilish",
          "name_required": "Nomni kiriting",
          "plan_required": "Avval tarif tanlang (tariflar bo'limida yarating)",
          "admin_error": "Admin yaratishda xatolik: {msg}",
          "payment_note": "Yangi to'yxona — boshlang'ich to'lov",
          "cover_pick": "Rasm tanlash (ixtiyoriy)",
          "no_plan_title": "⚠️ Hech qanday tarif topilmadi.",
          "no_plan_desc": "Avval yuqori menyudan “Tariflar” bo'limiga kiring va kamida bitta tarif yarating. Tarif bo'lmasa to'yxona yaratib bo'lmaydi."
        }
      },
      "plans": {
        "code_required": "Kod va nom majburiy",
        "price_invalid": "Narx noto'g'ri",
        "saved_create": "Tarif qo'shildi",
        "saved_edit": "Tarif yangilandi",
        "code_locked": "Kodni o'zgartirib bo'lmaydi",
        "code_ph": "venue",
        "name_ph": "Venue"
      },
      "activity": {
        "hall_created": "{name} qo'shildi",
        "admin_created": "{name} admini yaratildi",
        "hall_archived": "To'yxona arxivlandi",
        "hall_restored": "To'yxona arxivdan qaytarildi"
      }
    }
  }`),

  en: JSON.parse(`{
    "admin": {
      "archive": {
        "title": "WEDDING ARCHIVE",
        "subtitle": "List of completed weddings. All data is preserved.",
        "searchPh": "Search weddings...",
        "loading": "Loading...",
        "emptyTitle": "No archived weddings yet",
        "emptyDesc": "The first wedding will be archived automatically at 00:00.",
        "fetching": "Updating...",
        "status": "Archived",
        "coverAlt": "wedding",
        "weddingFallback": "Wedding",
        "viewBtn": "View archive",
        "zipBtn": "Download ZIP",
        "more": "More",
        "openDetails": "Open details",
        "rezip": "Re-download ZIP",
        "guestUnit": "guests",
        "photoUnit": "photos",
        "scanUnit": "scans",
        "zipReady": "ZIP ready — downloaded",
        "zipError": "Failed to prepare ZIP",
        "backToArchive": "Back to archive",
        "notFoundTitle": "Archive not found",
        "notFoundDesc": "This wedding archive does not exist or was deleted.",
        "completedBadge": "WEDDING COMPLETED",
        "sections": {
          "info": "Wedding details",
          "program": "Program",
          "menu": "Menu",
          "artists": "Artists",
          "couple": "Bride & Groom",
          "qr": "QR tables",
          "rsvp": "RSVP responses",
          "gallery": "Gallery (banners)",
          "moments": "Wedding photos"
        },
        "infoTitle": "Wedding details",
        "statGuests": "Guests",
        "statRsvp": "RSVP",
        "statPhotos": "Photos",
        "statScans": "QR scans",
        "pairBride": "Bride",
        "pairGroom": "Groom",
        "pairWeddingDate": "Wedding date",
        "pairArchived": "Archived",
        "pairHall": "Hall",
        "pairArchiveType": "Archive type",
        "qrHint": "QR codes are generated dynamically for each wedding. Go to {link} to create new codes.",
        "qrLinkText": "/admin/qr",
        "qrId": "Current ID for generating QR codes: {id}",
        "empty": {
          "program": "No program added for this wedding.",
          "menu": "No menu added.",
          "artists": "No artists added.",
          "couple": "Bride & groom photos not added.",
          "rsvp": "No RSVP received.",
          "gallery": "No banners added.",
          "moments": "Guests have not uploaded photos."
        },
        "rsvpAttending": "Attending",
        "rsvpNotAttending": "Not attending",
        "rsvpGuestUnit": "people",
        "rsvpTable": "Table",
        "footer": "VOWLY archive — completed wedding data.",
        "anonGuest": "Anonymous guest"
      },
      "account": {
        "noAccess": "Access not granted",
        "notLinked": "Your account is not linked to any venue. The super admin must make you an admin."
      },
      "menu": {
        "today": "Today",
        "archived": "Archived"
      },
      "rsvp": {
        "title": "RSVP responses",
        "subtitle": "Guest confirmation responses.",
        "deleted": "RSVP deleted",
        "totalGuests": "Total guests",
        "loading": "Loading...",
        "empty": "No RSVP received yet.",
        "colGuest": "Guest",
        "colStatus": "Status",
        "colCount": "People",
        "colTable": "Table",
        "colMessage": "Message"
      }
    },
    "superadmin": {
      "halls": {
        "add_modal": {
          "created": "Venue added!",
          "created_with_admin": "Venue and admin created!",
          "created_intro": "Venue created. Send these credentials to the admin:",
          "copy": "Copy",
          "copy_success": "Copied",
          "close": "Close",
          "cancel": "Cancel",
          "name_required": "Enter a name",
          "plan_required": "Select a plan first (create one in Tariflar)",
          "admin_error": "Error creating admin: {msg}",
          "payment_note": "New venue — initial payment",
          "cover_pick": "Choose image (optional)",
          "no_plan_title": "⚠️ No plan found.",
          "no_plan_desc": "Go to the “Tariflar” (Plans) section from the top menu and create at least one plan. A venue cannot be created without a plan."
        }
      },
      "plans": {
        "code_required": "Code and name are required",
        "price_invalid": "Invalid price",
        "saved_create": "Plan added",
        "saved_edit": "Plan updated",
        "code_locked": "Code cannot be changed",
        "code_ph": "venue",
        "name_ph": "Venue"
      },
      "activity": {
        "hall_created": "{name} added",
        "admin_created": "{name} admin created",
        "hall_archived": "Venue archived",
        "hall_restored": "Venue restored from archive"
      }
    }
  }`),

  ru: JSON.parse(`{
    "admin": {
      "archive": {
        "title": "АРХИВ СВАДЕБ",
        "subtitle": "Список завершённых свадеб. Все данные сохраняются.",
        "searchPh": "Поиск свадеб...",
        "loading": "Загрузка...",
        "emptyTitle": "Пока нет архивных свадеб",
        "emptyDesc": "Первая свадьба будет архивирована автоматически в 00:00.",
        "fetching": "Обновление...",
        "status": "В архиве",
        "coverAlt": "свадьба",
        "weddingFallback": "Свадьба",
        "viewBtn": "Открыть архив",
        "zipBtn": "Скачать ZIP",
        "more": "Ещё",
        "openDetails": "Открыть детали",
        "rezip": "Скачать ZIP снова",
        "guestUnit": "гостей",
        "photoUnit": "фото",
        "scanUnit": "сканов",
        "zipReady": "ZIP готов — скачано",
        "zipError": "Не удалось подготовить ZIP",
        "backToArchive": "Назад в архив",
        "notFoundTitle": "Архив не найден",
        "notFoundDesc": "Этот архив свадьбы не существует или был удалён.",
        "completedBadge": "СВАДЬБА ЗАВЕРШЕНА",
        "sections": {
          "info": "Данные свадьбы",
          "program": "Программа",
          "menu": "Меню",
          "artists": "Артисты",
          "couple": "Невеста и жених",
          "qr": "QR-столы",
          "rsvp": "Ответы RSVP",
          "gallery": "Галерея (баннеры)",
          "moments": "Фото со свадьбы"
        },
        "infoTitle": "Данные свадьбы",
        "statGuests": "Гости",
        "statRsvp": "RSVP",
        "statPhotos": "Фото",
        "statScans": "QR-сканы",
        "pairBride": "Невеста",
        "pairGroom": "Жених",
        "pairWeddingDate": "Дата свадьбы",
        "pairArchived": "В архиве",
        "pairHall": "Зал",
        "pairArchiveType": "Тип архива",
        "qrHint": "QR-коды создаются динамически для каждой свадьбы. Перейдите на {link}, чтобы создать новые коды.",
        "qrLinkText": "/admin/qr",
        "qrId": "Текущий ID для создания QR-кодов: {id}",
        "empty": {
          "program": "Для этой свадьбы не добавлена программа.",
          "menu": "Меню не добавлено.",
          "artists": "Артисты не добавлены.",
          "couple": "Фото невесты и жениха не добавлены.",
          "rsvp": "Ответов RSVP не поступало.",
          "gallery": "Баннеры не добавлены.",
          "moments": "Гости не загрузили фото."
        },
        "rsvpAttending": "Придёт",
        "rsvpNotAttending": "Не сможет",
        "rsvpGuestUnit": "чел.",
        "rsvpTable": "Стол",
        "footer": "Архив VOWLY — данные завершённых свадеб.",
        "anonGuest": "Анонимный гость"
      },
      "account": {
        "noAccess": "Доступ не предоставлен",
        "notLinked": "Ваш аккаунт не привязан ни к одной площадке. Супер-админ должен назначить вас админом."
      },
      "menu": {
        "today": "Сегодня",
        "archived": "В архиве"
      },
      "rsvp": {
        "title": "Ответы RSVP",
        "subtitle": "Ответы гостей на подтверждение.",
        "deleted": "RSVP удалён",
        "totalGuests": "Всего гостей",
        "loading": "Загрузка...",
        "empty": "Пока не получено ни одного RSVP.",
        "colGuest": "Гость",
        "colStatus": "Статус",
        "colCount": "Чел.",
        "colTable": "Стол",
        "colMessage": "Сообщение"
      }
    },
    "superadmin": {
      "halls": {
        "add_modal": {
          "created": "Площадка добавлена!",
          "created_with_admin": "Площадка и админ созданы!",
          "created_intro": "Площадка создана. Отправьте эти данные админу:",
          "copy": "Копировать",
          "copy_success": "Скопировано",
          "close": "Закрыть",
          "cancel": "Отмена",
          "name_required": "Введите название",
          "plan_required": "Сначала выберите тариф (создайте в разделе Тарифы)",
          "admin_error": "Ошибка при создании админа: {msg}",
          "payment_note": "Новая площадка — первоначальная оплата",
          "cover_pick": "Выбрать изображение (необязательно)",
          "no_plan_title": "⚠️ Тариф не найден.",
          "no_plan_desc": "Перейдите в раздел «Тарифы» в верхнем меню и создайте хотя бы один тариф. Площадку нельзя создать без тарифа."
        }
      },
      "plans": {
        "code_required": "Код и название обязательны",
        "price_invalid": "Неверная цена",
        "saved_create": "Тариф добавлен",
        "saved_edit": "Тариф обновлён",
        "code_locked": "Код нельзя изменить",
        "code_ph": "venue",
        "name_ph": "Venue"
      },
      "activity": {
        "hall_created": "{name} добавлена",
        "admin_created": "Админ {name} создан",
        "hall_archived": "Площадка архивирована",
        "hall_restored": "Площадка восстановлена из архива"
      }
    }
  }`),

  kaa: JSON.parse(`{
    "admin": {
      "archive": {
        "title": "TOYLAR ARXİPİ",
        "subtitle": "Tamamlanǵan toyler dizimi. Barlıq maǵliwmatlar saqlanadı.",
        "searchPh": "Toy izlew...",
        "loading": "Yüklenbekte...",
        "emptyTitle": "Álik arxipke alınǵan toy joq",
        "emptyDesc": "Birinshi toy 00:00 de avtomatik arxipke alınadı.",
        "fetching": "Janalanbaqta...",
        "status": "Arxipke alınǵan",
        "coverAlt": "toy",
        "weddingFallback": "Toy",
        "viewBtn": "Arxipti kóriw",
        "zipBtn": "ZIP júktep alıw",
        "more": "Kóbereк",
        "openDetails": "Tafsilatlarǵa ótiw",
        "rezip": "ZIP qayta júktep alıw",
        "guestUnit": "qonaq",
        "photoUnit": "súwret",
        "scanUnit": "scan",
        "zipReady": "ZIP tayyar — júklendi",
        "zipError": "ZIP tayyarlawda qátelik",
        "backToArchive": "Arxipke qaytıw",
        "notFoundTitle": "Arxip tabılmadı",
        "notFoundDesc": "Bul toy arxipi joq yaki óshirilgen.",
        "completedBadge": "TOY TAMAMLANDI",
        "sections": {
          "info": "Toy maǵliwmatları",
          "program": "Programma",
          "menu": "Tamaqlar",
          "artists": "Artistler",
          "couple": "Kelin & Kúyew",
          "qr": "QR stollar",
          "rsvp": "RSVP juwapları",
          "gallery": "Galereya (bannerlar)",
          "moments": "Toy súwretleri"
        },
        "infoTitle": "Toy maǵliwmatları",
        "statGuests": "Qonaqlar",
        "statRsvp": "RSVP",
        "statPhotos": "Súwretler",
        "statScans": "QR scanlar",
        "pairBride": "Kelin",
        "pairGroom": "Kúyew",
        "pairWeddingDate": "Toy kúni",
        "pairArchived": "Arxipke alınǵan",
        "pairHall": "Zal",
        "pairArchiveType": "Arxip túri",
        "qrHint": "QR kodlar hárbir toy ushın dinamikalıq túrde jaratıladı. Jańa kodlar ushın {link} betine ótiń.",
        "qrLinkText": "/admin/qr",
        "qrId": "QR kodlar jaratıw ushın aǵımdaǵı ID: {id}",
        "empty": {
          "program": "Bul toy ushın programma kirgizilmegen.",
          "menu": "Menyu kirgizilmegen.",
          "artists": "Artistler qosılmaǵan.",
          "couple": "Kelin hám kúyew súwretleri kirgizilmegen.",
          "rsvp": "Hech qanday RSVP kelmegen.",
          "gallery": "Bannerlar kirgizilmegen.",
          "moments": "Qonaqlar súwret júklemgen."
        },
        "rsvpAttending": "Keledi",
        "rsvpNotAttending": "Kela almaǵan",
        "rsvpGuestUnit": "adam",
        "rsvpTable": "Stol",
        "footer": "VOWLY arxipi — tamamlanǵan toy maǵliwmatları.",
        "anonGuest": "Anonim qonaq"
      },
      "account": {
        "noAccess": "Kiriw qabıllanbaǵan",
        "notLinked": "Siziń akkauntıńız hesh qanday to'yxanaǵa baylanbaǵan. Super admin sizi admin qılıwı kerek."
      },
      "menu": {
        "today": "Búgin",
        "archived": "Arxip"
      },
      "rsvp": {
        "title": "RSVP juwapları",
        "subtitle": "Qonaqlardıń tasdiqlaw juwapları.",
        "deleted": "RSVP óshirildi",
        "totalGuests": "Jami qonaq",
        "loading": "Yüklenbekte...",
        "empty": "Álik hech qanday RSVP kelmegen.",
        "colGuest": "Qonaq",
        "colStatus": "Status",
        "colCount": "Adam",
        "colTable": "Stol",
        "colMessage": "Xabar"
      }
    },
    "superadmin": {
      "halls": {
        "add_modal": {
          "created": "To'yxana qosıldı!",
          "created_with_admin": "To'yxana hám admin jaratıldı!",
          "created_intro": "To'yxana jaratıldı. Bul maǵliwmatlardı adminge jiberiń:",
          "copy": "Nusqalaw",
          "copy_success": "Nusqalandı",
          "close": "Jabıw",
          "cancel": "Biykarlaw",
          "name_required": "Atın kirgiziń",
          "plan_required": "Áwmeti tarif saylań (Tarifler bo'liminde jaratıń)",
          "admin_error": "Admin jaratıwda qátelik: {msg}",
          "payment_note": "Jańa to'yxana — baslanǵısh tólem",
          "cover_pick": "Súwret saylaw (májburiy emes)",
          "no_plan_title": "⚠️ Hech qanday tarif tabılmadı.",
          "no_plan_desc": "Joqarı menyudan «Tarifler» bo'limine ótiń hám azına bir tarif jaratıń. Tarifsiz to'yxana jaratıw múmkin emes."
        }
      },
      "plans": {
        "code_required": "Kod hám at májburiy",
        "price_invalid": "Narx qáte",
        "saved_create": "Tarif qosıldı",
        "saved_edit": "Tarif jańalandı",
        "code_locked": "Kodti ózgertiw múmkin emes",
        "code_ph": "venue",
        "name_ph": "Venue"
      },
      "activity": {
        "hall_created": "{name} qosıldı",
        "admin_created": "{name} admini jaratıldı",
        "hall_archived": "To'yxana arxipke alındı",
        "hall_restored": "To'yxana arxivden qaytarıldı"
      }
    }
  }`),
};

function merge(target, src) {
  for (const k of Object.keys(src)) {
    const sv = src[k];
    const tv = target[k];
    if (sv && typeof sv === "object" && !Array.isArray(sv) && tv && typeof tv === "object" && !Array.isArray(tv)) {
      merge(tv, sv);
    } else {
      target[k] = sv;
    }
  }
  return target;
}

function dotCount(obj, prefix = "") {
  let n = 0;
  for (const k of Object.keys(obj)) {
    const p = prefix ? prefix + "." + k : k;
    if (obj[k] && typeof obj[k] === "object" && !Array.isArray(obj[k])) n += dotCount(obj[k], p);
    else n++;
  }
  return n;
}

const report = {};
for (const [loc, path] of Object.entries(files)) {
  const json = JSON.parse(readFileSync(path, "utf8"));
  merge(json, patches[loc]);

  // verify the new top-level keys exist
  const checks = [
    "admin.archive.title",
    "admin.archive.sections.couple",
    "admin.account.notLinked",
    "superadmin.halls.add_modal.created",
    "superadmin.plans.code_required",
    "superadmin.activity.hall_created",
  ];
  for (const c of checks) {
    const parts = c.split(".");
    let cur = json;
    let ok = true;
    for (const p of parts) { if (cur && cur[p] != null) cur = cur[p]; else { ok = false; break; } }
    if (!ok) throw new Error(`[${loc}] missing key ${c}`);
  }

  writeFileSync(path, JSON.stringify(json, null, 2) + "\n", "utf8");
  report[loc] = dotCount(json);
  console.log(`✓ ${loc}: ${report[loc]} keys`);
}
console.log("KEY PARITY:", Object.values(report).every((v) => v === report.uz) ? "OK (all equal)" : report);
