// A deterministic sweep of calculateWindRings across every club, every level,
// and a grid of inputs. Used both to generate the committed fixtures and to
// check against them, so the two can never drift.

export const WIND_SPEEDS = [0.1, 3.7, 10, 18.5, 25];
export const ELEVATIONS = [-20, 0, 10, 30, 50];
export const POWER_BALLS = [0, 2, 6, 10];
export const RATIOS = [0, 0.5, 1];

/**
 * @param {import('../../scripts/windCalculator.js').WindCalculator} calculator
 * @returns {string[]} one `type|club|level|wind|elev|pb|ratio|{rings}` row per case
 */
export function sweep(calculator) {
  const rows = [];

  for (const [type, clubs] of Object.entries(calculator.clubData)) {
    for (const club of clubs) {
      for (let level = 1; level <= club.power.length; level++) {
        for (const wind of WIND_SPEEDS) {
          for (const elevation of ELEVATIONS) {
            for (const powerBall of POWER_BALLS) {
              for (const ratio of RATIOS) {
                let result;
                try {
                  result = calculator.calculateWindRings(
                    club.name,
                    level,
                    wind,
                    elevation,
                    powerBall,
                    0,
                    ratio
                  );
                } catch (error) {
                  result = { error: error.message };
                }

                rows.push(
                  [
                    type,
                    club.name,
                    level,
                    wind,
                    elevation,
                    powerBall,
                    ratio,
                    JSON.stringify(result)
                  ].join('|')
                );
              }
            }
          }
        }
      }
    }
  }

  return rows;
}
