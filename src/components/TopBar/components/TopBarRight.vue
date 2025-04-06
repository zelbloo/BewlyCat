<script setup lang="ts">
import ALink from '~/components/ALink.vue'
import { settings } from '~/logic'
import { getUserID } from '~/utils/main'

import { useTopBarCore } from '../composables/useTopBarCore'
import { useTopBarInteraction } from '../composables/useTopBarInteraction'
import { useTopBarNotifications } from '../composables/useTopBarNotifications'
import FavoritesPop from './pops/FavoritesPop.vue'
import HistoryPop from './pops/HistoryPop.vue'
import MomentsPop from './pops/MomentsPop.vue'
import MorePop from './pops/MorePop.vue'
import NotificationsPop from './pops/NotificationsPop.vue'
import UploadPop from './pops/UploadPop.vue'
import UserPanelPop from './pops/UserPanelPop.vue'
import WatchLaterPop from './pops/WatchLaterPop.vue'

defineProps<{
  forceWhiteIcon?: boolean
  drawerVisible: { notifications: boolean }
}>()

const emit = defineEmits<{
  'notificationsClick': [item: { name: string, url: string, unreadCount: number, icon: string }]
}>()

const {
  isLogin,
  userInfo,
  unReadMessage,
  unReadDm,
  unReadMessageCount,
  newMomentsCount,
  avatarImg,
  avatarShadow,
  initData,
} = useTopBarCore()

const {
  popupVisible,
  handleClickTopBarItem,
  setupTopBarItems,
} = useTopBarInteraction()

const {
  drawerVisible,
} = useTopBarNotifications()

const mid = getUserID() || ''

const {
  avatar,
  notifications,
  moments,
  favorites,
  history,
  watchLater,
  upload,
  more,
  avatarTransformer,
  notificationsTransformer,
  momentsTransformer,
  favoritesTransformer,
  historyTransformer,
  watchLaterTransformer,
  uploadTransformer,
  moreTransformer,
} = setupTopBarItems()

// 添加 onMounted 钩子来初始化数据
onMounted(() => {
  initData()
})

// 修改通知点击处理
function handleNotificationsClick(item: { name: string, url: string, unreadCount: number, icon: string }) {
  emit('notificationsClick', item)
}
</script>

