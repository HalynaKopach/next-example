import client from "../apollo-client";
import {gql} from '@apollo/client';

async function fetchAPI(query, { variables, preview } = {}) {

  const data = await client.query({
    query: gql`${query}`,
    variables,
    context: {
      headers: {
        "Authorization": "Bearer " + (preview ? process.env.PREPRIO_PREVIEW_TOKEN : process.env.PREPRIO_PRODUCTION_TOKEN),
      }
    },
    fetchPolicy: 'no-cache'
  })
  return data
}

export async function getPreviewPostBySlug(slug) {
  const {data} = await fetchAPI(
    `
  query ArticleBySlug($slug: String!) {
    Article(slug: $slug) {
      _slug
    }
  }
  `,
    {
      preview: true,
      variables: {
        slug,
      },
    }
  )
  return data.Article
}

export async function getAllPostsWithSlug() {
  const {data} = await fetchAPI(`
    {
      Articles {
        items {
          _slug
        }
      }
    }
  `, {preview: true})
  return data?.Articles.items
}

export async function getAllPostsForHome(preview) {
  const {data} = await fetchAPI(
    `
    {
      Articles(sort: publish_on_DESC) {
        items {
          _id
          _slug
          _publish_on
          title, 
          content {
            ...on Text {
              html
              text
            }
          }
          authors {
            full_name
            profile_pic {
              url
            }
          }
          seo {
            social_media_image {
              url(preset: "square")
            }
          }
        }
      }
    }
  `,
    { preview }
  )

  return data?.Articles.items
}

export async function getPostAndMorePosts(slug, preview) {
  const {data} = await fetchAPI(
    `
  query ArticlesBySlug($slug: String!) {
    Article(slug: $slug) {
      _id
      _slug
      _publish_on
      title, 
      content {
        __typename
        ... on Text {
          html
          text
        }
        ... on Assets {
          items {
            url
          }
        }
      }
      authors {
        full_name
        profile_pic {
          url
        }
      }
      seo {
        social_media_image {
          url(preset: "square")
        }
      }
    }
    MoreArticles: Articles(limit: 3, sort: publish_on_DESC) {
      items {
        _id
        _slug
        _publish_on
        title, 
        content {
          ... on Text {
            html
            text
          }
        }
        authors {
          full_name
          profile_pic {
            url
          }
        }
        seo {
          social_media_image {
            url(preset: "square")
          }
        }
      }
    }
  }
  `,
    {
      preview,
      variables: {
        slug,
      },
    }
  )

  return {
    post: data?.Article,
    morePosts: (data?.MoreArticles?.items || [])
      .filter((item) => item._slug !== slug)
      .slice(0, 2),
  }
}
