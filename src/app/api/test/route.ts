import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Получаем все товары
    const { data, error } = await supabase
      .from('products')
      .select('*')
    
    if (error) {
      return NextResponse.json({ 
        success: false,
        error: error.message,
        hint: 'Таблица products не найдена. Создайте ее в Supabase SQL Editor.'
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Supabase подключен успешно!',
      productsCount: data?.length || 0,
      products: data
    })
    
  } catch (err: any) {
    return NextResponse.json({ 
      success: false,
      error: err.message 
    }, { status: 500 })
  }
}