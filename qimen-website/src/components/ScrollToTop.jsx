import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * 婊氬姩鍒伴《閮ㄥ伐鍏风粍浠? * 鍦ㄨ矾鐢卞彉鍖栨椂鑷姩婊氬姩鍒伴〉闈㈤《閮? */
export default function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [pathname])

  return null
}



