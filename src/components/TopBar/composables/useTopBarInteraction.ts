import { onClickOutside } from '@vueuse/core'
import { reactive, ref } from 'vue'

import { useDelayedHover } from '~/composables/useDelayedHover'
import { settings } from '~/logic'
import { useTopBarStore } from '~/stores/topBarStore'
import { createTransformer } from '~/utils/transformer'

export function useTopBarInteraction() {
  const topBarStore = useTopBarStore()
  const { popupVisible, closeAllPopups } = topBarStore

  // 顶栏元素引用
  const topBarItemElements = reactive({})
  const topBarTransformers = reactive({})

  // 跟踪鼠标是否在弹窗上
  const isMouseOverPopup = reactive<Record<string, boolean>>({})

  // 当前点击的顶栏项
  const currentClickedTopBarItem = ref<string | null>(null)

  // 设置顶栏项悬停事件
  function setupTopBarItemHoverEvent(key: string) {
    const element = useDelayedHover({
      enterDelay: 320,
      leaveDelay: 320,
      beforeEnter: () => closeAllPopups(key),
      enter: () => {
        popupVisible[key] = true
      },
      leave: () => {
        // 只有当鼠标不在弹窗上时才隐藏
        setTimeout(() => {
          if (!isMouseOverPopup[key]) {
            popupVisible[key] = false
          }
        }, 200)
      },
    })

    topBarItemElements[key] = element
    return element
  }

  // 设置顶栏项变换器
  function setupTopBarItemTransformer(key: string) {
    const transformer = createTransformer(topBarItemElements[key], {
      x: '0px',
      y: '50px',
      centerTarget: {
        x: true,
      },
    })

    topBarTransformers[key] = transformer
    return transformer
  }

  // 处理顶栏项点击
  function handleClickTopBarItem(event: MouseEvent, key: string) {
    if (settings.value.touchScreenOptimization) {
      event.preventDefault()
      closeAllPopups(key)
      popupVisible[key] = !popupVisible[key]
      currentClickedTopBarItem.value = key
    }
  }

  // 新增：注册顶栏项元素和变换器
  // 修改 registerTopBarItem 方法
  function registerTopBarItem(key: string, element: HTMLElement | null, transformer: any) {
    if (element) {
      // 注册元素
      topBarItemElements[key] = element

      // 设置悬停事件
      if (!settings.value.touchScreenOptimization) {
        // 鼠标进入图标时显示弹窗
        element.addEventListener('mouseenter', () => {
          closeAllPopups(key)
          popupVisible[key] = true
        })

        // 鼠标离开图标时，检查是否进入了弹窗
        element.addEventListener('mouseleave', () => {
          // 延迟处理，给用户足够时间移动到弹窗
          setTimeout(() => {
            if (!topBarStore.getMouseOverPopup(key)) {
              popupVisible[key] = false
            }
          }, 200)
        })
      }

      // 注册变换器
      if (transformer) {
        topBarTransformers[key] = transformer
      }
    }
  }

  // 设置顶栏项
  function setupTopBarItems() {
    const channels = setupTopBarItemHoverEvent('channels')
    const avatar = setupTopBarItemHoverEvent('userPanel')
    const notifications = setupTopBarItemHoverEvent('notifications')
    const moments = setupTopBarItemHoverEvent('moments')
    const favorites = setupTopBarItemHoverEvent('favorites')
    const history = setupTopBarItemHoverEvent('history')
    const watchLater = setupTopBarItemHoverEvent('watchLater')
    const upload = setupTopBarItemHoverEvent('upload')
    const more = setupTopBarItemHoverEvent('more')

    const avatarTransformer = setupTopBarItemTransformer('userPanel')
    const notificationsTransformer = setupTopBarItemTransformer('notifications')
    const momentsTransformer = setupTopBarItemTransformer('moments')
    const favoritesTransformer = setupTopBarItemTransformer('favorites')
    const historyTransformer = setupTopBarItemTransformer('history')
    const watchLaterTransformer = setupTopBarItemTransformer('watchLater')
    const uploadTransformer = setupTopBarItemTransformer('upload')
    const moreTransformer = setupTopBarItemTransformer('more')

    return {
      // hover items
      channels,
      avatar,
      notifications,
      moments,
      favorites,
      history,
      watchLater,
      upload,
      more,
      // transformers
      avatarTransformer,
      notificationsTransformer,
      momentsTransformer,
      favoritesTransformer,
      historyTransformer,
      watchLaterTransformer,
      uploadTransformer,
      moreTransformer,
    }
  }

  // 设置点击外部关闭弹窗
  function setupClickOutside() {
    onClickOutside(document.body, () => {
      closeAllPopups()
      currentClickedTopBarItem.value = null
    })
  }

  return {
    popupVisible,
    currentClickedTopBarItem,
    handleClickTopBarItem,
    setupTopBarItems,
    setupClickOutside,
    registerTopBarItem, // 导出新增的方法
  }
}
