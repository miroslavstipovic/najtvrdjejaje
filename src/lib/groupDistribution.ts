/**
 * Pametna raspodjela natjecatelja u grupe s podrškom za:
 * - Nositelje grupa (seeds) koji se raspoređuju u zasebne grupe
 * - Obiteljska ograničenja (članovi iste obitelji ne smiju biti u istoj grupi)
 */

interface GroupDistributionOptions {
  competitorIds: number[]
  numberOfGroups: number
  seedIds?: number[]
  familyGroups?: Map<number, string> // competitorId -> familyGroup name
}

interface GroupDistributionResult {
  groups: number[][]
  error?: string
}

export function divideIntoGroups({
  competitorIds,
  numberOfGroups,
  seedIds = [],
  familyGroups = new Map(),
}: GroupDistributionOptions): GroupDistributionResult {
  const groups: number[][] = Array.from({ length: numberOfGroups }, () => [])

  if (seedIds.length > numberOfGroups) {
    return {
      groups: [],
      error: `Previše nositelja (${seedIds.length}) za ${numberOfGroups} grupa. Broj nositelja ne smije premašiti broj grupa.`,
    }
  }

  const validSeedIds = seedIds.filter(id => competitorIds.includes(id))

  // 1. Place each seed in its own group
  for (let i = 0; i < validSeedIds.length; i++) {
    groups[i].push(validSeedIds[i])
  }

  // 2. Build a set of placed competitor IDs
  const placed = new Set(validSeedIds)

  // 3. Shuffle remaining competitors
  const remaining = competitorIds
    .filter(id => !placed.has(id))
    .sort(() => Math.random() - 0.5)

  // 4. Place remaining competitors respecting family constraints
  for (const competitorId of remaining) {
    const family = familyGroups.get(competitorId)

    // Find the best group: smallest size, no family conflict
    let bestGroupIndex = -1
    let bestGroupSize = Infinity

    for (let g = 0; g < numberOfGroups; g++) {
      const groupSize = groups[g].length

      if (family) {
        const hasConflict = groups[g].some(
          memberId => familyGroups.get(memberId) === family
        )
        if (hasConflict) continue
      }

      if (groupSize < bestGroupSize) {
        bestGroupSize = groupSize
        bestGroupIndex = g
      }
    }

    if (bestGroupIndex === -1) {
      // No valid group found (family too large for number of groups) - fallback to smallest group
      let fallbackIndex = 0
      let fallbackSize = groups[0].length
      for (let g = 1; g < numberOfGroups; g++) {
        if (groups[g].length < fallbackSize) {
          fallbackSize = groups[g].length
          fallbackIndex = g
        }
      }
      groups[fallbackIndex].push(competitorId)
    } else {
      groups[bestGroupIndex].push(competitorId)
    }
  }

  return { groups: groups.filter(g => g.length > 0) }
}

/**
 * Bergerov algoritam za generiranje round-robin rasporeda
 */
export function generateBergerSchedule(
  competitorIds: number[]
): { round: number; home: number; away: number }[] {
  const n = competitorIds.length
  const matches: { round: number; home: number; away: number }[] = []

  if (n < 2) return matches

  const competitors = [...competitorIds]
  if (n % 2 !== 0) {
    competitors.push(-1)
  }

  const numCompetitors = competitors.length
  const numRounds = numCompetitors - 1

  for (let round = 0; round < numRounds; round++) {
    const roundMatches: { home: number; away: number }[] = []

    for (let match = 0; match < numCompetitors / 2; match++) {
      let home: number
      let away: number

      if (match === 0) {
        home = competitors[numCompetitors - 1]
        away = competitors[round % (numCompetitors - 1)]
      } else {
        const homeIdx = (round + match) % (numCompetitors - 1)
        const awayIdx = (round + numCompetitors - 1 - match) % (numCompetitors - 1)
        home = competitors[homeIdx]
        away = competitors[awayIdx]
      }

      if (round % 2 === 1 && match === 0) {
        [home, away] = [away, home]
      }

      if (home !== -1 && away !== -1) {
        roundMatches.push({ home, away })
      }
    }

    roundMatches.forEach(m => {
      matches.push({ round: round + 1, home: m.home, away: m.away })
    })
  }

  return matches
}
