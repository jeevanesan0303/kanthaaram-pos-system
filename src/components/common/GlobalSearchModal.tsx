import React, { useEffect, useRef } from 'react';
import { Search, X, Package, ShoppingBag, Users, Truck, UserCheck, Layers, Tag } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const GlobalSearchModal: React.FC = () => {
  const { 
    isSearchOpen, setIsSearchOpen, searchQuery, setSearchQuery, 
    products, orders, customers, suppliers, employees, categories, offers,
    setActiveView, addToCart, settings
  } = useApp();

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isSearchOpen]);

  if (!isSearchOpen) return null;

  const query = searchQuery.toLowerCase().trim();

  const matchedProducts = query ? products.filter(p => p.name.toLowerCase().includes(query) || p.barcode.includes(query) || p.sku.toLowerCase().includes(query)) : [];
  const matchedOrders = query ? orders.filter(o => o.id.toLowerCase().includes(query) || o.customerName.toLowerCase().includes(query)) : [];
  const matchedCustomers = query ? customers.filter(c => c.name.toLowerCase().includes(query) || c.mobile.includes(query)) : [];
  const matchedSuppliers = query ? suppliers.filter(s => s.companyName.toLowerCase().includes(query) || s.owner.toLowerCase().includes(query)) : [];
  const matchedEmployees = query ? employees.filter(e => e.name.toLowerCase().includes(query) || e.role.toLowerCase().includes(query)) : [];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-start justify-center pt-20 p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-150">
        <div className="p-4 border-b border-gray-100 flex items-center gap-3 bg-amber-50/30">
          <Search className="w-5 h-5 text-amber-600" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Global Search (Products, Orders, Customers, Suppliers, Staff)..."
            className="flex-1 bg-transparent text-sm focus:outline-none text-gray-800 placeholder-gray-400 font-medium"
          />
          <button 
            onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}
            className="p-1 rounded-lg hover:bg-gray-200 text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {!query && (
            <div className="text-center py-8 text-gray-400 text-xs">
              Type to search across Products, Orders, Customers, Suppliers, and Employees...
            </div>
          )}

          {/* Products Results */}
          {matchedProducts.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
                <Package className="w-3.5 h-3.5 text-amber-600" /> Products ({matchedProducts.length})
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {matchedProducts.map(p => (
                  <div 
                    key={p.id}
                    onClick={() => {
                      addToCart(p);
                      setActiveView('pos');
                      setIsSearchOpen(false);
                    }}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-amber-50/60 border border-gray-100 cursor-pointer transition-colors"
                  >
                    <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{p.name}</p>
                      <p className="text-[10px] text-gray-500">{p.category} • Stock: {p.stock}</p>
                    </div>
                    <span className="text-xs font-bold text-amber-600 font-mono">{settings.currency} {p.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Orders Results */}
          {matchedOrders.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
                <ShoppingBag className="w-3.5 h-3.5 text-amber-600" /> Orders ({matchedOrders.length})
              </div>
              <div className="space-y-1.5">
                {matchedOrders.map(o => (
                  <div 
                    key={o.id}
                    onClick={() => {
                      setActiveView('orders');
                      setIsSearchOpen(false);
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-amber-50/60 border border-gray-100 cursor-pointer text-xs"
                  >
                    <div>
                      <span className="font-bold text-gray-900">{o.id}</span>
                      <span className="text-gray-500 ml-2">({o.customerName})</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500">{o.time}</span>
                      <span className="font-bold text-emerald-600 font-mono">{settings.currency} {o.total.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Customers Results */}
          {matchedCustomers.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
                <Users className="w-3.5 h-3.5 text-amber-600" /> Customers ({matchedCustomers.length})
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {matchedCustomers.map(c => (
                  <div 
                    key={c.id}
                    onClick={() => {
                      setActiveView('customers');
                      setIsSearchOpen(false);
                    }}
                    className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-amber-50/60 border border-gray-100 cursor-pointer text-xs"
                  >
                    <img src={c.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'} alt={c.name} className="w-8 h-8 rounded-full object-cover" />
                    <div>
                      <p className="font-semibold text-gray-900">{c.name}</p>
                      <p className="text-[10px] text-gray-500">{c.mobile}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {query && matchedProducts.length === 0 && matchedOrders.length === 0 && matchedCustomers.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-xs">
              No matching records found for "{searchQuery}".
            </div>
          )}
        </div>
        
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-[11px] text-gray-400 flex items-center justify-between">
          <span>Press <kbd className="px-1.5 py-0.5 bg-white border rounded font-mono text-[10px] text-gray-600">ESC</kbd> to exit</span>
          <span>Kaanthaaram Tea Search</span>
        </div>
      </div>
    </div>
  );
};
