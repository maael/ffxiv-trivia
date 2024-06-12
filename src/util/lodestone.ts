import { load } from 'cheerio'
import fetch from 'node-fetch'

export async function getLodestoneData(url?: string): Promise<any> {
  if (!url) return {}
  try {
    const lodestoneUrl = new URL(url)
    const lodestoneId = lodestoneUrl.pathname.split('/').filter(Boolean).at(-1)
    const page = await fetch(url).then((r) => r.text())
    const $ = load(page)
    const race = $('.character-block__name').first().html()?.split('<br>')[0]?.trim()
    const name = $('.frame__chara__name').text().trim()
    const title = $('.frame__chara__title').text().trim()
    const world = $('.frame__chara__world').text().trim().split(' ')
    const imageUrl = new URL($('.frame__chara__face img').attr('src') || '')
    const image = `${imageUrl.protocol}//${imageUrl.host}${imageUrl.pathname}`
    const freeCompanyUrl = $('.character__freecompany__name h4 a').attr('href')
    const freeCompanyId = freeCompanyUrl?.split('/')[3]
    const freeCompanyName = $('.character__freecompany__name h4').text().trim()
    const freeCompanyCrest = $('.character__freecompany__crest__image')
      .children()
      .map((_idx, el) => $(el).attr('src'))
      .toArray()
    const data = {
      id: lodestoneId,
      url,
      race,
      name,
      title,
      server: {
        world: world[0],
        dataCenter: world[1].replace('[', '').replace(']', '').trim(),
      },
      image,
      freeCompany: {
        url: freeCompanyUrl,
        id: freeCompanyId,
        name: freeCompanyName,
        crest: freeCompanyCrest,
      },
    }
    console.info('[lodestone]', 'updated', data.name)
    return data
  } catch {
    return {}
  }
}
