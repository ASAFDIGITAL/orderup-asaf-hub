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
   */
  private formatReceiptText(order: Order): string {
    
    // כותרת
    let text = '====================\n';
    text += `הזמנה #${order.id}\n`;
    text += '====================\n\n';
    
    // פרטי לקוח
    text += `לקוח: ${order.customer_name}\n`;
    if (order.customer_phone) {
      text += `טלפון: ${order.customer_phone}\n`;
    }
    if (order.customer_address) {
      text += `כתובת: ${order.customer_address}\n`;
    }
    text += '\n';
    
    // פרטי הזמנה
    text += '--------------------\n';
    text += 'פריטים:\n';
    text += '--------------------\n';
    
    // פריטים
    order.items.forEach((item) => {
      text += `${item.qty}x ${item.name}\n`;
      
      // אפשרויות
      if (item.options?.choices && item.options.choices.length > 0) {
        item.options.choices.forEach((choice) => {
          text += `  ${choice.group}:\n`;
          choice.items.forEach((subItem) => {
            text += `    + ${subItem.name}\n`;
          });
        });
      }
      
      // הערה
      if (item.options?.note) {
        text += `  הערה: ${item.options.note}\n`;
      }
      
      text += `  ${item.total} ש"ח\n\n`;
    });
    
    // סיכום
    text += '--------------------\n';
    text += `סכום ביניים: ${order.subtotal} ש"ח\n`;
    if (order.delivery_fee > 0) {
      text += `דמי משלוח: ${order.delivery_fee} ש"ח\n`;
    }
    text += `סה"כ: ${order.total} ש"ח\n`;
    text += '--------------------\n\n';
    
    // הערות
    if (order.notes) {
      text += 'הערות:\n';
      text += `${order.notes}\n\n`;
    }
    
    // תשלום
    if (order.payment_method) {
      const paymentText = order.payment_method === 'cash' ? 'מזומן' : 'כרטיס אשראי';
      text += `אמצעי תשלום: ${paymentText}\n`;
    }
    
    // משלוח
    if (order.shipping_method) {
      const shippingText = order.shipping_method === 'delivery' ? 'משלוח' : 'איסוף עצמי';
      text += `אופן משלוח: ${shippingText}\n`;
    }
    
    text += '\n';
    text += 'תודה רבה!\n\n\n';
    
    return text;
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
      
      // שמור שההזמנה הודפסה
      this.markOrderAsPrinted(order.id);
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
