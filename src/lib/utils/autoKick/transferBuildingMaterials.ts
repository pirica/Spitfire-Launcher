import DataStorage from '$lib/core/dataStorage';
import MCPManager from '$lib/core/managers/mcp';
import { sleep } from '$lib/utils/util';
import type { AccountData } from '$types/accounts';
import type { ProfileItem } from '$types/game/mcp';

type MCPStorageTransferItem = {
  itemId: string;
  quantity: number;
  toStorage: boolean;
  newItemIdHint: string;
}

type BuildingMaterialData = {
  total: number;
  items: MCPStorageTransferItem[];
}

const MAX_BUILDING_MATERIALS = 5000;

export default async function transferBuildingMaterials(account: AccountData) {
  const settings = await DataStorage.getSettingsFile();
  const delaySeconds = settings.app?.claimRewardsDelay;
  await sleep((delaySeconds || 1.5) * 1000);

  const wood: BuildingMaterialData = {
    total: 0,
    items: []
  };

  const stone: BuildingMaterialData = {
    total: 0,
    items: []
  };

  const metal: BuildingMaterialData = {
    total: 0,
    items: []
  };

  const buildingMaterialArrays: Record<string, BuildingMaterialData> = {
    'WorldItem:wooditemdata': wood,
    'WorldItem:stoneitemdata': stone,
    'WorldItem:metalitemdata': metal
  };

  const storageProfile = await MCPManager.queryProfile(account, 'outpost0');
  const profile = storageProfile.profileChanges[0].profile;
  const ownedBuildingMaterials = Object.entries(profile.items).filter(([, item]) => Object.keys(buildingMaterialArrays).includes(item.templateId));
  if (!ownedBuildingMaterials.length) return;

  for (const [itemId, itemData] of ownedBuildingMaterials) {
    const buildingMaterial = buildingMaterialArrays[itemData.templateId];
    const quantity = calculateMaterial(itemData, buildingMaterial.total);

    buildingMaterial.total += quantity;
    buildingMaterial.items.push({
      itemId,
      quantity,
      newItemIdHint: '',
      toStorage: false
    });
  }

  return MCPManager.compose(account, 'StorageTransfer', 'theater0', {
    transferOperations: [...wood.items, ...stone.items, ...metal.items].filter(x => x.quantity > 0)
  });
}

function calculateMaterial(itemData: ProfileItem, total: number) {
  const tempTotalSum = total + itemData.quantity;
  const tempRemoveOverflow = MAX_BUILDING_MATERIALS - total;
  return tempTotalSum <= MAX_BUILDING_MATERIALS
    ? itemData.quantity
    : tempRemoveOverflow;
}