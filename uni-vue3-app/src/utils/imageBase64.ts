/** 本地临时文件路径 → 纯 base64（无 data: 前缀） */
export function pathToBase64(path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const fs = uni.getFileSystemManager?.()
    if (fs?.readFile) {
      fs.readFile({
        filePath: path,
        encoding: 'base64',
        success: (r) => resolve(String(r.data || '')),
        fail: reject,
      })
      return
    }
    if (typeof fetch !== 'undefined') {
      fetch(path)
        .then((res) => res.blob())
        .then(
          (blob) =>
            new Promise<string>((res2, rej2) => {
              const reader = new FileReader()
              reader.onloadend = () => {
                const dataUrl = reader.result as string
                const i = dataUrl.indexOf(',')
                res2(i >= 0 ? dataUrl.slice(i + 1) : dataUrl)
              }
              reader.onerror = () => rej2(new Error('读取图片失败'))
              reader.readAsDataURL(blob)
            })
        )
        .then(resolve)
        .catch(reject)
      return
    }
    reject(new Error('无法读取图片'))
  })
}
