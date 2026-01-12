// types/dashboard.ts
// DTO para el dashboard del usuario

export interface UserDashboardDTO {
  continue: {
    currentCourse: { id: string; slug: string; title: string } | null
    currentLesson: { id: string; slug: string; title: string } | null
    continueUrl: string | null
    courseProgressPct: number
  }
  progress: {
    completedLessonsTotal: number
    minutesWatchedTotal: number
    weekLessonsCompleted: number
    streakDays: number
  }
  gamification: {
    xpTotal: number
    level: {
      currentLevel: number
      currentXp: number
      nextLevelXp: number
    }
    recentBadges: Array<{
      id: string
      name: string
      icon: string | null
      earnedAt: string
    }>
  }
  community: {
    leaderboard: {
      rank: number | null
      totalUsers: number | null
    }
    topUsersPreview: Array<{
      userId: string
      displayName: string
      xp: number
      level: number
    }>
  }
}


