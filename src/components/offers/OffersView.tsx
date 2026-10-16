import React, { useMemo, useState } from 'react';
import { Check, Edit2, Plus, Sparkles, Tag, Trash2, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ImageUploader } from '../common/ImageUploader';
import { ComboDealItem, ComboOffer, Offer } from '../../types';

const toInputDate = (value: string): string => {
  if (!value) return '';
  const parts = value.split('-');
  if (parts.length !== 3) return value;
  return parts[0].length === 4 ? value : `${parts[2]}-${parts[1]}-${parts[0]}`;
};

const toStorageDate = (value: string): string => {
  if (!value) return '';
  const parts = value.split('-');
  if (parts.length !== 3) return value;
  return parts[0].length === 4 ? `${parts[2]}-${parts[1]}-${parts[0]}` : value;
};

const parseDate = (value: string): Date => {
  const iso = toInputDate(value);
  return new Date(`${iso}T12:00:00`);
};

const cleanNumberInput = (value: string): string => {
  if (value === '') return '';
  let next = value.replace(/[^0-9.]/g, '');
  const firstDot = next.indexOf('.');
  if (firstDot >= 0) {
    next = next.slice(0, firstDot + 1) + next.slice(firstDot + 1).replace(/\./g, '');
  }
  if (/^0\d/.test(next)) next = next.replace(/^0+/, '');
  if (next.startsWith('.')) next = `0${next}`;
  return next;
};

const defaultEndDate = (): string => {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toISOString().slice(0, 10);
};

