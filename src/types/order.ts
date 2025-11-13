export interface OrderItem {
  name: string;
  qty: number;
  unit_price: number;
  total: number;
  options?: {
    choices?: Array<{
      group: string;
      items: Array<{ name: string }>;
    }>;
    note?: string;
  };
}

export interface Order {
  id: number;
  customer_name: string;
  customer_phone: string;
  customer_address?: string;
  shipping_method: 'delivery' | 'pickup';
  delivery_zone?: {
    name_he: string;
    name_ar: string;
  };
  subtotal: number;
  delivery_fee: number;
  total: number;
  status: 'new' | 'preparing' | 'out_for_delivery' | 'completed' | 'canceled' | 'pending_payment' | 'paid' | 'failed';
  payment_method: 'cash' | 'card';
  notes?: string;
  created_at: string;
  items: OrderItem[];
}
