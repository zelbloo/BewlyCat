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

  async setItem<T>(key: string, value: T) {
    // 修改这里：在设置前检查云端是否已有配置
    if (key === 'settings') {
      const syncValueStr = await storageSync.getItem(key) as string | null
      if (syncValueStr) {
        try {
          const syncValue = JSON.parse(syncValueStr) as Settings
          // 如果云端已有配置且开启了同步，则不覆盖云端配置
          if (syncValue && syncValue.enableSettingsSync) {
            // 将云端配置同步到本地
            await storageLocal.setItem(key, syncValueStr)
            return Promise.resolve()
          }
        }
        catch (e) {
          console.error('解析云端设置失败:', e)
        }
      }
    }

    if (value) {
      const valueJson = JSON.stringify(value)
      const syncValue = JSON.parse(valueJson) as Settings
      if (syncValue.enableSettingsSync) {
        await storageSync.setItem(key, valueJson)
      }
      storageLocal.setItem(key, valueJson)
    }
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
      // 先检查云端是否有配置
      const syncResult = await storage.sync.get('settings')
      const syncSettingsStr = syncResult.settings as string | undefined

      if (syncSettingsStr) {
        try {
          const syncSettings = JSON.parse(syncSettingsStr) as Settings
          // 如果云端有配置且开启了同步，则使用云端配置并同步到本地
          if (syncSettings && syncSettings.enableSettingsSync) {
            // 将云端配置同步到本地
            await storageLocal.setItem('settings', syncSettingsStr)
            return storageBoth
          }
        }
        catch (e) {
          console.error('解析云端设置失败:', e)
        }
      }

      // 否则检查本地配置
      const result = await storage.local.get('settings')
      const settingsStr = result.settings as string | undefined

      if (settingsStr) {
        try {
          const settings = JSON.parse(settingsStr)
          return settings?.enableSettingsSync ? storageBoth : storageLocal
        }
        catch (e) {
          console.error('解析本地设置失败:', e)
        }
      }
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
