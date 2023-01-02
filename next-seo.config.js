const title = 'FFXIV Trivia'
const description = 'How well do you know the world of Final Fantasy XIV?'
const url = 'https://ffxiv-trivia.mael.tech'

export default {
  title,
  description,
  openGraph: {
    title,
    description,
    url,
    site_name: title,
    type: 'website',
    locale: 'en_GB',
    images: [
      {
        url: `${url}/preview.png`,
        width: 1200,
        height: 627,
        alt: 'FFXIV Trivia',
      },
    ],
  },
}
