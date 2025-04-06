import type { Ref } from 'vue'

import type { AppPage } from '~/enums/appEnums'

export interface BewlyAppProvider {
  activatedPage: Ref<AppPage>
  scrollbarRef: Ref<any>
  reachTop: Ref<boolean>
  mainAppRef: Ref<HTMLElement>
  handleReachBottom: Ref<(() => void) | undefined>
  handlePageRefresh: Ref<(() => void) | undefined>
  // 添加撤销刷新的处理函数
  handleUndoRefresh: Ref<(() => void) | undefined>
  // 添加控制撤销按钮显示的状态
  showUndoButton: Ref<boolean>
  handleBackToTop: (targetScrollTop?: number) => void
  haveScrollbar: () => Promise<boolean>
  openIframeDrawer: (url: string) => void
}

export function useBewlyApp(): BewlyAppProvider {
  const provider = inject<BewlyAppProvider>('BEWLY_APP')

  if (import.meta.env.DEV && !provider)
    throw new Error('AppProvider is not injected')

  return provider!
}
