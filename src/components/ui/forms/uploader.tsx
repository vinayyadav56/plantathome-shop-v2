import { useEffect, useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useTranslation } from 'next-i18next';
import { UploadIcon } from '@/components/icons/upload-icon';
import Spinner from '@/components/ui/loaders/spinner/spinner';
import { useUploads } from '@/framework/settings';

/**
 * Compact image uploader — thumbnails and a small add tile in one row, not a 144px empty box.
 *
 * The server accepts JPG/PNG/WEBP/GIF up to 5 MB per file (AttachmentRequest); those limits are
 * enforced here too, so a shopper learns about a bad file instantly and inline instead of
 * watching a spinner end in silence. The old `accept: 'image/*'` string was inert with this
 * react-dropzone version (it expects the object form), so the picker accepted anything.
 */

const MAX_SIZE = 5 * 1024 * 1024;

export default function Uploader({
  onChange,
  value,
  name,
  onBlur,
  multiple = false,
}: any) {
  const { t } = useTranslation('common');
  const [rejectError, setRejectError] = useState<string | null>(null);
  const {
    mutate: upload,
    isLoading,
    files,
    error: uploadError,
    removeFile,
  } = useUploads({
    onChange,
    defaultFiles: value,
  });

  const onDrop = useCallback(
    (acceptedFiles: any) => {
      if (acceptedFiles.length) {
        setRejectError(null);
        upload(acceptedFiles);
      }
    },
    [upload],
  );
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif'] },
    multiple,
    maxSize: MAX_SIZE,
    noClick: true,
    noKeyboard: true,
    onDrop,
    onDropRejected: (rejections) => {
      const code = rejections?.[0]?.errors?.[0]?.code;
      setRejectError(
        code === 'file-too-large'
          ? t('text-image-too-large', { defaultValue: 'That image is over 5 MB.' })
          : t('text-image-wrong-type', {
              defaultValue: 'Only JPG, PNG, WEBP or GIF images are supported.',
            }),
      );
    },
  });

  useEffect(
    () => () => {
      files.forEach((file: any) => URL.revokeObjectURL(file.preview));
    },
    [files],
  );

  const error = rejectError ?? uploadError;

  return (
    <section
      {...getRootProps({
        className: `upload rounded-md transition-colors ${
          isDragActive ? 'bg-accent/5 ring-2 ring-accent' : ''
        }`,
      })}
    >
      <input {...getInputProps({ name, onBlur })} />
      <div className="flex flex-wrap items-center gap-2.5">
        {files.map((file: any, idx: number) => (
          <div
            key={idx}
            className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-border-100"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={file.preview}
              alt={file?.name ?? ''}
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              aria-label={t('text-remove', { defaultValue: 'Remove' })}
              className="absolute end-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] leading-none text-light shadow"
              onClick={(e) => {
                e.stopPropagation();
                removeFile(idx);
              }}
            >
              ×
            </button>
          </div>
        ))}
        {isLoading && (
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-md border border-border-100">
            <Spinner text="" simple={true} className="h-5 w-5" />
          </div>
        )}
        {!isLoading && (multiple || files.length === 0) && (
          <button
            type="button"
            onClick={open}
            className="flex h-16 w-16 shrink-0 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border-base text-body transition-colors hover:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <UploadIcon className="h-5 w-5 text-muted-light" />
            <span className="text-[10px]">{t('text-upload-highlight')}</span>
          </button>
        )}
        <div className="flex min-w-0 flex-col gap-0.5">
          {!isLoading && !multiple && files.length > 0 && (
            <button
              type="button"
              onClick={open}
              className="inline-flex h-8 w-max items-center rounded-md border border-border-base px-3 text-xs font-medium text-body transition-colors hover:border-accent hover:text-accent focus:outline-none"
            >
              {t('text-change', { defaultValue: 'Change' })}
            </button>
          )}
          <span className="text-xs text-body/60">
            {t('text-img-format')} · max 5 MB
          </span>
        </div>
      </div>
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </section>
  );
}
