// Wind Calculator Utility for Golf Game
// Calculates wind ring adjustments based on club type, wind speed, elevation, and other parameters

/**
 * Computes Golf Clash wind rings for a club at a given level.
 *
 * Club stats live in `data/clubs.json` rather than in this file. Either pass
 * them in directly, or use the async `WindCalculator.load()` helper.
 */
export class WindCalculator {
  /**
   * @param {Object} clubData - Clubs keyed by club type, as in data/clubs.json
   */
  constructor(clubData) {
    if (!clubData) {
      throw new Error('WindCalculator requires club data; use WindCalculator.load() to fetch it');
    }
    this.clubData = clubData;
  }

  /**
   * Fetches club data and returns a ready-to-use calculator.
   * @param {string} url - Location of the club data JSON
   * @returns {Promise<WindCalculator>}
   */
  static async load(url = 'data/clubs.json') {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load club data from ${url}: ${response.status}`);
    }
    return new WindCalculator(await response.json());
  }

  getClubTypeMaxDistance(clubType) {
    const distances = {
      drivers: 240,
      woods: 180,
      longirons: 135,
      shortirons: 90,
      wedges: 45,
      roughirons: 135,
      sandwedges: 120
    };
    return distances[clubType];
  }

  getPowerBallMultiplier(powerBallLevel) {
    const multipliers = [1.0, 1.01, 1.03, 1.04, 1.05, 1.06, 1.07, 1.085, 1.1, 1.115, 1.13];
    return multipliers[powerBallLevel] || 1.0;
  }

  getWindBallMultiplier(windBallLevel) {
    const multipliers = [1.0, 0.9, 0.85, 0.8, 0.75, 0.7, 0.65, 0.6, 0.55, 0.5, 0.45];
    return multipliers[windBallLevel] || 1.0;
  }

  getCategoryMultiplier(clubType) {
    switch (clubType) {
      case 'roughirons':
        return 1.45;
      case 'sandwedges':
        return 1.15;
      default:
        return 1;
    }
  }

  maxPower(power, clubTypeMaxDistance) {
    return power / clubTypeMaxDistance;
  }

  minPower(power, clubType) {
    switch (clubType) {
      case 'drivers':
      case 'woods':
        return 0.75;
      case 'longirons':
        return 0.66;
      case 'shortirons':
        return 0.5;
      case 'wedges':
      case 'roughirons':
      case 'sandwedges':
        return 0;
      default:
        return 0.5;
    }
  }

  proratedPower(power, clubType, clubTypeMaxDistance, ratio) {
    // ratio: 0-1 parameter where 0 = minPower, 1 = maxPower
    const minPower = this.minPower(power, clubType);
    const maxPower = this.maxPower(power, clubTypeMaxDistance);
    const range = maxPower - minPower;

    return {
      current: minPower + range * ratio,
      max: maxPower,
      mid: minPower + range * 0.5,
      min: minPower
    };
  }

  windPerRing(clubName, level, accuracy, power, clubType) {
    const windCategoryMultiplier = this.getCategoryMultiplier(clubType);
    let windPerRing = ((3 - accuracy * 0.02) * windCategoryMultiplier) / power;

    if ((clubName === 'The B52' || clubName === 'The Grizzly') && level >= 5) {
      windPerRing = windPerRing * 0.9;
    }

    return windPerRing;
  }

  findClub(clubName, level) {
    for (const clubType in this.clubData) {
      const clubs = this.clubData[clubType];
      for (const club of clubs) {
        if (club.name === clubName) {
          return {
            ...club,
            clubType,
            power: club.power[level - 1],
            accuracy: club.accuracy[level - 1]
          };
        }
      }
    }
    return null;
  }

  calculateWindRings(
    clubName,
    level,
    windSpeed,
    elevation = 0,
    powerBall = 0,
    windBall = 0,
    powerRatio = 1
  ) {
    // Validate level
    if (level < 1 || level > 10 || !Number.isInteger(level)) {
      throw new Error(`Invalid level: ${level}. Level must be an integer between 1 and 10.`);
    }

    const club = this.findClub(clubName, level);
    if (!club) {
      throw new Error(`Club not found: ${clubName}`);
    }

    const clubTypeMaxDistance = this.getClubTypeMaxDistance(club.clubType);
    const powerBallMultiplier = this.getPowerBallMultiplier(powerBall);
    const windBallMultiplier = this.getWindBallMultiplier(windBall);
    const elevationAdjustment = 1 + elevation / 100;
    const adjustedWindSpeed = windSpeed * windBallMultiplier * elevationAdjustment;

    // Get all power values in a single call
    const powers = this.proratedPower(club.power, club.clubType, clubTypeMaxDistance, powerRatio);

    // Apply power ball multiplier to all power values
    const powerCurrent = powers.current * powerBallMultiplier;
    const powerMax = powers.max * powerBallMultiplier;
    const powerMid = powers.mid * powerBallMultiplier;
    const powerMin = powers.min * powerBallMultiplier;

    // Calculate wind per ring for each power value
    const windPerRingCurrent = this.windPerRing(
      clubName,
      level,
      club.accuracy,
      powerCurrent,
      club.clubType
    );
    const windPerRingMax = this.windPerRing(
      clubName,
      level,
      club.accuracy,
      powerMax,
      club.clubType
    );
    const windPerRingMid = this.windPerRing(
      clubName,
      level,
      club.accuracy,
      powerMid,
      club.clubType
    );
    const windPerRingMin = this.windPerRing(
      clubName,
      level,
      club.accuracy,
      powerMin,
      club.clubType
    );

    // Calculate final wind rings for each distance
    const current = Math.round((adjustedWindSpeed / windPerRingCurrent) * 10) / 10;
    const max = Math.round((adjustedWindSpeed / windPerRingMax) * 10) / 10;
    const mid = Math.round((adjustedWindSpeed / windPerRingMid) * 10) / 10;
    const min = Math.round((adjustedWindSpeed / windPerRingMin) * 10) / 10;

    return { current, max, mid, min };
  }
}
