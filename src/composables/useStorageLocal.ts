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

// 创建一个同时保存到本地和云端的存储对象
const storageBoth: StorageLikeAsync = {
  async removeItem(key: string) {
    await Promise.all([
      storageLocal.removeItem(key),
      storageSync.removeItem(key),
    ])
    return Promise.resolve()
  },

  async setItem<T extends string>(key: string, value: T) {
    await Promise.all([
      storageLocal.setItem(key, value),
      storageSync.setItem(key, value),
    ])
    return Promise.resolve()
  },

  async getItem(key: string): Promise<any | null> {
    // 优先从同步存储获取数据
    const syncValue = await storageSync.getItem(key)
    if (syncValue !== null) {
      // 确保本地存储也有最新数据
      await storageLocal.setItem(key, syncValue)
      return syncValue
    }
    return storageLocal.getItem(key)
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
      return settings?.enableSettingsSync ? storageBoth : storageLocal
    }
    return storageLocal
  }

  // 创建一个代理存储对象
  const proxyStorage: StorageLikeAsync = {
    async removeItem(key: string) {
      const currentStorage = await getCurrentStorage()
      return currentStorage.removeItem(key)
    },
    async setItem(key: string, value: any) {
      const currentStorage = await getCurrentStorage()
      return currentStorage.setItem(key, value)
    },
    async getItem(key: string): Promise<any | null> {
      const currentStorage = await getCurrentStorage()
      return currentStorage.getItem(key)
    },
  }

  // 使用代理存储对象
  return useStorageAsync(key, initialValue, proxyStorage, options)
}
