'use client'

import { createClient } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import { ShoppingCart, Phone, BookOpen, Package, Store } from "lucide-react"
import { useRouter } from 'next/navigation'
import Header from '@/app/components/Header'
import { useCart } from '@/lib/CartContext'

// Создаем Supabase клиент прямо здесь
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

// Коллекция картинок по категориям
const categoryImages: { [key: string]: string[] } = {
  'ковры': [
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1548620848-4250ca6d6d6a?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1505843513577-22bb7d21e455?w=400&h=300&fit=crop',
  ],
  'телефоны': [
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400&h=300&fit=crop',
  ],
  'книги': [
    'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&h=300&fit=crop',
  ],
}

// Функция для получения картинки по категории и индексу
function getProductImage(category: string, index: number): string {
  const normalizedCategory = category?.toLowerCase() || ''
  const images = categoryImages[normalizedCategory] || categoryImages['ковры']
  return images[index % images.length]
}

export default function Home() {
  const router = useRouter()
  const { cartItems, addToCart } = useCart()
  const categories = [
    { name: "Ковры", icon: Package, category: "ковры" },
    { name: "Телефоны", icon: Phone, category: "телефоны" },
    { name: "Книги", icon: BookOpen, category: "книги" },
  ]

  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadProducts() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .limit(8)
        
        if (error) throw error
        setProducts(data || [])
      } catch (err) {
        console.error('Ошибка загрузки товаров:', err)
      } finally {
        setLoading(false)
      }
    }
    
    loadProducts()
  }, [])

  // Функция добавления в корзину (без alert)
  const handleAddToCart = (product: any, index: number) => {
    addToCart({
      id: product.id,
      name: product.title,
      price: product.price,
      image: getProductImage(product.category, index),
      productId: product.id,
    })
    // Alert удален - счетчик в Header покажет добавление
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header currentPage="home" />

      {/* Герой-секция */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Лучшие товары по выгодным ценам
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 max-w-2xl mx-auto">
            Широкий ассортимент качественных товаров с доставкой по всей России
          </p>
        </div>
      </section>

      {/* Популярные категории */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Популярные категории
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {categories.map((category, index) => {
              const Icon = category.icon
              return (
                <div
                  key={index}
                  onClick={() => router.push(`/catalog?category=${encodeURIComponent(category.category)}`)}
                  className="bg-white rounded-lg shadow-md p-8 hover:shadow-xl transition-all cursor-pointer group active:scale-95"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="bg-blue-100 rounded-full p-6 mb-4 group-hover:bg-blue-200 transition-colors">
                      <Icon className="w-12 h-12 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">{category.name}</h3>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Рекомендуемые товары */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Рекомендуемые товары
          </h2>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Загружаем товары...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Товары не найдены</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
              {products.map((product, index) => (
                <div
                  key={product.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
                >
                  <div className="aspect-square overflow-hidden bg-gray-100">
                    <img
                      src={getProductImage(product.category, index)}
                      alt={product.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {product.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{product.description}</p>
                    <p className="text-2xl font-bold text-blue-600 mb-4">
                      {product.price.toLocaleString('ru-RU')} ₽
                    </p>
                    <button 
                      onClick={() => handleAddToCart(product, index)}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>В корзину</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Преимущества */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Почему выбирают нас
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <div className="bg-white rounded-lg p-6 text-center shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 font-bold text-lg">✓</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Гарантия качества</h3>
              <p className="text-gray-600 text-sm">Все товары проходят проверку перед отправкой</p>
            </div>
            <div className="bg-white rounded-lg p-6 text-center shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 font-bold text-lg">🚚</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Быстрая доставка</h3>
              <p className="text-gray-600 text-sm">Доставка по всей России от 1 дня</p>
            </div>
            <div className="bg-white rounded-lg p-6 text-center shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 font-bold text-lg">💳</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Удобная оплата</h3>
              <p className="text-gray-600 text-sm">Наличные, карты, онлайн-платежи</p>
            </div>
            <div className="bg-white rounded-lg p-6 text-center shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 font-bold text-lg">🔄</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Легкий возврат</h3>
              <p className="text-gray-600 text-sm">Возврат товара в течение 14 дней</p>
            </div>
          </div>
        </div>
      </section>

      {/* Футер */}
      <footer className="bg-gray-900 text-white mt-auto">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Store className="w-6 h-6" />
                <span className="text-xl font-bold">Маркет</span>
              </div>
              <p className="text-gray-400">
                Ваш надежный партнер в покупках. Качество и выгодные цены каждый день.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Контакты</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Телефон: +7 (800) 123-45-67</li>
                <li>Email: info@marketplace.ru</li>
                <li>Адрес: г. Москва, ул. Примерная, д. 1</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Режим работы</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Пн-Пт: 9:00 - 21:00</li>
                <li>Сб-Вс: 10:00 - 20:00</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Маркет. Все права защищены.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}