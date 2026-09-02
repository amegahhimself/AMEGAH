import Image from 'next/image'

import { hotspotPosition } from '@/lib/card-meta'
import type { GalleryImage } from '@/sanity/lib/content'
import { urlFor } from '@/sanity/lib/image'

export function ProjectGallery({
  images,
  title,
}: {
  images: GalleryImage[]
  title: string
}) {
  if (images.length === 0) {
    return null
  }

  return (
    <div className="mt-24 flex flex-col gap-16">
      {images.map((image, index) =>
        image.asset ? (
          <figure key={image.asset._ref ?? index}>
            <div className="relative aspect-[3/2] w-full overflow-hidden bg-hairline">
              <Image
                src={urlFor(image).width(2000).auto('format').url()}
                alt={image.alt || title}
                fill
                loading="lazy"
                sizes="(min-width: 1024px) 80vw, 100vw"
                placeholder={image.lqip ? 'blur' : 'empty'}
                blurDataURL={image.lqip}
                style={{ objectPosition: hotspotPosition(image) }}
                className="object-cover"
              />
            </div>
            {image.caption && <figcaption className="index-meta mt-3">{image.caption}</figcaption>}
          </figure>
        ) : null,
      )}
    </div>
  )
}
