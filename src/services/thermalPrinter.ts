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
      return new Promise((resolve, reject) => {
        const discoveredDevices: any[] = [];
        
        // האזנה למכשירים שנמצאו
        CapacitorThermalPrinter.addListener('discoverDevices', (devices) => {
          console.log('מכשירים שנמצאו:', devices);
          discoveredDevices.push(...devices.devices);
        });

        // התחל סריקה
        CapacitorThermalPrinter.startScan()
          .then(() => {
            console.log('סריקה החלה...');
            
            // חכה 5 שניות ואז עצור את הסריקה
            setTimeout(async () => {
              await CapacitorThermalPrinter.stopScan();
              
              if (discoveredDevices.length === 0) {
                reject(new Error('לא נמצאו מדפסות. ודא שהמדפסת דלוקה וקרובה.'));
                return;
              }

              resolve(discoveredDevices);
            }, 5000);
          })
          .catch((error) => {
            console.error('שגיאה בסריקה:', error);
            reject(error);
          });
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
      text += `אמצעי תשלום: ${order.payment_method}\n`;
    }
    
    // משלוח
    if (order.shipping_method) {
      text += `אופן משלוח: ${order.shipping_method}\n`;
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
        .align('center')
        .bold()
        .text(`הזמנה #${order.id}\n`)
        .clearFormatting()
        .text('====================\n\n')
        .align('right')
        .text(receiptText)
        .text('\n\n')
        .align('center')
        .text('תודה רבה!\n\n')
        .cutPaper()
        .write();
        
      console.log('קבלה הודפסה בהצלחה');
    } catch (error) {
      console.error('Failed to print receipt:', error);
      throw error;
    }
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
