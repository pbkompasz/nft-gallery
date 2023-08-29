import resolveQueryPath from '@/utils/queryPathResolver'
import { getDenyList } from '@/utils/prefix'
import { useSearchParams } from './utils/useSearchParams'
import { Ref } from 'vue'

import type { NFTWithMetadata } from '@/composables/useNft'

interface FetchSearchParams {
  page?: number
  loadDirection?: 'up' | 'down'
  search?: { [key: string]: string | number }[]
}

const getQueryPath = (prefix: string) => {
  switch (prefix) {
    case 'rmrk':
      return 'chain-rmrk'
    case 'ksm':
      return 'chain-ksm'
    default:
      return prefix
  }
}

const getVariables = (search) => {
  const { searchParams } = useSearchParams()
  const route = useRoute()

  return search?.length
    ? { search }
    : {
        search: searchParams.value,
        priceMin: Number(route.query.min),
        priceMax: Number(route.query.max),
      }
}

const getOrdering = () => {
  const route = useRoute()

  return route.query.sort?.length ? route.query.sort : ['blockNumber_DESC']
}

const getNewNfts = (loadDirection, oldNfts, nFTEntities) => {
  if (loadDirection === 'up') {
    return nFTEntities.concat(oldNfts)
  }
  return oldNfts.value.concat(nFTEntities)
}

export function useFetchSearch({
  first,
  total,
  isFetchingData,
  resetSearch,
  isLoading,
}: {
  first: Ref<number>
  total: Ref<number>
  isFetchingData: Ref<boolean>
  isLoading: Ref<boolean>
  resetSearch: () => void
}) {
  const { $apollo } = useNuxtApp()
  const { client, urlPrefix } = usePrefix()
  const route = useRoute()

  const nfts = ref<NFTWithMetadata[]>([])
  const loadedPages = ref([] as number[])

  async function fetchSearch({
    page = 1,
    loadDirection = 'down',
    search,
  }: FetchSearchParams) {
    if (isFetchingData.value) {
      return false
    }
    isFetchingData.value = true

    const queryPath = getQueryPath(client.value)
    const query = await resolveQueryPath(queryPath, 'nftListWithSearch')
    const result = await $apollo.query({
      query: query.default,
      client: client.value,
      variables: {
        ...getVariables(search),
        first: first.value,
        offset: (page - 1) * first.value,
        denyList: getDenyList(urlPrefix.value),
        orderBy: getOrdering(),
      },
    })

    // handle results
    const { nFTEntities, nftEntitiesConnection } = result.data

    total.value = nftEntitiesConnection.totalCount

    if (!loadedPages.value.includes(page)) {
      nfts.value = getNewNfts(loadDirection, nfts.value, nFTEntities)
      loadedPages.value.push(page)
    }

    isFetchingData.value = false
    isLoading.value = false
    return true
  }

  const refetch = (search?: { [key: string]: string | number }[]) => {
    nfts.value = []
    fetchSearch({ search })
  }

  watch(
    [
      () => route.query.sort,
      () => route.query.search,
      () => route.query.listed,
      () => route.query.min,
      () => route.query.max,
      () => route.query.owned,
      () => route.query.collections,
    ],
    () => {
      loadedPages.value = []
      resetSearch()
    }
  )

  return {
    nfts,
    fetchSearch,
    refetch,
  }
}
