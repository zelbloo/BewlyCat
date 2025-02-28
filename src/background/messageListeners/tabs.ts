import browser from 'webextension-polyfill'

interface Message {
  contentScriptQuery: string
  [key: string]: any
}

export enum TABS_MESSAGE {
  OPEN_LINK_IN_BACKGROUND = 'openLinkInBackground',
}

function handleMessage(message: Message) {
  if (message.contentScriptQuery === TABS_MESSAGE.OPEN_LINK_IN_BACKGROUND) {
    // 处理以 // 开头的 URL
    const url = message.url.startsWith('//') ? `https:${message.url}` : message.url
    return browser.tabs.create({ url, active: false })
  }
}

export function setupTabMsgLstnrs() {
  browser.runtime.onMessage.removeListener(handleConnect)
  browser.runtime.onMessage.addListener(handleConnect)
}

function handleConnect() {
  browser.runtime.onMessage.removeListener(handleMessage)
  browser.runtime.onMessage.addListener(handleMessage)
}
