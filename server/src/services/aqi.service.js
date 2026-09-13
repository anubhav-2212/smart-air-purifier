export function calculateAirQuality(dustDensity, mq135Raw) {
  const dustScore = Math.min(
    (Number(dustDensity || 0) / 0.15) * 100,
    100
  );

  const gasScore = Math.min(
    (Number(mq135Raw || 0) / 2500) * 100,
    100
  );

  const score = Math.round(Math.max(dustScore, gasScore));

  let level;

  if (score <= 25) {
    level = "Good";
  } else if (score <= 50) {
    level = "Moderate";
  } else if (score <= 75) {
    level = "Poor";
  } else {
    level = "Very Poor";
  }

  return {
    score,
    level,
  };
}
console.log(calculateAirQuality(0, 598));