<template>
  <div
    class="right-side"
    flex="inline xl:1 justify-end items-center"
  >
    <div
      class="others"
      flex="~ items-center gap-1" h-46px px-5px
      text="$bew-text-1"
      transform-gpu
    >
      <div
        v-if="!isLogin"
        class="right-side-item"
        important-w-auto
      >
        <a href="https://passport.bilibili.com/login" class="login">
          <div i-solar:user-circle-bold-duotone class="text-xl mr-2" />{{
            $t('topbar.sign_in')
          }}
        </a>
      </div>
      <template v-if="isLogin">
        <div class="hidden lg:flex" gap-1>
          <!-- Moments -->
          <div
            ref="moments"
            class="right-side-item"
            :class="{ active: popupVisible.moments }"
            @click="(event: MouseEvent) => handleClickTopBarItem(event, 'moments')"
          >
            <template v-if="newMomentsCount > 0">
              <div
                v-if="settings.topBarIconBadges === 'number'"
                class="unread-num-dot"
              >
                {{ newMomentsCount > 99 ? '99+' : newMomentsCount }}
              </div>
              <div
                v-else-if="settings.topBarIconBadges === 'dot'"
                class="unread-dot"
              />
            </template>
            <ALink
              :class="{ 'white-icon': forceWhiteIcon }"
              href="https://t.bilibili.com"
              :title="$t('topbar.moments')"
              type="topBar"
            >
              <div i-tabler:windmill />
            </ALink>

            <Transition name="slide-in">
              <MomentsPop
                v-show="popupVisible.moments"
                ref="momentsTransformer"
                class="bew-popover"
                @click.stop="() => {}"
              />
            </Transition>
          </div>

          <!-- Favorites -->
          <div
            ref="favorites"
            class="right-side-item"
            :class="{ active: popupVisible.favorites }"
            @click="(event: MouseEvent) => handleClickTopBarItem(event, 'favorites')"
          >
            <ALink
              :class="{ 'white-icon': forceWhiteIcon }"
              :href="`https://space.bilibili.com/${mid}/favlist`"
              :title="$t('topbar.favorites')"
              type="topBar"
            >
              <div i-mingcute:star-line />
            </ALink>

            <Transition name="slide-in">
              <KeepAlive>
                <FavoritesPop
                  v-if="popupVisible.favorites"
                  ref="favoritesTransformer"
                  class="bew-popover"
                  @click.stop="() => {}"
                />
              </KeepAlive>
            </Transition>
          </div>

          <!-- History -->
          <div
            ref="history"
            class="right-side-item"
            :class="{ active: popupVisible.history }"
            @click="(event: MouseEvent) => handleClickTopBarItem(event, 'history')"
          >
            <ALink
              :class="{ 'white-icon': forceWhiteIcon }"
              href="https://www.bilibili.com/history"
              :title="$t('topbar.history')"
              type="topBar"
            >
              <div i-mingcute:time-line />
            </ALink>

            <Transition name="slide-in">
              <HistoryPop
                v-if="popupVisible.history"
                ref="historyTransformer"
                class="bew-popover"
                @click.stop="() => {}"
              />
            </Transition>
          </div>

          <!-- Watch later -->
          <div
            ref="watchLater"
            class="right-side-item"
            :class="{ active: popupVisible.watchLater }"
            @click="(event: MouseEvent) => handleClickTopBarItem(event, 'watchLater')"
          >
            <ALink
              :class="{ 'white-icon': forceWhiteIcon }"
              href="https://www.bilibili.com/watchlater/list"
              :title="$t('topbar.watch_later')"
              type="topBar"
            >
              <div i-mingcute:carplay-line />
            </ALink>

            <Transition name="slide-in">
              <WatchLaterPop
                v-if="popupVisible.watchLater"
                ref="watchLaterTransformer"
                class="bew-popover"
                @click.stop="() => {}"
              />
            </Transition>
          </div>

          <!-- Creative center -->
          <div class="right-side-item">
            <a
              :class="{ 'white-icon': forceWhiteIcon }"
              href="https://member.bilibili.com/platform/home"
              target="_blank"
              :title="$t('topbar.creative_center')"
            >
              <div i-mingcute:bulb-line />
            </a>
          </div>
        </div>

        <!-- More -->
        <div
          ref="more"
          class="right-side-item lg:!hidden flex"
          :class="{ active: popupVisible.more }"
          @click="(event: MouseEvent) => handleClickTopBarItem(event, 'more')"
        >
          <a
            :class="{ 'white-icon': forceWhiteIcon }"
            title="More"
          >
            <div i-mingcute:menu-line />
          </a>

          <Transition name="slide-in">
            <MorePop
              v-show="popupVisible.more"
              ref="moreTransformer"
              class="bew-popover"
              @click.stop="() => {}"
            />
          </Transition>
        </div>

        <div class="hidden lg:flex" gap-1 items-center>
          <!-- Divider -->
          <div
            :class="{ 'white-icon': forceWhiteIcon }"
            w-2px h-16px bg="$bew-border-color" mx-1
            rounded-4px
          />

          <!-- Upload -->
          <div
            ref="upload"
            class="right-side-item"
            :class="{ active: popupVisible.upload }"
            @click="(event: MouseEvent) => handleClickTopBarItem(event, 'upload')"
          >
            <a
              class="upload"
              :class="{ 'white-icon': forceWhiteIcon }"
              style="backdrop-filter: var(--bew-filter-glass-1);"
              href="https://member.bilibili.com/platform/upload/video/frame"
              target="_blank"
              :title="$t('topbar.upload')"
            >
              <div i-mingcute:upload-line flex-shrink-0 />
            </a>

            <Transition name="slide-in">
              <UploadPop
                v-if="popupVisible.upload"
                ref="uploadTransformer"
                class="bew-popover"
                @click.stop="() => {}"
              />
            </Transition>
          </div>

          <!-- Notifications -->
          <div
            ref="notifications"
            class="right-side-item"
            :class="{ active: popupVisible.notifications }"
            @click="(event: MouseEvent) => handleClickTopBarItem(event, 'notifications')"
          >
            <template v-if="unReadMessageCount > 0">
              <div
                v-if="settings.topBarIconBadges === 'number'"
                class="unread-num-dot"
              >
                {{ unReadMessageCount > 99 ? '99+' : unReadMessageCount }}
              </div>
              <div
                v-else-if="settings.topBarIconBadges === 'dot'"
                class="unread-dot"
              />
            </template>

            <ALink
              :href="settings.openNotificationsPageAsDrawer ? undefined : 'https://message.bilibili.com'"
              :class="{ 'white-icon': forceWhiteIcon }"
              :title="$t('topbar.notifications')"
              type="topBar"
              :custom-click-event="settings.openNotificationsPageAsDrawer"
              @click="drawerVisible.notifications = true"
            >
              <div i-tabler:bell />
            </ALink>

            <Transition name="slide-in">
              <NotificationsPop
                v-if="popupVisible.notifications"
                ref="notificationsTransformer"
                class="bew-popover"
                :un-read-message="unReadMessage"
                :un-read-dm="unReadDm"
                @click.stop="() => {}"
                @item-click="handleNotificationsClick"
              />
            </Transition>
          </div>
        </div>
      </template>

      <!-- Avatar -->

      <div
        v-if="isLogin"
        ref="avatar"
        :class="{ hover: popupVisible.userPanel }"
        class="avatar right-side-item"
        @click="(event: MouseEvent) => handleClickTopBarItem(event, 'userPanel')"
      >
        <ALink
          ref="avatarImg"
          :href="`https://space.bilibili.com/${mid}`"
          type="topBar"
          class="avatar-img"
          :class="{ hover: popupVisible.userPanel }"
          :style="{
            backgroundImage: `url(${`${userInfo.face}`.replace(
              'http:',
              '',
            )})`,
          }"
        />
        <div
          ref="avatarShadow"
          class="avatar-shadow"
          :class="{ hover: popupVisible.userPanel }"
          :style="{
            backgroundImage: `url(${`${userInfo.face}`.replace(
              'http:',
              '',
            )})`,
          }"
        />
        <svg
          v-if="userInfo.vip?.status === 1"
          class="vip-img"
          :class="{ hover: popupVisible.userPanel }"
          :style="{ opacity: popupVisible.userPanel ? 1 : 0 }"
          bg="[url(https://i0.hdslb.com/bfs/seed/jinkela/short/user-avatar/big-vip.svg)] contain no-repeat"
          w="28%" h="28%" z-1
          pos="absolute bottom--20px right-28px" duration-300
        />

        <Transition name="slide-in">
          <UserPanelPop
            v-if="popupVisible.userPanel"
            ref="avatarTransformer"
            :user-info="userInfo"
            after:h="!0"
            class="bew-popover"
            pos="!left-auto !right-0" transform="!translate-x-0"
            @click.stop="() => {}"
          />
        </Transition>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import "../styles/index.scss";
</style>
