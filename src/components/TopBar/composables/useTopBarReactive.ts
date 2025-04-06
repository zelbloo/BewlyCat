import { useWindowFocus } from '@vueuse/core'
import type { Ref } from 'vue'
import { computed, nextTick, watch } from 'vue'

import { useBewlyApp } from '~/composables/useAppProvider'
import { AppPage } from '~/enums/appEnums'
import { settings } from '~/logic'
import { isHomePage, isInIframe } from '~/utils/main'

import {
  ACCOUNT_URL,
  BANGUMI_PLAY_URL,
  CHANNEL_PAGE_URL,
  CREATOR_PLATFORM_URL,
  MESSAGE_URL,
  MOMENTS_URL,
  READ_HOME_URL,
  READ_PREVIEW_URL,
  SEARCH_PAGE_URL,
  SPACE_URL,
  VIDEO_LIST_URL,
  VIDEO_PAGE_URL,
} from '../constants/urls'
import type { PopupVisibleState } from '../types'

export function useTopBarReactive() {
  const { activatedPage, reachTop } = useBewlyApp()

  const isSearchPage = computed((): boolean => {
    return SEARCH_PAGE_URL.test(location.href)
  })

  const forceWhiteIcon = computed((): boolean => {
    if (
      (isHomePage() && settings.value.useOriginalBilibiliHomepage)
      || (isInIframe() && isHomePage())
      || (CHANNEL_PAGE_URL.test(location.href) && !VIDEO_PAGE_URL.test(location.href))
      || SPACE_URL.test(location.href)
      || ACCOUNT_URL.test(location.href)
    ) {
      return true
    }

    if (!isHomePage())
      return false

    if (activatedPage.value === AppPage.Search) {
      if (settings.value.individuallySetSearchPageWallpaper) {
        if (settings.value.searchPageWallpaper)
          return true
        return false
      }
      return !!settings.value.wallpaper
    }
    else {
      if (settings.value.wallpaper)
        return true

      if (settings.value.useSearchPageModeOnHomePage) {
        if (settings.value.individuallySetSearchPageWallpaper && !!settings.value.searchPageWallpaper)
          return true
        else if (settings.value.wallpaper)
          return true
      }
    }
    return false
  })

  const showSearchBar = computed((): boolean => {
    if (isHomePage()) {
      if (settings.value.useOriginalBilibiliHomepage)
        return true
      if (activatedPage.value === AppPage.Search)
        return false
      if (settings.value.useSearchPageModeOnHomePage && activatedPage.value === AppPage.Home && reachTop.value)
        return false
    }
    else {
      if (isSearchPage.value)
        return false
    }
    return true
  })

  const isTopBarFixed = computed((): boolean => {
    if (
      isHomePage()
      || VIDEO_LIST_URL.test(location.href)
      || BANGUMI_PLAY_URL.test(location.href)
      || MOMENTS_URL.test(location.href)
      || CHANNEL_PAGE_URL.test(location.href)
      || READ_HOME_URL.test(location.href)
      || ACCOUNT_URL.test(location.href)
    ) {
      return true
    }

    return false
  })

  const showTopBar = computed((): boolean => {
    if (
      CREATOR_PLATFORM_URL.test(location.href)
      || READ_PREVIEW_URL.test(location.href)
    ) {
      return false
    }

    if (settings.value.showTopBar)
      return true
    return false
  })

  return {
    isSearchPage,
    forceWhiteIcon,
    showSearchBar,
    isTopBarFixed,
    showTopBar,
  }
}

export function setupTopBarWatchers({
  isLogin,
  popupVisible,
  drawerVisible,
  getUnreadMessageCount,
  getTopBarNewMomentsCount,
  toggleTopBarVisible,
  favoritesTransformer,
}: {
  isLogin: Ref<boolean>
  popupVisible: PopupVisibleState
  drawerVisible: { notifications: boolean }
  getUnreadMessageCount: () => Promise<void>
  getTopBarNewMomentsCount: () => Promise<void>
  toggleTopBarVisible: (visible: boolean) => void
  favoritesTransformer: Ref<any>
}) {
  // 自动隐藏顶栏设置监听
  watch(() => settings.value.autoHideTopBar, (newVal) => {
    if (!newVal)
      toggleTopBarVisible(true)
  })

  // 通知相关监听
  watch(
    () => popupVisible.notifications,
    (newVal, oldVal) => {
      if (oldVal === undefined && MESSAGE_URL.test(location.href))
        return

      if (newVal === oldVal)
        return

      if (!newVal)
        getUnreadMessageCount()
    },
    { immediate: true },
  )

  watch(
    () => drawerVisible.notifications,
    (newVal, oldVal) => {
      if (newVal === oldVal)
        return

      if (!newVal)
        getUnreadMessageCount()
    },
  )

  // 窗口焦点监听
  const focused = useWindowFocus()
  watch(() => focused.value, (newVal) => {
    if (newVal && isLogin.value)
      getUnreadMessageCount()
  })

  // 动态相关监听
  watch(
    () => popupVisible.moments,
    async (newVal, oldVal) => {
      if (newVal === oldVal)
        return

      if (!newVal)
        await getTopBarNewMomentsCount()
    },
    { immediate: true },
  )

  // 收藏夹相关监听
  watch(() => popupVisible.favorites, (newVal, oldVal) => {
    if (newVal === oldVal)
      return
    if (newVal) {
      nextTick(() => {
        if (favoritesTransformer.value)
          favoritesTransformer.value.refreshFavoriteResources()
      })
    }
  })
}
