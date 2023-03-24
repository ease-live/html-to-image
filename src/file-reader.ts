export default class FR {
  private lock = false
  private queue: Array<() => void> = []
  private reader: FileReader = new FileReader()

  public read(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const fn = async () => {
        this.lock = true
        this.reader.onerror = reject
        this.reader.onloadend = () => {
          try {
            this.lock = false
            resolve(this.reader.result as string)
          } catch (error) {
            reject(error)
          }
        }

        this.reader.readAsDataURL(blob)
      }

      if (this.lock) this.queue.push(fn)
      else fn()
    })
  }

  public next() {
    this.queue.shift()?.()
  }
}
