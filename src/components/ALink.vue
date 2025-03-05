<script lang="ts" setup>
import { useBewlyApp } from '~/composables/useAppProvider'
import { settings } from '~/logic'
import { isHomePage } from '~/utils/main'
import { openLinkInBackground } from '~/utils/tabs'

const props = defineProps<{
  href?: string // 修改这里，添加 ? 使其成为可选属性
  title?: string
  rel?: string
  type: 'topBar' | 'videoCard'
  customClickEvent?: boolean
}>()

const emit = defineEmits<{
  (e: 'click', value: MouseEvent): void
}>()

const { openIframeDrawer } = useBewlyApp()

const openMode = computed(() => {
  if (props.type === 'topBar')
    return settings.value.topBarLinkOpenMode
  else if (props.type === 'videoCard')
    return settings.value.videoCardLinkOpenMode
  return 'newTab'
})

// Since BewlyBewly sometimes uses an iframe to open the original Bilibili page in the current tab
// please set the target to `_top` instead of `_self`
const target = computed(() => {
  if (openMode.value === 'newTab') {
    return '_blank'
  }
  if (openMode.value === 'currentTabIfNotHomepage') {
    return isHomePage() ? '_blank' : '_top'
  }
  if (openMode.value === 'currentTab') {
    return '_top'
  }
  return '_top'
})

function handleClick(event: MouseEvent) {
  if (event.ctrlKey || event.metaKey || event.altKey)
    return

  if (props.customClickEvent) {
    event.preventDefault()
    emit('click', event)
    return
  }

  if (openMode.value === 'drawer') {
    event.preventDefault()
    if (props.href)
      openIframeDrawer(props.href)
    return
  }

  if (openMode.value === 'background' && props.href) {
    event.preventDefault()
    openLinkInBackground(props.href)
  }
}
</script>

<template>
  <a
    :href="href ?? 'javascript:void(0)'"
    :target="target"
    :title="title"
    :rel="rel"
    @click="handleClick"
  >
    <slot />
  </a>
</template>
