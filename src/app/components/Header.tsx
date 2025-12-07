'use client'

import { createClient } from '@supabase/supabase-js'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingCart, User, Home as HomeIcon, Grid3x3, Store, Menu, X, Plus, Package } from 'lucide-react'
import Link from 'next/link'
import { useCart } from '@/lib/CartContext'

// Создаем клиент прямо здесь
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

interface HeaderProps {
  currentPage?: 'home' | 'catalog' | 'cart' | 'auth' | 'add-product' | 'products'
}

interface UserProfile {
  id: string
  email: string
  full_name?: string
  role?: 'buyer' | 'seller'
}

export default function Header({ currentPage }: HeaderProps) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  // Добавляем контекст корзины
  const { cartItems } = useCart()
  
  // Считаем общее количество товаров в корзине
  const cartItemsCount = useMemo(() => {
    return cartItems.reduce((total, item) => total + item.quantity, 0)
  }, [cartItems])

  // Мемоизированная функция проверки пользователя
  const checkUser = useCallback(async () => {
    try {
      // Получаем текущего пользователя из auth
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
      
      if (authError) throw authError
      
      if (authUser) {
        setUser(authUser)
        
        // Пробуем загрузить профиль из таблицы users
        try {
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*') // Используем * вместо конкретных полей
            .eq('id', authUser.id)
            .single()
          
          if (!profileError && profile) {
            // Если есть профиль и нет ошибок
            setUserProfile({
              id: profile.id || authUser.id,
              email: profile.email || authUser.email || '',
              full_name: profile.full_name || profile.fullName || authUser.user_metadata?.full_name || '',
              role: (profile.role as 'buyer' | 'seller') || authUser.user_metadata?.role || 'buyer'
            })
          } else {
            // Если ошибка или профиль не найден, используем данные из auth
            setUserProfile({
              id: authUser.id,
              email: authUser.email || '',
              full_name: authUser.user_metadata?.full_name || '',
              role: (authUser.user_metadata?.role as 'buyer' | 'seller') || 'buyer'
            })
          }
        } catch (dbError) {
          // Если ошибка при запросе к таблице users
          console.log('Используем данные из auth, таблица users недоступна')
          setUserProfile({
            id: authUser.id,
            email: authUser.email || '',
            full_name: authUser.user_metadata?.full_name || '',
            role: (authUser.user_metadata?.role as 'buyer' | 'seller') || 'buyer'
          })
        }
      } else {
        setUser(null)
        setUserProfile(null)
      }
    } catch (err) {
      console.error('Ошибка проверки пользователя:', err)
      setUser(null)
      setUserProfile(null)
    } finally {
      setLoadingUser(false)
    }
  }, [])

  // Проверка авторизации и загрузка профиля
  useEffect(() => {
    checkUser()

    // Подписываемся на изменения авторизации
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user)
        // Перезагружаем профиль при изменении сессии
        checkUser()
      } else {
        setUser(null)
        setUserProfile(null)
        setLoadingUser(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [checkUser])

  // Обработчик выхода
  async function handleLogout() {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setUserProfile(null)
      router.push('/')
      router.refresh()
    } catch (err) {
      console.error('Ошибка выхода:', err)
      // В случае ошибки все равно делаем редирект
      setUser(null)
      setUserProfile(null)
      router.push('/')
      router.refresh()
    }
  }

  // Функция для определения активной ссылки (мемоизирована)
  const isActive = useCallback((page: string) => {
    return currentPage === page ? 'text-blue-600 font-semibold' : 'text-gray-700 hover:text-blue-600'
  }, [currentPage])

  const isSeller = useMemo(() => userProfile?.role === 'seller', [userProfile?.role])

  // Форматирование имени пользователя для отображения
  const displayName = useMemo(() => {
    if (!userProfile) return ''
    
    if (userProfile.full_name) return userProfile.full_name
    if (userProfile.email) {
      return userProfile.email.split('@')[0] // Показываем только часть до @
    }
    return 'Пользователь'
  }, [userProfile])

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Логотип */}
          <Link href="/" className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity active:scale-95">
            <Store className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">Маркет</span>
          </Link>

          {/* Десктопная навигация */}
          <nav className="hidden md:flex items-center gap-6">
            {/* Главная */}
            <Link href="/" className={`flex items-center gap-1 transition-colors cursor-pointer hover:text-blue-600 active:scale-95 ${isActive('home')}`}>
              <HomeIcon className="w-4 h-4" />
              <span>Главная</span>
            </Link>

            {/* Каталог */}
            <Link href="/catalog" className={`flex items-center gap-1 transition-colors cursor-pointer hover:text-blue-600 active:scale-95 ${isActive('catalog')}`}>
              <Grid3x3 className="w-4 h-4" />
              <span>Каталог</span>
            </Link>

            {/* Корзина с счетчиком - ИСПРАВЛЕННЫЙ ДИЗАЙН */}
            <Link href="/cart" className={`flex items-center gap-1 transition-colors cursor-pointer hover:text-blue-600 active:scale-95 relative ${isActive('cart')}`}>
              <ShoppingCart className="w-5 h-5" />
              <span>Корзина</span>
              {cartItemsCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                  {cartItemsCount > 9 ? '9+' : cartItemsCount}
                </span>
              )}
            </Link>

            {/* Ссылки для продавцов */}
            {isSeller && (
              <>
                <Link href="/seller/add-product" className={`flex items-center gap-1 transition-colors cursor-pointer hover:text-blue-600 active:scale-95 ${isActive('add-product')}`}>
                  <Plus className="w-4 h-4" />
                  <span>Добавить товар</span>
                </Link>
                <Link href="/seller/products" className={`flex items-center gap-1 transition-colors cursor-pointer hover:text-blue-600 active:scale-95 ${isActive('products')}`}>
                  <Package className="w-4 h-4" />
                  <span>Мои товары</span>
                </Link>
              </>
            )}

            {/* Авторизация */}
            {loadingUser ? (
              <div className="flex items-center gap-1 text-gray-400 min-w-[120px]">
                <User className="w-4 h-4" />
                <span>Загрузка...</span>
              </div>
            ) : user && userProfile ? (
              <div className="flex items-center gap-4 min-h-[32px]">
                <span className="text-gray-700 whitespace-nowrap max-w-[150px] truncate" title={userProfile.email}>
                  {displayName}
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 text-gray-700 hover:text-blue-600 transition-colors cursor-pointer active:scale-95"
                >
                  <User className="w-4 h-4" />
                  <span>Выйти</span>
                </button>
              </div>
            ) : (
              <Link href="/auth" className={`flex items-center gap-1 transition-colors cursor-pointer ${isActive('auth')}`}>
                <User className="w-4 h-4" />
                <span>Войти</span>
              </Link>
            )}
          </nav>

          {/* Мобильное меню */}
          <div className="md:hidden flex items-center gap-4">
            {/* Корзина с счетчиком для мобильных - ИСПРАВЛЕННЫЙ ДИЗАЙН */}
            <Link href="/cart" className="cursor-pointer hover:text-blue-600 transition-colors active:scale-95 relative">
              <ShoppingCart className={`w-7 h-7 ${currentPage === 'cart' ? 'text-blue-600' : 'text-gray-700'}`} />
              {cartItemsCount > 0 && (
                <span className="absolute -top-0.5 -right-1 bg-red-500 text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                  {cartItemsCount > 9 ? '9+' : cartItemsCount}
                </span>
              )}
            </Link>
            
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-700 hover:text-blue-600 transition-colors cursor-pointer active:scale-95"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Мобильное выпадающее меню */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-200 pt-4">
            <nav className="flex flex-col gap-4">
              <Link 
                href="/" 
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 py-2 cursor-pointer hover:text-blue-600 active:scale-95 transition-colors ${isActive('home')}`}
              >
                <HomeIcon className="w-5 h-5" />
                <span>Главная</span>
              </Link>
              
              <Link 
                href="/catalog" 
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 py-2 cursor-pointer hover:text-blue-600 active:scale-95 transition-colors ${isActive('catalog')}`}
              >
                <Grid3x3 className="w-5 h-5" />
                <span>Каталог</span>
              </Link>
              
              {/* Корзина в мобильном меню с счетчиком - ИСПРАВЛЕННЫЙ ДИЗАЙН */}
              <Link 
                href="/cart" 
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 py-2 cursor-pointer hover:text-blue-600 active:scale-95 transition-colors relative ${isActive('cart')}`}
              >
                <ShoppingCart className="w-6 h-6" />
                <span className="ml-1">Корзина</span>
                {cartItemsCount > 0 && (
                  <span className="absolute left-7 -top-0.5 bg-red-500 text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                    {cartItemsCount > 9 ? '9+' : cartItemsCount}
                  </span>
                )}
              </Link>

              {/* Ссылки для продавцов в мобильном меню */}
              {isSeller && (
                <>
                  <Link 
                    href="/seller/add-product" 
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2 py-2 cursor-pointer hover:text-blue-600 active:scale-95 transition-colors ${isActive('add-product')}`}
                  >
                    <Plus className="w-5 h-5" />
                    <span>Добавить товар</span>
                  </Link>
                  <Link 
                    href="/seller/products" 
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2 py-2 cursor-pointer hover:text-blue-600 active:scale-95 transition-colors ${isActive('products')}`}
                  >
                    <Package className="w-5 h-5" />
                    <span>Мои товары</span>
                  </Link>
                </>
              )}

              {/* Авторизация в мобильном меню */}
              {loadingUser ? (
                <div className="flex items-center gap-2 py-2 text-gray-400 min-h-[40px]">
                  <User className="w-5 h-5" />
                  <span>Загрузка...</span>
                </div>
              ) : user && userProfile ? (
                <div className="flex flex-col gap-2 py-2 min-h-[60px]">
                  <div className="text-gray-700 font-medium truncate" title={userProfile.email}>
                    {displayName}
                  </div>
                  <button
                    onClick={() => {
                      handleLogout()
                      setMobileMenuOpen(false)
                    }}
                    className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors text-left cursor-pointer active:scale-95"
                  >
                    <User className="w-5 h-5" />
                    <span>Выйти</span>
                  </button>
                </div>
              ) : (
                <Link 
                  href="/auth" 
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 py-2 cursor-pointer ${isActive('auth')}`}
                >
                  <User className="w-5 h-5" />
                  <span>Войти</span>
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}