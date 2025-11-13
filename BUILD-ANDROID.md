# 📱 בניית אפליקציית Android - ASAF POS

מדריך מלא לבניית האפליקציה למכשיר Android עם תמיכה במדפסת תרמית Q2P.

---

## ✅ דרישות מקדימות

לפני שמתחילים, ודא שמותקנים:
- **Node.js** (גרסה 16 ומעלה) - [הורדה](https://nodejs.org)
- **Git** - [הורדה](https://git-scm.com)
- **Android Studio** - [הורדה](https://developer.android.com/studio)
- **Java JDK 11+** - בדרך כלל מגיע עם Android Studio

---

## 🚀 שלבי הבנייה

### שלב 1️⃣: העברת הפרויקט ל-GitHub

1. **בעורך Lovable:**
   - לחץ על הכפתור **GitHub** בפינה השמאלית העליונה
   - לחץ על **Export to GitHub**
   - אשר את ההתחברות לחשבון GitHub
   - צור repository חדש

2. **במחשב שלך:**
   ```bash
   git clone [כתובת הרפוזיטורי שלך]
   cd [שם התיקייה]
   ```

---

### שלב 2️⃣: התקנת תלויות

```bash
npm install
```

⏱️ זה לוקח 2-3 דקות בממוצע

---

### שלב 3️⃣: הוספת פלטפורמת Android

```bash
npx cap add android
```

זה יוצר תיקיית `android` עם כל הקבצים הנדרשים.

---

### שלב 4️⃣: בניית הפרויקט

```bash
npm run build
```

זה מקמפל את האפליקציה ל-JavaScript מותאם לייצור.

---

### שלב 5️⃣: סנכרון עם Android

```bash
npx cap sync android
```

זה מעתיק את הקבצים שנבנו לפרויקט Android ומעדכן plugins.

---

### שלב 6️⃣: פתיחה ב-Android Studio

```bash
npx cap open android
```

🔧 **ב-Android Studio:**
1. המתן לסיום טעינת הפרויקט (עם סרגל ההתקדמות)
2. אם תתבקש להתקין SDK components נוספים - לחץ **Install**
3. ודא שאין שגיאות ב-Build (תחתית המסך)

---

### שלב 7️⃣: בניית APK

#### אופציה א': בניית APK Debug (מהיר)

**ב-Android Studio:**
1. לך ל: **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
2. המתן לסיום (1-5 דקות)
3. קובץ ה-APK יהיה ב:
   ```
   android/app/build/outputs/apk/debug/app-debug.apk
   ```

#### אופציה ב': בניית APK Release (לייצור)

1. **צור Keystore להחתמה:**
   ```bash
   keytool -genkey -v -keystore asaf-pos.keystore -alias asafpos -keyalg RSA -keysize 2048 -validity 10000
   ```
   שמור היטב את הסיסמה!

2. **צור קובץ `android/key.properties`:**
   ```properties
   storePassword=הסיסמה_שלך
   keyPassword=הסיסמה_שלך
   keyAlias=asafpos
   storeFile=../asaf-pos.keystore
   ```

3. **ערוך `android/app/build.gradle`:**
   הוסף לפני `android {`:
   ```gradle
   def keystoreProperties = new Properties()
   def keystorePropertiesFile = rootProject.file('key.properties')
   if (keystorePropertiesFile.exists()) {
       keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
   }
   ```

   בתוך `android { ... buildTypes { ... } }`:
   ```gradle
   release {
       signingConfig signingConfigs.release
       minifyEnabled false
       proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
   }
   ```

   בתוך `android { ... }`:
   ```gradle
   signingConfigs {
       release {
           keyAlias keystoreProperties['keyAlias']
           keyPassword keystoreProperties['keyPassword']
           storeFile keystoreProperties['storeFile'] ? file(keystoreProperties['storeFile']) : null
           storePassword keystoreProperties['storePassword']
       }
   }
   ```

4. **בנה APK Release:**
   ```bash
   cd android
   ./gradlew assembleRelease
   ```
   
   קובץ ה-APK יהיה ב:
   ```
   android/app/build/outputs/apk/release/app-release.apk
   ```

---

### שלב 8️⃣: התקנה על המכשיר

#### דרך א': העברה ישירה
1. העתק את קובץ ה-APK למכשיר (USB, Bluetooth, Email, WhatsApp)
2. במכשיר, פתח את הקובץ
3. אפשר התקנה ממקורות לא ידועים אם יתבקש
4. לחץ **התקן**

#### דרך ב': דרך Android Studio
1. חבר את המכשיר עם כבל USB
2. אפשר **USB Debugging** במכשיר (הגדרות → אודות הטלפון → לחץ 7 פעמים על "מספר גרסה" → חזור → אפשרויות מפתח → אפשר USB Debugging)
3. ב-Android Studio לחץ על ▶️ **Run**

---

## 🖨️ הגדרת המדפסת התרמית Q2P

### מפרט המדפסת
- **דגם**: Q2P
- **Bluetooth**: 4.0
- **גודל נייר**: 58mm × 35mm (רוחב × קוטר)
- **מערכת הפעלה**: Android 8.1
- **סוללה**: 5000mAh

### התחברות למדפסת

1. **הדלק את המדפסת** והמתן לנורית Bluetooth כחולה מהבהבת
2. **באפליקציה:**
   - לחץ על כפתור ה-Bluetooth 📶 בפינה העליונה
   - המתן לסריקת מכשירים
   - בחר **Q2P** או **PRINTER** מהרשימה
   - המתן להודעת "מחובר בהצלחה"
3. **מעכשיו** כל הזמנה שתודפס תשלח אוטומטית למדפסת

### טיפים למדפסת
- ✅ טען את המדפסת במלואה לפני שימוש ראשון
- ✅ השתמש בנייר תרמי בגודל 58mm בלבד
- ✅ נקה את ראש ההדפסה מדי פעם עם אלכוהול
- ⚠️ אל תחשוף את המדפסת לחום או לחות מוגזמים
- ⚠️ אם ההדפסה מטושטשת, החלף את גליל הנייר

---

## 🔧 פתרון בעיות נפוצות

### 🔴 בעיית: "Bluetooth permission denied"
**פתרון:**
1. הגדרות → אפליקציות → ASAF POS → הרשאות
2. אפשר את כל הרשאות Bluetooth ו-Location

---

### 🔴 בעיית: "המדפסת לא מתחברת"
**פתרון:**
1. ודא שהמדפסת דלוקה וטעונה
2. נסה לכבות ולהדליק את ה-Bluetooth במכשיר
3. מחק זיכרון cache של Bluetooth:
   - הגדרות → אפליקציות → הצג אפליקציות מערכת → Bluetooth → נקה מטמון
4. אתחל את המדפסת (כבה והדלק)
5. נסה להתחבר שוב

---

### 🔴 בעיית: "ההדפסה לא יוצאת/מטושטשת"
**פתרון:**
1. בדוק שיש נייר במדפסת
2. ודא שהנייר מוכנס כהלכה (צד ההדפסה כלפי מטה)
3. נקה את ראש ההדפסה
4. החלף גליל נייר חדש
5. טען את המדפסת (סוללה חלשה = הדפסה חלשה)

---

### 🔴 בעיית: "Build failed in Android Studio"
**פתרון:**
1. **נקה ובנה מחדש:**
   ```bash
   cd android
   ./gradlew clean
   cd ..
   npm run build
   npx cap sync android
   ```

2. **עדכן Gradle:**
   - File → Project Structure → Project
   - עדכן Gradle Version לאחרונה

3. **בדוק Java:**
   ```bash
   java -version
   ```
   צריך להיות Java 11 ומעלה

---

### 🔴 בעיית: "App crashes on startup"
**פתרון:**
1. בדוק Logcat ב-Android Studio
2. ודא שכל ההרשאות בוקשו
3. נסה למחוק ולהתקין מחדש
4. בדוק שיש חיבור אינטרנט (האפליקציה זקוקה לשרת)

---

## 📊 מידע טכני נוסף

### הרשאות הנדרשות
האפליקציה מבקשת את ההרשאות הבאות:
- ✅ **BLUETOOTH** - להתחברות בסיסית
- ✅ **BLUETOOTH_ADMIN** - לניהול חיבורים
- ✅ **BLUETOOTH_CONNECT** - Android 12+ 
- ✅ **BLUETOOTH_SCAN** - Android 12+
- ✅ **ACCESS_FINE_LOCATION** - נדרש לסריקת Bluetooth ב-Android
- ✅ **INTERNET** - לתקשורת עם השרת

### פורמט ההדפסה (ESC/POS)
הקבלות מודפסות בפורמט תעשייתי תקני:
```
================================
        ASAF POS
     shahin-kitchen
================================

הזמנה #66
תאריך: 18/10/2025 09:13

לקוח: محمد شلاعطة
טלפון: 0502311554

--------------------------------
פריטים:
--------------------------------
1x مياة معدنية
   ₪5.00            ₪5.00
--------------------------------

ביניים:           ₪5.00
משלוח:            ₪0.00
--------------------------------
סה"כ:             ₪5.00
================================
אמצעי תשלום: אשראי

תודה רבה!
================================
```

---

## 🔄 עדכון האפליקציה

לאחר עדכון קוד ב-Lovable:

```bash
# משוך עדכונים מ-GitHub
git pull

# התקן תלויות חדשות (אם יש)
npm install

# בנה מחדש
npm run build

# סנכרן ל-Android
npx cap sync android

# בנה APK חדש
cd android
./gradlew assembleDebug  # או assembleRelease
```

---

## 📞 קבלת עזרה

- [תיעוד Capacitor](https://capacitorjs.com/docs)
- [תיעוד Bluetooth LE Plugin](https://github.com/capacitor-community/bluetooth-le)
- [בלוג Lovable](https://docs.lovable.dev/features/capacitor)
- [קהילת Lovable Discord](https://discord.gg/lovable)

---

**בהצלחה! 🎉**

האפליקציה כעת מוכנה לשימוש במכשיר Q2P שלך עם תמיכה מלאה בהדפסה תרמית!
