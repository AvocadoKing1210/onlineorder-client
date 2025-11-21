'use client'

import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { X, Info } from 'lucide-react'
import { getActiveNotifications, type Notification } from '@/lib/api/notifications'
import { Button } from '@/components/ui/button'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const DISMISSED_NOTIFICATIONS_KEY = 'dismissed_notifications'

// Get dismissed notification IDs from localStorage
function getDismissedNotifications(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  
  try {
    const stored = localStorage.getItem(DISMISSED_NOTIFICATIONS_KEY)
    if (!stored) return new Set()
    const parsed = JSON.parse(stored)
    return new Set(Array.isArray(parsed) ? parsed : [])
  } catch {
    return new Set()
  }
}

// Save dismissed notification ID to localStorage
function dismissNotification(id: string): void {
  if (typeof window === 'undefined') return
  
  try {
    const dismissed = getDismissedNotifications()
    dismissed.add(id)
    localStorage.setItem(DISMISSED_NOTIFICATIONS_KEY, JSON.stringify(Array.from(dismissed)))
  } catch (error) {
    console.warn('Failed to save dismissed notification:', error)
  }
}

export function NotificationBanner() {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())
  const [localDismissed, setLocalDismissed] = useState<Set<string>>(new Set())
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isOnHeroSection, setIsOnHeroSection] = useState(true)
  const bannerRef = useRef<HTMLDivElement>(null)
  const scrollPositionRef = useRef<number>(0)
  const isMobile = useIsMobile()

  // Load dismissed notifications on mount
  useEffect(() => {
    setDismissedIds(getDismissedNotifications())
  }, [])

  // Check if we're on the hero section (first page)
  useEffect(() => {
    let ticking = false
    const checkScrollPosition = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const heroSection = document.getElementById('hero')
          if (heroSection) {
            const heroBottom = heroSection.offsetTop + heroSection.offsetHeight
            const scrollPosition = window.scrollY + window.innerHeight / 2
            setIsOnHeroSection(scrollPosition < heroBottom)
          }
          ticking = false
        })
        ticking = true
      }
    }

    checkScrollPosition()
    window.addEventListener('scroll', checkScrollPosition, { passive: true })
    return () => window.removeEventListener('scroll', checkScrollPosition)
  }, [])

  // Fetch active notifications
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['activeNotifications'],
    queryFn: getActiveNotifications,
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000, // Consider data stale after 30 seconds
  })

  // Filter out dismissed notifications
  const visibleNotifications = notifications.filter(
    (notification) => !dismissedIds.has(notification.id) && !localDismissed.has(notification.id)
  )

  // Update CSS variable for banner height
  useEffect(() => {
    if (bannerRef.current && visibleNotifications.length > 0) {
      const height = bannerRef.current.offsetHeight
      document.documentElement.style.setProperty('--notification-banner-height', `${height}px`)
    } else {
      document.documentElement.style.setProperty('--notification-banner-height', '0px')
    }
  }, [visibleNotifications.length])

  const handleNotificationClick = (notification: Notification, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Save current scroll position before opening dialog
    scrollPositionRef.current = window.scrollY
    setSelectedNotification(notification)
    setIsDialogOpen(true)
  }

  // Restore scroll position when dialog closes
  useEffect(() => {
    if (!isDialogOpen && scrollPositionRef.current > 0) {
      // Use requestAnimationFrame to ensure DOM has updated
      requestAnimationFrame(() => {
        window.scrollTo({
          top: scrollPositionRef.current,
          behavior: 'instant' as ScrollBehavior
        })
      })
    }
  }, [isDialogOpen])

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent opening dialog when clicking dismiss
    dismissNotification(id)
    setLocalDismissed((prev) => new Set(prev).add(id))
    setDismissedIds((prev) => new Set(prev).add(id))
  }

  if (isLoading || visibleNotifications.length === 0) {
    return null
  }

  const shouldShowBanner = !isOnHeroSection && !isDialogOpen

  return (
    <>
      {shouldShowBanner && (
        <div 
          ref={bannerRef}
          className="fixed top-16 sm:top-20 left-0 right-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm"
        >
          <div className="w-full px-4 sm:px-6 py-4 sm:py-5">
            <div className="flex flex-col gap-2 sm:gap-3 w-full">
              {visibleNotifications.map((notification) => (
                <NotificationBannerItem
                  key={notification.id}
                  notification={notification}
                  onClick={(e) => handleNotificationClick(notification, e)}
                  onDismiss={(e) => handleDismiss(notification.id, e)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Notification Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className={`${isMobile ? 'w-screen h-screen max-w-none max-h-none m-0 rounded-none' : 'max-w-2xl max-h-[90vh]'} flex flex-col p-0 gap-0 [&>button]:hidden`}>
          <DialogHeader className={`px-8 ${isMobile ? 'pt-24' : 'pt-16'} pb-4 relative`}>
            <button
              onClick={() => setIsDialogOpen(false)}
              className={`absolute right-8 ${isMobile ? 'top-12' : 'top-8'} rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none`}
              aria-label="Close"
            >
              <X className="h-7 w-7" />
            </button>
            <DialogTitle className="text-left text-2xl sm:text-3xl leading-relaxed">
              {selectedNotification?.title}
            </DialogTitle>
            {selectedNotification?.published_at && (
              <p className="text-sm text-muted-foreground mt-2">
                {new Date(selectedNotification.published_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            )}
          </DialogHeader>
          <div className="px-8 pb-8 overflow-y-auto flex-1 min-h-0">
            <div
              className="prose prose-sm max-w-none dark:prose-invert
                prose-headings:font-semibold prose-headings:mt-4 prose-headings:mb-2
                prose-p:text-foreground prose-p:leading-relaxed prose-p:my-2
                prose-strong:text-foreground prose-strong:font-semibold
                prose-em:text-foreground
                prose-ul:text-foreground prose-ol:text-foreground prose-ul:my-2 prose-ol:my-2
                prose-li:text-foreground prose-li:my-1
                prose-blockquote:text-muted-foreground prose-blockquote:border-l-foreground/20 prose-blockquote:my-4 prose-blockquote:pl-4
                prose-code:text-foreground prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
                prose-img:rounded-lg prose-img:max-w-full md:prose-img:max-w-md lg:prose-img:max-w-lg prose-img:h-auto prose-img:my-4 prose-img:mx-auto prose-img:block prose-img:shadow-sm
                prose-a:text-primary prose-a:underline hover:prose-a:text-primary/80
                prose-hr:my-4 prose-hr:border-border"
              dangerouslySetInnerHTML={{ __html: selectedNotification?.body || '' }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

interface NotificationBannerItemProps {
  notification: Notification
  onClick: (e: React.MouseEvent) => void
  onDismiss: (e: React.MouseEvent) => void
}

function NotificationBannerItem({ notification, onClick, onDismiss }: NotificationBannerItemProps) {
  return (
    <div 
      className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 cursor-pointer hover:bg-muted/50 rounded-md px-2 py-1 transition-colors"
      onClick={onClick}
    >
      <Info className="h-4 w-4 sm:h-5 sm:w-5 text-foreground/70 flex-shrink-0" />
      <span 
        className="text-sm sm:text-base text-foreground truncate flex-1 hover:underline"
      >
        {notification.title}
      </span>
      <button
        onClick={onDismiss}
        className="flex-shrink-0 h-6 w-6 sm:h-7 sm:w-7 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
      </button>
    </div>
  )
}

