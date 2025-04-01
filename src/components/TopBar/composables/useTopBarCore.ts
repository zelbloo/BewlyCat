import type { Ref, UnwrapNestedRefs } from 'vue'
import { reactive, ref } from 'vue'

import api from '~/utils/api'

import { updateInterval } from '../notify'
import type { UnReadDm, UnReadMessage, UserInfo } from '../types'

export function useTopBarCore() {
  // Refs
  const headerTarget = ref(null)
  const logo = ref<HTMLElement>() as Ref<HTMLElement>
  const avatarImg = ref<HTMLImageElement>() as Ref<HTMLImageElement>
  const avatarShadow = ref<HTMLImageElement>() as Ref<HTMLImageElement>

  // User State
  const isLogin = ref<boolean>(true)
  const userInfo = reactive<UserInfo | NonNullable<unknown>>({}) as UnwrapNestedRefs<UserInfo>

  // Notifications State
  const unReadMessage = reactive<UnReadMessage | NonNullable<unknown>>({}) as UnwrapNestedRefs<UnReadMessage>
  const unReadDm = reactive<UnReadDm>({} as UnwrapNestedRefs<UnReadDm>)
  const unReadMessageCount = ref<number>(0)

  // Moments State
  const newMomentsCount = ref<number>(0)

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

    let result = 0

    try {
      let res = await api.notification.getUnreadMsg()
      if (res.code === 0) {
        Object.assign(unReadMessage, res.data)
        Object.entries(unReadMessage).forEach(([key, value]) => {
          if (key !== 'up' && key !== 'recv_reply' && key !== 'recv_like') {
            if (typeof value === 'number')
              result += value
          }
        })
      }

      res = await api.notification.getUnreadDm()
      if (res.code === 0) {
        Object.assign(unReadDm, res.data)
        if (typeof unReadDm.follow_unread === 'number')
          result += unReadDm.follow_unread
      }
    }
    catch (error) {
      console.error(error)
    }
    finally {
      unReadMessageCount.value = result
    }
  }

  // Moments Methods
  async function getTopBarNewMomentsCount() {
    if (!isLogin.value)
      return

    let result = 0
    try {
      const res = await api.moment.getTopBarNewMomentsCount()
      if (res.code === 0 && typeof res.data.update_info.item.count === 'number')
        result = res.data.update_info.item.count
    }
    finally {
      newMomentsCount.value = result
    }
  }

  // Init Methods
  async function initData() {
    await getUserInfo()
    setInterval(() => {
      getUnreadMessageCount()
      getTopBarNewMomentsCount()
    }, updateInterval)
  }

  return {
    // Refs
    headerTarget,
    logo,
    avatarImg,
    avatarShadow,

    // User State
    isLogin,
    userInfo,

    // Notifications State
    unReadMessage,
    unReadDm,
    unReadMessageCount,

    // Moments State
    newMomentsCount,

    // Methods
    initData,
    getUserInfo,
    getUnreadMessageCount,
    getTopBarNewMomentsCount,
  }
}
