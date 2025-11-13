# 📱 ASAF POS - אפליקציית ניהול הזמנות

אפליקציית Android native לניהול הזמנות עם תמיכה מלאה במדפסת תרמית Q2P.

## 🎯 תכונות עיקריות

✅ **ניהול הזמנות בזמן אמת** - צפייה בהזמנות חדשות ועדכון סטטוס  
✅ **הדפסה תרמית** - התחברות Bluetooth למדפסת Q2P והדפסת קבלות  
✅ **ממשק עברי RTL** - ממשק מותאם לעברית ולערבית  
✅ **חיפוש וסינון** - מערכת חיפוש מתקדמת להזמנות  
✅ **התראות קוליות** - התראה על הזמנות חדשות  
✅ **הדפסה אוטומטית** - אפשרות להדפסה אוטומטית של הזמנות חדשות  

---

## 🚀 התקנה מהירה

### 1. העברה ל-GitHub
לחץ על **Export to GitHub** בעורך Lovable

### 2. שיבוט הפרויקט
```bash
git clone [כתובת-הרפוזיטורי]
cd [שם-התיקייה]
npm install
```

### 3. הוספת Android
```bash
npx cap add android
```

### 4. בנייה
```bash
npm run build
npx cap sync android
```

### 5. פתיחה ב-Android Studio
```bash
npx cap open android
```

### 6. בניית APK
**Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**

📱 הקובץ יהיה ב: `android/app/build/outputs/apk/debug/app-debug.apk`

---

## 🖨️ הגדרת מדפסת Q2P

1. **הדלק את המדפסת**
2. **באפליקציה**: לחץ על כפתור Bluetooth 📶
3. **בחר** את המדפסת Q2P מהרשימה
4. **הדפס** קבלה מכל הזמנה!

### מפרט המדפסת
- Bluetooth 4.0
- נייר 58mm
- Android 8.1
- סוללה 5000mAh

---

## 📖 תיעוד מלא

קרא את [BUILD-ANDROID.md](./BUILD-ANDROID.md) למדריך מפורט עם:
- הוראות בנייה שלב אחר שלב
- פתרון בעיות נפוצות
- טיפים למדפסת
- עדכון האפליקציה

---

## 🛠️ טכנולוגיות

- **React** + **TypeScript**
- **Vite** - כלי בנייה מהיר
- **Tailwind CSS** - עיצוב
- **Capacitor** - פלטפורמת Native
- **Bluetooth LE** - חיבור למדפסת
- **Shadcn UI** - רכיבי ממשק

---

## 📞 עזרה ותמיכה

- 📚 [תיעוד Capacitor](https://capacitorjs.com/docs)
- 🔌 [Bluetooth Plugin](https://github.com/capacitor-community/bluetooth-le)
- 💬 [קהילת Lovable](https://discord.gg/lovable)

---

## 📄 רישיון

© 2024 ASAF - כל הזכויות שמורות

---

**מוכן לעבוד! 🎉**  
האפליקציה שלך מוכנה להתקנה על מכשיר Android ולהתחבר למדפסת התרמית.
