<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed } from 'vue'

import { settings } from '~/logic'
import { useTopBarStore } from '~/stores/topBarStore'

const topBarStore = useTopBarStore()

const {
  showSearchBar,
  forceWhiteIcon,
} = storeToRefs(topBarStore)

// 可以考虑添加一个计算属性来处理样式
const searchBarStyles = computed(() => ({
  '--b-search-bar-normal-color': settings.value.disableFrostedGlass ? 'var(--bew-elevated)' : 'color-mix(in oklab, var(--bew-elevated-solid), transparent 60%)',
  '--b-search-bar-hover-color': 'var(--bew-elevated-hover)',
  '--b-search-bar-focus-color': 'var(--bew-elevated)',
  '--b-search-bar-normal-icon-color': forceWhiteIcon.value && !settings.value.disableFrostedGlass ? 'white' : 'var(--bew-text-1)',
  '--b-search-bar-normal-text-color': forceWhiteIcon.value && !settings.value.disableFrostedGlass ? 'white' : 'var(--bew-text-1)',
}))
</script>

<template>
  <div flex="inline 1 md:justify-center items-center" w="full">
    <Transition name="slide-out">
      <SearchBar
        v-if="showSearchBar"
        class="search-bar"
        :style="searchBarStyles"
      />
    </Transition>
  </div>
</template>
