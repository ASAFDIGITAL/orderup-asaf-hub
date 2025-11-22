import { CapacitorThermalPrinter } from 'capacitor-thermal-printer';
import { Order } from '@/types/order';
import { RestaurantSettings, defaultRestaurantSettings } from '@/types/restaurant';

// פקודות ESC/POS למדפסות תרמיות
const ESC = '\x1B';
const GS = '\x1D';

class ThermalPrinterService {
  private deviceAddress: string | null = null;

  /**
   * אתחול - ניסיון להתחבר למדפסת שמורה
   */
  async initialize(): Promise<void> {
    console.log('Thermal printer ready');
    
    // ניסיון לטעון מדפסת שמורה
    const savedAddress = localStorage.getItem('saved_printer_address');
    if (savedAddress) {
      try {
        console.log('מנסה להתחבר למדפסת שמורה:', savedAddress);
        await this.connectToPrinter(savedAddress);
      } catch (error) {
        console.log('לא הצלחתי להתחבר למדפסת שמורה:', error);
        // לא זורקים שגיאה - פשוט ממשיכים בלי מדפסת
      }
    }
  }

  /**
   * חיפוש מדפסות זמינות
   */
  async scanForPrinters(): Promise<any[]> {
    try {
      return new Promise(async (resolve, reject) => {
        const discoveredDevices: any[] = [];
        
        // הוסף listener לפני שמתחילים את הסריקה
        const listenerHandle = await CapacitorThermalPrinter.addListener('discoverDevices', (devices) => {
          console.log('🔍 מכשירים שנמצאו:', devices);
          if (devices && devices.devices) {
            discoveredDevices.push(...devices.devices);
            console.log('✅ סה"כ מכשירים:', discoveredDevices.length);
          }
        });
        
        console.log('📡 Listener נוסף בהצלחה');

        // המתן רגע לוודא שה-listener מוכן
        setTimeout(() => {
          // התחל סריקה
          CapacitorThermalPrinter.startScan()
            .then(() => {
              console.log('🔎 סריקה החלה...');
              
              // חכה 8 שניות ואז עצור את הסריקה
              setTimeout(async () => {
                try {
                  await CapacitorThermalPrinter.stopScan();
                  console.log('⏹️ סריקה הופסקה');
                  
                  // הסר את ה-listener
                  await listenerHandle.remove();
                  
                  if (discoveredDevices.length === 0) {
                    reject(new Error('לא נמצאו מדפסות Bluetooth. נסה לחבר ידנית לפי כתובת MAC.'));
                    return;
                  }

                  resolve(discoveredDevices);
                } catch (stopError) {
                  console.error('שגיאה בעצירת סריקה:', stopError);
                  await listenerHandle.remove();
                  resolve(discoveredDevices); // החזר את מה שנמצא גם אם יש שגיאה בעצירה
                }
              }, 8000);
            })
            .catch(async (error) => {
              console.error('❌ שגיאה בסריקה:', error);
              await listenerHandle.remove();
              reject(error);
            });
        }, 300);
      });
    } catch (error) {
      console.error('Failed to scan for printers:', error);
      throw error;
    }
  }

  /**
   * התחברות למדפסת לפי כתובת
   */
  async connectToPrinter(address: string): Promise<void> {
    try {
      const result = await CapacitorThermalPrinter.connect({ address });
      
      if (result && result.address) {
        this.deviceAddress = result.address;
        // שמירת כתובת המדפסת ב-localStorage
        localStorage.setItem('saved_printer_address', result.address);
        console.log('התחבר למדפסת:', result.name, result.address);
      } else {
        throw new Error('כישלון בהתחברות למדפסת');
      }
    } catch (error) {
      console.error('Failed to connect to printer:', error);
      throw error;
    }
  }

  /**
   * ניתוק מהמדפסת
   */
  async disconnect(): Promise<void> {
    if (this.deviceAddress) {
      try {
        await CapacitorThermalPrinter.disconnect();
        this.deviceAddress = null;
        // מחיקת כתובת המדפסת מ-localStorage
        localStorage.removeItem('saved_printer_address');
        console.log('מנותק מהמדפסת');
      } catch (error) {
        console.error('Failed to disconnect:', error);
      }
    }
  }

