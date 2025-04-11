import { useWindowFocus } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed, nextTick, reactive, ref, watch } from 'vue'

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
} from '~/components/TopBar/constants/urls'
import { updateInterval } from '~/components/TopBar/notify'
import type { UnReadDm, UnReadMessage, UserInfo } from '~/components/TopBar/types'
import { useBewlyApp } from '~/composables/useAppProvider'
import { AppPage } from '~/enums/appEnums'
import { settings } from '~/logic'
import api from '~/utils/api'
import { isHomePage, isInIframe } from '~/utils/main'

export const useTopBarStore = defineStore('topBar', () => {
  const isLogin = ref<boolean>(true)
  const userInfo = reactive<UserInfo>({} as UserInfo)
  const logo = ref<HTMLElement>() as Ref<HTMLElement>
  const avatarImg = ref<HTMLElement>() as Ref<HTMLElement>
  const avatarShadow = ref<HTMLElement>() as Ref<HTMLElement>

  const unReadMessage = reactive<UnReadMessage>({} as UnReadMessage)
  const unReadDm = reactive<UnReadDm>({} as UnReadDm)

  // 移除 unReadMessageCount 计算属性

  // Moments State
  const newMomentsCount = ref<number>(0)

  // UI State
  const drawerVisible = reactive({
    notifications: false,
  })
  const notificationsDrawerUrl = ref<string>('https://message.bilibili.com/')
  const popupVisible = reactive({
    channels: false,
    userPanel: false,
    notifications: false,
    moments: false,
    favorites: false,
    history: false,
    watchLater: false,
    upload: false,
    more: false,
  })

  // 从 useTopBarReactive 整合的状态
  const { activatedPage, reachTop } = useBewlyApp()

  // 从 useTopBarReactive 整合的计算属性
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

  // User Methods
  async function getUserInfo() {
    try {
      const res = await api.user.getUserInfo()
      if (res.code === 0) {
        isLogin.value = true
        Object.assign(userInfo, res.data)
      }
      else if (res.code === -101) {
        isLogin.value = false
      }
    }
    catch (error) {
      isLogin.value = false
      console.error(error)
    }
  }

  // Notification Methods
  async function getUnreadMessageCount() {
    if (!isLogin.value)
      return

    try {
      let res = await api.notification.getUnreadMsg()
      if (res.code === 0) {
        Object.assign(unReadMessage, res.data)
      }

      res = await api.notification.getUnreadDm()
      if (res.code === 0) {
        Object.assign(unReadDm, res.data)
      }
    }
    catch (error) {
      console.error(error)
    }
  }

  // Moments Methods
  async function getTopBarNewMomentsCount() {
    if (!isLogin.value)
      return

    try {
      // 修正API调用路径
      const res = await api.moment.getTopBarNewMomentsCount()
      if (res.code === 0 && typeof res.data.update_info.item.count === 'number')
        newMomentsCount.value = res.data.update_info.item.count
    }
    catch (error) {
      console.error(error)
    }
  }

  // Notification Drawer Methods
  function handleNotificationsItemClick(item: { name: string, url: string, unreadCount: number, icon: string }) {
    if (settings.value.openNotificationsPageAsDrawer) {
      drawerVisible.notifications = true
      notificationsDrawerUrl.value = item.url
    }
  }

  // Popup Methods
  function closeAllPopups(exceptionKey?: string) {
    Object.keys(popupVisible).forEach((key) => {
      if (key !== exceptionKey)
        popupVisible[key as keyof typeof popupVisible] = false
    })
  }

  // 从 setupTopBarWatchers 整合的方法
  function setupWatchers(toggleTopBarVisible: (visible: boolean) => void, favoritesTransformer: Ref<any>) {
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

  // 添加全局定时器引用
  let updateTimer: ReturnType<typeof setInterval> | null = null

  // Init Method
  function initData() {
    getUserInfo()
    getUnreadMessageCount()
    getTopBarNewMomentsCount()

    // 启动定时更新
    startUpdateTimer()
  }

  // 添加单独的定时器管理函数
  function startUpdateTimer() {
    // 确保不会创建多个定时器
    if (updateTimer) {
      clearInterval(updateTimer)
      updateTimer = null
    }

    // 创建新的定时器
    updateTimer = setInterval(() => {
      if (isLogin.value) {
        getUnreadMessageCount()
        getTopBarNewMomentsCount()
      }
    }, updateInterval)
  }

  // 清理定时器函数
  function stopUpdateTimer() {
    if (updateTimer) {
      clearInterval(updateTimer)
      updateTimer = null
    }
  }

  // 完善清理函数
  function cleanup() {
    // 清理定时器
    stopUpdateTimer()

    // 重置状态
    Object.keys(unReadMessage).forEach((key) => {
      unReadMessage[key as keyof UnReadMessage] = 0
    })
    Object.keys(unReadDm).forEach((key) => {
      unReadDm[key as keyof UnReadDm] = 0
    })
    newMomentsCount.value = 0

    // 关闭所有弹窗
    closeAllPopups()
    drawerVisible.notifications = false
  }

  // 添加鼠标状态跟踪
  const isMouseOverPopup = reactive<Record<string, boolean>>({})

  // 设置鼠标是否在弹窗上
  function setMouseOverPopup(key: string, value: boolean) {
    isMouseOverPopup[key] = value
  }

  // 获取鼠标是否在弹窗上
  function getMouseOverPopup(key: string) {
    return isMouseOverPopup[key] || false
  }

  return {
    // State
    isLogin,
    userInfo,
    unReadMessage,
    logo,
    avatarImg,
    avatarShadow,
    unReadDm,
    // 移除 unReadMessageCount
    newMomentsCount,
    drawerVisible,
    notificationsDrawerUrl,
    popupVisible,

    // 从 useTopBarReactive 整合的计算属性
    isSearchPage,
    forceWhiteIcon,
    showSearchBar,
    isTopBarFixed,
    showTopBar,

    // Methods
    getUserInfo,
    getUnreadMessageCount,
    getTopBarNewMomentsCount,
    handleNotificationsItemClick,
    closeAllPopups,
    initData,
    cleanup,
    isMouseOverPopup,
    setMouseOverPopup,
    getMouseOverPopup,
    setupWatchers,
    startUpdateTimer,
    stopUpdateTimer,
  }
})
