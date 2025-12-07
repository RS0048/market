'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, User, Mail, Lock, ShoppingBag, Store } from 'lucide-react'
import Header from '@/app/components/Header'

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  // Состояния для формы
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    role: 'buyer' as 'buyer' | 'seller'
  })

  // Проверяем есть ли уже сессия
  useEffect(() => {
    async function checkSession() {
      try {
        const supabase = createClient()
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Ошибка проверки сессии:', error)
          return
        }
        
        if (data.session) {
          router.push('/')
        }
      } catch (err: unknown) {
        console.error('Ошибка при проверке сессии:', err)
      }
    }
    
    checkSession()
  }, [router])

  // Обработчик изменения полей
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError('') // Сбрасываем ошибку при изменении
  }

  // Вход
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    
    try {
      const supabase = createClient()
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email.trim(),
        password: formData.password,
      })

      if (signInError) {
        throw signInError
      }

      if (data.session) {
        setSuccess('Вход выполнен успешно!')
        
        // Редирект через 1 секунду
        setTimeout(() => {
          router.push('/')
          router.refresh()
        }, 1000)
      }
      
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка при входе'
      setError(errorMessage)
      console.error('Ошибка входа:', err)
    } finally {
      setLoading(false)
    }
  }

  // Регистрация
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    // Валидация
    if (!formData.fullName.trim()) {
      setError('Введите имя')
      setLoading(false)
      return
    }

    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('Введите корректный email')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('Пароль должен быть не менее 6 символов')
      setLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Пароли не совпадают')
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()
      
      // Регистрируем пользователя
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName.trim(),
            role: formData.role
          }
        }
      })

      if (authError) {
        // Если пользователь уже существует, пробуем войти
        if (authError.message.includes('already registered') || 
            authError.message.includes('User already registered') ||
            authError.message.includes('already exists')) {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: formData.email.trim(),
            password: formData.password,
          })
          
          if (signInError) {
            throw signInError
          }
          
          setSuccess('Вход выполнен (пользователь уже был зарегистрирован)!')
          setTimeout(() => {
            router.push('/')
            router.refresh()
          }, 1000)
          return
        }
        throw authError
      }

      // Если регистрация успешна
      if (authData.user) {
        // Пробуем сохранить в таблицу users
        try {
          const { error: dbError } = await supabase
            .from('users')
            .insert({
              id: authData.user.id,
              email: formData.email.trim(),
              full_name: formData.fullName.trim(),
              role: formData.role
            })
            .select()

          if (dbError && !dbError.message.includes('duplicate') && !dbError.message.includes('already exists')) {
            console.warn('Не удалось сохранить в users:', dbError.message)
          }
        } catch (dbErr) {
          console.warn('Ошибка БД (не критично):', dbErr)
        }

        // Если сессия уже есть (автоматический вход), редиректим
        if (authData.session) {
          setSuccess('Регистрация и вход выполнены успешно!')
          setTimeout(() => {
            router.push('/')
            router.refresh()
          }, 1000)
        } else {
          // Если требуется подтверждение email, переключаем на вкладку входа
          setSuccess('Регистрация успешна! Теперь войдите.')
          setActiveTab('login')
          // Очищаем пароли
          setFormData(prev => ({
            ...prev,
            password: '',
            confirmPassword: ''
          }))
        }
      }

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка при регистрации'
      setError(errorMessage)
      console.error('Ошибка регистрации:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header currentPage="auth" />

      {/* Основной контент */}
      <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
        <div className="w-full max-w-md">
          {/* Вкладки */}
          <div className="flex border-b border-gray-200 mb-8">
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-4 text-center font-medium text-lg cursor-pointer transition-colors ${
                activeTab === 'login'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700 active:scale-95'
              }`}
            >
              Вход
            </button>
            <button
              onClick={() => setActiveTab('signup')}
              className={`flex-1 py-4 text-center font-medium text-lg cursor-pointer transition-colors ${
                activeTab === 'signup'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700 active:scale-95'
              }`}
            >
              Регистрация
            </button>
          </div>

          {/* Сообщения */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg">
              {success}
            </div>
          )}

          {/* Форма входа */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Пароль
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Введите пароль"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer active:scale-95 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-95"
              >
                {loading ? 'Вход...' : 'Войти'}
              </button>
            </form>
          )}

          {/* Форма регистрации */}
          {activeTab === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Имя
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Ваше имя"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Пароль
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Не менее 6 символов"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer active:scale-95 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Подтверждение пароля
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Повторите пароль"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Роль
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex flex-col items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 active:scale-95 transition-all has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
                    <input
                      type="radio"
                      name="role"
                      value="buyer"
                      checked={formData.role === 'buyer'}
                      onChange={handleChange}
                      className="hidden"
                    />
                    <ShoppingBag className="w-8 h-8 mb-2 text-gray-600" />
                    <span className="font-medium">Покупатель</span>
                    <span className="text-sm text-gray-500 text-center mt-1">
                      Покупка товаров
                    </span>
                  </label>
                  
                  <label className="flex flex-col items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 active:scale-95 transition-all has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
                    <input
                      type="radio"
                      name="role"
                      value="seller"
                      checked={formData.role === 'seller'}
                      onChange={handleChange}
                      className="hidden"
                    />
                    <Store className="w-8 h-8 mb-2 text-gray-600" />
                    <span className="font-medium">Продавец</span>
                    <span className="text-sm text-gray-500 text-center mt-1">
                      Продажа товаров
                    </span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-95"
              >
                {loading ? 'Регистрация...' : 'Зарегистрироваться'}
              </button>
            </form>
          )}

          {/* Ссылка на условия */}
          <div className="mt-8 text-center text-sm text-gray-500">
            Нажимая кнопку, вы соглашаетесь с{' '}
            <a href="#" className="text-blue-600 hover:underline cursor-pointer active:scale-95 transition-all">
              условиями использования
            </a>{' '}
            и{' '}
            <a href="#" className="text-blue-600 hover:underline cursor-pointer active:scale-95 transition-all">
              политикой конфиденциальности
            </a>
          </div>
        </div>
      </main>

      {/* Футер */}
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          <p>© 2024 Маркетплейс. Все права защищены.</p>
        </div>
      </footer>
    </div>
  )
}