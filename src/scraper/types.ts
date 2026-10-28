export interface Product {
  id: string;
  title: string;
  url: string;
  image?: string;
  salePrice: number;
  originalPrice?: number;
  discountPercent?: number;
  sold?: string;
  soldCount?: number;
  rating?: number;
  store?: string;
  choice: boolean;
  localWarehouse: boolean;
  source: string;
}
