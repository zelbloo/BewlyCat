<script setup lang="ts">
import { settings } from '~/logic'
import { useTopBarStore } from '~/stores/topBarStore'

const {
  showSearchBar,
  forceWhiteIcon,
} = useTopBarStore()
</script>

<template>
  <div flex="inline 1 md:justify-center items-center" w="full">
    <Transition name="slide-out">
      <SearchBar
        v-if="showSearchBar"
        class="search-bar"
        :style="{
          '--b-search-bar-normal-color': settings.disableFrostedGlass ? 'var(--bew-elevated)' : 'color-mix(in oklab, var(--bew-elevated-solid), transparent 60%)',
          '--b-search-bar-hover-color': 'var(--bew-elevated-hover)',
          '--b-search-bar-focus-color': 'var(--bew-elevated)',
          '--b-search-bar-normal-icon-color': forceWhiteIcon && !settings.disableFrostedGlass ? 'white' : 'var(--bew-text-1)',
          '--b-search-bar-normal-text-color': forceWhiteIcon && !settings.disableFrostedGlass ? 'white' : 'var(--bew-text-1)',
        }"
      />
    </Transition>
  </div>
</template>
