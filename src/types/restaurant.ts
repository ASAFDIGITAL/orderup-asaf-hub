export interface RestaurantSettings {
  name: string;
  nameAr?: string;
  address?: string;
  phone?: string;
  logoUrl?: string;
  footer?: string;
  footerAr?: string;
  fontSize?: 'normal' | 'medium' | 'large';
  // הגדרות הדפסה מרוחקת דרך מחשב (Network Printer)
  networkPrintEnabled?: boolean;
  networkPrintUrl?: string; // לדוגמה: https://bait-haof.com/api/print
  networkPrinterName?: string; // שם המדפסת המשותפת ב-Windows
  // הדפסה ישירה מהדפדפן (window.print) - הכי פשוט
  browserPrintEnabled?: boolean;
}

export const defaultRestaurantSettings: RestaurantSettings = {
  name: "ASAF Restaurant",
  nameAr: "مطعم أصف",
  address: "",
  phone: "",
  logoUrl: "",
  footer: "תודה רבה!",
  footerAr: "شكراً جزيلاً!",
  fontSize: 'normal',
  networkPrintEnabled: false,
  networkPrintUrl: "",
  networkPrinterName: "",
  browserPrintEnabled: false
};
