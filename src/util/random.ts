const DEFAULT_IMAGES = [
  '/images/users/1.png',
  '/images/users/2.png',
  '/images/users/3.png',
  '/images/users/4.png',
  '/images/users/5.png',
  '/images/users/6.png',
  '/images/users/7.png',
  '/images/users/8.png',
  '/images/users/9.png',
  '/images/users/10.png',
  '/images/users/11.png',
  '/images/users/12.png',
]

export function getRandomArrayItem<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)]
}

export function getRandomImage() {
  return getRandomArrayItem(DEFAULT_IMAGES)
}
