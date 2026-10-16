import React, { useEffect, useMemo, useState } from 'react';
import {
  Package, Search, Plus, Edit2, Trash2, QrCode, Printer,
  X, Check, AlertTriangle, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import { ImageUploader } from '../common/ImageUploader';
import { supabase } from "../../lib/supabase";
import { r2StorageService } from "../../services/r2StorageService";
import Swal from 'sweetalert2';
export const ProductsView: React.FC = () => {
  const { products, categories, suppliers, addProduct, updateProduct, deleteProduct, settings } = useApp();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState(categories[0]?.name || 'Tea');
  const [price, setPrice] = useState<string>('');
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [stock, setStock] = useState<number>(9999);
  const [lowStockAlert, setLowStockAlert] = useState<number>(0);
  const [image, setImage] = useState('');
  const [barcode, setBarcode] = useState('');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [tax, setTax] = useState<number>(0);
  const [unit, setUnit] = useState('Cup');

  const handleOpenAdd = () => {
    setEditingId(null);
    setName('');
    setCategory(categories[0]?.name || 'Tea');
    setPrice('');
    setPurchasePrice(0);
    setStock(9999);
    setLowStockAlert(0);
    setImage('https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=400');
    setBarcode('');
    setSku('');
    setDescription('');
    setTax(0);
    setUnit('Cup');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingId(p.id);
    setName(p.name);
    setCategory(p.category || categories[0]?.name || '');
    setPrice(String(Math.round(p.price)));
    setPurchasePrice(p.purchasePrice);
    setStock(p.stock);
    setLowStockAlert(p.lowStockAlert);
    setImage(p.image);
    setBarcode(p.barcode);
    setSku(p.sku);
    setDescription(p.description || '');
    setTax(p.tax);
    setUnit(p.unit);
    setIsModalOpen(true);
  };


  const dataUrlToFile = async (
  dataUrl: string,
  fileName: string,
): Promise<File> => {
  const response = await fetch(dataUrl);
  const blob = await response.blob();

  return new File([blob], fileName, {
    type: blob.type || "image/jpeg",
  });
};

  const handleSave = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!name.trim()) {
    await Swal.fire({
      icon: 'warning',
      title: 'Product name required',
      text: 'Please enter a product name.',
      confirmButtonColor: '#d97706'
    });
    return;
  }

  if (!category) {
    await Swal.fire({
      icon: 'warning',
      title: 'Category required',
      text: 'Please create or select a category.',
      confirmButtonColor: '#d97706'
    });
    return;
  }

  const sellingPrice = Number(price);

  if (
    price.trim() === '' ||
    !Number.isInteger(sellingPrice) ||
    sellingPrice < 1
  ) {
    await Swal.fire({
      icon: 'warning',
      title: 'Invalid selling price',
      text: 'Please enter a whole-number price of at least LKR 1.',
      confirmButtonColor: '#d97706'
    });
    return;
  }

  try {
    let finalImageUrl = image;

    // Upload newly selected Base64 image to Cloudflare R2
    if (image.startsWith("data:image/")) {
      const file = await dataUrlToFile(
        image,
        `product-${Date.now()}`,
      );

      const uploaded = await r2StorageService.upload(
        file,
        "products",
      );

      finalImageUrl = uploaded.fileUrl;

      console.log("R2 upload successful:", uploaded);
    }

    const productData = {
      name: name.trim(),
      category,
      price: sellingPrice,
      purchasePrice,
      stock,
      lowStockAlert,
      image: finalImageUrl,
      barcode,
      sku,
      description: description.trim(),
      tax,
      unit,
      isStockItem: false,
    };

    if (editingId) {
      await updateProduct(editingId, productData);
    } else {
      await addProduct({
        ...productData,
        status: "Active",
      });
    }

    setIsModalOpen(false);

    await Swal.fire({
      position: 'top',
      icon: 'success',
      iconColor: '#16a34a',
      title: editingId
        ? 'Product updated successfully!'
        : 'Product added successfully!',
      text: `${name.trim()} has been saved successfully.`,
      color: '#166534',
      background: '#ffffff',
      confirmButtonText: 'Done',
      confirmButtonColor: '#16a34a',
      timer: 2200,
      timerProgressBar: true,
      customClass: {
        popup: 'rounded-3xl',
        title: 'font-extrabold'
      }
    });
  } catch (error) {
    console.error("Product or R2 upload failed:", error);

    await Swal.fire({
      icon: 'error',
      title: 'Unable to save product',
      text:
        error instanceof Error
          ? error.message
          : 'Unable to save product.',
      confirmButtonColor: '#dc2626'
    });
  }
};
const handleDeleteProduct = async (
  product: Product,
  event?: React.MouseEvent<HTMLButtonElement>
) => {
  event?.preventDefault();
  event?.stopPropagation();

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
    console.error('Unable to delete product:', error);
    await Swal.fire({
      icon: 'error',
      title: 'Unable to delete product',
      text:
        error instanceof Error
          ? error.message
          : 'Unable to delete product.',
      confirmButtonColor: '#dc2626'
    });
  }
};
  const filteredProducts = useMemo(() => products.filter(p => {
    if (p.isStockItem) return false;

    const productCategory = p.category || '';
    const matchesCategory =
      categoryFilter === 'All' ||
      productCategory.toLowerCase() === categoryFilter.toLowerCase();
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesDate = !dateFilter || p.createdAt === dateFilter;
    return matchesCategory && matchesSearch && matchesDate;
  }), [products, categoryFilter, search, dateFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));

  useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter, search, dateFilter]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredProducts.slice(start, start + PAGE_SIZE);
  }, [filteredProducts, currentPage]);

  const startRow = filteredProducts.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endRow = Math.min(currentPage * PAGE_SIZE, filteredProducts.length);



  return (
    <div className="p-6 space-y-6 bg-[#FAF7F2] min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-gray-900 font-serif flex items-center gap-2">
            <Package className="w-6 h-6 text-amber-600" /> Products & Menu Catalog
          </h1>
          <p className="text-xs text-gray-500">Manage item pricing, barcode inventory, categories and low stock alerts</p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-amber-400 hover:bg-amber-500 text-amber-950 font-extrabold text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 w-full">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none"
            >
              <option value="All">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>

            {/* Calendar Date Filter */}
            <div className="flex items-center gap-1.5 shrink-0">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none cursor-pointer"
              />
              {dateFilter && (
                <button
                  type="button"
                  onClick={() => setDateFilter('')}
                  className="px-2 py-1.5 text-red-500 hover:bg-red-50 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  title="Clear Date"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name..."
              className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase text-[10px]">
                <th className="py-3 px-3">Product</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Selling Price</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 font-medium">
              {paginatedProducts.map((p) => {
                const isLowStock = p.stock <= p.lowStockAlert;
                return (
                  <tr key={p.id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <img src={p.image} alt={p.name} className="w-10 h-10 rounded-xl object-cover" />
                        <div>
                          <p className="font-bold text-gray-900">{p.name}</p>
                          <p className="text-[10px] text-gray-400">{p.unit}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-semibold text-gray-700">
                      {p.category || 'Uncategorized'}
                    </td>
                    <td className="py-3 px-3 font-extrabold text-amber-700 font-mono">{settings.currency} {p.price.toFixed(2)}</td>
                    <td className="py-3 px-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 text-gray-500 hover:text-amber-600 rounded-lg hover:bg-gray-100"
                          title="Edit Product"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            void handleDeleteProduct(p, event);
                          }}
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

        {filteredProducts.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] font-semibold text-gray-500">
              Showing <span className="font-black text-gray-800">{startRow}-{endRow}</span> of{' '}
              <span className="font-black text-gray-800">{filteredProducts.length}</span> products · 10 per page
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

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-gray-100 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-extrabold text-base text-gray-900 font-serif">
                {editingId ? 'Edit Product Item' : 'Add New Product Item'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-full hover:bg-gray-100 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
              <ImageUploader
                value={image}
                onChange={setImage}
                label="Product Image (Browse, Drag & Drop)"
                aspectRatio="square"
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Product Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="e.g. Masala Tea"
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Selling Price ({settings.currency}) *</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={price}
                  onChange={(e) => {
                    const inputValue = e.target.value;

                    if (inputValue === '') {
                      setPrice('');
                      return;
                    }

                    const correctedValue = inputValue
                      .replace(/\D/g, '')
                      .replace(/^0+(?=\d)/, '');

                    setPrice(correctedValue);
                  }}
                  onFocus={(e) => {
                    if (e.currentTarget.value === '0') {
                      setPrice('');
                    }
                  }}
                  required
                  placeholder="Enter selling price"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none"
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
                  <Check className="w-4 h-4" /> Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};