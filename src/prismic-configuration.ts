import Prismic from '@prismicio/client';
import { Document } from '@prismicio/client/types/documents';

export const apiEndpoint = process.env.PRISMIC_API_ENDPOINT;
export const accessToken = process.env.PRISMIC_ACCESS_TOKEN;

export function linkResolver(doc: Document): string {
  if (doc.type === 'posts') {
    return `/post/${doc.uid}`;
  }
  return '/';
}

export const Client = (req = null) => (
    Prismic.client(apiEndpoint, createClientOptions(req, accessToken))
)

const createClientOptions = (req = null, prismicAccessToken = null) => {
    const reqOption = req ? { req }: {};
    const accessTokenOption = prismicAccessToken ? { accessToken: prismicAccessToken }: {};

    return {
        ...reqOption,
        ...accessTokenOption
    }
}