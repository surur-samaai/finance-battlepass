import { useState, useCallback } from 'react'
import { fetchSeasonHistory } from '../api/user'
import { extractErrorMessage } from '../api/client'
import type { SeasonSummary } from '../api/types'

interface SeasonHistoryProps {
  userId: number
}

export default function SeasonHistory({ userId }: SeasonHistoryProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [seasons, setSeasons] = useState<SeasonSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasLoaded, setHasLoaded] = useState(false)

  const loadSeasons = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchSeasonHistory(userId)
      setSeasons(data)
      setHasLoaded(true)
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [userId])

  const handleToggle = () => {
    const nextOpen = !isOpen
    setIsOpen(nextOpen)
    if (nextOpen && !hasLoaded) {
      void loadSeasons()
    }
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 overflow-hidden">
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-white/50 hover:text-white hover:bg-white/5 transition-colors"
      >
        <span>Season History</span>
        <span className="text-xs">{isOpen ? '▲ Hide' : '▼ Show'}</span>
      </button>

      {isOpen && (
        <div className="border-t border-white/10 px-4 py-4">
          {loading && (
            <p className="text-sm text-white/40">Loading season history…</p>
          )}

          {error !== null && !loading && (
            <div className="space-y-2">
              <p className="text-sm text-red-400">{error}</p>
              <button
                onClick={() => void loadSeasons()}
                className="text-sm text-accent hover:text-accent/80 transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && error === null && seasons.length === 0 && hasLoaded && (
            <p className="text-sm text-white/30">
              No previous seasons. Complete your first month to see stats here.
            </p>
          )}

          {!loading && error === null && seasons.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="text-xs text-white/40 uppercase tracking-wider border-b border-white/10">
                    <th className="pb-2 pr-4 font-medium">Season</th>
                    <th className="pb-2 pr-4 font-medium">Level Reached</th>
                    <th className="pb-2 pr-4 font-medium">XP Earned</th>
                    <th className="pb-2 font-medium">Tokens Spent</th>
                  </tr>
                </thead>
                <tbody>
                  {seasons.map((season) => (
                    <tr
                      key={season.id}
                      className="border-b border-white/5 last:border-0 text-white/80"
                    >
                      <td className="py-2 pr-4">{season.season_number}</td>
                      <td className="py-2 pr-4">{season.final_level}</td>
                      <td className="py-2 pr-4">{season.final_xp}</td>
                      <td className="py-2">{season.final_tokens}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
