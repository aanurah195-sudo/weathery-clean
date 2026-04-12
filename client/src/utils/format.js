export const safeFixed = (val, digits = 1) =>
  typeof val === "number" ? val.toFixed(digits) : "--";