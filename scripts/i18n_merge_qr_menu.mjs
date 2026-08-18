/* One-off i18n merge: add QR + menu (food) keys to all 4 locales.
   Deep-merges so existing admin.menu.today/archived are preserved. */
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
      "qr": {
        "title": "QR KODLAR",
        "generate": "QR kod yaratish",
        "tableCount": "Stollar soni (1-100)",
        "downloadAll": "Hammasini yuklab olish (ZIP)",
        "table": "Stol",
        "download": "Yuklab olish",
        "downloaded": "QR kodlar yuklandi!"
      },
      "menu": {
        "heading": "BUGUNGI TA'MLAR",
        "add": "Qo'shish",
        "editTitle": "Ta'mni o'zgartirish",
        "newTitle": "Yangi ta'm qo'shish",
        "namePh": "Ta'm nomi",
        "pricePh": "Narxi",
        "descPh": "Tavsif",
        "imgOptional": "Ta'm rasmi (ixtiyoriy)",
        "imgBtn": "Rasm qo'shish",
        "uploading": "Yuklanmoqda...",
        "save": "Saqlash",
        "todayLabel": "Bugungi ta'm",
        "updated": "Ta'm yangilandi!",
        "added": "Ta'm qo'shildi!",
        "deleted": "Ta'm o'chirildi!",
        "imgUploaded": "Rasm yuklandi!",
        "imgError": "Rasm yuklash xatosi",
        "currency": "so'm"
      }
    }
  }`),
  en: JSON.parse(`{
    "admin": {
      "qr": {
        "title": "QR CODES",
        "generate": "Generate QR",
        "tableCount": "Number of tables (1-100)",
        "downloadAll": "Download all (ZIP)",
        "table": "Table",
        "download": "Download",
        "downloaded": "QR codes downloaded!"
      },
      "menu": {
        "heading": "TODAY'S FLAVORS",
        "add": "Add",
        "editTitle": "Edit flavor",
        "newTitle": "New flavor",
        "namePh": "Flavor name",
        "pricePh": "Price",
        "descPh": "Description",
        "imgOptional": "Flavor image (optional)",
        "imgBtn": "Add image",
        "uploading": "Uploading...",
        "save": "Save",
        "todayLabel": "Today's flavor",
        "updated": "Flavor updated!",
        "added": "Flavor added!",
        "deleted": "Flavor deleted!",
        "imgUploaded": "Image uploaded!",
        "imgError": "Image upload error",
        "currency": "UZS"
      }
    }
  }`),
  ru: JSON.parse(`{
    "admin": {
      "qr": {
        "title": "QR-КОДЫ",
        "generate": "Создать QR",
        "tableCount": "Количество столов (1-100)",
        "downloadAll": "Скачать всё (ZIP)",
        "table": "Стол",
        "download": "Скачать",
        "downloaded": "QR-коды загружены!"
      },
      "menu": {
        "heading": "ВКУСЫ НА СЕГОДНЯ",
        "add": "Добавить",
        "editTitle": "Изменить блюдо",
        "newTitle": "Новое блюдо",
        "namePh": "Название блюда",
        "pricePh": "Цена",
        "descPh": "Описание",
        "imgOptional": "Изображение блюда (необязательно)",
        "imgBtn": "Добавить изображение",
        "uploading": "Загрузка...",
        "save": "Сохранить",
        "todayLabel": "Блюдо на сегодня",
        "updated": "Блюдо обновлено!",
        "added": "Блюдо добавлено!",
        "deleted": "Блюдо удалено!",
        "imgUploaded": "Изображение загружено!",
        "imgError": "Ошибка загрузки изображения",
        "currency": "сум"
      }
    }
  }`),
  kaa: JSON.parse(`{
    "admin": {
      "qr": {
        "title": "QR KODLAR",
        "generate": "QR kod jaratıw",
        "tableCount": "Stollar sanı (1-100)",
        "downloadAll": "Hámmesin júklew (ZIP)",
        "table": "Stol",
        "download": "Júklew",
        "downloaded": "QR kodlar júklendi!"
      },
      "menu": {
        "heading": "BÚGINGI TA'MLAR",
        "add": "Qosıw",
        "editTitle": "Ta'm ózgertiw",
        "newTitle": "Jańa ta'm qosıw",
        "namePh": "Ta'm atı",
        "pricePh": "Bahası",
        "descPh": "Táriyipleme",
        "imgOptional": "Ta'm súwreti (ixtiyariy)",
        "imgBtn": "Súwret qosıw",
        "uploading": "Júkleniwde...",
        "save": "Saqlaw",
        "todayLabel": "Búgingi ta'm",
        "updated": "Ta'm jańalandı!",
        "added": "Ta'm qosıldı!",
        "deleted": "Ta'm óshirildi!",
        "imgUploaded": "Súwret júklendi!",
        "imgError": "Súwret júklew qáteligi",
        "currency": "sum"
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
    "admin.qr.title",
    "admin.qr.downloaded",
    "admin.menu.heading",
    "admin.menu.currency",
    "admin.menu.imgUploaded",
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
  console.log(`? ${loc}: ${report[loc]} keys`);
}
console.log("KEY PARITY:", Object.values(report).every((v) => v === report.uz) ? "OK (all equal)" : report);
