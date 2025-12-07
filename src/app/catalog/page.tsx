"use client";

import { createClient } from '@supabase/supabase-js'
import { useEffect, useState } from "react";
import { ShoppingCart, Search, Menu, X, Store } from "lucide-react";
import Link from 'next/link';
import Header from '@/app/components/Header';
import { useCart } from '@/lib/CartContext';

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

export default function CatalogPage() {
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedPriceRange, setSelectedPriceRange] = useState<string>("");
    const [onlyDiscount, setOnlyDiscount] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    
    // НОВЫЕ СОСТОЯНИЯ ДЛЯ ЗАГРУЗКИ ИЗ SUPABASE
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filteredProducts, setFilteredProducts] = useState<any[]>([]);

    // Подключаем контекст корзины
    const { cartItems, addToCart } = useCart();

    // ЗАГРУЗКА ТОВАРОВ ИЗ SUPABASE
    useEffect(() => {
        async function loadProducts() {
            try {
                const { data, error } = await supabase
                    .from('products')
                    .select('*');
                
                if (error) throw error;
                
                setProducts(data || []);
                setFilteredProducts(data || []);
            } catch (err) {
                console.error('Ошибка загрузки товаров:', err);
            } finally {
                setLoading(false);
            }
        }
        
        loadProducts();
    }, []);

    // ФУНКЦИЯ ДЛЯ ФИЛЬТРАЦИИ
    useEffect(() => {
        if (!products.length) return;
        
        let result = [...products];
        
        // Фильтрация по категориям
        if (selectedCategories.length > 0) {
            result = result.filter(product => 
                selectedCategories.includes(product.category)
            );
        }
        
        // Фильтрация по цене
        if (selectedPriceRange) {
            switch (selectedPriceRange) {
                case "0-5000":
                    result = result.filter(product => product.price <= 5000);
                    break;
                case "5000-20000":
                    result = result.filter(product => product.price > 5000 && product.price <= 20000);
                    break;
                case "20000+":
                    result = result.filter(product => product.price > 20000);
                    break;
            }
        }
        
        // Фильтрация по скидке
        if (onlyDiscount) {
            result = result.filter(product => product.discount > 0);
        }
        
        // Поиск по названию
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            result = result.filter(product => 
                product.title.toLowerCase().includes(query) ||
                product.description.toLowerCase().includes(query)
            );
        }
        
        setFilteredProducts(result);
    }, [selectedCategories, selectedPriceRange, onlyDiscount, searchQuery, products]);

    const toggleCategory = (category: string) => {
        setSelectedCategories((prev) =>
            prev.includes(category)
                ? prev.filter((c) => c !== category)
                : [...prev, category]
        );
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("ru-RU").format(price) + " ₽";
    };

    // Функция добавления в корзину (БЕЗ alert)
    const handleAddToCart = (product: any, index: number) => {
        addToCart({
            id: product.id,
            name: product.title,
            price: product.discount > 0 
                ? product.price * (1 - product.discount / 100)
                : product.price,
            originalPrice: product.price,
            discount: product.discount,
            image: getProductImage(product.category, index),
            productId: product.id,
            quantity: 1
        });
        // Alert удален - счетчик в Header покажет добавление
    };

    // Если загрузка
    if (loading) {
        return (
            <div className="min-h-screen flex flex-col">
                <Header currentPage="catalog" />
                <main className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                        <p className="text-gray-600">Загружаем каталог...</p>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col">
            <Header currentPage="catalog" />

            {/* Основной контент */}
            <main className="flex-1 container mx-auto px-4 py-8">
                {/* Кнопка открытия фильтров для мобильных */}
                {!isFiltersOpen && (
                    <div className="lg:hidden mb-4">
                        <button
                            onClick={() => setIsFiltersOpen(true)}
                            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                            <Menu className="w-5 h-5" />
                            <span>Фильтры</span>
                        </button>
                    </div>
                )}
                
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Левая колонка - Фильтры */}
                    <aside
                        className={`${isFiltersOpen ? "block" : "hidden"
                            } lg:block w-full lg:w-64 flex-shrink-0 bg-white rounded-lg shadow-md p-6 h-fit sticky top-24`}
                    >
                        <div className="lg:hidden mb-4">
                            <button
                                onClick={() => setIsFiltersOpen(false)}
                                className="w-full flex items-center justify-center gap-2 text-gray-700 hover:text-blue-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                                <span>Закрыть фильтры</span>
                            </button>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Фильтры</h2>

                        {/* Поисковая строка */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Поиск
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Поиск товаров..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                />
                            </div>
                        </div>

                        {/* Категории */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Категории
                            </label>
                            <div className="space-y-2">
                                {["ковры", "телефоны", "книги"].map((category) => (
                                    <label key={category} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={selectedCategories.includes(category)}
                                            onChange={() => toggleCategory(category)}
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <span className="text-gray-700">{category.charAt(0).toUpperCase() + category.slice(1)}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Ценовой диапазон */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Ценовой диапазон
                            </label>
                            <div className="space-y-2">
                                {[
                                    { label: "до 5000₽", value: "0-5000" },
                                    { label: "5000-20000₽", value: "5000-20000" },
                                    { label: "от 20000₽", value: "20000+" },
                                ].map((range) => (
                                    <label key={range.value} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="priceRange"
                                            checked={selectedPriceRange === range.value}
                                            onChange={() => setSelectedPriceRange(range.value)}
                                            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                        />
                                        <span className="text-gray-700">{range.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Только со скидкой */}
                        <div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={onlyDiscount}
                                    onChange={(e) => setOnlyDiscount(e.target.checked)}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="text-gray-700">Только со скидкой</span>
                            </label>
                        </div>
                        
                        {/* Количество найденных товаров */}
                        <div className="mt-6 pt-6 border-t border-gray-200">
                            <p className="text-sm text-gray-600">
                                Найдено: <span className="font-semibold">{filteredProducts.length}</span> товаров
                            </p>
                        </div>
                    </aside>

                    {/* Правая колонка - Товары */}
                    <div className="flex-1">
                        <div className="flex justify-between items-center mb-6">
                            <h1 className="text-3xl font-bold text-gray-900">Каталог товаров</h1>
                            <div className="text-gray-600">
                                Показано: <span className="font-semibold">{filteredProducts.length}</span> из <span className="font-semibold">{products.length}</span>
                            </div>
                        </div>

                        {/* Сетка товаров */}
                        {filteredProducts.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-gray-600 text-lg">Товары не найдены</p>
                                <p className="text-gray-500 mt-2">Попробуйте изменить фильтры</p>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                                    {filteredProducts.map((product, index) => (
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
                                                <button 
                                                    onClick={() => handleAddToCart(product, index)}
                                                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <ShoppingCart className="w-4 h-4" />
                                                    <span>В корзину</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Пагинация */}
                                {filteredProducts.length > 8 && (
                                    <div className="flex justify-center items-center gap-2">
                                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold">
                                            1
                                        </button>
                                        <button className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                                            2
                                        </button>
                                        <button className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                                            3
                                        </button>
                                        <button className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                                            4
                                        </button>
                                        <button className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                                            5
                                        </button>
                                        <button className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                                            Далее
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
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