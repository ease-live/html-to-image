export default class ImageLoader {
  private lock = false
  private img: HTMLImageElement
  private queue: Array<() => void> = []

  constructor() {
    this.img = new Image()
    this.img.crossOrigin = 'anonymous'
    this.img.decoding = 'async'
  }

  public load(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const fn = () => {
        this.lock = true
        this.img.onload = () => {
          this.lock = false
          resolve(this.img)
        }
        this.img.onerror = reject
        this.img.src = url
      }

      if (this.lock) this.queue.push(fn)
      else fn()
    })
  }

  public next() {
    this.queue.shift()?.()
  }
}
