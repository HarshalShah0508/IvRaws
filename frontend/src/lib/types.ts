export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface SizeOption {
  id: string;
  label: string;
  sortOrder: number;
  type: 'APPAREL' | 'NUMERIC';
}

export interface ColorOption {
  id: string;
  name: string;
  hexCode: string;
}

export interface ProductImage {
  id: string;
  url: string;
  altText: string | null;
  position: number;
}

export interface ProductVariant {
  id: string;
  sku: string;
  price: string;
  stockQuantity: number;
  reservedQuantity: number;
  isActive: boolean;
  size: SizeOption;
  color: ColorOption;
  images?: ProductImage[];
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  basePrice: string;
  gender: string;
  category: Category;
  material: string | null;
  fitType: string | null;
  pattern: string | null;
  sleeveLength: string | null;
  tags: string[];
  compareAtPrice: string | null;
  isOnSale: boolean;
  discountAmount: string | null;
  salesCount: number;
  avgRating: string | null;
  reviewCount: number;
  images: ProductImage[];
  variants: ProductVariant[];
}

export interface Paginated<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: { id: string; firstName: string | null; lastName: string | null };
}

export interface CartItem {
  id: string;
  variantId: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  sku: string;
  size: string;
  color: string;
  availableStock: number;
  product: { id: string; name: string; slug: string };
}

export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
}

export interface Address {
  id: string;
  fullName: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
  role: 'CUSTOMER' | 'ADMIN' | 'STAFF';
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface OrderItem {
  id: string;
  productName: string;
  variantSku: string;
  unitPrice: string;
  quantity: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: string;
  discountAmount: string;
  total: string;
  createdAt: string;
  items: OrderItem[];
}

export interface ChatSuggestion {
  id: string;
  question: string;
  category: string;
}

export interface ChatReply {
  type: 'order-status' | 'faq' | 'no-match';
  reply: string;
  suggestions?: ChatSuggestion[];
}
