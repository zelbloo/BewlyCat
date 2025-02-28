import type {
  MaybeRef,
  RemovableRef,
  StorageLikeAsync,
  UseStorageAsyncOptions,
} from '@vueuse/core'
import { useStorageAsync } from '@vueuse/core'
import { storage } from 'webextension-polyfill'

import type { Settings } from '~/logic/storage'

const storageLocal: StorageLikeAsync = {
  removeItem(key: string) {
    return storage.local.remove(key)
  },

  setItem<T>(key: string, value: T) {
    return storage.local.set({ [key]: value })
  },

  async getItem<T>(key: string): Promise<T | null> {
    return (await storage.local.get(key))[key]
  },
}

const storageSync: StorageLikeAsync = {
  removeItem(key: string) {
    return storage.sync.remove(key)
  },

  setItem<T>(key: string, value: T) {
    return storage.sync.set({ [key]: value })
  },

  async getItem<T>(key: string): Promise<T | null> {
    return (await storage.sync.get(key))[key]
  },
}

export function useStorageLocal<T>(
  key: string,
  initialValue: MaybeRef<T>,
  options?: UseStorageAsyncOptions<T>,
): RemovableRef<T> {
  // 获取当前存储区域
  async function getCurrentStorage() {
    if (key === 'settings') {
      const result = await storage.local.get('settings')
      const settings = result.settings as Settings
      return settings?.enableSettingsSync ? storageSync : storageLocal
    }
    return storageLocal
  }

  // 初始化时获取存储区域
  getCurrentStorage().then((storageArea) => {
    return useStorageAsync(key, initialValue, storageArea, options)
  })

  // 默认使用本地存储，等待异步决定是否切换到同步存储
  return useStorageAsync(key, initialValue, storageLocal, options)
}
