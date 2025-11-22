import { CapacitorThermalPrinter } from 'capacitor-thermal-printer';
import { Order } from '@/types/order';

// פקודות ESC/POS למדפסות תרמיות
const ESC = '\x1B';
const GS = '\x1D';

class ThermalPrinterService {
  private deviceAddress: string | null = null;

  /**
   * אתחול - לא נדרש עבור plugin זה
   */
  async initialize(): Promise<void> {
    // Plugin זה לא דורש אתחול
    console.log('Thermal printer ready');
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
        console.log('מנותק מהמדפסת');
      } catch (error) {
        console.error('Failed to disconnect:', error);
      }
    }
  }

  /**
   * פורמט טקסט למדפסת תרמית
   * תמיכה מלאה ב-RTL (Right-to-Left) לעברית
   */
  private formatReceiptText(order: Order): string {
    // פונקציה להיפוך רק טקסט עברית (לא ערבית או מספרים)
    const reverseHebrew = (text: string): string => {
      // בדיקה אם יש עברית בטקסט
      const hasHebrew = /[\u0590-\u05FF]/.test(text);
      
      // אם אין עברית, מחזירים כמו שהוא
      if (!hasHebrew) {
        return text;
      }
      
      // אם יש עברית, הופכים רק את התווים העבריים
      return text.split('').reverse().join('');
    };
    
    let lines: string[] = [];
    
    // כותרת
    lines.push('====================');
    lines.push(reverseHebrew(`הזמנה #${order.id}`));
    lines.push('====================');
    lines.push('');
    
    // פרטי לקוח
    lines.push(reverseHebrew(`לקוח: ${order.customer_name}`));
    if (order.customer_phone) {
      lines.push(reverseHebrew(`טלפון: ${order.customer_phone}`));
    }
    if (order.customer_address) {
      lines.push(reverseHebrew(`כתובת: ${order.customer_address}`));
    }
    lines.push('');
    
    // פרטי הזמנה
    lines.push('--------------------');
    lines.push(reverseHebrew('פריטים:'));
    lines.push('--------------------');
    
    // פריטים
    order.items.forEach((item) => {
      lines.push(reverseHebrew(`${item.qty}x ${item.name}`));
      
      // אפשרויות
      if (item.options?.choices && item.options.choices.length > 0) {
        item.options.choices.forEach((choice) => {
          lines.push(reverseHebrew(`  ${choice.group}:`));
          choice.items.forEach((subItem) => {
            lines.push(reverseHebrew(`    + ${subItem.name}`));
          });
        });
      }
      
      // הערה
      if (item.options?.note) {
        lines.push(reverseHebrew(`  הערה: ${item.options.note}`));
      }
      
      lines.push(reverseHebrew(`  ${item.total} ש"ח`));
      lines.push('');
    });
    
    // סיכום
    lines.push('--------------------');
    lines.push(reverseHebrew(`סכום ביניים: ${order.subtotal} ש"ח`));
    if (order.delivery_fee > 0) {
      lines.push(reverseHebrew(`דמי משלוח: ${order.delivery_fee} ש"ח`));
    }
    lines.push(reverseHebrew(`סה"כ: ${order.total} ש"ח`));
    lines.push('--------------------');
    lines.push('');
    
    // הערות
    if (order.notes) {
      lines.push(reverseHebrew('הערות:'));
      lines.push(reverseHebrew(order.notes));
      lines.push('');
    }
    
    // תשלום
    if (order.payment_method) {
      const paymentText = order.payment_method === 'cash' ? 'מזומן' : 'כרטיס אשראי';
      lines.push(reverseHebrew(`אמצעי תשלום: ${paymentText}`));
    }
    
    // משלוח
    if (order.shipping_method) {
      const shippingText = order.shipping_method === 'delivery' ? 'משלוח' : 'איסוף עצמי';
      lines.push(reverseHebrew(`אופן משלוח: ${shippingText}`));
    }
    
    lines.push('');
    lines.push(reverseHebrew('תודה רבה!'));
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
