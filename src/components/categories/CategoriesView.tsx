import React, { useEffect, useMemo, useState } from 'react';
import {
  Layers, Plus, Edit2, Trash2, X, Check, Eye, Package, Search, Tag, AlertTriangle, ArrowRight, ArrowLeft, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Category, Product } from '../../types';
import { ImageUploader } from '../common/ImageUploader';
import Swal from 'sweetalert2';

export const CategoriesView: React.FC = () => {
  const { categories, products, addCategory, updateCategory, deleteCategory, addProduct, deleteProduct, updateProduct, settings } = useApp();
  
  // Category Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  const filteredCategories = useMemo(
    () => categories.filter(c => !dateFilter || c.createdAt === dateFilter),
    [categories, dateFilter]
  );

  const totalPages = Math.max(1, Math.ceil(filteredCategories.length / PAGE_SIZE));

  useEffect(() => {
    setCurrentPage(1);
  }, [dateFilter]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginatedCategories = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredCategories.slice(start, start + PAGE_SIZE);
  }, [filteredCategories, currentPage]);

  const startRow = filteredCategories.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endRow = Math.min(currentPage * PAGE_SIZE, filteredCategories.length);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');

  // Selected Category Drill-down (View Products in Category)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // Quick Product Add within Category Drill-down State
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState('20.00');
  const [prodStock, setProdStock] = useState('50');
  const [prodImage, setProdImage] = useState('https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=400');
  const [prodFilter, setProdFilter] = useState('');

  // Handlers for Category CRUD
  const handleOpenAddCategory = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setImage('https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=300');
    setIsModalOpen(true);
  };

  const handleOpenEditCategory = (c: Category, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingId(c.id);
    setName(c.name);
    setDescription(c.description);
    setImage(c.image);
    setIsModalOpen(true);
  };

  const handleDeleteCategory = async (
    category: Category,
    event?: React.MouseEvent<HTMLButtonElement>
  ) => {
    event?.preventDefault();
    event?.stopPropagation();

    const confirmation = await Swal.fire({
      icon: 'warning',
      title: 'Delete category?',
      text: `This will delete "${category.name}" and its connected products.`,
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      reverseButtons: true
    });

    if (!confirmation.isConfirmed) return;

    try {
      await deleteCategory(category.id);

      if (selectedCategory?.id === category.id) {
        setSelectedCategory(null);
      }

      await Swal.fire({
        position: 'top',
        icon: 'success',
        iconColor: '#16a34a',
        title: 'Category deleted successfully!',
        text: `"${category.name}" was deleted.`,
        color: '#166534',
        background: '#ffffff',
        confirmButtonColor: '#16a34a',
        timer: 1800,
        timerProgressBar: true
      });
    } catch (error) {
      console.error('Failed to delete category:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Unable to delete category',
        text: error instanceof Error
          ? error.message
          : 'Unable to delete the category. Please try again.',
        confirmButtonColor: '#dc2626'
      });
    }
  };

  const handleDeleteProduct = async (
    product: Product,
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();

    const confirmation = await Swal.fire({
      icon: 'warning',
      title: 'Delete product?',
      text: `Are you sure you want to delete "${product.name}"?`,
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      reverseButtons: true
    });

    if (!confirmation.isConfirmed) return;

    try {
      await deleteProduct(product.id);

      await Swal.fire({
        position: 'top',
        icon: 'success',
        iconColor: '#16a34a',
        title: 'Product deleted successfully!',
        text: `"${product.name}" was deleted.`,
        color: '#166534',
        background: '#ffffff',
        confirmButtonColor: '#16a34a',
        timer: 1800,
        timerProgressBar: true
      });
    } catch (error) {
      console.error('Failed to delete product:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Unable to delete product',
        text: error instanceof Error
          ? error.message
          : 'Unable to delete the product. Please try again.',
        confirmButtonColor: '#dc2626'
      });
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      await Swal.fire({
        icon: 'warning',
        title: 'Category name required',
        text: 'Please enter a category name.',
        confirmButtonColor: '#d97706'
      });
      return;
    }

    try {
      const isEditing = Boolean(editingId);

      if (editingId) {
        await updateCategory(editingId, { name: name.trim(), description, image });
        if (selectedCategory?.id === editingId) {
          setSelectedCategory(prev => prev ? { ...prev, name: name.trim(), description, image } : null);
        }
      } else {
        await addCategory({ name: name.trim(), description, image, status: 'Active' });
      }

      setIsModalOpen(false);

      await Swal.fire({
        position: 'top',
        icon: 'success',
        iconColor: '#16a34a',
        title: isEditing
          ? 'Category updated successfully!'
          : 'Category added successfully!',
        text: `"${name.trim()}" has been saved successfully.`,
        color: '#166534',
        background: '#ffffff',
        confirmButtonColor: '#16a34a',
        timer: 2000,
        timerProgressBar: true
      });
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Unable to save category',
        text: error instanceof Error ? error.message : 'Unable to save category.',
        confirmButtonColor: '#dc2626'
      });
    }
  };

  // Add Product to current category
  const handleSaveProductToCategory = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();
    if (!selectedCategory || !prodName.trim()) {
      await Swal.fire({
        icon: 'warning',
        title: 'Product name required',
        text: 'Please enter a product name.',
        confirmButtonColor: '#d97706'
      });
      return;
    }

    try {
      await addProduct({
      name: prodName,
      category: selectedCategory.name,
      price: parseFloat(prodPrice) || 20.00,
      purchasePrice: (parseFloat(prodPrice) || 20.00) * 0.4,
      stock: parseInt(prodStock) || 50,
      lowStockAlert: 10,
      image: prodImage || 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=400',
      barcode: `890${Math.floor(1000 + Math.random() * 9000)}`,
      sku: `${selectedCategory.name.substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
      description: `${prodName} in ${selectedCategory.name} category.`,
      tax: 5,
      unit: 'Cup',
      status: 'Active'
      });

      setIsAddProductModalOpen(false);
      setProdName('');

      await Swal.fire({
        position: 'top',
        icon: 'success',
        iconColor: '#16a34a',
        title: 'Product added successfully!',
        color: '#166534',
        background: '#ffffff',
        confirmButtonColor: '#16a34a',
        timer: 2000,
        timerProgressBar: true
      });
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Unable to add product',
        text: error instanceof Error ? error.message : 'Unable to add product.',
        confirmButtonColor: '#dc2626'
      });
    }
  };

  // Filter products by selected category
  const getCategoryProducts = (categoryName: string) => {
    return products.filter(p =>
      (p.category || '').toLowerCase() === categoryName.toLowerCase()
    );
  };

  return (
    <div className="p-6 space-y-6 bg-[#FAF7F2] min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-gray-900 font-serif flex items-center gap-2">
            <Layers className="w-6 h-6 text-amber-600" /> Category Management
          </h1>
          <p className="text-xs text-gray-500">
            Click any category to view its products. Rename, edit, or delete categories seamlessly.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!selectedCategory && (
            <div className="flex items-center gap-1.5 shrink-0">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="p-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-750 focus:outline-none cursor-pointer"
              />
              {dateFilter && (
                <button
                  type="button"
                  onClick={() => setDateFilter('')}
                  className="px-2 py-1.5 bg-red-50 hover:bg-red-100 text-red-650 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  title="Clear Date"
                >
                  Clear
                </button>
              )}
            </div>
          )}

          {selectedCategory && (
            <button
              onClick={() => setSelectedCategory(null)}
              className="px-3.5 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" /> All Categories
            </button>
          )}

          <button
            onClick={handleOpenAddCategory}
            className="px-4 py-2.5 bg-amber-400 hover:bg-amber-500 text-amber-950 font-extrabold text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Category
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {!selectedCategory ? (
        /* Categories Cards & Table Grid */
        <div className="space-y-6">
          {/* Quick Stats Banner */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs flex items-center gap-3">
              <div className="p-3 bg-amber-50 rounded-xl text-amber-700">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase">Total Categories</p>
                <p className="text-lg font-black text-gray-900">{categories.length}</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs flex items-center gap-3">
              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-700">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase">Total Products</p>
                <p className="text-lg font-black text-gray-900">{products.length}</p>
              </div>
            </div>
          </div>

          {/* Visual Category Grid */}
          <div>
            <h2 className="text-sm font-extrabold text-gray-800 mb-3 flex items-center gap-1.5 font-serif">
              <Tag className="w-4 h-4 text-amber-600" /> Click a Category to Inspect Products
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredCategories.map((c) => {
                const categoryProducts = getCategoryProducts(c.name);
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCategory(c)}
                    className="bg-white rounded-2xl border border-gray-100 p-4 shadow-2xs hover:shadow-md hover:border-amber-300 transition-all cursor-pointer group relative flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={c.image}
                        alt={c.name}
                        className="w-14 h-14 rounded-2xl object-cover ring-2 ring-amber-100 group-hover:scale-105 transition-transform"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-extrabold text-sm text-gray-900 group-hover:text-amber-700 transition-colors truncate">
                          {c.name}
                        </h3>
                        <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5 leading-snug">
                          {c.description || 'No description provided'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-50 text-xs">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-50 text-amber-800 border border-amber-100">
                        {categoryProducts.length} Items
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => handleOpenEditCategory(c, e)}
                          className="p-1.5 text-gray-400 hover:text-amber-600 rounded-lg hover:bg-amber-50 transition-colors"
                          title="Rename / Edit Category"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteCategory(c, e)}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                          title="Delete Category"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <div className="p-1.5 text-amber-600 font-bold flex items-center gap-0.5 text-[11px] group-hover:translate-x-0.5 transition-transform">
                          <Eye className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Categories Detailed Table */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider">All Categories Table</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase text-[10px]">
                    <th className="py-3 px-3">Image</th>
                    <th className="py-3 px-3">Category Name</th>
                    <th className="py-3 px-3">Description</th>
                    <th className="py-3 px-3">Items Count</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 font-medium">
                  {paginatedCategories.map((c) => {
                    const count = getCategoryProducts(c.name).length;
                    return (
                      <tr
                        key={c.id}
                        onClick={() => setSelectedCategory(c)}
                        className="hover:bg-amber-50/40 transition-colors cursor-pointer group"
                      >
                        <td className="py-3 px-3">
                          <img src={c.image} alt={c.name} className="w-10 h-10 rounded-xl object-cover" />
                        </td>
                        <td className="py-3 px-3 font-bold text-gray-900 group-hover:text-amber-700">
                          {c.name}
                        </td>
                        <td className="py-3 px-3 text-gray-600 max-w-xs truncate">{c.description}</td>
                        <td className="py-3 px-3 font-extrabold text-amber-800">
                          {count} Products
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {c.status || 'Active'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCategory(c);
                              }}
                              className="px-2 py-1 bg-amber-100 text-amber-900 hover:bg-amber-200 rounded-lg text-[10px] font-bold flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" /> View Products
                            </button>
                            <button
                              onClick={(e) => handleOpenEditCategory(c, e)}
                              className="p-1.5 text-gray-500 hover:text-amber-600 rounded-lg hover:bg-amber-50"
                              title="Rename / Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteCategory(c, e)}
                              className="p-1.5 text-gray-500 hover:text-red-600 rounded-lg hover:bg-red-50"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredCategories.length > 0 && (
              <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[11px] font-semibold text-gray-500">
                  Showing <span className="font-black text-gray-800">{startRow}-{endRow}</span> of{' '}
                  <span className="font-black text-gray-800">{filteredCategories.length}</span> categories · 10 per page
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-[11px] font-bold text-gray-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" /> Previous
                  </button>

                  <span className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] font-black text-amber-800">
                    Page {currentPage} / {totalPages}
                  </span>

                  <button
                    type="button"
                    onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-[11px] font-bold text-gray-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Selected Category Products Drill-Down View */
        <div className="space-y-6 animate-in fade-in zoom-in-98 duration-150">
          {/* Category Banner Card */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
            <div className="flex items-center gap-4 relative z-10">
              <img
                src={selectedCategory.image}
                alt={selectedCategory.name}
                className="w-20 h-20 rounded-2xl object-cover ring-4 ring-amber-100 shadow-md"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-black text-gray-900 font-serif">{selectedCategory.name}</h2>
                  <button
                    onClick={(e) => handleOpenEditCategory(selectedCategory, e)}
                    className="p-1 text-gray-400 hover:text-amber-600 rounded-lg hover:bg-amber-50"
                    title="Rename / Edit Category"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-0.5 max-w-lg">{selectedCategory.description}</p>
                <div className="flex items-center gap-3 mt-2 text-xs font-semibold text-amber-800">
                  <span className="bg-amber-100/80 px-2.5 py-0.5 rounded-full font-bold">
                    {getCategoryProducts(selectedCategory.name).length} Items Listed
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAddProductModalOpen(true)}
                className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Add Item to {selectedCategory.name}
              </button>

              <button
                type="button"
                onClick={(e) => handleDeleteCategory(selectedCategory, e)}
                className="px-3.5 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" /> Delete Category
              </button>
            </div>
          </div>

          {/* Products Search & List inside Category */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <h3 className="font-extrabold text-base text-gray-900 font-serif flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-600" /> Products in "{selectedCategory.name}"
              </h3>

              <div className="w-full sm:w-64 relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter items..."
                  value={prodFilter}
                  onChange={(e) => setProdFilter(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>

            {/* Products Grid */}
            {(() => {
              const catProds = getCategoryProducts(selectedCategory.name).filter(p =>
                p.name.toLowerCase().includes(prodFilter.toLowerCase())
              );

              if (catProds.length === 0) {
                return (
                  <div className="text-center py-12 space-y-3 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                    <Package className="w-12 h-12 mx-auto text-gray-300" />
                    <p className="text-sm font-bold text-gray-600">No products found in this category.</p>
                    <button
                      onClick={() => setIsAddProductModalOpen(true)}
                      className="px-4 py-2 bg-amber-400 text-amber-950 font-extrabold text-xs rounded-xl shadow-xs hover:bg-amber-500"
                    >
                      + Add First Item to {selectedCategory.name}
                    </button>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {catProds.map((p) => (
                    <div
                      key={p.id}
                      className="bg-gray-50/80 rounded-2xl border border-gray-200/80 p-4 space-y-3 hover:border-amber-400 transition-all group relative"
                    >
                      <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100">
                        <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        <span className="absolute top-2 right-2 px-2 py-0.5 bg-emerald-900/90 text-amber-300 text-[10px] font-black rounded-lg backdrop-blur-xs">
                          <span className="font-mono">{settings.currency} {p.price.toFixed(2)}</span>
                        </span>
                      </div>

                      <div>
                        <h4 className="font-extrabold text-sm text-gray-900 leading-tight">{p.name}</h4>
                        <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{p.description}</p>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-200/60">
                        <span className={`text-[10px] font-bold ${p.stock <= p.lowStockAlert ? 'text-red-600' : 'text-emerald-700'}`}>
                          Stock: {p.stock} {p.unit || 'units'}
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => handleDeleteProduct(p, e)}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                            title="Delete Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-gray-100 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-extrabold text-base text-gray-900 font-serif">
                {editingId ? 'Rename / Edit Category' : 'Add New Category'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-full hover:bg-gray-100 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <ImageUploader
                value={image}
                onChange={setImage}
                label="Category Banner Image"
                aspectRatio="square"
              />

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. Special Teas"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Premium signature brewed tea menu"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 font-bold rounded-xl text-xs hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-400 text-amber-950 font-extrabold rounded-xl text-xs hover:bg-amber-500 flex items-center gap-1 shadow-xs"
                >
                  <Check className="w-4 h-4" /> Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Product inside Category Modal */}
      {isAddProductModalOpen && selectedCategory && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-gray-100 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-extrabold text-base text-gray-900 font-serif">
                Add Item to "{selectedCategory.name}"
              </h3>
              <button onClick={() => setIsAddProductModalOpen(false)} className="p-1 rounded-full hover:bg-gray-100 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProductToCategory} className="space-y-4">
              <ImageUploader
                value={prodImage}
                onChange={setProdImage}
                label="Product Image"
                aspectRatio="square"
              />

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Item Name *</label>
                <input
                  type="text"
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  required
                  placeholder="e.g. Organic Honey Green Tea"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Price ({settings.currency}) *</label>
                  <input
                    type="number"
                    step="0.5"
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    required
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Initial Stock *</label>
                  <input
                    type="number"
                    value={prodStock}
                    onChange={(e) => setProdStock(e.target.value)}
                    required
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddProductModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 font-bold rounded-xl text-xs hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 text-white font-extrabold rounded-xl text-xs hover:bg-emerald-800 flex items-center gap-1 shadow-xs"
                >
                  <Plus className="w-4 h-4" /> Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};