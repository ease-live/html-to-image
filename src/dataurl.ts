import { Options } from './types'

function getContentFromDataUrl(dataURL: string) {
  return dataURL.split(/,/)[1]
}

export function isDataUrl(url: string) {
  return url.search(/^(data:)/) !== -1
}

export function makeDataUrl(content: string, mimeType: string) {
  return `data:${mimeType};base64,${content}`
}

export async function fetchAsDataURL<T>(
  url: string,
  init: RequestInit | undefined,
  process: (data: { result: string; res: Response }) => T,
): Promise<T> {
  const res = await fetch(url, init)
  if (res.status === 404) {
    throw new Error(`Resource "${res.url}" not found`)
  }
  const blob = await res.blob()
  return new Promise<T>((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onloadend = () => {
      try {
        resolve(process({ res, result: reader.result as string }))
      } catch (error) {
        reject(error)
      }
    }

    reader.readAsDataURL(blob)
  })
}

export async function resourceToDataURL(
  resourceUrl: string,
  contentType: string | undefined,
  options: Options,
) {
  // ref: https://developer.mozilla.org/en/docs/Web/API/XMLHttpRequest/Using_XMLHttpRequest#Bypassing_the_cache
  if (options.cacheBust) {
    // eslint-disable-next-line no-param-reassign
    resourceUrl += (/\?/.test(resourceUrl) ? '&' : '?') + new Date().getTime()
  }

  let dataURL: string
  try {
    const content = await fetchAsDataURL(
      resourceUrl,
      options.fetchRequestInit,
      ({ res, result }) => {
        if (!contentType) {
          // eslint-disable-next-line no-param-reassign
          contentType = res.headers.get('Content-Type') || ''
        }
        if (contentType === 'application/octet-stream') {
          // eslint-disable-next-line no-param-reassign
          contentType = 'image/png'
        }
        return getContentFromDataUrl(result)
      },
    )
    dataURL = makeDataUrl(content, contentType!)
  } catch (error) {
    dataURL = options.imagePlaceholder || ''

    let msg = `Failed to fetch resource: ${resourceUrl}`
    if (error) {
      msg = typeof error === 'string' ? error : error.message
    }

    if (msg) {
      console.warn(msg)
    }
  }

  return dataURL
}
