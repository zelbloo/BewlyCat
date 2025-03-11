import browser from 'webextension-polyfill'

import { TABS_MESSAGE } from '~/background/messageListeners/tabs'

export async function openLinkInBackground(url: string) {
  try {
    browser.runtime.sendMessage({
      contentScriptQuery: TABS_MESSAGE.OPEN_LINK_IN_BACKGROUND,
      url,
    })
  }
  catch (error) {
    console.error('Failed to open link in background:', error)
  }
}
