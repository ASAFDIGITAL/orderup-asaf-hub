# הוראות בניית אפליקציית Android - ASAF POS

## שלב 1: העברת הפרויקט ל-GitHub
1. לחץ על כפתור "Export to GitHub" בעורך Lovable
2. חבר את חשבון ה-GitHub שלך
3. צור repository חדש
4. העתק את הפרויקט למחשב שלך:
```bash
git clone [URL של הרפוזיטורי שלך]
cd [שם התיקייה]
```

## שלב 2: התקנת תלויות
```bash
npm install
```

## שלב 3: הוספת פלטפורמת Android
```bash
npx cap add android
```

## שלב 4: בניית הפרויקט
```bash
npm run build
```

## שלב 5: סנכרון עם Android
```bash
npx cap sync android
```

## שלב 6: פתיחה ב-Android Studio
```bash
npx cap open android
```

## שלב 7: בניית APK
1. ב-Android Studio, לך ל: **Build > Build Bundle(s) / APK(s) > Build APK(s)**
2. המתן לסיום הבנייה
3. קובץ ה-APK יהיה ב: `android/app/build/outputs/apk/debug/app-debug.apk`

## שלב 8: התקנה על המכשיר
העבר את קובץ ה-APK למכשיר וחבר להתקנה.

---

## הרצה על אמולטור או מכשיר מחובר
במקום שלבים 6-7, אפשר להריץ ישירות:
```bash
npx cap run android
```

---

## הערות חשובות למדפסת הטרמית

### הרשאות Bluetooth
האפליקציה כבר מוגדרת עם ההרשאות הנדרשות:
- BLUETOOTH
- BLUETOOTH_ADMIN
- BLUETOOTH_CONNECT
- BLUETOOTH_SCAN
- ACCESS_FINE_LOCATION (נדרש עבור סריקת Bluetooth ב-Android)

### התחברות למדפסת
1. פתח את האפליקציה
2. לחץ על כפתור ה-Bluetooth בפינה העליונה
3. בחר את המדפסת Q2P מהרשימה
4. לאחר ההתחברות, ניתן להדפיס קבלות ישירות מההזמנות

### מפרט טכני של המדפסת שלך
- **דגם**: Q2P
- **Bluetooth**: 4.0
- **גודל נייר**: 58mm × 35mm
- **מערכת הפעלה**: Android 8.1
- **תקשורת**: 3G, WiFi, Bluetooth

### פורמט הדפסה
הקבלות מודפסות בפורמט ESC/POS תקני:
- כותרת עם שם העסק
- פרטי לקוח (שם, טלפון)
- פריטים עם כמויות ומחירים
- סיכום תשלום
- תאריך ושעה

---

## פתרון בעיות נפוצות

### בעיות Bluetooth
- ודא שה-Bluetooth מופעל במכשיר
- ודא שהמדפסת דלוקה וסוללה טעונה
- אם ההתחברות נכשלת, נסה לכבות ולהדליק את המדפסת
- במכשירי Android 12+, ודא שניתנו כל הרשאות Bluetooth

### בעיות בנייה
- ודא ש-Android Studio מותקן
- ודא ש-Java JDK 11 או גבוה יותר מותקן
- הרץ `npx cap sync android` לאחר כל שינוי בקוד

### עדכון קוד
לאחר עדכון קוד ב-GitHub:
```bash
git pull
npm install
npm run build
npx cap sync android
```

---

## קישורים שימושיים
- [תיעוד Capacitor](https://capacitorjs.com/docs)
- [תיעוד Bluetooth LE Plugin](https://github.com/capacitor-community/bluetooth-le)
- [בלוג Lovable - Capacitor](https://docs.lovable.dev)
