/** @type {import('next').NextConfig} */
const nextConfig = {
  // ВАЖНО: Эта настройка превращает Next.js в статический сайт
  output: 'export',

  // Нужно для работы картинок на статическом хостинге
  images: {
    unoptimized: true,
  },

  // ВАЖНО: Раскомментируйте строку ниже, если ваш сайт НЕ открывается
  // или вы видите ошибку 404 после деплоя.
  // Замените 'my-marketplace' на имя вашего репозитория на GitHub.
  // basePath: '/my-marketplace',
}

module.exports = nextConfig
