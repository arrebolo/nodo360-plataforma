'use client'

import { GoogleAnalytics as GA } from '@next/third-parties/google'

const GA_MEASUREMENT_ID = 'G-4L1V170N61'

export default function GoogleAnalytics() {
  if (process.env.NODE_ENV !== 'production') {
    return null
  }

  return <GA gaId={GA_MEASUREMENT_ID} />
}
