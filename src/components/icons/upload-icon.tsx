import { Upload } from '@/components/ui/icon';

export const UploadIcon = ({
  color = 'currentColor',
  width = '41px',
  height = '30px',
  ...rest
}) => {
  return (
    <Upload
      aria-hidden
      color={color}
      width={width}
      height={height}
      {...(rest as any)}
    />
  );
};
