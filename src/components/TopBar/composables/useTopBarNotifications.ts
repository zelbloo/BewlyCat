import { ref } from 'vue'

import { settings } from '~/logic'

export function useTopBarNotifications() {
  const drawerVisible = reactive({
    notifications: false,
  })

  const notificationsDrawerUrl = ref<string>('https://message.bilibili.com/')

  function handleNotificationsItemClick(item: { name: string, url: string, unreadCount: number, icon: string }) {
    if (settings.value.openNotificationsPageAsDrawer) {
      drawerVisible.notifications = true
      notificationsDrawerUrl.value = item.url
    }
  }

  return {
    drawerVisible,
    notificationsDrawerUrl,
    handleNotificationsItemClick,
  }
}
