export function createArgs(
  randomId: number,
  metadata: string
): [number, { Marketplace: null }, string] {
  return [randomId, { Marketplace: null }, metadata]
}

export function createArgsForNftPallet(
  account: string,
  maxSupply?: number
): [string, any] {
  const config = {
    settings: 0,
    maxSupply,
    mintSettings: {
      mintType: { Issuer: null },
      defaultItemSettings: 0,
    },
  }
  return [account, config]
}

export const createMessage = (itemName, blockNumber?) => {
  const { $i18n } = useNuxtApp()

  if (blockNumber) {
    return $i18n.t('mint.mintCollectionSuccess', {
      name: itemName,
      block: blockNumber,
    })
  }
  return $i18n.t('mint.errorCreateNewNft', { name: itemName })
}
