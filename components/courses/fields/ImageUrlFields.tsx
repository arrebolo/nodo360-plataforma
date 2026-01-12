'use client'

interface ImageUrlFieldsProps {
  thumbnailUrl: string
  bannerUrl: string
  onThumbnailChange: (value: string) => void
  onBannerChange: (value: string) => void
  errors?: {
    thumbnail_url?: string
    banner_url?: string
  }
}

export function ImageUrlFields({
  thumbnailUrl,
  bannerUrl,
  onThumbnailChange,
  onBannerChange,
  errors,
}: ImageUrlFieldsProps) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Thumbnail URL */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          URL Thumbnail
        </label>
        <input
          type="url"
          name="thumbnail_url"
          value={thumbnailUrl}
          onChange={(e) => onThumbnailChange(e.target.value)}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/70 focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 transition"
          placeholder="https://..."
        />
        {errors?.thumbnail_url && (
          <p className="mt-2 text-sm text-red-400">{errors.thumbnail_url}</p>
        )}
      </div>

      {/* Banner URL */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          URL Banner
        </label>
        <input
          type="url"
          name="banner_url"
          value={bannerUrl}
          onChange={(e) => onBannerChange(e.target.value)}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/70 focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 transition"
          placeholder="https://..."
        />
        {errors?.banner_url && (
          <p className="mt-2 text-sm text-red-400">{errors.banner_url}</p>
        )}
      </div>
    </div>
  )
}
