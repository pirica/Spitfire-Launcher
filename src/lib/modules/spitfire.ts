import { spitfireService } from '$lib/http';
import type { ShopData } from '$types/spitfire';

export function fetchShop(): Promise<ShopData> {
  return spitfireService.get<ShopData>('epic/shop').json();
}
