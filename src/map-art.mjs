export function seededUnit(seed, salt) {
  let value = 0;
  for (let index = 0; index < seed.length; index += 1) {
    value = (value * 31 + seed.charCodeAt(index) + salt * 17) >>> 0;
  }
  return (((value ^ (value >>> 13)) >>> 0) % 1000) / 1000;
}
