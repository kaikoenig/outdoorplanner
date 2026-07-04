import { useObjectUrl } from '../../utils/useObjectUrl';

export function EquipmentImage({ image, alt, size = 48 }: { image?: Blob; alt: string; size?: number }) {
  const url = useObjectUrl(image);

  if (!url) {
    return (
      <div
        className="equipment-image equipment-image--placeholder"
        style={{ width: size, height: size }}
        aria-hidden="true"
      />
    );
  }

  return <img className="equipment-image" src={url} alt={alt} width={size} height={size} />;
}
