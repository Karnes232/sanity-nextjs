import { GetStaticProps } from 'next'
import React from 'react'
import Header from '../../components/Header'
import { sanityClient, urlFor } from '../../sanity'
import { Post } from '../../typings'
import PortableText from 'react-portable-text'
import { useForm, SubmitHandler } from 'react-hook-form'
import Form from '../../components/Form'
import Article from '../../components/Article'
import Comments from '../../components/Comments'


interface Props {
    post: Post;
}


const Post = ({ post }: Props) => {
 
  return (
    <main>
        <Header/>

        <img
            className='w-full h-40 object-cover' 
            src={urlFor(post.mainImage).url()!} 
            alt="" 
        />

        <Article post={post} />
        <hr className='max-w-lg my-5 mx-auto border border-yellow-500' />
                
        <Form post={post}/>

        <Comments post={post}/>
    </main>
  )
}

export default Post

export const getStaticPaths = async () => {
    const query = `*[_type == "post"]{
        _id,
        slug {
            current
        }
    }`;

    const posts = await sanityClient.fetch(query);
    
    const paths = posts.map((post: Post) => ({
        params: {
            slug: post.slug.current
        }
    }));

    return {
        paths,
        fallback: 'blocking'
    }
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
    const query = `*[_type == "post" && slug.current == $slug][0]{
        _id,
        _createdAt,
        title,
        author-> {
            name,
            image
        },
        'comments': *[
            _type == "comment" &&
            post._ref == ^._id &&
            approved == true],
        description,
        mainImage,
        slug,
        body
    }`

    const post = await sanityClient.fetch(query, {
        slug: params?.slug,
    })

    if (!post) {
        return {
            notFound: true
        }
    }

    return {
        props: {
            post,
        },
        revalidate: 60, // after 60 seconds, will update the old cache
    };
}