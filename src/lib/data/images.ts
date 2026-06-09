const imageModules = import.meta.glob('/src/img/*', {
  eager: true,
  import: 'default'
}) as Record<string, string>;

const localImagesByName = Object.fromEntries(
  Object.entries(imageModules).map(([path, resolvedUrl]) => [path.split('/').pop() ?? path, resolvedUrl])
);

export function resolveImageSource(image: string): string {
  if (!image) {
    return '';
  }

  if (/^https?:\/\//.test(image)) {
    return image;
  }

  const fileName = image.split('/').pop();

  if (!fileName) {
    return image;
  }

  return localImagesByName[fileName] ?? image;
}
