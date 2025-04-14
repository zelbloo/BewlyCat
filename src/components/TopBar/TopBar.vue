<script setup lang="ts">
import { onKeyStroke, useMouseInElement } from '@vueuse/core'
import { nextTick, onMounted, onUnmounted, provide, ref } from 'vue'

import { useBewlyApp } from '~/composables/useAppProvider'
import { useDark } from '~/composables/useDark'
import { OVERLAY_SCROLL_BAR_SCROLL, TOP_BAR_VISIBILITY_CHANGE } from '~/constants/globalEvents'
import { settings } from '~/logic'
import { useTopBarStore } from '~/stores/topBarStore'
import { isHomePage } from '~/utils/main'
import emitter from '~/utils/mitt'

import NotificationsDrawer from './components/NotificationsDrawer.vue'
import TopBarHeader from './components/TopBarHeader.vue'
import { useTopBarInteraction } from './composables/useTopBarInteraction'
import type { TopBarInteraction } from './types'

const { scrollbarRef, reachTop } = useBewlyApp()
// 顶栏状态管理
const topBarStore = useTopBarStore()

const { isDark } = useDark()

// 顶栏交互逻辑 - 确保正确初始化并提供给子组件
const topBarInteraction = useTopBarInteraction()
// // 显式提供 TopBarInteraction 类型
provide<TopBarInteraction>('topBarInteraction', topBarInteraction)

// 顶栏显示控制
const hideTopBar = ref<boolean>(false)
const headerTarget = ref(null)
const { isOutside: isOutsideTopBar } = useMouseInElement(headerTarget)

// 滚动处理
const scrollTop = ref<number>(0)
const oldScrollTop = ref<number>(0)

function handleScroll() {
  if (isHomePage() && !settings.value.useOriginalBilibiliHomepage) {
    const osInstance = scrollbarRef.value?.osInstance()
    scrollTop.value = osInstance.elements().viewport.scrollTop as number
  }
  else {
    scrollTop.value = document.documentElement.scrollTop
  }

  if (scrollTop.value === 0)
    toggleTopBarVisible(true)

  if (settings.value.autoHideTopBar && isOutsideTopBar && scrollTop.value !== 0) {
    if (scrollTop.value > oldScrollTop.value)
      toggleTopBarVisible(false)
    else
      toggleTopBarVisible(true)
  }

  oldScrollTop.value = scrollTop.value
}

function toggleTopBarVisible(visible: boolean) {
  hideTopBar.value = !visible
  emitter.emit(TOP_BAR_VISIBILITY_CHANGE, visible)
}

function setupScrollListeners() {
  toggleTopBarVisible(true)
  emitter.off(OVERLAY_SCROLL_BAR_SCROLL)
  if (isHomePage() && !settings.value.useOriginalBilibiliHomepage) {
    emitter.on(OVERLAY_SCROLL_BAR_SCROLL, () => {
      handleScroll()
    })
  }
  else {
    window.addEventListener('scroll', handleScroll)
  }
}

function cleanupScrollListeners() {
  window.removeEventListener('scroll', handleScroll)
  emitter.off(OVERLAY_SCROLL_BAR_SCROLL)
}

// 生命周期钩子
onMounted(() => {
  nextTick(() => {
    // 先初始化数据
    topBarStore.initData()
    topBarInteraction.setupClickOutside()

    // 启动定时器
    topBarStore.startUpdateTimer()

    // 确保 setupTopBarItems 返回值存在再传递给 setupWatchers
    const items = topBarInteraction.setupTopBarItems()
    topBarStore.setupWatchers(
      toggleTopBarVisible,
      items?.favoritesTransformer || { value: null },
    )

    setupScrollListeners()
  })
})

onUnmounted(() => {
  cleanupScrollListeners()
  // 使用 store 中的方法清理定时器
  topBarStore.cleanup()
})

// 快捷键
onKeyStroke('/', () => {
  toggleTopBarVisible(true)
})

defineExpose({
  toggleTopBarVisible,
  handleScroll,
})
</script>

<template>
  <Transition name="top-bar">
    <header
      v-if="topBarStore.showTopBar"
      ref="headerTarget"
      w="full" transition="all 300 ease-in-out"
      :class="{ 'hide': hideTopBar, 'force-white-icon': topBarStore.forceWhiteIcon }"
      :style="{ position: topBarStore.isTopBarFixed ? 'fixed' : 'absolute' }"
    >
      <TopBarHeader
        :force-white-icon="topBarStore.forceWhiteIcon"
        :reach-top="reachTop"
        :is-dark="isDark"
      />

      <KeepAlive v-if="settings.openNotificationsPageAsDrawer">
        <NotificationsDrawer
          v-if="topBarStore.drawerVisible.notifications"
          :url="topBarStore.notificationsDrawerUrl"
          @close="topBarStore.drawerVisible.notifications = false"
        />
      </KeepAlive>
    </header>
  </Transition>
</template>

<style lang="scss" scoped>
@import "./styles/index.scss";
</style>
