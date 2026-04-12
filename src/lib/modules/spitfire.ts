import { spitfireService } from '$lib/http';
import type { SpitfireShop } from '$types/game/shop';

export function fetchShop() {
  return spitfireService.get<SpitfireShop>('epic/shop').json();
}
