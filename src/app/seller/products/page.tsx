'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Package, Plus, Edit, Trash2, Store } from 'lucide-react'
import Link from 'next/link'
import Header from '@/app/components/Header'

export default function SellerProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    async function loadProducts() {
      try {
        const supabase = createClient()
        
        // Получаем текущего пользователя
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          setError('Необходимо войти в систему')
          setLoading(false)
          return
        }

        // Загружаем товары продавца
        const { data, error: productsError } = await supabase
          .from('products')
          .select('*')
          .eq('seller_id', user.id)
          .order('created_at', { ascending: false })

        if (productsError) throw productsError

        setProducts(data || [])
      } catch (err: any) {
        console.error('Ошибка загрузки товаров:', err)
        setError(err.message || 'Ошибка при загрузке товаров')
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [])

  const handleDelete = async (productId: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот товар?')) {
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)

      if (error) throw error

      // Обновляем список товаров
      setProducts(products.filter(p => p.id !== productId))
    } catch (err: any) {
      console.error('Ошибка удаления товара:', err)
      alert('Ошибка при удалении товара: ' + err.message)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU').format(price) + ' ₽'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header currentPage="products" />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Загружаем товары...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header currentPage="products" />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Заголовок */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 rounded-full p-3">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Мои товары</h1>
            </div>
            <Link
              href="/seller/add-product"
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors font-medium cursor-pointer active:scale-95"
            >
              <Plus className="w-5 h-5" />
              <span>Добавить товар</span>
            </Link>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Список товаров */}
          {products.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <div className="bg-gray-100 rounded-full p-8 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <Package className="w-12 h-12 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">У вас пока нет товаров</h2>
              <p className="text-gray-600 mb-8">
                Начните продавать, добавив свой первый товар
              </p>
              <Link
                href="/seller/add-product"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors font-medium cursor-pointer active:scale-95"
              >
                <Plus className="w-5 h-5" />
                <span>Добавить товар</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
                >
                  <div className="aspect-square overflow-hidden bg-gray-100">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-16 h-16 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {product.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {product.description}
                    </p>
                    <div className="mb-4">
                      {product.discount > 0 ? (
                        <div>
                          <p className="text-lg font-bold text-blue-600">
                            {formatPrice(product.price * (1 - product.discount / 100))}
                          </p>
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-gray-500 line-through">
                              {formatPrice(product.price)}
                            </p>
                            <span className="bg-red-100 text-red-600 text-xs font-semibold px-2 py-1 rounded">
                              -{product.discount}%
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-lg font-bold text-blue-600">
                          {formatPrice(product.price)}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 active:bg-red-100 transition-colors cursor-pointer active:scale-95"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Удалить</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Статистика */}
          {products.length > 0 && (
            <div className="mt-8 bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Статистика</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Всего товаров</div>
                  <div className="text-2xl font-bold text-blue-600">{products.length}</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Со скидкой</div>
                  <div className="text-2xl font-bold text-green-600">
                    {products.filter(p => p.discount > 0).length}
                  </div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Средняя цена</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {products.length > 0
                      ? formatPrice(
                          products.reduce((sum, p) => sum + p.price, 0) / products.length
                        )
                      : '0 ₽'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
