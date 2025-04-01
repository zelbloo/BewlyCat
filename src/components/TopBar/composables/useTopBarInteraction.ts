import { onClickOutside } from '@vueuse/core'
import { reactive, ref } from 'vue'

import { useDelayedHover } from '~/composables/useDelayedHover'
import { settings } from '~/logic'
import { createTransformer } from '~/utils/transformer'

import type { PopupVisibleState, TopBarItemElements, TopBarTransformers } from '../types'

export function useTopBarInteraction() {
  // Popup States
  const popupVisible = reactive<PopupVisibleState>({
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

  const currentClickedTopBarItem = ref<keyof PopupVisibleState | null>(null)
  const topBarItemElements: TopBarItemElements = {}
  const topBarTransformers: TopBarTransformers = {}

  // Popup Methods
  function closeAllTopBarPopup(exceptionKey?: keyof PopupVisibleState) {
    Object.keys(popupVisible).forEach((key) => {
      if (key !== exceptionKey)
        popupVisible[key as keyof PopupVisibleState] = false
    })
  }

  function setupTopBarItemHoverEvent(key: keyof PopupVisibleState) {
    const element = useDelayedHover({
      enterDelay: 320,
      leaveDelay: 320,
      beforeEnter: () => closeAllTopBarPopup(key),
      enter: () => {
        popupVisible[key] = true
      },
      leave: () => {
        popupVisible[key] = false
      },
    })

    topBarItemElements[key] = element
    return element
  }

  function setupTopBarItemTransformer(key: keyof PopupVisibleState) {
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

  function handleClickTopBarItem(event: MouseEvent, key: keyof PopupVisibleState) {
    if (settings.value.touchScreenOptimization) {
      event.preventDefault()
      closeAllTopBarPopup(key)
      popupVisible[key] = !popupVisible[key]
      currentClickedTopBarItem.value = key
    }
  }

  function setupClickOutside() {
    Object.entries(topBarItemElements).forEach(([key, element]) => {
      onClickOutside(element, () => {
        if (currentClickedTopBarItem.value === key)
          popupVisible[key as keyof PopupVisibleState] = false
      })
    })
  }

  // Setup TopBar Items
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

  return {
    // States
    popupVisible,
    currentClickedTopBarItem,
    topBarItemElements,
    topBarTransformers,

    // Methods
    closeAllTopBarPopup,
    setupTopBarItemHoverEvent,
    setupTopBarItemTransformer,
    handleClickTopBarItem,
    setupClickOutside,
    setupTopBarItems,
  }
}
