export interface SeasonResetResult {
  success: boolean;
  archivedSeasonId: number;
  seasonNumber: number;
  newSeasonStartDate: string;
}

export interface SeasonSummary {
  id: number;
  season_number: number;
  start_date: string;
  end_date: string;
  final_xp: number;
  final_level: number;
  final_tokens: number;
}
