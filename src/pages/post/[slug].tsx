import React from 'react';
import Head from 'next/head';

import { GetStaticPaths, GetStaticProps } from 'next';
import { getPrismicClient } from '../../services/prismic';
import Prismic from '@prismicio/client';
import { useRouter } from 'next/router';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { RichText } from 'prismic-dom';

import Link from 'next/link';

import { FiUser, FiCalendar, FiClock } from 'react-icons/fi';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import Comments from '../../components/Comments';

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
  preview: boolean;
  navigation: {
    prevPost: {
      uid: string;
      data: {
        title: string;
      }
    }[],
    nextPost: {
      uid: string;
      data: {
        title: string;
      }
    }[],
  },

}

export default function Post({ post, preview, navigation }: PostProps) {

  const { isFallback } = useRouter();

  if (isFallback) {
    return <div>Carregando...</div>;
  }

  const postFormatted = {
    first_publication_date: format(new Date(post.first_publication_date), 'PP', { locale: ptBR }),
    data: {
      ...post.data,
      readingTime: post.data.content.reduce((acumulator, current) => {

        //Quantidade de palavras do heading
        const headingAmountCurrent = current.heading?.split(' ').length ?? 0;  // 2

        //Quantidade de palavras no body
        const bodyAmountCurrent = RichText.asText(current.body)?.split(' ').length ?? 0;

        const totalAmountHeading = acumulator.heading + headingAmountCurrent;
        const totalAmountBody = acumulator.body + bodyAmountCurrent;

        return {
          heading: totalAmountHeading,
          body: totalAmountBody,
          time: Math.ceil((totalAmountHeading + totalAmountBody) / 200)
        };
      }, {
        heading: 0,
        body: 0,
        time: 0
      }),
    }
  };

  

  return (
    <>
      <Head>
        <title>Criando um app CRA do zero | spacetraveling </title>
      </Head>

      <div className={styles.containerBanner}>
        <img src={postFormatted.data.banner.url} alt="banner" />
      </div>

      <main className={styles.container}>
        <article>
          <h1>{postFormatted.data.title}</h1>

          <div className={styles.containerDescription}>
            <div className={styles.blockIcon}>
              <span>
                <FiCalendar />
                <time>{postFormatted.first_publication_date}</time>
              </span>

              <span>
                <FiUser />
                <strong>{postFormatted.data.author}</strong>
              </span>

              <span>
                <FiClock />
                <strong>{postFormatted.data.readingTime.time} min</strong>
              </span>
            </div>
          </div>

          <div className={styles.containerContent}>
            {
              postFormatted.data.content.map(content => (
                <div key={content.heading}>
                  <h2>{content.heading}</h2>
                  <div dangerouslySetInnerHTML={{ __html: RichText.asHtml(content.body) }}>
                  </div>
                </div>
              ))
            }
          </div>
        </article>

        <section className={`${commonStyles.container} ${styles.navigation}`}>
          {navigation?.prevPost.length > 0 && (
            <div>
              <h3>{navigation.prevPost[0].data.title}</h3>
              <Link href={`/post/${navigation.prevPost[0].uid}`}>
                <a>Post anterior</a>
              </Link>
            </div>
          )}

          {navigation?.nextPost.length > 0 && (
           <div>
              <h3>{navigation.nextPost[0].data.title}</h3>
              <Link href={`/post/${navigation.nextPost[0].uid}`}>
                <a>Próximo post</a>
              </Link>
            </div>
          )}


          

        </section>

        <Comments />

        {preview && (
          <aside>
            <Link href="/api/exit-preview">
              <a className={commonStyles.preview}>Sair do modo preview</a>
            </Link>
          </aside>
        )}
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  //react-hook-swr---melhor-ux-no-consumo-de-api-no-front-end-react
  //criando-um-blog-com-contador-de-visitas-usando-nextjs-e-mongodb

  const response = await prismic.query([
    Prismic.predicates.any('my.posts.title',
      ['Mapas com React usando Leaflet',
        'Criando um Blog com contador de visitas usando NextJS e MongoDB'
      ]),
  ],
    {
      fetch: ['post.title', 'post.subtitle', 'post.author', 'post.banner', 'post.content'],
    })

  return {
    paths: [
      { params: { slug: response.results[0].uid } },
      { params: { slug: response.results[1].uid } },
    ],
    fallback: true
  }

};

export const getStaticProps: GetStaticProps = async ({ params, preview = false, previewData }) => {
  //Parâmetros da rota
  const { slug } = params;

  //Iniciando o cliente prismic
  const prismic = getPrismicClient();

  const response = await prismic.getByUID('posts', String(slug), {
    ref: previewData?.ref || null,
  });

  //Pegando a página anterior da página atual
  const prevPost = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      pageSize: 1,
      after: response.id,
      orderings: '[document.first_publication_date]'
    }
  )

  const nextPost = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      pageSize: 1,
      after: response.id,
      orderings: '[document.last_publication_date_desc]'

    }
  )

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    last_publication_data: response.last_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content.map(content => {
        return {
          heading: content.heading,
          body: [...content.body]
        }
      })
    }
  }


  return {
    props: {
      post,
      preview,
      navigation: {
        prevPost: prevPost?.results,
        nextPost: nextPost?.results,
      }
    }
  }
};
