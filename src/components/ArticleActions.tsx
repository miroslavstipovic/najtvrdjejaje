'use client'

interface ArticleActionsProps {
  title: string
  lastUpdated: string
}

export default function ArticleActions({ title, lastUpdated }: ArticleActionsProps) {
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title,
          url: window.location.href,
        })
      } else {
        await navigator.clipboard.writeText(window.location.href)
        alert('Link članka kopiran u clipboard!')
      }
    } catch (error) {
      console.error('Share failed:', error)
    }
  }

  return (
    <div className="mt-8 pt-8 border-t border-gray-200">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Zadnje ažuriranje: {new Date(lastUpdated).toLocaleDateString('hr-HR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })}
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={handleShare}
            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            Podijeli
          </button>
        </div>
      </div>
    </div>
  )
}
