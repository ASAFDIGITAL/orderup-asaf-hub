export interface RestaurantSettings {
  name: string;
  nameAr?: string;
  address?: string;
  phone?: string;
  logoUrl?: string;
  footer?: string;
  footerAr?: string;
  fontSize?: 'normal' | 'medium' | 'large';
}

export const defaultRestaurantSettings: RestaurantSettings = {
  name: "ASAF Restaurant",
  nameAr: "مطعم أصف",
  address: "",
  phone: "",
  logoUrl: "",
  footer: "תודה רבה!",
  footerAr: "شكراً جزيلاً!",
  fontSize: 'normal'
};
