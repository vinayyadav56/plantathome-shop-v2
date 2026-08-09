type Props = {
  iconList: any;
  iconName: string;
  [key: string]: unknown;
};
export const getIcon = ({ iconList, iconName, ...rest }: Props) => {
  const TagName = iconList[iconName];
  if (!TagName && process.env.NODE_ENV !== 'production') {
    // Unmapped names render as nothing — make that loud in dev so it can't
    // ship silently (docs/design/icon-system.md: fallback policy).
    console.warn('[icons] unmapped icon name:', iconName);
  }
  return !!TagName ? <TagName {...rest} /> : null;
};
