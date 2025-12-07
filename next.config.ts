/** @type {import('next').NextConfig} */
const nextConfig = {
  // ВАЖНО: Эта настройка превращает Next.js в статический сайт
  output: 'export',

  // Нужно для работы картинок на статическом хостинге
  images: {
    unoptimized: true,
  },

  // ВАЖНО: Это решает проблему со стилями. Путь должен совпадать с именем репозитория
  basePath: '/market',
}


module.exports = nextConfig
