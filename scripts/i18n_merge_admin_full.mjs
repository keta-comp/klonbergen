/* One-off i18n merge: add admin.artists/banners/timeline/couple/moments +
   common.imageCrop keys to all 4 locales. Deep-merge, parity-checked. */
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
      "artists": {
        "heading": "ARTISTLER",
        "add": "Qo'shish",
        "editTitle": "Artistni o'zgartirish",
        "newTitle": "Yangi artist qo'shish",
        "namePh": "Artist nomi",
        "timePh": "Chiqqish vaqti (masalan: 20:00 - 21:00)",
        "descPh": "Tavsif",
        "save": "Saqlash",
        "updated": "Artist yangilandi!",
        "added": "Artist qo'shildi!",
        "deleted": "Artist o'chirildi!"
      },
      "banners": {
        "coupleLabel": "Kelin va kuyov",
        "weddingDate": "To'y sanasi",
        "heading": "BANNERLAR",
        "subtitle": "Mehmonlar ko'radigan rasmlar",
        "add": "Qo'shish",
        "editTitle": "Bannerni o'zgartirish",
        "newTitle": "Yangi banner qo'shish",
        "titleLabel": "Banner nomi (ixtiyoriy)",
        "titlePh": "Masalan: To'y kuni",
        "imageLabel": "Rasm",
        "crop": "Kesish",
        "replace": "Almashtirish",
        "upload": "Rasm yuklash",
        "uploading": "Yuklanmoqda...",
        "formatHint": "JPG, PNG — 16:7 formati tavsiya etiladi",
        "saveEdit": "O'zgartirish",
        "saveNew": "Qo'shish",
        "updated": "Banner yangilandi!",
        "added": "Banner qo'shildi!",
        "deleted": "Banner o'chirildi!",
        "emptyTitle": "Hozircha bannerlar yo'q",
        "emptyDesc": "Yangi banner qo'shish uchun «Qo'shish» tugmasini bosing",
        "imgUploaded": "Rasm yuklandi!",
        "imgError": "Rasm yuklash xatosi"
      },
      "timeline": {
        "heading": "TO'Y DASTURI",
        "presetBtn": "Namuna dastur",
        "add": "Qo'shish",
        "editTitle": "O'zgartirish",
        "newTitle": "Yangi tadbir",
        "titlePh": "Tadbir nomi",
        "startLabel": "Boshlanishi",
        "endLabel": "Tugashi (ixtiyoriy)",
        "emojiPh": "Emoji (masalan 🍽️)",
        "descPh": "Qo'shimcha ma'lumot",
        "save": "Saqlash",
        "titleTimeRequired": "Nomi va vaqti kerak",
        "updated": "Yangilandi!",
        "added": "Qo'shildi!",
        "presetAdded": "Namuna dastur qo'shildi!",
        "loading": "Yuklanmoqda...",
        "empty": "Hali hech qanday tadbir qo'shilmagan.",
        "presets": {
          "greet": "Mehmonlarni kutib olish",
          "coupleEntry": "Kelin-kuyov kirishi",
          "firstDance": "Birinchi raqs",
          "dinner": "Kechki ovqat",
          "cake": "Tort marosimi",
          "entertainment": "Ko'ngil ochar",
          "closing": "Yakunlash"
        }
      },
      "couple": {
        "heading": "Kelin va kuyov",
        "brideNameLabel": "Kelin ismi",
        "groomNameLabel": "Kuyov ismi",
        "bridePhotoLabel": "Kelin rasmi",
        "groomPhotoLabel": "Kuyov rasmi",
        "weddingDateLabel": "To'y sanasi",
        "loveStoryLabel": "Sevgi hikoyasi",
        "loveStoryPh": "Sevgi hikoyangiz...",
        "save": "Saqlash",
        "saving": "Saqlanmoqda...",
        "saved": "Kelin-kuyov ma'lumotlari saqlandi!",
        "imgUploaded": "Rasm yuklandi!",
        "imgError": "Rasm yuklash xatosi",
        "uploading": "Yuklanmoqda...",
        "upload": "Rasm yuklash"
      },
      "moments": {
        "tabPhotos": "Rasmlar",
        "tabRsvp": "RSVP",
        "photosEmpty": "Hozircha mehmonlar rasm yuklamagan.",
        "anonGuest": "Anonim mehmon",
        "guestFallback": "Mehmon",
        "hide": "Yashirish",
        "show": "Ko'rsatish",
        "deleted": "Rasm o'chirildi",
        "confirmDelete": "O'chirishni tasdiqlaysizmi?",
        "sumAttending": "Keladi",
        "sumNotAttending": "Kela olmaydi",
        "sumTotalGuests": "Jami mehmon",
        "sumTotalReplies": "Jami javob",
        "byTables": "Stollar bo'yicha",
        "rsvpEmpty": "Hozircha javoblar yo'q.",
        "yes": "Ha",
        "no": "Yo'q",
        "guestsUnit": "kishi",
        "tableNo": "Stol № {n}"
      }
    },
    "common": {
      "imageCrop": {
        "title": "Rasmni kesish va o'zgartirish",
        "cancel": "Bekor qilish",
        "processing": "Tayyorlanmoqda...",
        "confirm": "Tasdiqlash"
      }
    }
  }`),
  en: JSON.parse(`{
    "admin": {
      "artists": {
        "heading": "ARTISTS",
        "add": "Add",
        "editTitle": "Edit artist",
        "newTitle": "New artist",
        "namePh": "Artist name",
        "timePh": "Performance time (e.g. 20:00 - 21:00)",
        "descPh": "Description",
        "save": "Save",
        "updated": "Artist updated!",
        "added": "Artist added!",
        "deleted": "Artist deleted!"
      },
      "banners": {
        "coupleLabel": "Bride & groom",
        "weddingDate": "Wedding date",
        "heading": "BANNERS",
        "subtitle": "Images your guests will see",
        "add": "Add",
        "editTitle": "Edit banner",
        "newTitle": "New banner",
        "titleLabel": "Banner title (optional)",
        "titlePh": "e.g. Wedding day",
        "imageLabel": "Image",
        "crop": "Crop",
        "replace": "Replace",
        "upload": "Upload image",
        "uploading": "Uploading...",
        "formatHint": "JPG, PNG — 16:7 format recommended",
        "saveEdit": "Edit",
        "saveNew": "Add",
        "updated": "Banner updated!",
        "added": "Banner added!",
        "deleted": "Banner deleted!",
        "emptyTitle": "No banners yet",
        "emptyDesc": "Click the «Add» button to add a new banner",
        "imgUploaded": "Image uploaded!",
        "imgError": "Image upload error"
      },
      "timeline": {
        "heading": "WEDDING PROGRAM",
        "presetBtn": "Sample program",
        "add": "Add",
        "editTitle": "Edit",
        "newTitle": "New event",
        "titlePh": "Event name",
        "startLabel": "Start",
        "endLabel": "End (optional)",
        "emojiPh": "Emoji (e.g. 🍽️)",
        "descPh": "Additional info",
        "save": "Save",
        "titleTimeRequired": "Name and time are required",
        "updated": "Updated!",
        "added": "Added!",
        "presetAdded": "Sample program added!",
        "loading": "Loading...",
        "empty": "No events added yet.",
        "presets": {
          "greet": "Welcome guests",
          "coupleEntry": "Bride & groom entrance",
          "firstDance": "First dance",
          "dinner": "Dinner",
          "cake": "Cake ceremony",
          "entertainment": "Entertainment",
          "closing": "Closing"
        }
      },
      "couple": {
        "heading": "Bride & groom",
        "brideNameLabel": "Bride name",
        "groomNameLabel": "Groom name",
        "bridePhotoLabel": "Bride photo",
        "groomPhotoLabel": "Groom photo",
        "weddingDateLabel": "Wedding date",
        "loveStoryLabel": "Love story",
        "loveStoryPh": "Your love story...",
        "save": "Save",
        "saving": "Saving...",
        "saved": "Bride & groom details saved!",
        "imgUploaded": "Image uploaded!",
        "imgError": "Image upload error",
        "uploading": "Uploading...",
        "upload": "Upload image"
      },
      "moments": {
        "tabPhotos": "Photos",
        "tabRsvp": "RSVP",
        "photosEmpty": "Guests haven't uploaded photos yet.",
        "anonGuest": "Anonymous guest",
        "guestFallback": "Guest",
        "hide": "Hide",
        "show": "Show",
        "deleted": "Photo deleted",
        "confirmDelete": "Confirm deletion?",
        "sumAttending": "Attending",
        "sumNotAttending": "Not attending",
        "sumTotalGuests": "Total guests",
        "sumTotalReplies": "Total replies",
        "byTables": "By tables",
        "rsvpEmpty": "No replies yet.",
        "yes": "Yes",
        "no": "No",
        "guestsUnit": "guests",
        "tableNo": "Table № {n}"
      }
    },
    "common": {
      "imageCrop": {
        "title": "Crop & adjust image",
        "cancel": "Cancel",
        "processing": "Processing...",
        "confirm": "Confirm"
      }
    }
  }`),
  ru: JSON.parse(`{
    "admin": {
      "artists": {
        "heading": "АРТИСТЫ",
        "add": "Добавить",
        "editTitle": "Изменить артиста",
        "newTitle": "Новый артист",
        "namePh": "Имя артиста",
        "timePh": "Время выступления (напр. 20:00 - 21:00)",
        "descPh": "Описание",
        "save": "Сохранить",
        "updated": "Артист обновлён!",
        "added": "Артист добавлен!",
        "deleted": "Артист удалён!"
      },
      "banners": {
        "coupleLabel": "Невеста и жених",
        "weddingDate": "Дата свадьбы",
        "heading": "БАННЕРЫ",
        "subtitle": "Изображения, которые увидят гости",
        "add": "Добавить",
        "editTitle": "Изменить баннер",
        "newTitle": "Новый баннер",
        "titleLabel": "Название баннера (необязательно)",
        "titlePh": "Например: День свадьбы",
        "imageLabel": "Изображение",
        "crop": "Обрезать",
        "replace": "Заменить",
        "upload": "Загрузить изображение",
        "uploading": "Загрузка...",
        "formatHint": "JPG, PNG — рекомендуется 16:7",
        "saveEdit": "Изменить",
        "saveNew": "Добавить",
        "updated": "Баннер обновлён!",
        "added": "Баннер добавлен!",
        "deleted": "Баннер удалён!",
        "emptyTitle": "Пока нет баннеров",
        "emptyDesc": "Нажмите кнопку «Добавить», чтобы добавить новый баннер",
        "imgUploaded": "Изображение загружено!",
        "imgError": "Ошибка загрузки изображения"
      },
      "timeline": {
        "heading": "ПРОГРАММА СВАДЬБЫ",
        "presetBtn": "Пример программы",
        "add": "Добавить",
        "editTitle": "Изменить",
        "newTitle": "Новое событие",
        "titlePh": "Название события",
        "startLabel": "Начало",
        "endLabel": "Конец (необязательно)",
        "emojiPh": "Эмодзи (напр. 🍽️)",
        "descPh": "Дополнительная информация",
        "save": "Сохранить",
        "titleTimeRequired": "Нужны название и время",
        "updated": "Обновлено!",
        "added": "Добавлено!",
        "presetAdded": "Пример программы добавлен!",
        "loading": "Загрузка...",
        "empty": "Пока не добавлено ни одного события.",
        "presets": {
          "greet": "Встреча гостей",
          "coupleEntry": "Выход невесты и жениха",
          "firstDance": "Первый танец",
          "dinner": "Ужин",
          "cake": "Церемония торта",
          "entertainment": "Развлечения",
          "closing": "Завершение"
        }
      },
      "couple": {
        "heading": "Невеста и жених",
        "brideNameLabel": "Имя невесты",
        "groomNameLabel": "Имя жениха",
        "bridePhotoLabel": "Фото невесты",
        "groomPhotoLabel": "Фото жениха",
        "weddingDateLabel": "Дата свадьбы",
        "loveStoryLabel": "История любви",
        "loveStoryPh": "Ваша история любви...",
        "save": "Сохранить",
        "saving": "Сохранение...",
        "saved": "Данные невесты и жениха сохранены!",
        "imgUploaded": "Изображение загружено!",
        "imgError": "Ошибка загрузки изображения",
        "uploading": "Загрузка...",
        "upload": "Загрузить изображение"
      },
      "moments": {
        "tabPhotos": "Фото",
        "tabRsvp": "RSVP",
        "photosEmpty": "Гости ещё не загрузили фото.",
        "anonGuest": "Анонимный гость",
        "guestFallback": "Гость",
        "hide": "Скрыть",
        "show": "Показать",
        "deleted": "Фото удалено",
        "confirmDelete": "Подтвердить удаление?",
        "sumAttending": "Придёт",
        "sumNotAttending": "Не сможет",
        "sumTotalGuests": "Всего гостей",
        "sumTotalReplies": "Всего ответов",
        "byTables": "По столам",
        "rsvpEmpty": "Пока нет ответов.",
        "yes": "Да",
        "no": "Нет",
        "guestsUnit": "чел.",
        "tableNo": "Стол № {n}"
      }
    },
    "common": {
      "imageCrop": {
        "title": "Обрезать и изменить изображение",
        "cancel": "Отмена",
        "processing": "Обработка...",
        "confirm": "Подтвердить"
      }
    }
  }`),
  kaa: JSON.parse(`{
    "admin": {
      "artists": {
        "heading": "ARTISTLER",
        "add": "Qosıw",
        "editTitle": "Artist o'zgertiw",
        "newTitle": "Jańa artist qosıw",
        "namePh": "Artist atı",
        "timePh": "Oynaw waqtı (msl: 20:00 - 21:00)",
        "descPh": "Táriyipleme",
        "save": "Saqlaw",
        "updated": "Artist jańalandı!",
        "added": "Artist qosıldı!",
        "deleted": "Artist oshirildi!"
      },
      "banners": {
        "coupleLabel": "Kelin ha'm kuyew",
        "weddingDate": "Toy kúni",
        "heading": "BANNERLER",
        "subtitle": "Mehmonlar kóretug'ın suwretler",
        "add": "Qosıw",
        "editTitle": "Bannerdı o'zgertiw",
        "newTitle": "Jańa banner qosıw",
        "titleLabel": "Banner atı (ıqtıyarıy)",
        "titlePh": "Mısalı: Toy kuni",
        "imageLabel": "Suwret",
        "crop": "Qırqıw",
        "replace": "Almastırıw",
        "upload": "Suwret júklew",
        "uploading": "Júkleniwde...",
        "formatHint": "JPG, PNG — 16:7 formatı usınıladı",
        "saveEdit": "O'zgertiw",
        "saveNew": "Qosıw",
        "updated": "Banner jańalandı!",
        "added": "Banner qosıldı!",
        "deleted": "Banner oshirildi!",
        "emptyTitle": "Házirshe bannerler joq",
        "emptyDesc": "Jańa banner qosıw ushın «Qosıw» tuymesin basıń",
        "imgUploaded": "Suwret júklendi!",
        "imgError": "Suwret júklewde qátelik"
      },
      "timeline": {
        "heading": "TOY BAǴDARLAMASI",
        "presetBtn": "Úlgi baǵdarlama",
        "add": "Qosıw",
        "editTitle": "Ózgertiw",
        "newTitle": "Jańa ilaj",
        "titlePh": "Ilaj atı",
        "startLabel": "Baslanıwı",
        "endLabel": "Juwmaǵı (erkin)",
        "emojiPh": "Emoji (mısalı 🍽️)",
        "descPh": "Qosımsha maǵlıwmat",
        "save": "Saqlaw",
        "titleTimeRequired": "Atı hám waqtı kerek",
        "updated": "Jańalandı!",
        "added": "Qosıldı!",
        "presetAdded": "Úlgi baǵdarlama qosıldı!",
        "loading": "Júklenbekte...",
        "empty": "Hesh qanday ilaj qosılmaǵan.",
        "presets": {
          "greet": "Mıymanlardı kútip alıw",
          "coupleEntry": "Kelin-kúyew kirisi",
          "firstDance": "Birinshi biy",
          "dinner": "Kesheki as",
          "cake": "Tort máresimi",
          "entertainment": "Kóńil ashar",
          "closing": "Juwmaqlanıw"
        }
      },
      "couple": {
        "heading": "Kelin ha'm kuyew",
        "brideNameLabel": "Kelin atı",
        "groomNameLabel": "Kuyew atı",
        "bridePhotoLabel": "Kelin suwreti",
        "groomPhotoLabel": "Kuyew suwreti",
        "weddingDateLabel": "Toy kúni",
        "loveStoryLabel": "Gáp-hikáyat",
        "loveStoryPh": "Sizdiń muhabbat hikáyańız...",
        "save": "Saqlaw",
        "saving": "Saqlanıwda...",
        "saved": "Kelin-kuyew mag'lıwmatları saqlandı!",
        "imgUploaded": "Suwret júklendi!",
        "imgError": "Suwret júklenwde qátelik!",
        "uploading": "Júkleniwde...",
        "upload": "Suwret júklew"
      },
      "moments": {
        "tabPhotos": "Súwretler",
        "tabRsvp": "RSVP",
        "photosEmpty": "Álle házirge shekem mehmanlar súwret júklemegen.",
        "anonGuest": "Anonim mehmon",
        "guestFallback": "Mehmon",
        "hide": "Jasırıw",
        "show": "Kórsetiw",
        "deleted": "Súwret óshirildi",
        "confirmDelete": "Óshiriwdi tastıyıqlaysızba?",
        "sumAttending": "Qatnasadı",
        "sumNotAttending": "Qatnasa almaydı",
        "sumTotalGuests": "Jámi mehman",
        "sumTotalReplies": "Jámi juwap",
        "byTables": "Stollar boyınsha",
        "rsvpEmpty": "Házirshe juwaplar joq.",
        "yes": "Iá",
        "no": "Joq",
        "guestsUnit": "mehman",
        "tableNo": "Stol № {n}"
      }
    },
    "common": {
      "imageCrop": {
        "title": "Suwretti qırqıw ha'm ózgertiw",
        "cancel": "Biykar etiw",
        "processing": "Tayarlanıwda...",
        "confirm": "Tastıyıqlaw"
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

  const checks = [
    "admin.artists.heading",
    "admin.banners.saveNew",
    "admin.timeline.presets.closing",
    "admin.couple.saved",
    "admin.moments.tableNo",
    "common.imageCrop.confirm",
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
  console.log(`OK ${loc}: ${report[loc]} keys`);
}
console.log("KEY PARITY:", Object.values(report).every((v) => v === report.uz) ? "OK (all equal)" : report);
