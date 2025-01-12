<template>
  <div class="flex flex-wrap pb-44">
    <div class="w-1/2 flex flex-col gap-10">
      <!-- Content of the first column -->
      <div class="">
        <h1 class="title is-3 mb-4">{{ $t('codeChecker.title') }}</h1>
        <div class="w-2/3">
          {{ $t('codeChecker.description') }}
        </div>
      </div>

      <div class="py-4 px-5 border border-neutral-5">
        <h2 class="mb-3">{{ $t('codeChecker.resources') }}:</h2>
        <div class="pl-3 flex flex-col gap-3">
          <a
            v-safe-href="'https://hello.kodadot.xyz/tutorial/generative-art'"
            class="flex items-center w-fit"
            target="_blank"
            rel="nofollow noopener noreferrer">
            <div
              class="text-k-blue hover:text-k-blue-hover flex items-center mr-2">
              <NeoIcon icon="circle" pack="fas" class="text-[4px] mr-2" />
              {{ $t('codeChecker.kodahashTemplate') }}
            </div>
            <NeoIcon icon="arrow-up-right" class="text-neutral-7 text-[14px]" />
          </a>

          <a
            v-safe-href="'https://github.com/vikiival/kodahash'"
            class="flex items-center w-fit"
            target="_blank"
            rel="nofollow noopener noreferrer">
            <div
              class="text-k-blue hover:text-k-blue-hover flex items-center mr-2">
              <NeoIcon icon="circle" pack="fas" class="text-[4px] mr-2" />
              {{ $t('codeChecker.learnAboutGenArt') }}
            </div>
            <NeoIcon icon="arrow-up-right" class="text-neutral-7 text-[14px]" />
          </a>
        </div>
      </div>

      <div class="">
        <h2 class="mb-3 title is-4">{{ $t('codeChecker.upload') }}</h2>
        <p class="mb-4">
          {{ $t('codeChecker.uploadInstructions') }}
        </p>
        <CodeCheckerFileUploader
          v-model="selectedFile"
          :file-name="fileName"
          @file-selected="onFileSelected"
          @clear="clear" />
      </div>

      <div class="">
        <h2 class="mb-3 title is-4">{{ $t('codeChecker.codeValidation') }}</h2>
        <p v-if="!selectedFile" class="text-neutral-7">
          {{ $t('codeChecker.uploadPrompt') }}
        </p>
        <div v-else>
          <div v-if="errorMessage" class="text-red-500">
            {{ $t('error') }}: {{ errorMessage }}
          </div>
          <div v-else>
            <div class="flex justify-between items-center">
              <span class="text-neutral-7">{{
                $t('codeChecker.canvasSize')
              }}</span>
              <span>{{ fileValidity.canvasSize }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-neutral-7">
                {{ $t('codeChecker.artName') }}
              </span>
              <span>{{ fileValidity.title }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-neutral-7">{{
                $t('codeChecker.webglSupported')
              }}</span>
              <span>{{ fileValidity.webGLSupported ? 'Yes' : 'No' }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-neutral-7"
                >{{ $t('codeChecker.local') }} p5js</span
              >
              <span>{{ fileValidity.localP5jsUsed ? 'Yes' : 'No' }}</span>
            </div>
          </div>
        </div>
      </div>
      <div
        v-if="selectedFile && !errorMessage"
        class="border-t border-k-shade pt-5 flex flex-col gap-5">
        <CodeCheckerTestItem
          :passed="fileValidity.resizerUsed"
          :description="$t('codeChecker.automaticResize')" />
        <CodeCheckerTestItem
          :passed="fileValidity.validTitle"
          :description="$t('codeChecker.correctHTMLName')" />
        <CodeCheckerTestItem
          :passed="fileValidity.kodaRendererUsed"
          :description="$t('codeChecker.usingKodaHash')" />
        <CodeCheckerTestItem
          :passed="fileValidity.usesHashParam"
          :description="$t('codeChecker.usingParamHash')" />
        <CodeCheckerTestItem
          :passed="fileValidity.renderDurationValid"
          :description="
            $t('codeChecker.variationLoadingTime', [
              (config.maxAllowedLoadTime / 1000).toFixed(0),
            ])
          " />
      </div>
    </div>

    <div class="w-1/2 flex flex-col items-end">
      <!-- Content of the second column -->
      <CodeCheckerPreviewCard
        :selected-file="selectedFile"
        :file-name="fileName"
        :assets="assets"
        :render="Boolean(selectedFile)"
        :koda-renderer-used="fileValidity.kodaRendererUsed" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { NeoIcon } from '@kodadot1/brick'
import { validate } from './validate'
import { createSandboxAssets, extractAssetsFromZip } from './utils'
import config from './codechecker.config'
import { AssetMessage, Validity } from './types'

useEventListener(window, 'message', (res) => {
  if (res.data?.type === 'kodahash/render/completed') {
    renderEndTime.value = performance.now()
    const duration = renderEndTime.value - renderStartTime.value
    fileValidity.renderDurationValid = duration < config.maxAllowedLoadTime
  }
})

const validtyDefault: Validity = {
  canvasSize: '',
  webGLSupported: false,
  localP5jsUsed: false,
  kodaRendererUsed: 'unknown',
  resizerUsed: false,
  usesHashParam: false,
  validTitle: false,
  renderDurationValid: 'loading',
  title: '-',
}

const selectedFile = ref<File | null>(null)
const assets = ref<AssetMessage[]>([])
const fileName = computed(() => selectedFile.value?.name)
const fileValidity = reactive<Validity>({ ...validtyDefault })
const errorMessage = ref('')
const renderStartTime = ref(0)
const renderEndTime = ref(0)

const onFileSelected = async (file: File) => {
  clear()
  renderStartTime.value = performance.now()
  selectedFile.value = file
  const { indexFile, sketchFile, entries } = await extractAssetsFromZip(file)

  if (!sketchFile) {
    errorMessage.value = `Sketch file not found: ${config.sketchFile}`
    return
  }
  const valid = validate(indexFile.content, sketchFile.content)
  if (!valid.isSuccess) {
    errorMessage.value = valid.error ?? 'Unknown error'
  } else {
    Object.assign(fileValidity, valid.value)
  }

  if (!fileValidity.kodaRendererUsed) {
    fileValidity.renderDurationValid = 'unknown'
  }

  assets.value = await createSandboxAssets(indexFile, entries)
}

const clear = () => {
  selectedFile.value = null
  assets.value = []
  errorMessage.value = ''
  Object.assign(fileValidity, validtyDefault)
}
</script>
