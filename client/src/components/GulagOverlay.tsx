interface GulagOverlayProps {
  streakCount?: number
}

export default function GulagOverlay({ streakCount = 1 }: GulagOverlayProps) {
  return (
    <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">🔒</span>
        <h2 className="text-xl font-black tracking-widest text-red-400 uppercase">
          Battle Pass Frozen
        </h2>
      </div>

      <div className="w-full mb-4">
        <div className="flex justify-between text-xs text-white/30 mb-1">
          <span>XP frozen</span>
          <span>XP frozen</span>
        </div>
        <div className="relative h-4 w-full rounded-full bg-white/10 overflow-hidden grayscale">
          <div className="h-full rounded-full bg-gray-500 w-3/4" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs text-white/50">🔒</span>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-red-900/40 bg-red-900/10 px-4 py-3">
        <p className="text-sm font-semibold text-red-300 mb-1">Gulag Redemption Quest</p>
        <p className="text-xs text-white/50 mb-3">
          Complete 3 consecutive zero-spend days to unlock your Battle Pass.
        </p>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black text-white">
            Day {streakCount} / 3
          </span>
          <div className="flex gap-1">
            {[1, 2, 3].map((day) => (
              <div
                key={day}
                className={`h-3 w-3 rounded-full ${
                  day <= streakCount ? 'bg-red-400' : 'bg-white/20'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
