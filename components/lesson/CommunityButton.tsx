'use client'

import { useState } from 'react'
import type { CommunityPlatform } from '@/lib/community-config'
import { communityConfig, platformNames } from '@/lib/community-config'
import { DiscordIcon, TelegramIcon, SlackIcon, ForumIcon } from './CommunityIcons'

interface CommunityButtonProps {
  platform?: CommunityPlatform
  url?: string
  memberCount?: string
  isRegistered?: boolean
  isPremium?: boolean
  isCompact?: boolean // Para versión de tab en premium
}

export function CommunityButton({
  platform = communityConfig.platform,
  url,
  memberCount = communityConfig.memberCount,
  isRegistered = true,
  isPremium = false,
  isCompact = false,
}: CommunityButtonProps) {
  const [isHovered, setIsHovered] = useState(false)

  const communityUrl = url || communityConfig.urls[platform]
  const platformName = platformNames[platform]
  const features = isPremium ? communityConfig.features.premium : communityConfig.features.free

  // Map platform to icon component
  const getPlatformIcon = (iconClass: string = 'w-6 h-6') => {
    switch (platform) {
      case 'discord':
        return <DiscordIcon className={iconClass} />
      case 'telegram':
        return <TelegramIcon className={iconClass} />
      case 'slack':
        return <SlackIcon className={iconClass} />
      case 'forum':
        return <ForumIcon className={iconClass} />
      default:
        return <DiscordIcon className={iconClass} />
    }
  }

  const handleClick = () => {
    if (!isRegistered) {
      // Redirect to login/register
      window.location.href = '/login'
      return
    }
    window.open(communityUrl, '_blank')
  }

  // Compact version for sidebar tab
  if (isCompact) {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className={`${isPremium ? 'text-yellow-500' : 'text-orange-500'}`}>
            {getPlatformIcon()}
          </div>
          <h3 className="font-semibold text-white">Comunidad</h3>
        </div>

        {/* Premium Badge */}
        {isPremium && (
          <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 rounded-lg p-3 border border-yellow-500/30">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-sm font-medium text-yellow-400">Comunidad Premium</span>
            </div>
            <p className="text-xs text-gray-400">
              Acceso exclusivo a canales premium y soporte prioritario
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-white">{memberCount} miembros activos</span>
          </div>
          <p className="text-xs text-gray-400">En {platformName}</p>
        </div>

        {/* Features */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-white">Beneficios:</p>
          <ul className="space-y-2">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2 text-xs text-gray-400">
                <svg className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isPremium ? 'text-yellow-500' : 'text-orange-500'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Join Button */}
        <button
          onClick={handleClick}
          className={`w-full px-4 py-3 ${
            isPremium
              ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-gray-900'
              : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white'
          } font-semibold rounded-lg transition-all shadow-lg ${
            isPremium ? 'shadow-yellow-500/20' : 'shadow-orange-500/20'
          } flex items-center justify-center gap-2`}
        >
          {isRegistered ? (
            <>
              Unirse a {platformName}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Regístrate para acceder
            </>
          )}
        </button>
      </div>
    )
  }

  // Full version for content area
  return (
    <div
      className={`relative overflow-hidden rounded-xl border transition-all duration-300 ${
        isRegistered
          ? 'cursor-pointer hover:shadow-2xl hover:-translate-y-1'
          : 'cursor-not-allowed opacity-75'
      } ${
        isPremium
          ? 'bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/30 hover:border-yellow-500/50'
          : 'bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/30 hover:border-orange-500/50'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Animated background gradient */}
      <div
        className={`absolute inset-0 opacity-0 transition-opacity duration-300 ${
          isHovered ? 'opacity-100' : ''
        }`}
      >
        <div
          className={`absolute inset-0 ${
            isPremium
              ? 'bg-gradient-to-r from-yellow-500/5 via-yellow-600/10 to-yellow-500/5'
              : 'bg-gradient-to-r from-orange-500/5 via-orange-600/10 to-orange-500/5'
          } animate-pulse`}
        />
      </div>

      <div className="relative p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Icon */}
          <div
            className={`flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center ${
              isPremium
                ? 'bg-yellow-500/20 text-yellow-500'
                : 'bg-orange-500/20 text-orange-500'
            } transform transition-transform duration-300 ${
              isHovered ? 'scale-110 rotate-3' : ''
            }`}
          >
            {getPlatformIcon()}
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                  {isRegistered ? 'Únete a la Comunidad' : 'Accede a la Comunidad'}
                  {isPremium && (
                    <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full font-medium">
                      Premium
                    </span>
                  )}
                </h3>
                <p className="text-gray-400 text-sm">
                  {isRegistered
                    ? 'Conecta con otros estudiantes, resuelve dudas y comparte conocimiento'
                    : 'Regístrate para acceder a nuestra comunidad exclusiva'}
                </p>
              </div>

              {!isRegistered && (
                <div className="flex-shrink-0">
                  <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Stats and Features */}
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-sm font-semibold text-white">{memberCount} miembros activos</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                  <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                </svg>
                <span>En {platformName}</span>
              </div>
              {isPremium && (
                <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500/10 rounded-full">
                  <svg className="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs text-yellow-400 font-medium">Acceso prioritario</span>
                </div>
              )}
            </div>

            {/* Quick features */}
            {isRegistered && (
              <div className="flex flex-wrap gap-2">
                {features.slice(0, 4).map((feature, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-gray-800/50 rounded-lg text-xs text-gray-300"
                  >
                    <svg className={`w-3 h-3 ${isPremium ? 'text-yellow-500' : 'text-orange-500'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {feature}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* CTA Button */}
          <div className="flex-shrink-0 w-full md:w-auto">
            <button
              className={`w-full md:w-auto px-6 py-3 ${
                isPremium
                  ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-gray-900'
                  : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white'
              } font-semibold rounded-lg transition-all shadow-lg ${
                isPremium ? 'shadow-yellow-500/20' : 'shadow-orange-500/20'
              } flex items-center justify-center gap-2 whitespace-nowrap`}
              disabled={!isRegistered}
            >
              {isRegistered ? (
                <>
                  Unirse Ahora
                  <svg
                    className={`w-5 h-5 transform transition-transform duration-300 ${
                      isHovered ? 'translate-x-1' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              ) : (
                <>
                  Regístrate Gratis
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Badge: NUEVO (opcional, se puede activar condicionalmente) */}
      {false && (
        <div className="absolute top-4 right-4">
          <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
            NUEVO
          </span>
        </div>
      )}
    </div>
  )
}
