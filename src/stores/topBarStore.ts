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
import { getCSRF, isHomePage, isInIframe } from '~/utils/main'

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
  // 添加 Moments 相关状态
  const moments = reactive<any[]>([])
  const addedWatchLaterList = reactive<number[]>([])
  const isLoadingMoments = ref<boolean>(false)
  const noMoreMomentsContent = ref<boolean>(false)
  const livePage = ref<number>(1)
  const momentUpdateBaseline = ref<string>('')
  const momentOffset = ref<string>('')

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
  async function getTopBarNewMomentsCount(selectedType: string = 'video') {
    if (!isLogin.value || isLoadingMoments.value)
      return

    try {
      isLoadingMoments.value = true

      const res = await api.moment.getTopBarMoments({
        type: selectedType,
        update_baseline: momentUpdateBaseline.value || undefined,
      })

      if (res.code === 0) {
        const { update_num, update_baseline, items, has_more } = res.data

        // 更新计数
        newMomentsCount.value = update_num

        // 如果有更新内容且不是在弹窗中，则更新基准线
        if (update_baseline && !popupVisible.moments)
          momentUpdateBaseline.value = update_baseline

        // 如果弹窗打开且有新内容，则添加到列表顶部
        if (popupVisible.moments && update_num > 0 && items?.length) {
          for (let i = update_num - 1; i >= 0; i--) {
            moments.unshift({
              type: selectedType,
              title: items[i].title,
              author: items[i].author.name,
              authorFace: items[i].author.face,
              authorJumpUrl: items[i].author.jump_url,
              pubTime: items[i].pub_time,
              cover: items[i].cover,
              link: items[i].jump_url,
              rid: items[i].rid,
            })
          }
        }

        // 更新是否有更多内容的标志
        if (has_more === false)
          noMoreMomentsContent.value = true
      }
    }
    catch (error) {
      console.error(error)
    }
    finally {
      isLoadingMoments.value = false
    }
  }

  function initMomentsData(selectedType: string) {
    // 重置所有相关状态
    moments.length = 0
    momentUpdateBaseline.value = ''
    momentOffset.value = ''
    newMomentsCount.value = 0
    livePage.value = 1
    noMoreMomentsContent.value = false

    // 获取初始数据
    getMomentsData(selectedType)
  }

  function getMomentsData(selectedType: string) {
    if (selectedType !== 'live')
      getTopBarMoments(selectedType)
    else
      getTopBarLiveMoments()
  }

  // 移除 checkIfHasNewMomentsThenUpdateMoments 函数，合并到 getTopBarNewMomentsCount

  function getTopBarMoments(selectedType: string) {
    if (isLoadingMoments.value || noMoreMomentsContent.value)
      return

    isLoadingMoments.value = true
    api.moment.getTopBarMoments({
      type: selectedType,
      update_baseline: momentUpdateBaseline.value || undefined,
      offset: momentOffset.value || undefined,
    })
      .then((res: any) => {
        if (res.code === 0) {
          const { has_more, items, offset, update_baseline, update_num } = res.data

          if (!has_more) {
            noMoreMomentsContent.value = true
            return
          }

          // 更新状态
          newMomentsCount.value = update_num
          momentUpdateBaseline.value = update_baseline
          momentOffset.value = offset

          // 添加新内容
          if (items?.length) {
            moments.push(
              ...items.map((item: any) => ({
                type: selectedType,
                title: item.title,
                author: item.author.name,
                authorFace: item.author.face,
                authorJumpUrl: item.author.jump_url,
                pubTime: item.pub_time,
                cover: item.cover,
                link: item.jump_url,
                rid: item.rid,
              })),
            )
          }
        }
      })
      .catch(error => console.error(error))
      .finally(() => isLoadingMoments.value = false)
  }

  function getTopBarLiveMoments() {
    if (isLoadingMoments.value)
      return
    if (noMoreMomentsContent.value)
      return

    isLoadingMoments.value = true
    const pageSize = 10
    api.moment.getTopBarLiveMoments({
      page: livePage.value,
      pagesize: pageSize,
    })
      .then((res: any) => {
        if (res.code === 0) {
          const { list } = res.data

          // if the length of this list is less then the pageSize, it means that it have no more contents
          if (list.length < pageSize) {
            noMoreMomentsContent.value = true
          }

          // if the length of this list is equal to the pageSize, this means that it may have the next page.
          if (list.length === pageSize)
            livePage.value++

          moments.push(
            ...list.map((item: any) => ({
              type: 'live',
              title: item.title,
              author: item.uname,
              authorFace: item.face,
              cover: item.pic,
              link: item.link,
            }),
            ),
          )
        }
      })
      .finally(() => isLoadingMoments.value = false)
  }

  function isNewMoment(index: number) {
    return index < newMomentsCount.value
  }

  function toggleWatchLater(aid: number) {
    const isInWatchLater = addedWatchLaterList.includes(aid)

    if (!isInWatchLater) {
      api.watchlater.saveToWatchLater({
        aid,
        csrf: getCSRF(),
      })
        .then((res: any) => {
          if (res.code === 0)
            addedWatchLaterList.push(aid)
        })
    }
    else {
      api.watchlater.removeFromWatchLater({
        aid,
        csrf: getCSRF(),
      })
        .then((res: any) => {
          if (res.code === 0) {
            addedWatchLaterList.length = 0
            Object.assign(addedWatchLaterList, addedWatchLaterList.filter(item => item !== aid))
          }
        })
    }
  }

  function handleNotificationsItemClick(item: { name: string, url: string, unreadCount: number, icon: string }) {
    if (settings.value.openNotificationsPageAsDrawer) {
      drawerVisible.notifications = true
      notificationsDrawerUrl.value = item.url
    }
  }

  function closeAllPopups(exceptionKey?: string) {
    Object.keys(popupVisible).forEach((key) => {
      if (key !== exceptionKey)
        popupVisible[key as keyof typeof popupVisible] = false
    })
  }

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

    const focused = useWindowFocus()
    watch(() => focused.value, (newVal) => {
      if (newVal && isLogin.value)
        getUnreadMessageCount()
    })

    watch(
      () => popupVisible.moments,
      async (newVal, oldVal) => {
        if (newVal === oldVal)
          return

        // 只在弹窗打开或关闭时更新
        if (isLogin.value) {
          if (newVal) {
            // 弹窗打开时，如果没有内容则初始化
            if (moments.length === 0)
              await getTopBarMoments('video')
          }
          else {
            // 弹窗关闭时更新计数
            await getTopBarNewMomentsCount('video')
          }
        }
      },
      { immediate: true },
    )

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

  let updateTimer: ReturnType<typeof setInterval> | null = null

  function initData() {
    getUserInfo()
    getUnreadMessageCount()
    getTopBarNewMomentsCount()
    startUpdateTimer()
  }

  function startUpdateTimer() {
    if (updateTimer) {
      clearInterval(updateTimer)
      updateTimer = null
    }
    updateTimer = setInterval(() => {
      if (isLogin.value) {
        getUnreadMessageCount()
        // 只有在弹窗未显示时才更新计数，避免与 watch 重复调用
        if (!popupVisible.moments)
          getTopBarNewMomentsCount()
      }
    }, updateInterval)
  }
  function stopUpdateTimer() {
    if (updateTimer) {
      clearInterval(updateTimer)
      updateTimer = null
    }
  }

  function cleanup() {
    stopUpdateTimer()

    Object.keys(unReadMessage).forEach((key) => {
      unReadMessage[key as keyof UnReadMessage] = 0
    })
    Object.keys(unReadDm).forEach((key) => {
      unReadDm[key as keyof UnReadDm] = 0
    })
    newMomentsCount.value = 0

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

    // 添加新的导出
    moments,
    addedWatchLaterList,
    isLoadingMoments,
    noMoreMomentsContent,
    livePage,
    momentUpdateBaseline,
    momentOffset,

    // 添加新的方法导出
    initMomentsData,
    getMomentsData,
    isNewMoment,
    toggleWatchLater,
  }
})