  /**
   * קבלת הגדרות מסעדה
   */
  private getRestaurantSettings(): RestaurantSettings {
    try {
      const stored = localStorage.getItem('restaurant_settings');
      if (stored) {
        return { ...defaultRestaurantSettings, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Failed to get restaurant settings:', error);
    }
    return defaultRestaurantSettings;
  }

  /**
   * שמירת הגדרות מסעדה
   */
  saveRestaurantSettings(settings: RestaurantSettings): void {
    try {
      localStorage.setItem('restaurant_settings', JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save restaurant settings:', error);
    }
  }

  /**
   * זיהוי שפה (עברית או ערבית)
   */
  private detectLanguage(text: string): 'he' | 'ar' | 'mixed' {
    const hasHebrew = /[\u0590-\u05FF]/.test(text);
    const hasArabic = /[\u0600-\u06FF]/.test(text);
    
    if (hasHebrew && !hasArabic) return 'he';
    if (hasArabic && !hasHebrew) return 'ar';
    return 'mixed';
  }

  /**
   * פורמט טקסט למדפסת תרמית
   * תמיכה מלאה ב-RTL (Right-to-Left) לעברית וערבית
   */
  private formatReceiptText(order: Order): string {
    const settings = this.getRestaurantSettings();
    const orderLang = this.detectLanguage(order.customer_name);
    let lines: string[] = [];
    
    // לוגו (אם קיים - נשאיר מקום)
    if (settings.logoUrl) {
      lines.push('');
      lines.push('[LOGO]');
      lines.push('');
    }
    
    // שם מסעדה
    if (orderLang === 'ar' && settings.nameAr) {
      lines.push('====================');
      lines.push(settings.nameAr);
      lines.push('====================');
    } else {
      lines.push('====================');
      lines.push(settings.name);
      lines.push('====================');
    }
    
    // פרטי מסעדה
    if (settings.address || settings.phone) {
      lines.push('');
      if (settings.address) lines.push(settings.address);
      if (settings.phone) lines.push(settings.phone);
    }
    
    lines.push('');
    
    // מספר הזמנה
    const orderLabel = orderLang === 'ar' ? 'طلب رقم' : 'הזמנה';
    lines.push('--------------------');
    lines.push(`${orderLabel} #${order.id}`);
    lines.push('--------------------');
    lines.push('');
    
    // פרטי לקוח
    const customerLabel = orderLang === 'ar' ? 'العميل' : 'לקוח';
    const phoneLabel = orderLang === 'ar' ? 'الهاتف' : 'טלפון';
    const addressLabel = orderLang === 'ar' ? 'العنوان' : 'כתובת';
    
    lines.push(`${customerLabel}: ${order.customer_name}`);
    if (order.customer_phone) {
      lines.push(`${phoneLabel}: ${order.customer_phone}`);
    }
    if (order.customer_address) {
      lines.push(`${addressLabel}: ${order.customer_address}`);
    }
    lines.push('');
    
    // פרטי הזמנה
    const itemsLabel = orderLang === 'ar' ? 'العناصر' : 'פריטים';
    lines.push('--------------------');
    lines.push(`${itemsLabel}:`);
    lines.push('--------------------');
    
    // פריטים
    order.items.forEach((item) => {
      lines.push(`${item.qty}x ${item.name}`);
      
      // אפשרויות
      if (item.options?.choices && item.options.choices.length > 0) {
        item.options.choices.forEach((choice) => {
          lines.push(`  ${choice.group}:`);
          choice.items.forEach((subItem) => {
            lines.push(`    + ${subItem.name}`);
          });
        });
      }
      
      // הערה
      if (item.options?.note) {
        lines.push(`  הערה: ${item.options.note}`);
      }
      
      lines.push(`  ${item.total} ש"ח`);
      lines.push('');
    });
    
    // סיכום
    const subtotalLabel = orderLang === 'ar' ? 'المجموع الفرعي' : 'סכום ביניים';
    const deliveryLabel = orderLang === 'ar' ? 'توصيل' : 'דמי משלוח';
    const totalLabel = orderLang === 'ar' ? 'الإجمالي' : 'סה"כ';
    
    lines.push('--------------------');
    lines.push(`${subtotalLabel}: ${order.subtotal} ₪`);
    if (order.delivery_fee > 0) {
      lines.push(`${deliveryLabel}: ${order.delivery_fee} ₪`);
    }
    lines.push(`${totalLabel}: ${order.total} ₪`);
    lines.push('--------------------');
    lines.push('');
    
    // הערות
    if (order.notes) {
      const notesLabel = orderLang === 'ar' ? 'ملاحظات' : 'הערות';
      lines.push(`${notesLabel}:`);
      lines.push(order.notes);
      lines.push('');
    }
    
    // תשלום
    if (order.payment_method) {
      const paymentLabel = orderLang === 'ar' ? 'طريقة الدفع' : 'אמצעי תשלום';
      const paymentText = order.payment_method === 'cash' 
        ? (orderLang === 'ar' ? 'نقداً' : 'מזומן')
        : (orderLang === 'ar' ? 'بطاقة' : 'כרטיס אשראי');
      lines.push(`${paymentLabel}: ${paymentText}`);
    }
    
    // משלוח
    if (order.shipping_method) {
      const shippingLabel = orderLang === 'ar' ? 'طريقة التوصيل' : 'אופן משלוח';
      const shippingText = order.shipping_method === 'delivery'
        ? (orderLang === 'ar' ? 'توصيل' : 'משלוח')
        : (orderLang === 'ar' ? 'استلام ذاتي' : 'איסוף עצמי');
      lines.push(`${shippingLabel}: ${shippingText}`);
    }
    
    // כותרת תחתונה מותאמת אישית
    lines.push('');
    const footer = orderLang === 'ar' && settings.footerAr 
      ? settings.footerAr 
      : settings.footer || 'תודה רבה!';
    lines.push(footer);
    lines.push('');
    lines.push('');
    
    return lines.join('\n');
  }

  /**
   * הדפסת קבלה
   */
  async printReceipt(order: Order): Promise<void> {
    if (!this.deviceAddress) {
      throw new Error('לא מחובר למדפסת. יש להתחבר תחילה.');
    }

    try {
      const receiptText = this.formatReceiptText(order);
      
      await CapacitorThermalPrinter.begin()
        .align('right')
        .text(receiptText)
        .text('\n\n')
        .cutPaper()
        .write();
        
      console.log('✅ קבלה הודפסה בהצלחה - הזמנה #' + order.id);
    } catch (error) {
      console.error('Failed to print receipt:', error);
      throw error;
    }
  }

  /**
   * סימון הזמנה כמודפסת
   */
  private markOrderAsPrinted(orderId: number): void {
    try {
      const printed = this.getPrintedOrders();
      printed.add(orderId);
      localStorage.setItem('printed_orders', JSON.stringify([...printed]));
    } catch (error) {
      console.error('Failed to mark order as printed:', error);
    }
  }

  /**
   * בדיקה אם הזמנה כבר הודפסה
   */
  isOrderPrinted(orderId: number): boolean {
    const printed = this.getPrintedOrders();
    return printed.has(orderId);
  }

  /**
   * קבלת רשימת הזמנות שהודפסו
   */
  private getPrintedOrders(): Set<number> {
    try {
      const stored = localStorage.getItem('printed_orders');
      if (stored) {
        return new Set(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to get printed orders:', error);
    }
    return new Set();
  }

  /**
   * ניקוי רשימת הזמנות מודפסות (למשל, פעם ביום)
   */
  clearPrintedOrders(): void {
    localStorage.removeItem('printed_orders');
  }

  /**
   * בדיקה האם מחובר למדפסת
   */
  isConnected(): boolean {
    return this.deviceAddress !== null;
  }

  /**
   * קבלת כתובת המדפסת המחוברת
   */
  getPrinterAddress(): string | null {
    return this.deviceAddress;
  }
}

export const thermalPrinter = new ThermalPrinterService();
