import React, { useState } from 'react';
import { GetStaticProps } from 'next';

import { getPrismicClient } from '../services/prismic';
import Prismic from '@prismicio/client';
import Head from 'next/head';
import Link from 'next/link';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { FiCalendar, FiUser } from 'react-icons/fi';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
  preview:boolean;
}

export default function Home({ postsPagination, preview}:HomeProps) {
  const [nextPage, setNexPage] = useState(postsPagination.next_page);
  const [posts, setPosts] = useState<Post[]>(() => {
    const postsFormatted = postsPagination.results.map(post => {
      return {
        uid: post.uid,
        first_publication_date: format(new Date(post.first_publication_date), 'PP',{ locale: ptBR}),
        data:{
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author,
        }
      }
    });
    return postsFormatted;
  });

  async function handleNextPage(){

      if(nextPage){
        const data = await fetch(nextPage).then(response => response.json());

        const postsCurrent = data.results.map(post => {
          return {
            uid: post.uid,
            first_publication_date: format(new Date(post.first_publication_date), 'PP',{ locale: ptBR}),
            data:{
              title: post.data.title,
              subtitle: post.data.subtitle,
              author: post.data.author,
            }
          }
        })
    
        setPosts([...posts, ...postsCurrent]);
        setNexPage(data.next_page);
      }
  }

  return(
    <>
      <Head>
         <title> Posts | spacetraveling </title>
      </Head>
      <main className={commonStyles.container}>
          <div className={styles.posts}>
             {
               posts.map(post=>(
                  <Link href={`/post/${post.uid}`} key={post.uid}>
                    <a>
                        <strong>{post.data.title}</strong>
                        <p>{post.data.subtitle}</p>
                        <div>
                            <FiCalendar/>
                            <time>{post.first_publication_date}</time>           
                            <FiUser/>
                            <span>{post.data.author}</span>
                        </div>
                    </a>
              </Link>            
            ))
          }
        </div>

         {nextPage && <button type="button" className={styles.morePosts}onClick={handleNextPage}>Carregar mais posts</button>}
         
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

export const getStaticProps:GetStaticProps = async ({preview = false}) =>{
  //Iniciando um cliente prismic
  const prismic = getPrismicClient();

  const response = await prismic.query([
    Prismic.predicates.at('document.type', 'posts')],
    {
      fetch:['post.title','post.subtitle','post.author','post.banner','post.content'],
      pageSize: 1
    },
  
  );


  const posts = response.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data:{
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      }
    }
  });


  const postsPagination = {
    next_page: response.next_page,
    results: posts
  }



  return {
    props:{
      postsPagination,
      preview,
    },
    revalidate: 60 * 30 // 30 minutes
  }
}