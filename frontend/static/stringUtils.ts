export const capitalize = (val?: string): string => (val ? `${val[0].toUpperCase()}${val.slice(1).toLowerCase()}` : '');
