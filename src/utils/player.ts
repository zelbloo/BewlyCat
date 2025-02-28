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
}

export async function fullscreen() {
  const a = document.querySelector(_videoClassTag.fullscreen) as HTMLElement
  a && a.click()
}
export async function webFullscreen() {
  const a = document.querySelector(_videoClassTag.pagefullscreen) as HTMLElement
  a && a.click()
}
export async function widescreen() {
  const a = document.querySelector(_videoClassTag.widescreen) as HTMLElement
  a && a.click()
}
