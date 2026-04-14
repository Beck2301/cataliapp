import { getSupabase } from '@/lib/supabase';

let sessionId: string;

export function getSessionId() {
  if (!sessionId) {
    sessionId =
      typeof window !== 'undefined'
        ? sessionStorage.getItem('session_id') || crypto.randomUUID()
        : crypto.randomUUID();
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('session_id', sessionId);
    }
  }
  return sessionId;
}

export async function trackPageView(storeId: string, path = '/') {
  try {
    const db = getSupabase() as any;
    await db.from('page_views').insert({
      store_id: storeId,
      session_id: getSessionId(),
      path,
    });
  } catch {
    // Fail silently for analytics
  }
}

export async function trackProductView(storeId: string, productId: string) {
  try {
    const db = getSupabase() as any;
    await db.from('product_views').insert({
      store_id: storeId,
      product_id: productId,
      session_id: getSessionId(),
    });
  } catch {
    // Fail silently
  }
}

export async function fetchAnalytics(storeId: string) {
  const db = getSupabase() as any;
  const { data: views } = await db
    .from('page_views')
    .select('created_at')
    .eq('store_id', storeId);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const totalViews = views?.length || 0;
  const todayViews =
    views?.filter((v: any) => new Date(v.created_at) >= today).length || 0;

  // Top products
  const { data: productViews } = await db
    .from('product_views')
    .select('product_id')
    .eq('store_id', storeId);

  const viewCounts: Record<string, number> = {};
  productViews?.forEach((pv: any) => {
    viewCounts[pv.product_id] = (viewCounts[pv.product_id] || 0) + 1;
  });

  const topProducts = Object.entries(viewCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, views]) => ({ id, name: '', views }));

  // WhatsApp clicks
  const { count: whatsappClicks } = await db
    .from('whatsapp_clicks')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId);

  return {
    totalViews,
    todayViews,
    topProducts,
    whatsappClicks: whatsappClicks || 0,
  };
}
