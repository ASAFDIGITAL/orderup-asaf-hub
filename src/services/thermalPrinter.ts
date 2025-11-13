import { BleClient, BleDevice } from '@capacitor-community/bluetooth-le';
import { Order } from '@/types/order';

// פקודות ESC/POS למדפסות תרמיות
const ESC = '\x1B';
const GS = '\x1D';

class ThermalPrinterService {
  private device: BleDevice | null = null;
  private serviceUuid = '000018f0-0000-1000-8000-00805f9b34fb'; // UUID סטנדרטי למדפסות תרמיות
  private characteristicUuid = '00002af1-0000-1000-8000-00805f9b34fb';

  /**
   * אתחול והתחברות למדפסת
   */
  async initialize(): Promise<void> {
    try {
      await BleClient.initialize();
    } catch (error) {
      console.error('Failed to initialize Bluetooth:', error);
      throw new Error('לא ניתן לאתחל Bluetooth');
    }
  }

  /**
   * חיפוש והתחברות למדפסת זמינה
   */
  async connectToPrinter(): Promise<void> {
    try {
      // בקשת הרשאות
      await BleClient.initialize();

      // חיפוש מכשירים זמינים
      const device = await BleClient.requestDevice({
        optionalServices: [this.serviceUuid],
      });

      // התחברות למכשיר
      await BleClient.connect(device.deviceId);
      this.device = device;
      
      console.log('Connected to printer:', device.name);
    } catch (error) {
      console.error('Failed to connect to printer:', error);
      throw new Error('לא ניתן להתחבר למדפסת');
    }
  }

  /**
   * ניתוק מהמדפסת
   */
  async disconnect(): Promise<void> {
    if (this.device) {
      try {
        await BleClient.disconnect(this.device.deviceId);
        this.device = null;
      } catch (error) {
        console.error('Failed to disconnect:', error);
      }
    }
  }

  /**
   * שליחת פקודות למדפסת
   */
  private async sendCommand(command: string): Promise<void> {
    if (!this.device) {
      throw new Error('לא מחובר למדפסת');
    }

    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(command);
      
      await BleClient.write(
        this.device.deviceId,
        this.serviceUuid,
        this.characteristicUuid,
        new DataView(data.buffer)
      );
    } catch (error) {
      console.error('Failed to send command:', error);
      throw new Error('שגיאה בשליחת פקודה למדפסת');
    }
  }

  /**
   * פורמט טקסט למדפסת תרמית
   */
  private formatReceipt(order: Order): string {
    let receipt = '';
    
    // אתחול מדפסת
    receipt += ESC + '@';
    
    // יישור למרכז וגודל גדול
    receipt += ESC + 'a' + '\x01'; // מרכז
    receipt += ESC + '!' + '\x30'; // גודל כפול
    
    // כותרת
    receipt += '====================\n';
    receipt += `הזמנה #${order.id}\n`;
    receipt += '====================\n\n';
    
    // יישור לשמאל וגודל רגיל
    receipt += ESC + 'a' + '\x00'; // שמאל
    receipt += ESC + '!' + '\x00'; // רגיל
    
    // פרטי לקוח
    receipt += `לקוח: ${order.customer_name}\n`;
    if (order.customer_phone) {
      receipt += `טלפון: ${order.customer_phone}\n`;
    }
    if (order.customer_address) {
      receipt += `כתובת: ${order.customer_address}\n`;
    }
    receipt += '\n';
    
    // פרטי הזמנה
    receipt += '--------------------\n';
    receipt += 'פריטים:\n';
    receipt += '--------------------\n';
    
    // פריטים
    order.items.forEach((item) => {
      receipt += `${item.qty}x ${item.name}\n`;
      
      // אפשרויות
      if (item.options?.choices && item.options.choices.length > 0) {
        item.options.choices.forEach((choice) => {
          receipt += `  ${choice.group}:\n`;
          choice.items.forEach((subItem) => {
            receipt += `    + ${subItem.name}\n`;
          });
        });
      }
      
      // הערה
      if (item.options?.note) {
        receipt += `  הערה: ${item.options.note}\n`;
      }
      
      receipt += `  ${item.total} ש"ח\n\n`;
    });
    
    // סיכום
    receipt += '--------------------\n';
    receipt += ESC + '!' + '\x10'; // גודל גדול יותר
    receipt += `סכום ביניים: ${order.subtotal} ש"ח\n`;
    if (order.delivery_fee > 0) {
      receipt += `דמי משלוח: ${order.delivery_fee} ש"ח\n`;
    }
    receipt += ESC + '!' + '\x30'; // גודל כפול
    receipt += `סה"כ: ${order.total} ש"ח\n`;
    receipt += ESC + '!' + '\x00'; // גודל רגיל
    receipt += '--------------------\n\n';
    
    // הערות
    if (order.notes) {
      receipt += 'הערות:\n';
      receipt += `${order.notes}\n\n`;
    }
    
    // תשלום
    if (order.payment_method) {
      receipt += `אמצעי תשלום: ${order.payment_method}\n`;
    }
    
    // משלוח
    if (order.shipping_method) {
      receipt += `אופן משלוח: ${order.shipping_method}\n`;
    }
    
    receipt += '\n';
    receipt += ESC + 'a' + '\x01'; // מרכז
    receipt += 'תודה רבה!\n\n\n';
    
    // חיתוך
    receipt += GS + 'V' + '\x00';
    
    return receipt;
  }

  /**
   * הדפסת קבלה
   */
  async printReceipt(order: Order): Promise<void> {
    if (!this.device) {
      throw new Error('לא מחובר למדפסת. יש להתחבר תחילה.');
    }

    try {
      const receipt = this.formatReceipt(order);
      await this.sendCommand(receipt);
    } catch (error) {
      console.error('Failed to print receipt:', error);
      throw error;
    }
  }

  /**
   * בדיקה האם מחובר למדפסת
   */
  isConnected(): boolean {
    return this.device !== null;
  }

  /**
   * קבלת שם המדפסת המחוברת
   */
  getPrinterName(): string | null {
    return this.device?.name || null;
  }
}

export const thermalPrinter = new ThermalPrinterService();
