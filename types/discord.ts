/**
 * Discord Webhook Types
 */

export interface DiscordEmbedField {
  name: string
  value: string
  inline?: boolean
}

export interface DiscordEmbedFooter {
  text: string
  icon_url?: string
}

export interface DiscordEmbedAuthor {
  name: string
  url?: string
  icon_url?: string
}

export interface DiscordEmbedImage {
  url: string
}

export interface DiscordEmbed {
  title?: string
  description?: string
  url?: string
  color?: number
  fields?: DiscordEmbedField[]
  footer?: DiscordEmbedFooter
  author?: DiscordEmbedAuthor
  thumbnail?: DiscordEmbedImage
  image?: DiscordEmbedImage
  timestamp?: string
}

export interface DiscordWebhookPayload {
  content?: string
  username?: string
  avatar_url?: string
  embeds?: DiscordEmbed[]
}

export interface NewCourseNotification {
  title: string
  slug: string
  description: string | null
  instructor_name: string
  level: string
  thumbnail_url?: string | null
}

export interface NewBlogPostNotification {
  title: string
  slug: string
  excerpt: string
}