export const OffersView: React.FC = () => {
  const {
    offers,
    combos,
    addOffer,
    updateOffer,
    deleteOffer,
    addCombo,
    updateCombo,
    deleteCombo,
    products,
    categories,
    settings,
  } = useApp();

  const [dateFilter, setDateFilter] = useState('');

  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [offerName, setOfferName] = useState('');
  const [offerType, setOfferType] = useState<'Percentage' | 'Flat'>('Percentage');
  const [offerDiscount, setOfferDiscount] = useState('');
  const [offerCategoryId, setOfferCategoryId] = useState('');
  const [offerProductId, setOfferProductId] = useState('');
  const [offerStartDate, setOfferStartDate] = useState('');
  const [offerEndDate, setOfferEndDate] = useState('');
  const [isSavingOffer, setIsSavingOffer] = useState(false);
  const [deletingOfferId, setDeletingOfferId] = useState<string | null>(null);

  const [isComboModalOpen, setIsComboModalOpen] = useState(false);
  const [editingCombo, setEditingCombo] = useState<ComboOffer | null>(null);
  const [comboName, setComboName] = useState('');
  const [comboPrice, setComboPrice] = useState('');
  const [comboDiscount, setComboDiscount] = useState('');
  const [comboImage, setComboImage] = useState('');
  const [comboStartDate, setComboStartDate] = useState('');
  const [comboEndDate, setComboEndDate] = useState('');
  const [comboItems, setComboItems] = useState<Record<string, number>>({});
  const [isSavingCombo, setIsSavingCombo] = useState(false);
  const [deletingComboId, setDeletingComboId] = useState<string | null>(null);

  const isActiveOnDate = (start: string, end: string, target: string): boolean => {
    if (!target) return true;
    const date = new Date(`${target}T12:00:00`);
    const from = parseDate(start);
    const to = parseDate(end);
    return date >= from && date <= to;
  };

  const validity = (start: string, end: string, status: string): 'Active' | 'Scheduled' | 'Expired' | 'Inactive' => {
    if (status !== 'Active') return 'Inactive';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const from = parseDate(start);
    const to = parseDate(end);
    from.setHours(0, 0, 0, 0);
    to.setHours(23, 59, 59, 999);
    if (today < from) return 'Scheduled';
    if (today > to) return 'Expired';
    return 'Active';
  };

  const filteredOffers = offers.filter(offer => isActiveOnDate(offer.startDate, offer.endDate, dateFilter));
  const filteredCombos = combos.filter(combo => isActiveOnDate(combo.startDate, combo.endDate, dateFilter));

  const offerProducts = useMemo(() => {
    if (!offerCategoryId) return products;
    return products.filter(product => product.categoryId === offerCategoryId);
  }, [products, offerCategoryId]);

  const selectedComboItems: ComboDealItem[] = useMemo(() => {
    return Object.entries(comboItems)
      .filter(([, quantity]) => quantity > 0)
      .map(([productId, quantity]) => {
        const product = products.find(item => item.id === productId);
        return {
          productId,
          productName: product?.name ?? 'Product',
          quantity,
        };
      });
  }, [comboItems, products]);

  const comboRegularTotal = useMemo(() => {
    return selectedComboItems.reduce((sum, item) => {
      const product = products.find(entry => entry.id === item.productId);
      return sum + (product ? Number(product.price) * item.quantity : 0);
    }, 0);
  }, [selectedComboItems, products]);

  const resetOffer = () => {
    setEditingOffer(null);
    setOfferName('');
    setOfferType('Percentage');
    setOfferDiscount('');
    setOfferCategoryId('');
    setOfferProductId('');
    setOfferStartDate(new Date().toISOString().slice(0, 10));
    setOfferEndDate(defaultEndDate());
  };

  const openAddOffer = () => {
    resetOffer();
    setIsOfferModalOpen(true);
  };

  const openEditOffer = (offer: Offer) => {
    setEditingOffer(offer);
    setOfferName(offer.name);
    setOfferType(offer.type);
    setOfferDiscount(String(offer.discount));
    setOfferCategoryId(offer.categoryId ?? '');
    setOfferProductId(offer.productId ?? '');
    setOfferStartDate(toInputDate(offer.startDate));
    setOfferEndDate(toInputDate(offer.endDate));
    setIsOfferModalOpen(true);
  };

  const saveOffer = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSavingOffer) return;
    const discount = Number(offerDiscount);
    if (!offerName.trim()) return alert('Please enter the offer name.');
    if (offerDiscount === '' || !Number.isFinite(discount) || discount < 0) return alert('Enter a valid discount value.');
    if (offerType === 'Percentage' && discount > 100) return alert('Percentage discount cannot exceed 100%.');
    if (!offerStartDate || !offerEndDate || offerEndDate < offerStartDate) return alert('Please select a valid date range.');

    const category = categories.find(item => item.id === offerCategoryId);
    const product = products.find(item => item.id === offerProductId);
    const data: Omit<Offer, 'id'> = {
      name: offerName.trim(),
      type: offerType,
      discount,
      startDate: toStorageDate(offerStartDate),
      endDate: toStorageDate(offerEndDate),
      status: editingOffer?.status ?? 'Active',
      categoryId: offerCategoryId || undefined,
      categoryName: category?.name,
      productId: offerProductId || undefined,
      productName: product?.name,
    };

    try {
      setIsSavingOffer(true);
      if (editingOffer) await updateOffer(editingOffer.id, data);
      else await addOffer(data);
      setIsOfferModalOpen(false);
      resetOffer();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Unable to save offer.');
    } finally {
      setIsSavingOffer(false);
    }
  };

  const removeOffer = async (offer: Offer) => {
    if (!window.confirm(`Delete "${offer.name}"?`)) return;
    try {
      setDeletingOfferId(offer.id);
      await deleteOffer(offer.id);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Unable to delete offer.');
    } finally {
      setDeletingOfferId(null);
    }
  };

  const resetCombo = () => {
    setEditingCombo(null);
    setComboName('');
    setComboPrice('');
    setComboDiscount('');
    setComboImage('');
    setComboItems({});
    setComboStartDate(new Date().toISOString().slice(0, 10));
    setComboEndDate(defaultEndDate());
  };

  const openAddCombo = () => {
    resetCombo();
    setIsComboModalOpen(true);
  };

  const openEditCombo = (combo: ComboOffer) => {
    setEditingCombo(combo);
    setComboName(combo.name);
    setComboPrice(String(combo.price));
    setComboDiscount(String(combo.discount));
    setComboImage(combo.image);
    setComboStartDate(toInputDate(combo.startDate));
    setComboEndDate(toInputDate(combo.endDate));
    const next: Record<string, number> = {};
    (combo.productItems ?? []).forEach(item => { next[item.productId] = item.quantity; });
    setComboItems(next);
    setIsComboModalOpen(true);
  };

  const toggleComboProduct = (productId: string) => {
    setComboItems(previous => {
      const next = { ...previous };
      if (next[productId]) delete next[productId];
      else next[productId] = 1;
      return next;
    });
  };

  const saveCombo = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSavingCombo) return;
    const price = Number(comboPrice);
    const discount = Number(comboDiscount || 0);
    if (!comboName.trim()) return alert('Please enter the combo name.');
    if (selectedComboItems.length < 2) return alert('Select at least two products for the combo.');
    if (comboPrice === '' || !Number.isFinite(price) || price < 0) return alert('Enter a valid bundle price.');
    if (!Number.isFinite(discount) || discount < 0 || discount > 100) return alert('Discount must be between 0 and 100.');
    if (!comboStartDate || !comboEndDate || comboEndDate < comboStartDate) return alert('Please select a valid date range.');

    const data: Omit<ComboOffer, 'id'> = {
      name: comboName.trim(),
      price,
      discount,
      image: comboImage,
      productItems: selectedComboItems,
      productsIncluded: selectedComboItems.map(item => item.quantity > 1 ? `${item.quantity} x ${item.productName}` : item.productName),
      startDate: toStorageDate(comboStartDate),
      endDate: toStorageDate(comboEndDate),
      status: editingCombo?.status ?? 'Active',
    };

    try {
      setIsSavingCombo(true);
      if (editingCombo) await updateCombo(editingCombo.id, data);
      else await addCombo(data);
      setIsComboModalOpen(false);
      resetCombo();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Unable to save combo deal.');
    } finally {
      setIsSavingCombo(false);
    }
  };

  const removeCombo = async (combo: ComboOffer) => {
    if (!window.confirm(`Delete "${combo.name}"?`)) return;
    try {
      setDeletingComboId(combo.id);
      await deleteCombo(combo.id);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Unable to delete combo deal.');
    } finally {
      setDeletingComboId(null);
    }
  };

  const statusBadge = (value: string) => {
    const cls = value === 'Active'
      ? 'bg-emerald-100 text-emerald-800'
      : value === 'Scheduled'
        ? 'bg-blue-100 text-blue-800'
        : 'bg-red-100 text-red-800';
    return <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${cls}`}>{value}</span>;
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] p-4 sm:p-6 space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="font-serif text-xl font-black text-gray-900 flex items-center gap-2"><Tag className="w-5 h-5 text-amber-600" /> Offers & Combo Deals</h1>
          <p className="text-xs text-gray-500 mt-1">Offers and combo deals are saved in Supabase and automatically shown in POS Sales.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input type="date" value={dateFilter} onChange={event => setDateFilter(event.target.value)} className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs" />
          {dateFilter && <button onClick={() => setDateFilter('')} className="px-3 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold">Clear</button>}
          <button onClick={openAddOffer} className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold flex items-center gap-1.5"><Plus className="w-4 h-4 text-amber-600" /> Add Discount Offer</button>
          <button onClick={openAddCombo} className="px-4 py-2 bg-amber-400 text-amber-950 rounded-xl text-xs font-extrabold flex items-center gap-1.5"><Sparkles className="w-4 h-4" /> Add Combo Deal</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <h2 className="font-serif font-extrabold text-sm text-gray-900 flex items-center gap-2 mb-3"><Sparkles className="w-4 h-4 text-amber-500" /> Combo Deals</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[850px]">
            <thead><tr className="border-b text-[10px] uppercase text-gray-400"><th className="p-3">Image</th><th className="p-3">Combo</th><th className="p-3">Products</th><th className="p-3">Bundle Price</th><th className="p-3">Discount</th><th className="p-3">Validity</th><th className="p-3">Status</th><th className="p-3 text-right">Actions</th></tr></thead>
            <tbody className="divide-y divide-gray-50">
              {filteredCombos.map(combo => (
                <tr key={combo.id} className="hover:bg-amber-50/30">
                  <td className="p-3"><div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden">{combo.image ? <img src={combo.image} alt={combo.name} className="w-full h-full object-cover" /> : <Sparkles className="w-5 h-5 text-gray-300 m-3" />}</div></td>
                  <td className="p-3 font-bold text-gray-900">{combo.name}</td>
                  <td className="p-3 text-gray-600 max-w-xs">{combo.productsIncluded.join(' + ')}</td>
                  <td className="p-3 font-mono font-black text-amber-700">{settings.currency} {Number(combo.price).toFixed(2)}</td>
                  <td className="p-3 font-bold text-emerald-600">{combo.discount}%</td>
                  <td className="p-3 text-[10px] font-mono text-gray-500">{combo.startDate} to {combo.endDate}</td>
                  <td className="p-3">{statusBadge(validity(combo.startDate, combo.endDate, combo.status))}</td>
                  <td className="p-3"><div className="flex justify-end gap-1"><button onClick={() => openEditCombo(combo)} className="p-2 text-gray-400 hover:text-amber-600"><Edit2 className="w-4 h-4" /></button><button disabled={deletingComboId === combo.id} onClick={() => void removeCombo(combo)} className="p-2 text-gray-400 hover:text-red-600 disabled:opacity-50"><Trash2 className="w-4 h-4" /></button></div></td>
                </tr>
              ))}
              {!filteredCombos.length && <tr><td colSpan={8} className="p-8 text-center text-gray-400">No combo deals found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <h2 className="font-serif font-extrabold text-sm text-gray-900 flex items-center gap-2 mb-3"><Tag className="w-4 h-4 text-amber-500" /> Discount Offers</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[850px]">
            <thead><tr className="border-b text-[10px] uppercase text-gray-400"><th className="p-3">Offer</th><th className="p-3">Applied To</th><th className="p-3">Type</th><th className="p-3">Discount</th><th className="p-3">Validity</th><th className="p-3">Status</th><th className="p-3 text-right">Actions</th></tr></thead>
            <tbody className="divide-y divide-gray-50">
              {filteredOffers.map(offer => (
                <tr key={offer.id} className="hover:bg-amber-50/30">
                  <td className="p-3 font-bold text-gray-900">{offer.name}</td>
                  <td className="p-3 text-amber-900 font-semibold">{offer.productName || offer.categoryName || 'All Products'}</td>
                  <td className="p-3 text-gray-600">{offer.type}</td>
                  <td className="p-3 font-extrabold text-emerald-600">{offer.type === 'Flat' ? `${settings.currency} ${offer.discount} OFF` : `${offer.discount}% OFF`}</td>
                  <td className="p-3 text-[10px] font-mono text-gray-500">{offer.startDate} to {offer.endDate}</td>
                  <td className="p-3">{statusBadge(validity(offer.startDate, offer.endDate, offer.status))}</td>
                  <td className="p-3"><div className="flex justify-end gap-1"><button onClick={() => openEditOffer(offer)} className="p-2 text-gray-400 hover:text-amber-600"><Edit2 className="w-4 h-4" /></button><button disabled={deletingOfferId === offer.id} onClick={() => void removeOffer(offer)} className="p-2 text-gray-400 hover:text-red-600 disabled:opacity-50"><Trash2 className="w-4 h-4" /></button></div></td>
                </tr>
              ))}
              {!filteredOffers.length && <tr><td colSpan={7} className="p-8 text-center text-gray-400">No discount offers found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {isOfferModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b"><h3 className="font-bold text-sm">{editingOffer ? 'Edit Discount Offer' : 'Add Discount Offer'}</h3><button onClick={() => setIsOfferModalOpen(false)}><X className="w-4 h-4" /></button></div>
            <form onSubmit={saveOffer} className="space-y-3 mt-4">
              <div><label className="text-xs font-bold block mb-1">Offer Name</label><input value={offerName} onChange={e => setOfferName(e.target.value)} placeholder="e.g. Happy Hour Special" className="w-full p-2.5 bg-gray-50 border rounded-xl text-xs" required /></div>
              <div><label className="text-xs font-bold block mb-1">Select Category (Optional)</label><select value={offerCategoryId} onChange={e => { setOfferCategoryId(e.target.value); setOfferProductId(''); }} className="w-full p-2.5 bg-gray-50 border rounded-xl text-xs"><option value="">All Categories</option>{categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select></div>
              <div><label className="text-xs font-bold block mb-1">Select Product (Optional)</label><select value={offerProductId} onChange={e => setOfferProductId(e.target.value)} className="w-full p-2.5 bg-gray-50 border rounded-xl text-xs"><option value="">All Products{offerCategoryId ? ' in Selected Category' : ''}</option>{offerProducts.map(product => <option key={product.id} value={product.id}>{product.name} ({settings.currency} {product.price.toFixed(2)})</option>)}</select></div>
              <div className="grid grid-cols-2 gap-2"><div><label className="text-xs font-bold block mb-1">Type</label><select value={offerType} onChange={e => setOfferType(e.target.value as 'Percentage' | 'Flat')} className="w-full p-2.5 bg-gray-50 border rounded-xl text-xs"><option value="Percentage">Percentage (%)</option><option value="Flat">Flat Amount ({settings.currency})</option></select></div><div><label className="text-xs font-bold block mb-1">Discount Value</label><input type="text" inputMode="decimal" value={offerDiscount} onChange={e => setOfferDiscount(cleanNumberInput(e.target.value))} placeholder="e.g. 5" className="w-full p-2.5 bg-gray-50 border rounded-xl text-xs" required /></div></div>
              <div className="grid grid-cols-2 gap-3"><div><label className="text-[10px] font-bold block mb-1">Start Date</label><input type="date" value={offerStartDate} onChange={e => setOfferStartDate(e.target.value)} className="w-full p-2.5 bg-gray-50 border rounded-xl text-xs" required /></div><div><label className="text-[10px] font-bold block mb-1">End Date</label><input type="date" value={offerEndDate} min={offerStartDate} onChange={e => setOfferEndDate(e.target.value)} className="w-full p-2.5 bg-gray-50 border rounded-xl text-xs" required /></div></div>
              <button disabled={isSavingOffer} className="w-full py-2.5 bg-amber-400 text-amber-950 font-bold text-xs rounded-xl disabled:opacity-60">{isSavingOffer ? 'Saving...' : editingOffer ? 'Update Offer' : 'Save Offer'}</button>
            </form>
          </div>
        </div>
      )}

      {isComboModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl p-6 my-6">
            <div className="flex items-center justify-between pb-3 border-b"><h3 className="font-bold text-sm">{editingCombo ? 'Edit Combo Deal' : 'Add Combo Deal'}</h3><button onClick={() => setIsComboModalOpen(false)}><X className="w-4 h-4" /></button></div>
            <form onSubmit={saveCombo} className="space-y-3 mt-4">
              <ImageUploader value={comboImage} onChange={setComboImage} label="Combo Banner Image" />
              <div><label className="text-xs font-bold block mb-1">Combo Name</label><input value={comboName} onChange={e => setComboName(e.target.value)} placeholder="e.g. Tea + Snack Combo" className="w-full p-2.5 bg-gray-50 border rounded-xl text-xs" required /></div>
              <div><label className="text-xs font-bold block mb-2">Select Products (minimum 2)</label><div className="max-h-48 overflow-y-auto border rounded-2xl divide-y bg-gray-50">{products.map(product => { const checked = Boolean(comboItems[product.id]); return <div key={product.id} className="flex items-center gap-3 p-2.5"><button type="button" onClick={() => toggleComboProduct(product.id)} className={`w-5 h-5 rounded border flex items-center justify-center ${checked ? 'bg-amber-400 border-amber-400' : 'bg-white border-gray-300'}`}>{checked && <Check className="w-3 h-3" />}</button><div className="flex-1 min-w-0"><p className="text-xs font-bold truncate">{product.name}</p><p className="text-[10px] text-gray-500">{settings.currency} {product.price.toFixed(2)}</p></div>{checked && <input type="number" min="1" step="1" value={comboItems[product.id]} onChange={e => setComboItems(prev => ({ ...prev, [product.id]: Math.max(1, Number(e.target.value) || 1) }))} className="w-16 p-1.5 bg-white border rounded-lg text-xs text-center" />}</div>; })}</div></div>
              <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 text-xs flex justify-between"><span className="text-gray-600">Regular total</span><strong className="font-mono">{settings.currency} {comboRegularTotal.toFixed(2)}</strong></div>
              <div className="grid grid-cols-2 gap-2"><div><label className="text-xs font-bold block mb-1">Bundle Price ({settings.currency})</label><input type="text" inputMode="decimal" value={comboPrice} onChange={e => setComboPrice(cleanNumberInput(e.target.value))} placeholder="e.g. 70" className="w-full p-2.5 bg-gray-50 border rounded-xl text-xs" required /></div><div><label className="text-xs font-bold block mb-1">Discount %</label><input type="text" inputMode="decimal" value={comboDiscount} onChange={e => setComboDiscount(cleanNumberInput(e.target.value))} placeholder="e.g. 15" className="w-full p-2.5 bg-gray-50 border rounded-xl text-xs" /></div></div>
              <div className="grid grid-cols-2 gap-3"><div><label className="text-[10px] font-bold block mb-1">Start Date</label><input type="date" value={comboStartDate} onChange={e => setComboStartDate(e.target.value)} className="w-full p-2.5 bg-gray-50 border rounded-xl text-xs" required /></div><div><label className="text-[10px] font-bold block mb-1">End Date</label><input type="date" value={comboEndDate} min={comboStartDate} onChange={e => setComboEndDate(e.target.value)} className="w-full p-2.5 bg-gray-50 border rounded-xl text-xs" required /></div></div>
              <button disabled={isSavingCombo} className="w-full py-2.5 bg-amber-400 text-amber-950 font-bold text-xs rounded-xl disabled:opacity-60">{isSavingCombo ? 'Saving...' : editingCombo ? 'Update Combo Deal' : 'Save Combo Deal'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};