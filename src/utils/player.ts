// 更完善的播放器元素选择器
const _videoClassTag = {
  danmuBtn:
      '.bilibili-player-video-danmaku-switch > input[type=checkbox],.bpx-player-dm-switch input[type=checkbox]',
  playBtn:
      '.bpx-player-ctrl-play,.bilibili-player-video-btn-start,.squirtle-video-start',
  nextBtn:
      '.bpx-player-ctrl-next,.bilibili-player-video-btn-next,.squirtle-video-next',
  muteBtn:
      '.bpx-player-ctrl-volume,.bilibili-player-video-btn-volume,.squirtle-volume-icon',
  state:
      '.bilibili-player-video-state,.bpx-player-state-wrap,.bpx-player-video-state',
  title:
      '.video-title,.bilibili-player-video-top-title,#player-title,.season-info .title',
  widescreen:
      '.bpx-player-ctrl-wide,.bilibili-player-video-btn-widescreen,.squirtle-video-widescreen',
  pagefullscreen:
      '.bpx-player-ctrl-web,.bilibili-player-video-web-fullscreen,.squirtle-video-pagefullscreen',
  fullscreen:
      '.bpx-player-ctrl-full,.bilibili-player-video-btn-fullscreen,.squirtle-video-fullscreen',
  videoArea: '.bilibili-player-video-wrap,.bpx-player-video-area',
  video: '#bilibiliPlayer video,#bilibili-player video,.bilibili-player video,.player-container video,#bilibiliPlayer bwp-video,#bilibili-player bwp-video,.bilibili-player bwp-video,.player-container bwp-video,#bofqi video,[aria-label="哔哩哔哩播放器"] video',
}

// 重试任务类，用于处理重试逻辑
export class RetryTask {
  private count = 0
  private repeat: () => void

  constructor(
    private max: number,
    private timeout: number,
    private fn: () => boolean,
  ) {
    this.repeat = this.start.bind(this)
  }

  start() {
    this.count++
    if (this.count > this.max)
      return
    if (!this.fn())
      setTimeout(this.repeat, this.timeout)
  }
}

// 检查是否为移动设备
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

export function fullscreen() {
  new RetryTask(20, 500, () => {
    const fullscreenBtn = document.querySelector(_videoClassTag.fullscreen) as HTMLElement
    if (fullscreenBtn) {
      fullscreenBtn.click()
      return true
    }
    return false
  }).start()
}

export function webFullscreen() {
  new RetryTask(20, 500, () => {
    // 检查是否已经处于网页全屏状态
    if (document.querySelector('[data-screen=\'web\']')) {
      return true
    }

    const webFullscreenBtn = document.querySelector(_videoClassTag.pagefullscreen) as HTMLElement
    if (webFullscreenBtn) {
      webFullscreenBtn.click()

      // 如果是移动设备，可能需要滚动到视频中心位置
      const videoElement = document.querySelector(_videoClassTag.video)
      if (isMobile && videoElement) {
        setTimeout(() => {
          (videoElement as HTMLElement).scrollIntoView({ block: 'center', inline: 'center' })
        }, 180)
      }
      return true
    }
    return false
  }).start()
}

export function widescreen() {
  new RetryTask(20, 500, () => {
    // 检查是否已经处于宽屏状态
    if (document.querySelector('[data-screen=\'wide\']')) {
      return true
    }

    const widescreenBtn = document.querySelector(_videoClassTag.widescreen) as HTMLElement
    if (widescreenBtn) {
      widescreenBtn.click()
      return true
    }
    return false
  }).start()
}
