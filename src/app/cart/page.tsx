"use client";

import { useState } from "react";
import { ShoppingCart, Grid3x3, X, Plus, Minus, Tag, Store } from "lucide-react";
import Link from "next/link";
import Header from '@/app/components/Header';
import { useCart } from '@/lib/CartContext';

export default function CartPage() {
  const { cartItems, updateQuantity, removeFromCart } = useCart();
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ru-RU").format(price) + " ₽";
  };

  const applyPromoCode = () => {
    // Пример промокода: скидка 10%
    if (promoCode.toLowerCase() === "скидка10") {
      setDiscount(0.1);
    } else if (promoCode.toLowerCase() === "скидка20") {
      setDiscount(0.2);
    } else {
      alert("Промокод не найден");
    }
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = subtotal * discount;
  const total = subtotal - discountAmount;

  const isCartEmpty = cartItems.length === 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Header currentPage="cart" />

      {/* Основной контент */}
      <main className="flex-1 container mx-auto px-4 py-8">
        {isCartEmpty ? (
          /* Пустая корзина */
          <div className="flex flex-col items-center justify-center py-20">
            <div className="bg-gray-100 rounded-full p-12 mb-6">
              <ShoppingCart className="w-24 h-24 text-gray-400" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Ваша корзина пуста</h2>
            <p className="text-gray-600 mb-8 text-center max-w-md">
              Добавьте товары из каталога, чтобы начать покупки
            </p>
            <Link
              href="/catalog"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors font-semibold flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Grid3x3 className="w-5 h-5" />
              <span>Перейти в каталог</span>
            </Link>
          </div>
        ) : (
          /* Корзина с товарами */
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Корзина покупок</h1>

            <div className="flex flex-col lg:flex-row gap-8">
              {/* Таблица товаров */}
              <div className="flex-1">
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  {/* Десктопная таблица */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Товар</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Цена</th>
                          <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Количество</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Сумма</th>
                          <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Действия</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {cartItems.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-4">
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="w-20 h-20 object-cover rounded-lg"
                                />
                                <span className="font-medium text-gray-900">{item.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-gray-700">{formatPrice(item.price)}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-center gap-3">
                                <button
                                  onClick={() => updateQuantity(item.id, -1)}
                                  className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors cursor-pointer active:scale-95"
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                                <span className="w-12 text-center font-medium">{item.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(item.id, 1)}
                                  className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors cursor-pointer active:scale-95"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                            <td className="px-6 py-4 font-semibold text-gray-900">
                              {formatPrice(item.price * item.quantity)}
                            </td>
                            <td className="px-6 py-4">
                              <button
                                onClick={() => removeFromCart(item.id)}
                                className="mx-auto flex items-center justify-center w-8 h-8 text-red-600 hover:bg-red-50 active:bg-red-100 rounded-lg transition-colors cursor-pointer active:scale-95"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Мобильная версия */}
                  <div className="md:hidden divide-y divide-gray-200">
                    {cartItems.map((item) => (
                      <div key={item.id} className="p-4">
                        <div className="flex gap-4 mb-4">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                          />
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900 mb-2">{item.name}</h3>
                            <p className="text-lg font-semibold text-blue-600 mb-2">{formatPrice(item.price)}</p>
                            <div className="flex items-center gap-3 mb-2">
                              <button
                                onClick={() => updateQuantity(item.id, -1)}
                                className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors cursor-pointer active:scale-95"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="w-12 text-center font-medium">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.id, 1)}
                                className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors cursor-pointer active:scale-95"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-gray-900">
                                Сумма: {formatPrice(item.price * item.quantity)}
                              </span>
                              <button
                                onClick={() => removeFromCart(item.id)}
                                className="p-2 text-red-600 hover:bg-red-50 active:bg-red-100 rounded-lg transition-colors cursor-pointer active:scale-95"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Блок "Итого" */}
              <div className="lg:w-96 flex-shrink-0">
                <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Итого</h2>

                  {/* Промокод */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Промокод</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Введите промокод"
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                      </div>
                      <button
                        onClick={applyPromoCode}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-colors font-medium whitespace-nowrap cursor-pointer active:scale-95"
                      >
                        Применить
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Пример: СКИДКА10, СКИДКА20</p>
                  </div>

                  {/* Расчет суммы */}
                  <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
                    <div className="flex justify-between text-gray-700">
                      <span>Товары ({cartItems.reduce((sum, item) => sum + item.quantity, 0)} шт.)</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Скидка ({Math.round(discount * 100)}%)</span>
                        <span>-{formatPrice(discountAmount)}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center mb-6">
                    <span className="text-xl font-bold text-gray-900">К оплате</span>
                    <span className="text-2xl font-bold text-blue-600">{formatPrice(total)}</span>
                  </div>

                  <button className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors font-semibold text-lg cursor-pointer active:scale-95">
                    Оформить заказ
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

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
  );
}
