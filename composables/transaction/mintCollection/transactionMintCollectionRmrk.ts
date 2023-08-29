import type {
  ActionMintCollection,
  CollectionToMintKusama,
  ExecuteTransactionParams,
} from '../types'
import { constructMeta } from './constructMeta'
import {
  Interaction,
  createCollection,
  createMintInteraction,
} from '@kodadot1/minimark/v1'
import {
  Interaction as NewInteraction,
  createInteraction,
} from '@kodadot1/minimark/v2'
import { asSystemRemark } from '@kodadot1/minimark/common'
import { canSupport } from '@/utils/support'
import { createMessage } from './utils'

const mintInteraction = async (mint, isV2, api) => {
  const mintInteraction = isV2.value
    ? createInteraction({
        action: NewInteraction.CREATE,
        payload: { value: mint },
      })
    : createMintInteraction(Interaction.MINT, mint)

  return [
    [asSystemRemark(api, mintInteraction), ...(await canSupport(api, true))],
  ]
}

export async function execMintCollectionRmrk(
  item: ActionMintCollection,
  api,
  executeTransaction: (p: ExecuteTransactionParams) => void
) {
  const { isV2 } = useRmrkVersion()
  const { accountId } = useAuth()

  const metadata = await constructMeta(item)
  const { symbol, name, nftCount } = item.collection as CollectionToMintKusama

  const mint = createCollection(
    accountId.value,
    symbol || '',
    name,
    metadata,
    nftCount
  )
  const arg = await mintInteraction(mint, isV2, api)

  executeTransaction({
    cb: api.tx.utility.batchAll,
    arg,
    successMessage:
      item.successMessage ||
      ((blockNumber) => createMessage(item.collection.name, blockNumber)),
    errorMessage: item.errorMessage || createMessage(item.collection.name),
  })
}
