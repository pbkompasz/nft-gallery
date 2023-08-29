import type { ActionMintCollection, ExecuteTransactionParams } from '../types'
import { constructMeta } from './constructMeta'
import { useNewCollectionId } from './useNewCollectionId'
import { createArgs, createMessage } from './utils'

export async function execMintCollectionBasilisk(
  item: ActionMintCollection,
  api,
  executeTransaction: (p: ExecuteTransactionParams) => void
) {
  const metadata = await constructMeta(item)

  const cb = api.tx.nft.createCollection

  const { newCollectionId } = useNewCollectionId()

  watch(newCollectionId, (id) => {
    if (id) {
      const arg = createArgs(id, metadata)
      executeTransaction({
        cb,
        arg,
        successMessage:
          item.successMessage ||
          ((blockNumber) => createMessage(item.collection.name, blockNumber)),
        errorMessage: item.errorMessage || createMessage(item.collection.name),
      })
    }
  })
}
