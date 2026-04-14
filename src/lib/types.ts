export interface Store {
  id: string;
  user_id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  address: string | null;
  hours: string | null;
  instagram: string | null;
  whatsapp: string;
  logo_url: string | null;
  banner_url: string | null;
  primary_color: string;
  accent_color: string;
  background_color: string;
  font_heading: string;
  font_body: string;
  mode: 'retail' | 'restaurant';
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  store_id: string;
  name: string;
  display_order: number;
  created_at: string;
}

export interface Product {
  id: string;
  store_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  image_url: string | null;
  images: string[] | null;
  is_featured: boolean;
  is_available: boolean;
  display_order: number;
  category?: Category;
  variants?: ProductVariant[];
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  display_order: number;
  required: boolean;
  multiple: boolean;
  options: ProductVariantOption[];
  created_at: string;
}

export interface ProductVariantOption {
  id: string;
  variant_id: string;
  name: string;
  price_modifier: number;
  display_order: number;
  created_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedOptions: Record<string, string>; // variant name -> option name
  extraPrice: number;
}

export interface Analytics {
  totalViews: number;
  todayViews: number;
  topProducts: { id: string; name: string; views: number }[];
  whatsappClicks: number;
}
