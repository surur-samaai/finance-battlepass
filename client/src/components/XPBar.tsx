interface XPBarProps {
  currentXP: number
  xpToNext: number
  isGulag?: boolean
  lockedIcon?: 'padlock' | 'hourglass'
}

export default function XPBar({
  currentXP,
  xpToNext,
  isGulag = false,
  lockedIcon = 'padlock',
}: XPBarProps) {
  const percent = Math.min((currentXP / xpToNext) * 100, 100)

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-white/50 mb-1">
        <span>{currentXP} XP</span>
        <span>{xpToNext} XP</span>
      </div>
      <div
        className={`relative h-4 w-full rounded-full bg-white/10 overflow-hidden ${
          isGulag ? 'grayscale' : ''
        }`}
      >
        <div
          className="h-full rounded-full bg-accent transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
        {isGulag && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs text-white/70">
              {lockedIcon === 'hourglass' ? '⏳' : '🔒'}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
