/**
 * Search Utilities
 *
 * Helper functions for search functionality
 */

/**
 * Highlight matching text in a string
 */
export function highlightText(text: string, query: string): string {
  if (!query || !text) return text

  const regex = new RegExp(`(${escapeRegex(query)})`, 'gi')
  return text.replace(regex, '<mark class="bg-[#ff6b35]/30 text-white">$1</mark>')
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Truncate text to a maximum length
 */
export function truncateText(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength).trim() + '...'
}

/**
 * Get search history from localStorage
 */
export function getSearchHistory(): string[] {
  if (typeof window === 'undefined') return []

  try {
    const history = localStorage.getItem('search_history')
    return history ? JSON.parse(history) : []
  } catch {
    return []
  }
}

/**
 * Save search query to history
 */
export function saveToSearchHistory(query: string, maxItems: number = 10): void {
  if (typeof window === 'undefined' || !query.trim()) return

  try {
    const history = getSearchHistory()
    const newHistory = [
      query,
      ...history.filter(q => q !== query)
    ].slice(0, maxItems)

    localStorage.setItem('search_history', JSON.stringify(newHistory))
  } catch (error) {
    console.error('Error saving search history:', error)
  }
}

/**
 * Clear search history
 */
export function clearSearchHistory(): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem('search_history')
  } catch (error) {
    console.error('Error clearing search history:', error)
  }
}

/**
 * Popular/suggested searches
 */
export const POPULAR_SEARCHES = [
  'Bitcoin',
  'Blockchain',
  'Lightning Network',
  'Smart Contracts',
  'DeFi',
  'Web3',
  'Solidity',
  'Wallet'
]

/**
 * Get relevance score for a search result
 * Higher score = more relevant
 */
export function calculateRelevance(
  item: { title: string; description?: string | null },
  query: string
): number {
  const lowerQuery = query.toLowerCase()
  let score = 0

  // Exact title match
  if (item.title.toLowerCase() === lowerQuery) {
    score += 100
  }
  // Title starts with query
  else if (item.title.toLowerCase().startsWith(lowerQuery)) {
    score += 50
  }
  // Title contains query
  else if (item.title.toLowerCase().includes(lowerQuery)) {
    score += 25
  }

  // Description contains query
  if (item.description?.toLowerCase().includes(lowerQuery)) {
    score += 10
  }

  return score
}

/**
 * Sort search results by relevance
 */
export function sortByRelevance<T extends { title: string; description?: string | null }>(
  items: T[],
  query: string
): T[] {
  return items.sort((a, b) => {
    const scoreA = calculateRelevance(a, query)
    const scoreB = calculateRelevance(b, query)
    return scoreB - scoreA
  })
}

/**
 * Log search analytics (optional)
 */
export async function logSearch(
  query: string,
  resultsCount: number,
  clickedResult?: string
): Promise<void> {
  // This is optional and can be implemented later
  // For now, just log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Search logged:', { query, resultsCount, clickedResult })
  }

  // TODO: Send to analytics endpoint
  // try {
  //   await fetch('/api/search/analytics', {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({ query, resultsCount, clickedResult })
  //   })
  // } catch (error) {
  //   console.error('Error logging search:', error)
  // }
}
