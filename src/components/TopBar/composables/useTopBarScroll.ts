import type { Ref } from 'vue'
import { ref } from 'vue'

import { OVERLAY_SCROLL_BAR_SCROLL, TOP_BAR_VISIBILITY_CHANGE } from '~/constants/globalEvents'
import { settings } from '~/logic'
import { isHomePage } from '~/utils/main'
import emitter from '~/utils/mitt'

export function useTopBarScroll(
  scrollbarRef: Ref<any>,
  isOutsideTopBar: Ref<boolean>,
) {
  const scrollTop = ref<number>(0)
  const oldScrollTop = ref<number>(0)
  const hideTopBar = ref<boolean>(false)

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

  return {
    scrollTop,
    oldScrollTop,
    hideTopBar,
    handleScroll,
    toggleTopBarVisible,
    setupScrollListeners,
    cleanupScrollListeners,
  }
}
