'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, Pencil, Trash2, Store, Package, Image as ImageIcon,
  DollarSign, Tag, Save, X, Share2, Check, ExternalLink,
  QrCode, BarChart3, Palette, UtensilsCrossed, Eye,
  MessageSquare, TrendingUp, ShoppingBag, AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import { fetchAnalytics } from '@/lib/analytics';
import QRModal from '@/components/QRModal';
import { createCategory, updateCategory, deleteCategory } from '../(auth)/actions';
import type { Store as StoreType, Product, Category } from '@/lib/types';

import { createClient } from '@/utils/supabase/client';

async function getDb() {
  return createClient();
}

export default function DashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [store, setStore] = useState<StoreType | null>(null);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState<'products' | 'store' | 'analytics'>('products');
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '', price: '', description: '', image: '', category: '',
    compare_at_price: '',
  });

  const [storeForm, setStoreForm] = useState({
    name: '', tagline: '', description: '', address: '', hours: '',
    instagram: '', whatsapp: '', primary_color: '', accent_color: '',
    background_color: '', mode: 'retail' as 'retail' | 'restaurant',
    logo_url: '', banner_url: '', font_heading: 'sans', font_body: 'sans'
  });
  const [storeSaving, setStoreSaving] = useState(false);
  const [storeSaved, setStoreSaved] = useState(false);

  const catalogUrl = typeof window !== 'undefined' && store
    ? `${window.location.origin}/tienda/${store.slug}`
    : '';

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      const db = await getDb();
      const d = db as any;

      const { data: { user } } = await d.auth.getUser();
      if (!user) {
         window.location.href = '/login';
         return;
      }

      const { data: storeData } = await d
        .from('stores')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      setStore(storeData as StoreType | null);

      if (storeData) {
        setStoreForm({
          name: storeData.name,
          tagline: storeData.tagline || '',
          description: storeData.description || '',
          address: storeData.address || '',
          hours: storeData.hours || '',
          instagram: storeData.instagram || '',
          whatsapp: storeData.whatsapp || '',
          primary_color: storeData.primary_color || '#1C1917',
          accent_color: storeData.accent_color || '#B45309',
          background_color: storeData.background_color || '#FAFAF9',
          mode: storeData.mode || 'retail',
          logo_url: storeData.logo_url || '',
          banner_url: storeData.banner_url || '',
          font_heading: storeData.font_heading || 'sans',
          font_body: storeData.font_body || 'sans',
        });
      }

      if (!storeData) {
        setLoading(false);
        return;
      }

      const { data: cats } = await d
        .from('categories')
        .select('*')
        .eq('store_id', storeData.id)
        .order('display_order');
      setCategories((cats || []) as Category[]);

      const { data: prods } = await d
        .from('products')
        .select('*, category:categories(*)')
        .eq('store_id', storeData.id)
        .order('display_order');
      setProducts((prods || []) as Product[]);

      setLoading(false);
    }
    fetchData();
  }, []);

  const [isUploading, setIsUploading] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState('');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [inlineCategoryName, setInlineCategoryName] = useState('');

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const db = await getDb() as any;
    
    // Create highly unlikely collision name
    const fileExt = file.name.split('.').pop();
    const fileName = `${store?.id || 'temp'}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error } = await db.storage
      .from('products')
      .upload(fileName, file, { cacheControl: '3600', upsert: false });
      
    if (error) {
      alert('Error subiendo la imagen al Storage. Asegurate de crear el bucket "products" y hacerlo público en Supabase. Detalles: ' + error.message);
      setIsUploading(false);
      return;
    }

    const { data: publicData } = db.storage
      .from('products')
      .getPublicUrl(fileName);

    setFormData({ ...formData, image: publicData.publicUrl });
    setIsUploading(false);
  };

  const handleConfigImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'logo_url' | 'banner_url') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const db = await getDb() as any;
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${store?.id || 'temp'}-${field}-${Date.now()}.${fileExt}`;

    const { error } = await db.storage
      .from('products')
      .upload(fileName, file, { cacheControl: '3600', upsert: false });
      
    if (error) {
      alert('Error subiendo imagen: ' + error.message);
      setIsUploading(false);
      return;
    }

    const { data: publicData } = db.storage
      .from('products')
      .getPublicUrl(fileName);

    setStoreForm((prev) => ({ ...prev, [field]: publicData.publicUrl }));
    setIsUploading(false);
  };

  // Category handlers
  const handleCreateCategory = async () => {
    if (!store || !newCategoryName.trim()) return;
    setCategoryError('');
    const result = await createCategory(store.id, newCategoryName.trim());
    if (result.error) {
      setCategoryError(result.error);
    } else {
      setNewCategoryName('');
      // Refresh categories
      const db = await getDb();
      const { data: cats } = await (db as any)
        .from('categories')
        .select('*')
        .eq('store_id', store.id)
        .order('display_order');
      setCategories((cats || []) as Category[]);
    }
  };

  const handleUpdateCategory = async (id: string) => {
    if (!editingCategoryName.trim()) return;
    setCategoryError('');
    const result = await updateCategory(id, editingCategoryName.trim());
    if (result.error) {
      setCategoryError(result.error);
    } else {
      setEditingCategoryId(null);
      setEditingCategoryName('');
      // Refresh categories
      const db = await getDb();
      const { data: cats } = await (db as any)
        .from('categories')
        .select('*')
        .eq('store_id', store!.id)
        .order('display_order');
      setCategories((cats || []) as Category[]);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!store) return;
    setCategoryError('');
    setDeletingCategoryId(id);
    const result = await deleteCategory(id);
    if (result.error) {
      setCategoryError(result.error);
    } else {
      setDeletingCategoryId(null);
      // Refresh categories
      const db = await getDb();
      const { data: cats } = await (db as any)
        .from('categories')
        .select('*')
        .eq('store_id', store.id)
        .order('display_order');
      setCategories((cats || []) as Category[]);
    }
  };

  const handleInlineCreateCategory = async () => {
    if (!store || !inlineCategoryName.trim()) return;
    const result = await createCategory(store.id, inlineCategoryName.trim());
    if (result.success) {
      setInlineCategoryName('');
      setShowNewCategoryInput(false);
      // Refresh categories
      const db = await getDb();
      const { data: cats } = await (db as any)
        .from('categories')
        .select('*')
        .eq('store_id', store.id)
        .order('display_order');
      setCategories((cats || []) as Category[]);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', price: '', description: '', image: '', category: '', compare_at_price: '' });
    setEditingProduct(null);
    setShowForm(false);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      description: product.description || '',
      image: product.image_url || '',
      category: product.category_id || '',
      compare_at_price: product.compare_at_price?.toString() || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const db = await getDb();
    await (db as any).from('products').delete().eq('id', id);
    setProducts(products.filter((p) => p.id !== id));
  };

  const handleSubmit = async () => {
    const db = await getDb();
    const productData = {
      store_id: store?.id,
      name: formData.name,
      price: parseFloat(formData.price) || 0,
      description: formData.description,
      image_url: formData.image,
      category_id: formData.category || null,
      compare_at_price: formData.compare_at_price ? parseFloat(formData.compare_at_price) : null,
    };

    if (editingProduct) {
      const { error } = await (db as any).from('products').update(productData).eq('id', editingProduct.id);   
      if (error) { console.error(error); alert('Error editando producto: ' + error.message); return; }
      setProducts(products.map((p) =>
        p.id === editingProduct.id ? { ...p, ...productData } as Product : p
      ));
    } else {
      const { data, error } = await (db as any).from('products').insert(productData).select().single();
      if (error) { console.error(error); alert('Error creando producto: ' + error.message); return; }
      if (data) setProducts([...products, data]);
    }
    resetForm();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `${store?.name} - Catálogo`, url: catalogUrl });
      } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(catalogUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveStore = async () => {
    if (!store?.id) return;
    setStoreSaving(true);
    setStoreSaved(false);
    const db = await getDb();
    const { error } = await (db as any)
      .from('stores')
      .update(storeForm)
      .eq('id', store.id);
    setStoreSaving(false);
    if (!error) {
      setStoreSaved(true);
      setTimeout(() => setStoreSaved(false), 3000);
      // Refresh local store data
      setStore({ ...store, ...storeForm });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--color-border)] border-t-[var(--color-accent)] rounded-full animate-spin" />
      </div>
    );
  }

  if (!store && !loading) {
    return <StoreSetup onComplete={(st) => setStore(st)} />;
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Header */}
      <header className="bg-[var(--color-surface)] border-b border-[var(--color-border)] sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--color-text-primary)] rounded-lg flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-[var(--font-sans)]">{store?.name}</h1>
              <p className="text-sm text-[var(--color-text-tertiary)]">Panel de administración</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setQrOpen(true)}
              className="p-2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-elevated)] rounded-lg transition-colors"
              title="Código QR"
            >
              <QrCode className="w-5 h-5" />
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 text-base text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors px-3 py-2 rounded-lg hover:bg-[var(--color-accent-subtle)]"
            >
              {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
              <span className="hidden sm:inline">{copied ? '¡Copiado!' : 'Compartir'}</span>
            </button>
            <Link
              href={catalogUrl || '/catalogo'}
              target="_blank"
              className="flex items-center gap-2 text-base text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors px-3 py-2 rounded-lg hover:bg-[var(--color-surface-elevated)]"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">Ver catálogo</span>
            </Link>
            <div className="w-px h-5 bg-[var(--color-border)] mx-1" />
            <div className="w-8 h-8 bg-[var(--color-accent-subtle)] rounded-full flex items-center justify-center text-[var(--color-accent)] text-base font-medium">
              {store?.name?.[0] || 'L'}
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-[var(--color-surface)] border-b border-[var(--color-border)]">
        <div className="max-w-6xl mx-auto px-4 md:px-8 flex gap-0 overflow-x-auto">
          {[
            { id: 'products' as const, icon: Package, label: 'Productos' },
            { id: 'store' as const, icon: Store, label: 'Tienda' },
            { id: 'analytics' as const, icon: BarChart3, label: 'Analytics' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-base border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-[var(--color-text-primary)] text-[var(--color-text-primary)]'
                  : 'border-transparent text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 md:px-8 py-4 sm:py-6 pb-24 lg:pb-6">
        {/* PRODUCTS TAB */}
        {activeTab === 'products' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="mb-4 sm:mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg sm:text-2xl font-[var(--font-sans)]">Mis Productos</h2>
                  <p className="text-xs sm:text-sm text-[var(--color-text-tertiary)] mt-0.5">
                    {products.length} producto{products.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center gap-1.5 bg-[var(--color-text-primary)] text-white px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm hover:bg-[var(--color-text-primary)]/90 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Nuevo producto</span>
                  <span className="sm:hidden">Nuevo</span>
                </button>
              </div>
            </div>

            {/* Product Form Modal */}
            {showForm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4"
                onClick={(e) => e.target === e.currentTarget && resetForm()}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-[var(--color-surface)] rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-[var(--font-sans)]">
                      {editingProduct ? 'Editar producto' : 'Nuevo producto'}
                    </h3>
                    <button onClick={resetForm} className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-base font-medium text-[var(--color-text-primary)] mb-2">Imagen del producto</label>
                      <div className="relative border-2 border-dashed border-[var(--color-border)] rounded-xl p-4 flex flex-col items-center justify-center text-center hover:border-[var(--color-accent)] transition-colors overflow-hidden group min-h-[160px]">
                        {formData.image ? (
                          <div className="relative w-full h-40">
                             <img src={formData.image} alt="Preview" className="w-full h-full object-contain rounded-lg" />
                             <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-lg transition-opacity">
                                <span className="text-white text-base font-medium">Cambiar imagen</span>
                             </div>
                             <input type="file" accept="image/*" onChange={handleImageUpload} disabled={isUploading} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" />
                          </div>
                        ) : (
                          <>
                            {isUploading ? (
                              <div className="w-8 h-8 border-2 border-[var(--color-border)] border-t-[var(--color-accent)] rounded-full animate-spin my-4" />
                            ) : (
                              <>
                                <ImageIcon className="w-8 h-8 text-[var(--color-accent)] mx-auto mb-2" />
                                <p className="text-base font-medium text-[var(--color-text-primary)]">Haz clic aquí para subir una imagen</p>
                                <p className="text-sm text-[var(--color-text-tertiary)] mt-1">Soporta PNG, JPG, WEBP</p>
                                <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                              </>
                            )}
                          </>
                        )}
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                         <span className="text-sm text-[var(--color-text-tertiary)]">O pega un link manualmente:</span>
                         <input type="text" value={formData.image} onChange={(e) => setFormData({ ...formData, image: e.target.value })} placeholder="https://..." className="flex-1 ml-2 px-2 py-1 border border-[var(--color-border)] rounded-md text-sm focus:outline-none" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-base text-[var(--color-text-secondary)] mb-2">Nombre</label>
                      <input
                        type="text"
                        placeholder="Nombre del producto"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-base focus:outline-none focus:border-[var(--color-text-tertiary)]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-base text-[var(--color-text-secondary)] mb-2">Precio</label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-tertiary)]" />
                          <input
                            type="number"
                            placeholder="0.00"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            className="w-full pl-9 pr-3 py-2 border border-[var(--color-border)] rounded-lg text-base focus:outline-none focus:border-[var(--color-text-tertiary)]"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-base text-[var(--color-text-secondary)] mb-2">Precio tachado (opcional)</label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-tertiary)]" />
                          <input
                            type="number"
                            placeholder="0.00"
                            value={formData.compare_at_price}
                            onChange={(e) => setFormData({ ...formData, compare_at_price: e.target.value })}
                            className="w-full pl-9 pr-3 py-2 border border-[var(--color-border)] rounded-lg text-base focus:outline-none focus:border-[var(--color-text-tertiary)]"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-base text-[var(--color-text-secondary)] mb-2">Categoría</label>
                      {showNewCategoryInput ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={inlineCategoryName}
                            onChange={(e) => setInlineCategoryName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleInlineCreateCategory();
                              if (e.key === 'Escape') {
                                setShowNewCategoryInput(false);
                                setInlineCategoryName('');
                              }
                            }}
                            placeholder="Nombre de la categoría..."
                            autoFocus
                            className="flex-1 px-3 py-2 border border-[var(--color-border)] rounded-lg text-base focus:outline-none focus:border-[var(--color-text-primary)]"
                          />
                          <button
                            type="button"
                            onClick={handleInlineCreateCategory}
                            disabled={!inlineCategoryName.trim()}
                            className="px-3 py-2 bg-[var(--color-text-primary)] text-white rounded-lg hover:bg-[var(--color-text-primary)]/90 transition-colors disabled:opacity-50"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowNewCategoryInput(false);
                              setInlineCategoryName('');
                            }}
                            className="px-3 py-2 border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-surface-elevated)] transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-tertiary)]" />
                            <select
                              value={formData.category}
                              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                              className="w-full pl-9 pr-3 py-2 border border-[var(--color-border)] rounded-lg text-base focus:outline-none focus:border-[var(--color-text-tertiary)] appearance-none bg-[var(--color-surface)]"
                            >
                              <option value="">Sin categoría</option>
                              {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                              ))}
                            </select>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowNewCategoryInput(true)}
                            className="px-3 py-2 border border-[var(--color-border)] rounded-lg text-base hover:bg-[var(--color-surface-elevated)] transition-colors flex-shrink-0"
                            title="Crear nueva categoría"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-base text-[var(--color-text-secondary)] mb-2">Descripción</label>
                      <textarea
                        placeholder="Describe tu producto..."
                        rows={3}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-base focus:outline-none focus:border-[var(--color-text-tertiary)] resize-none"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6 pt-4 border-t border-[var(--color-border)]">
                    <button onClick={resetForm} className="flex-1 px-4 py-2.5 border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] transition-colors">
                      Cancelar
                    </button>
                    <button onClick={handleSubmit} className="flex-1 flex items-center justify-center gap-2 bg-[var(--color-text-primary)] text-white px-4 py-2.5 rounded-lg text-sm hover:bg-[var(--color-text-primary)]/90 transition-colors">
                      <Save className="w-4 h-4" />
                      {editingProduct ? 'Guardar' : 'Crear'}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* Products List */}
            <div className="space-y-2 sm:space-y-3">
              {products.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden hover:border-[var(--color-border-subtle)] transition-colors group"
                >
                  <div className="flex items-start gap-3 p-3 sm:p-4">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden flex-shrink-0 bg-[var(--color-surface-elevated)]">
                      <img src={product.image_url || ''} alt={product.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm sm:text-base text-[var(--color-text-primary)] truncate">{product.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-medium text-[var(--color-accent)]">
                          ${product.price.toFixed(2)}
                        </span>
                        {product.compare_at_price && product.compare_at_price > product.price && (
                          <span className="text-xs text-[var(--color-text-tertiary)] line-through">
                            ${product.compare_at_price.toFixed(2)}
                          </span>
                        )}
                      </div>
                      {product.category?.name && (
                        <span className="inline-block text-xs text-[var(--color-text-tertiary)] bg-[var(--color-surface-elevated)] px-2 py-0.5 rounded mt-1.5">
                          {product.category.name}
                        </span>
                      )}
                    </div>
                    {/* Desktop edit/delete buttons */}
                    <div className="hidden sm:flex flex-col items-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(product)} className="p-1.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-elevated)] rounded-lg transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(product.id)} className="p-1.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] hover:bg-[var(--color-error)]/10 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {/* Mobile actions bar */}
                  <div className="sm:hidden flex items-center justify-end gap-1 px-3 pb-2 pt-0 border-t border-[var(--color-border-subtle)]">
                    <button onClick={() => handleEdit(product)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">
                      <Pencil className="w-3.5 h-3.5" /> Editar
                    </button>
                    <button onClick={() => handleDelete(product.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[var(--color-error)] hover:bg-red-50 rounded transition-colors">
                      <Trash2 className="w-3.5 h-3.5" /> Eliminar
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* STORE TAB */}
        {activeTab === 'store' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-[var(--font-sans)] mb-4 sm:mb-6">Configuración de Tienda</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 pb-20 lg:pb-0">
              {/* Left Column: Form */}
              <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 sm:p-6 space-y-4 sm:space-y-5 order-last lg:order-first">

                {/* Images */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm sm:text-base text-[var(--color-text-secondary)] mb-1.5 sm:mb-2">Logo (1:1)</label>
                    <div className="relative border-2 border-dashed border-[var(--color-border)] rounded-xl h-20 sm:h-28 flex flex-col items-center justify-center overflow-hidden group bg-[var(--color-bg)]">
                      {storeForm.logo_url ? (
                        <>
                          <img src={storeForm.logo_url} className="w-full h-full object-contain p-2" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><span className="text-white text-xs sm:text-sm font-medium">Cambiar</span></div>
                        </>
                      ) : (
                        <span className="text-xs sm:text-sm text-[var(--color-text-tertiary)] group-hover:text-[var(--color-text-primary)] transition-colors cursor-pointer">Subir logo</span>
                      )}
                      <input type="file" accept="image/*" onChange={(e) => handleConfigImageUpload(e, 'logo_url')} disabled={isUploading} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm sm:text-base text-[var(--color-text-secondary)] mb-1.5 sm:mb-2">Portada (16:9)</label>
                    <div className="relative border-2 border-dashed border-[var(--color-border)] rounded-xl h-20 sm:h-28 flex flex-col items-center justify-center overflow-hidden group bg-[var(--color-bg)]">
                      {storeForm.banner_url ? (
                        <>
                          <img src={storeForm.banner_url} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><span className="text-white text-xs sm:text-sm font-medium">Cambiar</span></div>
                        </>
                      ) : (
                        <span className="text-xs sm:text-sm text-[var(--color-text-tertiary)] group-hover:text-[var(--color-text-primary)] transition-colors cursor-pointer">Subir portada</span>
                      )}
                      <input type="file" accept="image/*" onChange={(e) => handleConfigImageUpload(e, 'banner_url')} disabled={isUploading} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm sm:text-base text-[var(--color-text-secondary)] mb-1.5 sm:mb-2">Nombre</label>
                  <input type="text" value={storeForm.name} onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })} className="w-full px-3 py-2 sm:py-2.5 border border-[var(--color-border)] bg-[var(--color-bg)] rounded-lg text-sm sm:text-base focus:outline-none focus:border-[var(--color-text-tertiary)]" />
                </div>
                <div>
                  <label className="block text-sm sm:text-base text-[var(--color-text-secondary)] mb-1.5 sm:mb-2">Eslogan</label>
                  <input type="text" value={storeForm.tagline} onChange={(e) => setStoreForm({ ...storeForm, tagline: e.target.value })} className="w-full px-3 py-2 sm:py-2.5 border border-[var(--color-border)] bg-[var(--color-bg)] rounded-lg text-sm sm:text-base focus:outline-none focus:border-[var(--color-text-tertiary)]" />
                </div>
                <div>
                  <label className="block text-sm sm:text-base text-[var(--color-text-secondary)] mb-1.5 sm:mb-2">Descripción</label>
                  <textarea value={storeForm.description} onChange={(e) => setStoreForm({ ...storeForm, description: e.target.value })} rows={3} className="w-full px-3 py-2 sm:py-2.5 border border-[var(--color-border)] bg-[var(--color-bg)] rounded-lg text-sm sm:text-base focus:outline-none focus:border-[var(--color-text-tertiary)] resize-none" />
                </div>

                {/* Brand Colors */}
                <div>
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-[var(--color-text-primary)]">
                      <Palette className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Colores de marca
                    </label>
                    <button
                      onClick={() => setStoreForm(prev => ({
                        ...prev,
                        primary_color: '#1C1917',
                        accent_color: '#B45309',
                        background_color: '#FAFAF9',
                        font_heading: 'sans',
                        font_body: 'sans',
                      }))}
                      className="flex items-center gap-1 text-xs sm:text-sm text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] border border-[var(--color-border)] hover:border-[var(--color-error)]/40 px-2 py-1 sm:px-2.5 sm:py-1 rounded-lg transition-colors bg-[var(--color-bg)]"
                    >
                      <X className="w-3 h-3" /> <span className="hidden sm:inline">Resetear</span> diseño
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 sm:gap-4">
                    <div>
                      <label className="block text-xs text-[var(--color-text-tertiary)] mb-1">Texto Principal</label>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <input type="color" value={storeForm.primary_color} onChange={(e) => setStoreForm({ ...storeForm, primary_color: e.target.value })} className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg cursor-pointer border-0 p-0" />
                        <span className="text-xs text-[var(--color-text-secondary)] font-mono truncate">{storeForm.primary_color}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-[var(--color-text-tertiary)] mb-1">Color de precios</label>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <input type="color" value={storeForm.accent_color} onChange={(e) => setStoreForm({ ...storeForm, accent_color: e.target.value })} className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg cursor-pointer border-0 p-0" />
                        <span className="text-xs text-[var(--color-text-secondary)] font-mono truncate">{storeForm.accent_color}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-[var(--color-text-tertiary)] mb-1">Fondo App</label>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <input type="color" value={storeForm.background_color} onChange={(e) => setStoreForm({ ...storeForm, background_color: e.target.value })} className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg cursor-pointer border-0 p-0" />
                        <span className="text-xs text-[var(--color-text-secondary)] font-mono truncate">{storeForm.background_color}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Typography */}
                <div>
                  <label className="flex items-center gap-2 text-sm sm:text-base font-medium text-[var(--color-text-primary)] mb-2 sm:mb-3 mt-3 sm:mt-4">
                    <span className="font-serif italic font-bold text-base sm:text-lg">Aa</span> Tipografía
                  </label>
                  <div className="grid grid-cols-2 gap-2 sm:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm text-[var(--color-text-tertiary)] mb-1">Títulos</label>
                      <select value={storeForm.font_heading} onChange={(e) => setStoreForm({ ...storeForm, font_heading: e.target.value })} className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-[var(--color-border)] bg-[var(--color-bg)] rounded-lg text-xs sm:text-base focus:outline-none focus:border-[var(--color-text-tertiary)] appearance-none cursor-pointer">
                        <option value="sans">Moderno (Sans)</option>
                        <option value="serif">Elegante (Serif)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm text-[var(--color-text-tertiary)] mb-1">Cuerpo textual</label>
                      <select value={storeForm.font_body} onChange={(e) => setStoreForm({ ...storeForm, font_body: e.target.value })} className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-[var(--color-border)] bg-[var(--color-bg)] rounded-lg text-xs sm:text-base focus:outline-none focus:border-[var(--color-text-tertiary)] appearance-none cursor-pointer">
                        <option value="sans">Moderno (Sans)</option>
                        <option value="serif">Elegante (Serif)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-base text-[var(--color-text-secondary)] mb-1 sm:mb-2">Dirección</label>
                    <input type="text" value={storeForm.address} onChange={(e) => setStoreForm({ ...storeForm, address: e.target.value })} className="w-full px-2 sm:px-3 py-1.5 sm:py-2.5 border border-[var(--color-border)] bg-[var(--color-bg)] rounded-lg text-xs sm:text-base focus:outline-none focus:border-[var(--color-text-tertiary)]" />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-base text-[var(--color-text-secondary)] mb-1 sm:mb-2">Horario</label>
                    <input type="text" value={storeForm.hours} onChange={(e) => setStoreForm({ ...storeForm, hours: e.target.value })} className="w-full px-2 sm:px-3 py-1.5 sm:py-2.5 border border-[var(--color-border)] bg-[var(--color-bg)] rounded-lg text-xs sm:text-base focus:outline-none focus:border-[var(--color-text-tertiary)]" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-base text-[var(--color-text-secondary)] mb-1 sm:mb-2">Instagram</label>
                    <input type="text" value={storeForm.instagram} onChange={(e) => setStoreForm({ ...storeForm, instagram: e.target.value })} className="w-full px-2 sm:px-3 py-1.5 sm:py-2.5 border border-[var(--color-border)] bg-[var(--color-bg)] rounded-lg text-xs sm:text-base focus:outline-none focus:border-[var(--color-text-tertiary)]" />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-base text-[var(--color-text-secondary)] mb-1 sm:mb-2">WhatsApp</label>
                    <input type="text" value={storeForm.whatsapp} onChange={(e) => setStoreForm({ ...storeForm, whatsapp: e.target.value })} className="w-full px-2 sm:px-3 py-1.5 sm:py-2.5 border border-[var(--color-border)] bg-[var(--color-bg)] rounded-lg text-xs sm:text-base focus:outline-none focus:border-[var(--color-text-tertiary)]" />
                  </div>
                </div>

                {/* Mode Toggle */}
                <div>
                  <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-[var(--color-text-primary)] mb-2 sm:mb-3">
                    <UtensilsCrossed className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Modo
                  </label>
                  <div className="flex gap-2">
                    {(['retail', 'restaurant'] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setStoreForm({ ...storeForm, mode })}
                        className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm transition-all ${
                          storeForm.mode === mode
                            ? 'bg-[var(--color-text-primary)] text-white'
                            : 'border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] bg-[var(--color-bg)]'
                        }`}
                      >
                        {mode === 'retail' ? 'Tienda' : 'Restaurante'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Categories Management */}
                <div className="pt-4 sm:pt-6 border-t border-[var(--color-border)]">
                  <label className="flex items-center gap-2 text-sm sm:text-base font-medium text-[var(--color-text-primary)] mb-2 sm:mb-4">
                    <Tag className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Categorías
                  </label>
                  {categoryError && (
                    <p className="text-xs sm:text-sm text-[var(--color-error)] bg-red-50 border border-red-200 rounded-lg p-2 sm:p-3 mb-2 sm:mb-3">{categoryError}</p>
                  )}
                  {/* Add new category */}
                  <div className="flex gap-2 mb-2 sm:mb-4">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateCategory()}
                      placeholder="Nueva categoría..."
                      className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 border border-[var(--color-border)] bg-[var(--color-bg)] rounded-lg text-xs sm:text-base focus:outline-none focus:border-[var(--color-text-tertiary)]"
                    />
                    <button
                      onClick={handleCreateCategory}
                      disabled={!newCategoryName.trim()}
                      className="px-3 sm:px-4 py-1.5 sm:py-2 bg-[var(--color-text-primary)] text-white rounded-lg text-sm sm:text-base hover:bg-[var(--color-text-primary)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                  {/* Categories list */}
                  <div className="space-y-1.5 sm:space-y-2">
                    {categories.length === 0 ? (
                      <p className="text-xs sm:text-sm text-[var(--color-text-tertiary)] text-center py-3 sm:py-4">No hay categorías aún</p>
                    ) : (
                      categories.map((cat) => (
                        <div key={cat.id} className="flex items-center gap-1.5 sm:gap-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-2 sm:px-3 py-1.5 sm:py-2">
                          {editingCategoryId === cat.id ? (
                            <>
                              <input
                                type="text"
                                value={editingCategoryName}
                                onChange={(e) => setEditingCategoryName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleUpdateCategory(cat.id);
                                  if (e.key === 'Escape') {
                                    setEditingCategoryId(null);
                                    setEditingCategoryName('');
                                  }
                                }}
                                autoFocus
                                className="flex-1 px-2 py-1 border border-[var(--color-border)] rounded text-sm sm:text-base focus:outline-none focus:border-[var(--color-text-primary)]"
                              />
                              <button
                                onClick={() => handleUpdateCategory(cat.id)}
                                className="p-1 sm:p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                              >
                                <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingCategoryId(null);
                                  setEditingCategoryName('');
                                }}
                                className="p-1 sm:p-1.5 text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-elevated)] rounded transition-colors"
                              >
                                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <span className="flex-1 text-sm sm:text-base">{cat.name}</span>
                              <button
                                onClick={() => {
                                  setEditingCategoryId(cat.id);
                                  setEditingCategoryName(cat.name);
                                }}
                                className="p-1 sm:p-1.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-elevated)] rounded transition-colors"
                                title="Editar"
                              >
                                <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteCategory(cat.id)}
                                disabled={deletingCategoryId === cat.id}
                                className="p-1 sm:p-1.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                                title="Eliminar"
                              >
                                {deletingCategoryId === cat.id ? (
                                  <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-[var(--color-error)] border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                )}
                              </button>
                            </>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="pt-3 sm:pt-4 border-t border-[var(--color-border)]">
                  <button
                    onClick={handleSaveStore}
                    disabled={storeSaving}
                    className="flex items-center gap-2 bg-[var(--color-text-primary)] text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm hover:bg-[var(--color-text-primary)]/90 transition-colors disabled:opacity-50"
                  >
                    {storeSaving ? (
                      <>
                        <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> <span className="hidden sm:inline">Guardando</span>...
                      </>
                    ) : storeSaved ? (
                      <>
                        <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="hidden sm:inline">¡</span>Guardado<span className="hidden sm:inline">!</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Guardar cambios
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Right Column: Live Preview (Hidden on mobile, converted to Modal) */}
              <div className={`
                ${mobilePreviewOpen ? 'fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4' : 'hidden lg:block relative'}
              `}>
                <div className={`
                  bg-[var(--color-surface)] border border-[var(--color-border)] overflow-hidden shadow-2xl relative flex flex-col
                  ${mobilePreviewOpen ? 'w-full max-w-sm rounded-[2rem] h-[80vh] sm:h-[85vh] mt-8' : 'sticky top-24 rounded-2xl'}
                `}>
                  {mobilePreviewOpen && (
                    <button onClick={() => setMobilePreviewOpen(false)} className="absolute top-3 right-3 z-50 w-8 h-8 bg-black/50 backdrop-blur-sm text-white rounded-full flex items-center justify-center shadow-lg hover:bg-black/70 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  {/* Fake Browser Header (Desktop only) */}
                  {!mobilePreviewOpen && (
                    <div className="bg-[var(--color-surface-elevated)] border-b border-[var(--color-border)] px-4 py-3 flex items-center gap-2 flex-shrink-0">
                      <div className="w-3 h-3 rounded-full bg-red-400" />
                      <div className="w-3 h-3 rounded-full bg-amber-400" />
                      <div className="w-3 h-3 rounded-full bg-green-400" />
                      <span className="ml-2 text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider">Vista Previa en Vivo</span>
                    </div>
                  )}
                  
                  {/* Catalog Miniature (CSS isolated via inline styles mapped to theme vars) */}
                  <div 
                    className={`flex-1 overflow-y-auto overflow-x-hidden ${!mobilePreviewOpen ? 'h-[600px]' : ''} ${storeForm.font_body === 'serif' ? 'font-serif' : 'font-sans'}`}
                    style={{ backgroundColor: storeForm.background_color, color: storeForm.primary_color }}
                  >
                    {/* Hero Banner Area */}
                    <div className="relative h-48 overflow-hidden bg-black/10">
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/70 z-10" />
                      {storeForm.banner_url && (
                        <img src={storeForm.banner_url} alt="Banner" className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500" />
                      )}
                      
                      <div className="absolute bottom-0 left-0 right-0 z-20 p-5">
                        {storeForm.logo_url && (
                          <img src={storeForm.logo_url} alt="Logo" className="w-12 h-12 rounded-xl object-cover mb-3 border border-white/20 shadow-lg" />
                        )}
                        <h1 className={`text-2xl font-bold text-white drop-shadow-md ${storeForm.font_heading === 'serif' ? 'font-serif' : 'font-sans'}`}>{storeForm.name || 'Mi Tienda'}</h1>
                        <p className="text-sm text-white/90 drop-shadow-sm line-clamp-1">{storeForm.tagline || 'Eslogan de tu marca'}</p>
                      </div>
                    </div>

                    {/* Content Area */}
                    <div className="p-5">
                       {storeForm.description && (
                         <p className="text-sm opacity-80 text-center mb-6">{storeForm.description}</p>
                       )}

                       {/* Category Tabs with example text */}
                       <div className="flex justify-center gap-2 mb-8 flex-wrap">
                         {['Todos', 'Felinos', 'Premium', 'Oferta'].map((cat, i) => (
                           <div key={cat} className={`px-4 py-1.5 rounded-full text-xs font-semibold ${i === 0 ? 'text-white' : 'border opacity-60'}`}
                             style={i === 0 ? { backgroundColor: storeForm.primary_color } : { borderColor: storeForm.primary_color, color: storeForm.primary_color }}>
                             {cat}
                           </div>
                         ))}
                       </div>

                       {/* Preview Product Cards with sample data */}
                       <div className="grid grid-cols-2 gap-x-4 gap-y-8">
                         {([
                           { name: 'Gatito Naranja', desc: 'Muy suavecito', price: '$250.00', cat: 'Nuevo', img: 'https://loremflickr.com/300/375/kitten?lock=1' },
                           { name: 'Michi Gris', desc: 'Amoroso y tranquilo', price: '$180.00', cat: 'Popular', img: 'https://loremflickr.com/300/375/kitten?lock=2' },
                           { name: 'Gatita Blanca', desc: 'Ideal para regalo', price: '$320.00', cat: 'Oferta', img: 'https://loremflickr.com/300/375/kitten?lock=3' },
                           { name: 'Minino Negro', desc: 'Elegante y curioso', price: '$210.00', cat: 'Nuevo', img: 'https://loremflickr.com/300/375/kitten?lock=4' },
                         ] as const).map((product, i) => (
                           <div key={i} className="group cursor-pointer">
                             <div className="relative aspect-[4/5] overflow-hidden">
                               <img src={product.img} alt={product.name} className="w-full h-full object-cover" />
                               <span className="absolute top-2 left-2 px-2 py-0.5 bg-white/90 backdrop-blur-sm text-[9px] uppercase tracking-widest" style={{ color: storeForm.primary_color }}>
                                 {product.cat}
                               </span>
                               <div className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center shadow-sm">
                                 <Plus className="w-3.5 h-3.5" style={{ color: storeForm.primary_color }} />
                               </div>
                             </div>
                             <div className="mt-3 space-y-1">
                               <h3 className="text-sm font-medium leading-tight" style={{ color: storeForm.primary_color }}>{product.name}</h3>
                               <p className="text-xs opacity-60 line-clamp-1" style={{ color: storeForm.primary_color }}>{product.desc}</p>
                               <p className="text-sm font-medium" style={{ color: storeForm.accent_color }}>{product.price}</p>
                             </div>
                           </div>
                         ))}
                       </div>
                    </div>
                    
                    {/* WhatsApp CTA — matches real catalog bottom button */}
                    <div className="px-5 pb-8 mt-4 text-center">
                      <div className="inline-flex items-center gap-2 bg-[#25D366] text-white px-6 py-3 rounded-full text-sm font-bold shadow-lg">
                        <ShoppingBag className="w-4 h-4" />
                        Contactar por WhatsApp
                      </div>
                    </div>
                  </div>
                </div>
              </div>


            </div>
          </motion.div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === 'analytics' && <AnalyticsPanel storeId={store?.id || ''} />}
      </main>

      {/* Mobile Floating FAB for Live Preview */}
      {activeTab === 'store' && (
        <button
           onClick={() => setMobilePreviewOpen(true)}
           className="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-[var(--color-text-primary)] text-[var(--color-bg)] px-4 py-2.5 rounded-full flex items-center gap-2 shadow-2xl text-xs font-medium border border-white/10"
        >
           <Eye className="w-4 h-4" /> Ver diseño
        </button>
      )}

      {/* QR Modal */}
      <QRModal open={qrOpen} onClose={() => setQrOpen(false)} url={catalogUrl} storeName={store?.name || ''} />
    </div>
  );
}

function AnalyticsPanel({ storeId }: { storeId: string }) {
  const [analytics, setAnalytics] = useState<{ totalViews: number; todayViews: number; topProducts: { id: string; name: string; views: number }[]; whatsappClicks: number } | null>(null);

  useEffect(() => {
    if (!storeId) return;
    fetchAnalytics(storeId).then(setAnalytics);
  }, [storeId]);

  if (!analytics) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-[var(--color-border)] border-t-[var(--color-accent)] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h2 className="text-2xl font-[var(--font-sans)] !mb-6">Analytics</h2>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Visitas totales', value: analytics.totalViews, icon: Eye, color: 'var(--color-text-primary)' },
          { label: 'Visitas hoy', value: analytics.todayViews, icon: TrendingUp, color: 'var(--color-success)' },
          { label: 'Clicks WhatsApp', value: analytics.whatsappClicks, icon: MessageSquare, color: '#25D366' },
          { label: 'Conversiones', value: analytics.totalViews > 0 ? ((analytics.whatsappClicks / analytics.totalViews) * 100).toFixed(1) + '%' : '0%', icon: BarChart3, color: 'var(--color-accent)' },
        ].map((stat) => (
          <div key={stat.label} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5">
            <stat.icon className="w-5 h-5 mb-3" style={{ color: stat.color }} />
            <p className="text-2xl font-medium">{stat.value}</p>
            <p className="text-sm text-[var(--color-text-tertiary)]">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Top Products */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6">
        <h3 className="text-lg font-[var(--font-sans)] mb-4">Productos más vistos</h3>
        {analytics.topProducts.length === 0 ? (
          <p className="text-[var(--color-text-tertiary)] text-sm">Aún no hay datos de visitas.</p>
        ) : (
          <div className="space-y-3">
            {analytics.topProducts.map((product, i) => (
              <div key={product.id} className="flex items-center gap-3">
                <span className="w-6 text-center text-sm text-[var(--color-text-tertiary)] font-medium">#{i + 1}</span>
                <div className="flex-1">
                  <div className="h-2 bg-[var(--color-surface-elevated)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--color-accent)] rounded-full transition-all"
                      style={{ width: `${(product.views / (analytics.topProducts[0]?.views || 1)) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm text-[var(--color-text-secondary)]">{product.views} vistas</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function StoreSetup({ onComplete }: { onComplete: (store: StoreType) => void }) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [creating, setCreating] = useState(false);

  // basic slug generator
  useEffect(() => {
    setSlug(name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
  }, [name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    const { createClient } = await import('@/utils/supabase/client');
    const db = createClient();
    
    const { data: { user } } = await db.auth.getUser();
    if (!user) return;

    // insert store
    const { data, error } = await db.from('stores').insert({
      user_id: user.id,
      name,
      slug,
      whatsapp: '',
      primary_color: '#1C1917',
      accent_color: '#B45309',
      background_color: '#FAFAF9',
      mode: 'retail',
      logo_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D8ABC&color=fff&size=200`,
      banner_url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1400&h=400&fit=crop'
    }).select('*').single();

    if (data) {
      onComplete(data as StoreType);
    } else {
      console.error(error);
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-border)] p-8 rounded-2xl shadow-xl">
        <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center mb-6 border border-orange-500/20">
          <Store className="w-6 h-6 text-orange-500" />
        </div>
        <h2 className="text-2xl font-[var(--font-sans)] mb-2">Crea tu tienda</h2>
        <p className="text-[var(--color-text-tertiary)] mb-6 text-sm">Completa los detalles para comenzar a administrar tu catálogo y tus productos.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Nombre de la tienda</label>
            <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border border-[var(--color-border)] bg-[var(--color-bg)] rounded-lg focus:outline-none focus:border-orange-500 transition-colors text-[var(--color-text-primary)]" placeholder="Ej. Mi Tienda Increíble" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">URL de la tienda</label>
            <div className="flex items-center">
              <span className="px-3 py-2 border border-r-0 border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-tertiary)] rounded-l-lg text-sm">catalogo.com/tienda/</span>
              <input required type="text" value={slug} onChange={e => setSlug(e.target.value)} className="w-full px-3 py-2 border border-[var(--color-border)] bg-[var(--color-bg)] rounded-r-lg focus:outline-none focus:border-orange-500 transition-colors text-[var(--color-text-primary)]" />
            </div>
          </div>
          
          <button disabled={creating} className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg text-white bg-[var(--color-text-primary)] hover:bg-[var(--color-text-primary)]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-text-primary)] transition-colors mt-2 disabled:opacity-50 font-medium">
            {creating ? 'Creando...' : 'Crear Tienda'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
