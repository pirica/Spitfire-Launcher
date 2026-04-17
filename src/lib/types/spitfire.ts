export type ShopFilter = 'new' | 'leavingSoon' | 'longestWait';

export type ShopData = {
  lastUpdated: string;
  hash: string;
  image: string;
  offers: ShopItem[];
};

export type ShopItem = {
  id: string;
  offerId: string;
  devName: string;
  name: string;
  description: string;
  price: {
    final: number;
    regular: number;
    floor: number;
  };
  assets: Partial<{
    small: string;
    large: string;
    featured: string;
    lego: Partial<{
      small: string;
      large: string;
    }>;
    bean: Partial<{
      small: string;
      large: string;
    }>;
  }>;
  type: {
    id: string;
    name: string;
  };
  rarity: {
    id: string;
    name: string;
  };
  series?: {
    id: string;
    name: string;
  };
  meta: {
    newDisplayAssetPath: string;
    webURL: string;
    templateId: string;
  };
  dates: {
    releaseDate: string;
    lastSeen: string;
    in: string;
    out: string;
  };
  section: {
    id: string;
    name: string;
  };
  banner: {
    id: string;
    name: string;
    intensity: string;
  };
  contents: {
    id: string;
    name: string;
    alreadyOwnedPriceReduction: number;
  }[];
  shopHistory: string[];
  sortPriority: number;
  giftable: boolean;
  refundable: boolean;
};

export type ShopSection = {
  name: string;
  id: string;
  items: ShopItem[];
};
