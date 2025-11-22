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
   * פורמט טקסט למדפסת תרמית
   * תמיכה דו-לשונית - עברית וערבית בכל כותרת
   */
  private formatReceiptText(order: Order): string {
    const settings = this.getRestaurantSettings();
    let lines: string[] = [];
    
    // לוגו (אם קיים - נשאיר מקום)
    if (settings.logoUrl) {
      lines.push('');
      lines.push('[LOGO]');
      lines.push('');
    }
    
    // שם מסעדה - דו-לשוני
    lines.push('====================');
    if (settings.nameAr) {
      lines.push(`${settings.name} / ${settings.nameAr}`);
    } else {
      lines.push(settings.name);
    }
    lines.push('====================');
    
    // פרטי מסעדה
    if (settings.address || settings.phone) {
      lines.push('');
      if (settings.address) lines.push(settings.address);
      if (settings.phone) lines.push(settings.phone);
    }
    
    lines.push('');
    
    // מספר הזמנה - דו-לשוני
    lines.push('--------------------');
    lines.push(`הזמנה מספר / طلب رقم #${order.id}`);
    lines.push('--------------------');
    lines.push('');
    
    // פרטי לקוח - דו-לשוני
    lines.push(`שם הלקוח / العميل: ${order.customer_name}`);
    if (order.customer_phone) {
      lines.push(`מספר טלפון / الهاتف: ${order.customer_phone}`);
    }
    if (order.customer_address) {
      lines.push(`כתובת / العنوان: ${order.customer_address}`);
    }
    lines.push('');
    
    // פרטי הזמנה - דו-לשוני
    lines.push('--------------------');
    lines.push('פרטי ההזמנה / تفاصيل الطلب:');
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
    
    // סיכום - דו-לשוני
    lines.push('--------------------');
    lines.push(`סכום ביניים / المجموع الفرعي: ${order.subtotal} ₪`);
    if (order.delivery_fee > 0) {
      lines.push(`משלוח / توصيل: ${order.delivery_fee} ₪`);
    }
    lines.push(`סה"כ / الإجمالي: ${order.total} ₪`);
    lines.push('--------------------');
    lines.push('');
    
    // הערות - דו-לשוני
    if (order.notes) {
      lines.push('הערות / ملاحظات:');
      lines.push(order.notes);
      lines.push('');
    }
    
    // תשלום - דו-לשוני
    if (order.payment_method) {
      const paymentText = order.payment_method === 'cash' 
        ? 'מזומן / نقداً'
        : 'כרטיס אשראי / بطاقة';
      lines.push(`אמצעי תשלום / طريقة الدفع: ${paymentText}`);
    }
    
    // משלוח - דו-לשוני
    if (order.shipping_method) {
      const shippingText = order.shipping_method === 'delivery'
        ? 'משלוח / توصيل'
        : 'איסוף עצמי / استلام ذاتي';
      lines.push(`אופן משלוח / طريقة التوصيל: ${shippingText}`);
    }
    
    // כותרת תחתונה - דו-לשוני
    lines.push('');
    if (settings.footer && settings.footerAr) {
      lines.push(`${settings.footer} / ${settings.footerAr}`);
    } else if (settings.footer) {
      lines.push(settings.footer);
    } else {
      lines.push('תודה רבה! / شكراً جزيلاً!');
    }
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
