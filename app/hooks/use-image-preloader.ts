import { useState, useEffect } from 'react'

export function useImagePreloader(imageUrls: string[], minDisplayTime = 0) {
  const [imagesLoaded, setImagesLoaded] = useState(false)
  
  useEffect(() => {
    if (!imageUrls.length) {
      setImagesLoaded(true)
      return
    }

    const startTime = Date.now()
    let loadedCount = 0
    let isMounted = true

    const checkCompletion = () => {
      if (loadedCount === imageUrls.length) {
        const elapsedTime = Date.now() - startTime
        const remainingTime = Math.max(0, minDisplayTime - elapsedTime)
        
        setTimeout(() => {
          if (isMounted) setImagesLoaded(true)
        }, remainingTime)
      }
    }

    imageUrls.forEach(url => {
      const img = new Image()
      img.src = url
      img.onload = () => {
        loadedCount++
        checkCompletion()
      }
      img.onerror = () => {
        loadedCount++ // Count errors as loaded to not block
        checkCompletion()
      }
    })

    return () => {
      isMounted = false
    }
  }, [imageUrls, minDisplayTime])

  return imagesLoaded
}

