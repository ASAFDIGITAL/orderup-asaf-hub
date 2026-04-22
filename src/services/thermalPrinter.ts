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
   * אם יש ערבית בטקסט - לא הופכים
   */
  private reverseText(text: string): string {
    const hasArabic = /[\u0600-\u06FF]/.test(text);
    
    // אם יש ערבית, לא הופכים כי זה כבר RTL טבעי
    if (hasArabic) {
      return text;
    }
    
    // עברית בלבד - הופכים
    return Array.from(text).reverse().join('');
  }

  /**
   * פיצול הערות מעורבות לשורות "פשוטות" למדפסת
   * לא הופך טקסט כדי לא לשבור ערבית/עברית מעורבים
   */
  private handleMixedText(text: string): string[] {
    const result: string[] = [];

    // כל שורה לוגית (אם יש \n)
    const logicalLines = text.split('\n');

    logicalLines.forEach(rawLine => {
      const line = rawLine.trim();
      if (!line) return;

      // אם יש מפריד | נחלק לשניים/יותר
      if (line.includes('|')) {
        const parts = line.split('|')
          .map(p => p.trim())
          .filter(Boolean);

        parts.forEach(p => {
          // כאן בכוונה לא עושים reverse – כדי לא לשבור ערבית
          result.push(p);
        });
      } else {
        // שורה רגילה – משאירים כמו שהיא
        result.push(line);
      }
    });

    return result;
  }

  /**
   * פורמט טקסט למדפסת תרמית
   * קבלה בעברית עם תמיכה בתוכן בערבית
   */
  formatReceiptText(order: Order): string {
    const settings = this.getRestaurantSettings();
    let lines: string[] = [];
    const LTR = "\u200E"; // סימן כיוון טקסט משמאל לימין (לא מודפס)
    
    // כותרת
    lines.push(this.reverseText('הזמנה / קבלה'));
    lines.push('');
    
    // מספר הזמנה
    lines.push(this.reverseText(`#${LTR}${order.id}${LTR}`));
    lines.push('_______________');

    // תאריך
    const orderDate = new Date(order.created_at);
    const formattedDate = `${orderDate.getDate().toString().padStart(2, '0')}/${(orderDate.getMonth() + 1).toString().padStart(2, '0')}/${orderDate.getFullYear()} `;
    const formattedTime = `${orderDate.getHours().toString().padStart(2, '0')}:${orderDate.getMinutes().toString().padStart(2, '0')}`;
    lines.push(`${LTR}${formattedDate}${LTR}`);
    lines.push(`${LTR}${formattedTime}${LTR}`);

    // לקוח
    lines.push(this.reverseText('לקוח'));
    lines.push('_______________');
    lines.push(this.reverseText(order.customer_name));
    
    // טלפון
    lines.push(this.reverseText('טלפון'));
    lines.push('');
    lines.push(`${LTR}${order.customer_phone}${LTR}`);
    lines.push('_______________');

    // כתובת (אם קיימת)
    if (order.customer_address) {
      lines.push('');
      lines.push(this.reverseText('כתובת'));
      lines.push('');
      lines.push(this.reverseText(order.customer_address));
    }
    lines.push('_______________');
    
    // פרטים
    lines.push('');
    lines.push(this.reverseText('פרטים'));
    lines.push('_______________');
    
    // פריטים
    order.items.forEach((item, index) => {
      // שם הפריט
      lines.push(item.name);
      lines.push('');
      
      // כמות
      lines.push(`${this.reverseText('כמות')}: ${LTR}${item.qty}${LTR}`);
      lines.push('');
      
      // מחיר
      lines.push(this.reverseText('מחיר'));
      lines.push(`${LTR}${Number(item.total).toFixed(2)} ₪${LTR}`);
      
      // אפשרויות
      if (item.options && Array.isArray(item.options) && item.options.length > 0) {
        item.options.forEach((opt: any) => {
          if (opt?.choices && Array.isArray(opt.choices)) {
            opt.choices.forEach((choice: any) => {
              const choiceItems = choice.items.map((i: any) => i.name).join(', ');
              if (choiceItems) {
                lines.push(`${choice.group}: ${choiceItems}`);
              }
            });
          }
          if (opt?.note) {
            lines.push(`${this.reverseText('הערה')}: ${opt.note}`);
          }
        });
      } else if (item.options && !Array.isArray(item.options)) {
        const opt = item.options as any;
        if (opt.choices && Array.isArray(opt.choices)) {
          opt.choices.forEach((choice: any) => {
            const choiceItems = choice.items.map((i: any) => i.name).join(', ');
            if (choiceItems) {
              lines.push(`${choice.group}: ${choiceItems}`);
            }
          });
        }
        if (opt.note) {
          lines.push(`${this.reverseText('הערה')}: ${opt.note}`);
        }
      }
      
      // קו מפריד בין פריטים
      if (index < order.items.length - 1) {
        lines.push('_______________');
      }
    });
    
    // ביניים
    lines.push('_______________');
    lines.push(this.reverseText('ביניים'));
    lines.push('');
    lines.push(`${LTR}${Number(order.subtotal).toFixed(2)} ₪${LTR}`);
    lines.push('_______________');
    
    // משלוח
    lines.push(this.reverseText('משלוח'));
    lines.push('');
    lines.push(`${LTR}${Number(order.delivery_fee).toFixed(2)} ₪${LTR}`);
    lines.push('_______________');
    
    // סה"כ
    lines.push(this.reverseText('סה"כ'));
    lines.push('');
    lines.push(`${LTR}${Number(order.total).toFixed(2)} ₪${LTR}`);
    lines.push('____________________________');
    
    // הערות
    if (order.notes) {
      lines.push(this.reverseText('הערות'));
      lines.push('_______________');
      const noteLines = this.handleMixedText(order.notes);
      noteLines.forEach(l => lines.push(l));
    }
    
    // שיטת תשלום
    lines.push('_______________');
    lines.push(this.reverseText('שיטת תשלום'));
    lines.push('');
    if (order.payment_method === 'card') {
      lines.push(this.reverseText('אשראי'));
    } else {
      lines.push(this.reverseText('מזומן'));
    }
    lines.push('_______________');
    
    // כותרת תחתונה
    lines.push('');
    if (settings.footer) {
      lines.push(this.reverseText(settings.footer));
    } else {
      lines.push(this.reverseText('תודה רבה'));
    }
    lines.push('');
    lines.push('');
    
    return lines.join('\n');
  }

  /**
   * קבלת פקודת ESC/POS לגודל פונט
   */
  private getFontSizeCommand(): string {
    const settings = this.getRestaurantSettings();
    const fontSize = settings.fontSize || 'normal';
    
    // GS ! n - פקודה לשינוי גודל פונט
    // n = (width - 1) + (height - 1) * 16
    switch (fontSize) {
      case 'normal':
        return `${GS}!\x00`; // רגיל (1x1)
      case 'medium':
        return `${GS}!\x00`; // בינוני (1x1 - כמו רגיל)
      case 'large':
        return `${GS}!\x10`; // גדול (2x1 - רוחב כפול)
      default:
        return `${GS}!\x00`; // ברירת מחדל
    }
  }

  /**
   * הדפסת קבלה
   */
  async printReceipt(order: Order): Promise<void> {
    const settings = this.getRestaurantSettings();

    // אם הופעלה הדפסה מהדפדפן - השתמש ב-window.print
    if (settings.browserPrintEnabled) {
      this.printViaBrowser(order);
      return;
    }

    // אם הופעלה הדפסה דרך השרת (מחשב מרוחק) - שלח לשרת
    if (settings.networkPrintEnabled && settings.networkPrintUrl) {
      await this.printViaServer(order);
      return;
    }

    // אחרת - הדפסה ישירה דרך Bluetooth
    if (!this.deviceAddress) {
      throw new Error('לא מחובר למדפסת. יש להתחבר תחילה.');
    }

    try {
      const receiptText = this.formatReceiptText(order);
      const fontSizeCommand = this.getFontSizeCommand();

      await CapacitorThermalPrinter.begin()
        .align('right')
        .text(fontSizeCommand + receiptText)
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
   * הדפסה דרך הדפדפן - פותח חלון עם קבלה מעוצבת ומריץ window.print()
   * מתאים למדפסות 80mm המוגדרות במחשב/בדפדפן
   */
  printViaBrowser(order: Order): void {
    const settings = this.getRestaurantSettings();
    const fontSize = settings.fontSize === 'large' ? '16px'
      : settings.fontSize === 'medium' ? '14px'
      : '12px';

    const formatPrice = (n: number) => `${Number(n).toFixed(2)} ₪`;
    const orderDate = new Date(order.created_at);
    const dateStr = `${orderDate.getDate().toString().padStart(2, '0')}/${(orderDate.getMonth() + 1).toString().padStart(2, '0')}/${orderDate.getFullYear()} ${orderDate.getHours().toString().padStart(2, '0')}:${orderDate.getMinutes().toString().padStart(2, '0')}`;

    const itemsHtml = order.items.map((item) => {
      let optionsHtml = '';
      const opts = Array.isArray(item.options) ? item.options : (item.options ? [item.options] : []);
      opts.forEach((opt: any) => {
        if (opt?.choices && Array.isArray(opt.choices)) {
          opt.choices.forEach((choice: any) => {
            const choiceItems = choice.items?.map((i: any) => i.name).join(', ');
            if (choiceItems) {
              optionsHtml += `<div class="opt">${choice.group}: ${choiceItems}</div>`;
            }
          });
        }
        if (opt?.note) {
          optionsHtml += `<div class="opt">הערה: ${opt.note}</div>`;
        }
      });

      return `
        <div class="item">
          <div class="item-name">${item.name}</div>
          <div class="item-row">
            <span>כמות: ${item.qty}</span>
            <span>${formatPrice(Number(item.total))}</span>
          </div>
          ${optionsHtml}
        </div>
      `;
    }).join('');

    const html = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
<meta charset="UTF-8">
<title>הזמנה #${order.id}</title>
<style>
  @page {
    size: 80mm auto;
    margin: 0;
  }
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    font-family: 'Arial', 'Heebo', sans-serif;
    direction: rtl;
    color: #000;
    background: #fff;
  }
  body {
    width: 72mm;
    padding: 4mm 4mm 8mm 4mm;
    font-size: ${fontSize};
    line-height: 1.4;
  }
  .center { text-align: center; }
  .bold { font-weight: bold; }
  .title { font-size: 16px; font-weight: bold; text-align: center; margin-bottom: 4px; }
  .sub { text-align: center; font-size: 11px; margin-bottom: 6px; }
  .sep { border-top: 1px dashed #000; margin: 6px 0; }
  .row { display: flex; justify-content: space-between; gap: 8px; }
  .label { font-weight: bold; }
  .item { margin-bottom: 6px; }
  .item-name { font-weight: bold; }
  .item-row { display: flex; justify-content: space-between; font-size: 12px; }
  .opt { font-size: 11px; color: #333; padding-right: 6px; }
  .total { font-size: 15px; font-weight: bold; }
  .footer { text-align: center; margin-top: 8px; font-weight: bold; }
  @media print {
    body { width: 72mm; }
  }
</style>
</head>
<body>
  <div class="title">${settings.name || 'הזמנה / קבלה'}</div>
  ${settings.address ? `<div class="sub">${settings.address}</div>` : ''}
  ${settings.phone ? `<div class="sub">טל: ${settings.phone}</div>` : ''}

  <div class="sep"></div>

  <div class="row"><span class="label">הזמנה #</span><span>${order.id}</span></div>
  <div class="row"><span class="label">תאריך</span><span>${dateStr}</span></div>

  <div class="sep"></div>

  <div class="row"><span class="label">לקוח</span><span>${order.customer_name || ''}</span></div>
  <div class="row"><span class="label">טלפון</span><span dir="ltr">${order.customer_phone || ''}</span></div>
  ${order.customer_address ? `<div class="row"><span class="label">כתובת</span><span>${order.customer_address}</span></div>` : ''}

  <div class="sep"></div>

  <div class="bold center">פרטים</div>
  <div class="sep"></div>

  ${itemsHtml}

  <div class="sep"></div>

  <div class="row"><span>ביניים</span><span>${formatPrice(Number(order.subtotal))}</span></div>
  <div class="row"><span>משלוח</span><span>${formatPrice(Number(order.delivery_fee))}</span></div>
  <div class="sep"></div>
  <div class="row total"><span>סה"כ</span><span>${formatPrice(Number(order.total))}</span></div>

  ${order.notes ? `
    <div class="sep"></div>
    <div class="bold">הערות:</div>
    <div>${order.notes.replace(/\n/g, '<br>')}</div>
  ` : ''}

  <div class="sep"></div>
  <div class="row"><span class="label">תשלום</span><span>${order.payment_method === 'card' ? 'אשראי' : 'מזומן'}</span></div>

  <div class="footer">${settings.footer || 'תודה רבה!'}</div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
        setTimeout(function() { window.close(); }, 500);
      }, 200);
    };
  </script>
</body>
</html>
    `;

    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) {
      throw new Error('הדפדפן חסם את חלון ההדפסה. אפשר חלונות קופצים ונסה שוב.');
    }
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();

    console.log('🖨️ נשלחה הזמנה #' + order.id + ' להדפסה דרך הדפדפן');
  }

  /**
   * הדפסה דרך השרת (Network Printer / מדפסת משותפת ב-Windows)
   * דורש endpoint בשרת Laravel שמקבל content + printer_name
   * ושולח את התוכן למדפסת המחוברת למחשב.
   */
  async printViaServer(order: Order): Promise<void> {
    const settings = this.getRestaurantSettings();

    if (!settings.networkPrintUrl) {
      throw new Error('כתובת שרת ההדפסה לא מוגדרת');
    }
    if (!settings.networkPrinterName) {
      throw new Error('שם המדפסת המשותפת לא מוגדר');
    }

    const receiptText = this.formatReceiptText(order);

    try {
      console.log('🖨️ שולח הדפסה לשרת:', settings.networkPrintUrl);

      const response = await fetch(settings.networkPrintUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          content: receiptText,
          printer_name: settings.networkPrinterName,
          order_id: order.id,
          font_size: settings.fontSize || 'normal',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`שגיאה מהשרת [${response.status}]: ${errorText}`);
      }

      console.log('✅ הזמנה #' + order.id + ' נשלחה למדפסת דרך השרת');
    } catch (error) {
      console.error('Failed to print via server:', error);
      throw error;
    }
  }

  /**
   * בדיקת חיבור לשרת ההדפסה (Test Print)
   */
  async testServerPrint(): Promise<void> {
    const settings = this.getRestaurantSettings();

    if (!settings.networkPrintUrl) {
      throw new Error('כתובת שרת ההדפסה לא מוגדרת');
    }
    if (!settings.networkPrinterName) {
      throw new Error('שם המדפסת המשותפת לא מוגדר');
    }

    const testContent = [
      this.reverseText('בדיקת הדפסה'),
      '',
      this.reverseText('המדפסת עובדת!'),
      '',
      new Date().toLocaleString('he-IL'),
      '',
      '_______________',
      '',
    ].join('\n');

    const response = await fetch(settings.networkPrintUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        content: testContent,
        printer_name: settings.networkPrinterName,
        font_size: settings.fontSize || 'normal',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`שגיאה מהשרת [${response.status}]: ${errorText}`);
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
