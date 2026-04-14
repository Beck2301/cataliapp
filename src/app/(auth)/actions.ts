'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Please enter both email and password' }
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Please enter both email and password' }
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

// =============================================
// Category Management
// =============================================

export async function createCategory(storeId: string, name: string) {
  const supabase = await createClient()

  if (!name.trim()) {
    return { error: 'El nombre es requerido' }
  }

  // Get max display_order
  const { data: existing } = await supabase
    .from('categories')
    .select('display_order')
    .eq('store_id', storeId)
    .order('display_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  const displayOrder = existing ? existing.display_order + 1 : 0

  const { error } = await supabase
    .from('categories')
    .insert({
      store_id: storeId,
      name: name.trim(),
      display_order: displayOrder,
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function updateCategory(categoryId: string, name: string) {
  const supabase = await createClient()

  if (!name.trim()) {
    return { error: 'El nombre es requerido' }
  }

  const { error } = await supabase
    .from('categories')
    .update({ name: name.trim() })
    .eq('id', categoryId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteCategory(categoryId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', categoryId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function reorderCategories(storeId: string, categoryIds: string[]) {
  const supabase = await createClient()

  const updates = categoryIds.map((id, index) => ({
    id,
    display_order: index,
  }))

  for (const update of updates) {
    await supabase
      .from('categories')
      .update({ display_order: update.display_order })
      .eq('id', update.id)
  }

  revalidatePath('/dashboard')
  return { success: true }
}
