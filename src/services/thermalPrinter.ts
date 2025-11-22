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
   * היפוך טקסט עברי בלבד
   */
  private reverseText(text: string): string {
    return Array.from(text).reverse().join('');
  }

  /**
   * פורמט טקסט למדפסת תרמית
   * קבלה בעברית עם תמיכה בתוכן בערבית
   */
  formatReceiptText(order: Order): string {
    const settings = this.getRestaurantSettings();
    let lines: string[] = [];
    const LTR = "\u200E"; // סימן כיוון טקסט משמאל לימין (לא מודפס)
    
    // כותרת ותאריך
    lines.push(this.reverseText(`קבלה / הזמנה #${LTR}${order.id}${LTR}`));
    const orderDate = new Date(order.created_at);
    const formattedDate = `${orderDate.getDate().toString().padStart(2, '0')}/${(orderDate.getMonth() + 1).toString().padStart(2, '0')}/${orderDate.getFullYear()} ${orderDate.getHours().toString().padStart(2, '0')}:${orderDate.getMinutes().toString().padStart(2, '0')}`;
    lines.push(`${LTR}${formattedDate}${LTR}`);
    
    // קו מפריד
    lines.push('-----------------------------');
    
    // פרטי לקוח
    lines.push(`לקוח: ${order.customer_name}`);
    lines.push(`${LTR}${this.reverseText('טלפון')}: ${order.customer_phone}${LTR}`);
    if (order.customer_address) {
      lines.push(`כתובת: ${order.customer_address}`);
    }
    
    // קו מפריד
    lines.push('-----------------------------');
    
    // כותרת פריטים
    lines.push(this.reverseText('פריטים'));
    
    // קו מפריד
    lines.push('-----------------------------');
    
    // פריטים
    order.items.forEach((item, index) => {
      lines.push(`${item.name} × ${LTR}${item.qty}${LTR}`);
      lines.push(`${LTR}${Number(item.total).toFixed(2)} ₪${LTR}`);
      
      // אפשרויות
      if (item.options && Array.isArray(item.options) && item.options.length > 0) {
        item.options.forEach((opt: any) => {
          if (opt?.choices && Array.isArray(opt.choices)) {
            opt.choices.forEach((choice: any) => {
              const choiceItems = choice.items.map((i: any) => i.name).join(', ');
              if (choiceItems) {
                lines.push(`  ${choice.group}: ${choiceItems}`);
              }
            });
          }
          if (opt?.note) {
            lines.push(`  הערה: ${opt.note}`);
          }
        });
      } else if (item.options && !Array.isArray(item.options)) {
        const opt = item.options as any;
        if (opt.choices && Array.isArray(opt.choices)) {
          opt.choices.forEach((choice: any) => {
            const choiceItems = choice.items.map((i: any) => i.name).join(', ');
            if (choiceItems) {
              lines.push(`  ${choice.group}: ${choiceItems}`);
            }
          });
        }
        if (opt.note) {
          lines.push(`  הערה: ${opt.note}`);
        }
      }
      
      // קו מפריד בין פריטים
      if (index < order.items.length - 1) {
        lines.push('-----------------------------');
      }
    });
    
    // קו מפריד לפני סיכום
    lines.push('-----------------------------');
    
    // סיכום
    lines.push(`${this.reverseText('ביניים')} ${LTR}${Number(order.subtotal).toFixed(2)} ₪${LTR}`);
    lines.push(`${this.reverseText('משלוח')} ${LTR}${Number(order.delivery_fee).toFixed(2)} ₪${LTR}`);
    lines.push(`${this.reverseText('סה"כ')} ${LTR}${Number(order.total).toFixed(2)} ₪${LTR}`);
    
    // קו מפריד
    lines.push('-----------------------------');
    
    // הערות
    if (order.notes) {
      lines.push('');
      lines.push(this.reverseText('הערות'));
      lines.push(this.reverseText(order.notes));
    }
    
    // תשלום
    if (order.payment_method === 'card') {
      lines.push('');
      lines.push(this.reverseText('תשלום באשראי: שולם'));
    }
    
    // כותרת תחתונה
    lines.push('');
    if (settings.footer) {
      lines.push(settings.footer);
    } else {
      lines.push(this.reverseText('תודה רבה'));
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
