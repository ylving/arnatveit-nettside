import { sanityClient } from 'sanity:client';
import { createImageUrlBuilder } from '@sanity/image-url';

export const load = <T>(query: string, params: Record<string, unknown> = {}) => sanityClient.fetch<T>(query, params);

const builder = createImageUrlBuilder(sanityClient);
export const urlFor = (source: Parameters<typeof builder.image>[0]) => builder.image(source).auto('format');
