'use client'

import { useState, useEffect } from 'react'

interface VideoPlayerProps {
  url: string
  type: string
}

export default function VideoPlayer({ url, type }: VideoPlayerProps) {
  const [embedUrl, setEmbedUrl] = useState('')

  useEffect(() => {
    const getEmbedUrl = () => {
      if (type === 'youtube') {
        // Check for invalid YouTube URLs first
        if (url === 'https://www.youtube.com/' || url === 'https://youtube.com/' || url === 'www.youtube.com') {
          return null // Return null for invalid URLs
        }
        
        // Extract video ID from various YouTube URL formats
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
        const match = url.match(regExp)
        const videoId = match && match[2].length === 11 ? match[2] : null
        
        if (videoId) {
          return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`
        }
        
        return null // Return null if no valid video ID found
      } else if (type === 'vimeo') {
        // Extract video ID from Vimeo URL
        const regExp = /vimeo.com\/(\d+)/
        const match = url.match(regExp)
        const videoId = match ? match[1] : null
        
        if (videoId) {
          return `https://player.vimeo.com/video/${videoId}`
        }
        
        return null // Return null if no valid Vimeo ID found
      }
      
      // For other types, only return if it looks like a valid embed URL
      if (url && url.includes('embed')) {
        return url
      }
      
      return null // Return null for invalid URLs
    }

    const embedUrl = getEmbedUrl()
    setEmbedUrl(embedUrl || '')
  }, [url, type])

  if (!embedUrl) {
    return (
      <div className="video-container bg-gray-200 flex items-center justify-center">
        <p className="text-gray-500">Nevaljan video URL</p>
      </div>
    )
  }

  return (
    <div className="video-container">
      <iframe
        src={embedUrl}
        title="Video Player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="rounded-lg"
        loading="lazy"
      />
    </div>
  )
}
