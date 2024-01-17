export const buildForwardURL = (href: string, dataId: string): string => {
  const hrefSegs = (href || '').split('/');
  hrefSegs.pop();
  return `${hrefSegs.join('/')}/${dataId}`;
};
