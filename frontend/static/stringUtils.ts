export const capitalize = (val?: string): string => (val ? `${val[0].toUpperCase()}${val.slice(1).toLowerCase()}` : '');

export const truncate = (val?: string, length = 30, suffix = '...'): string =>
  val && val.length > length ? `${val.slice(0, length)}${suffix}` : val ?? '';
