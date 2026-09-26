import { sanityClient } from 'sanity:client';

export const load = <T>(query: string, params: Record<string, unknown> = {}) => sanityClient.fetch<T>(query, params);
