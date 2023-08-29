import type {
  ActionMintCollection,
  CollectionToMintStatmine,
  ExecuteTransactionParams,
} from '../types'
import { constructMeta } from './constructMeta'
import { useStatemineNewCollectionId } from './useNewCollectionId'
import { createArgsForNftPallet, createMessage } from './utils'

export async function execMintCollectionStatemine(
  item: ActionMintCollection,
  api,
  executeTransaction: (p: ExecuteTransactionParams) => void
) {
  const metadata = await constructMeta(item)
  const { nftCount } = item.collection as CollectionToMintStatmine
  const { accountId } = useAuth()
  const transectionSent = ref(false)

  const { nextCollectionId, unsubscribe } = useStatemineNewCollectionId()

  const maxSupply = nftCount > 0 ? nftCount : undefined

  const createArgs = createArgsForNftPallet(accountId.value, maxSupply)

  watch(nextCollectionId, (id) => {
    if (!id || transectionSent.value) {
      return
    }
    const arg = [
      [
        api.tx.nfts.create(...createArgs),
        api.tx.nfts.setCollectionMetadata(nextCollectionId, metadata),
      ],
    ]

    transectionSent.value = true

    unsubscribe.value && unsubscribe.value()

    executeTransaction({
      cb: api.tx.utility.batchAll,
      arg,
      successMessage: (blockNumber) =>
        item.successMessage
          ? resolveSuccessMessage(blockNumber, item.successMessage)
          : createMessage(item.collection.name, blockNumber),
      errorMessage: item.errorMessage || createMessage(item.collection.name),
    })
  })
}
