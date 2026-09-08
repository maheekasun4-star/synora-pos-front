import { useEffect, useState } from 'react';
import { createMenuItem, getMenuCategories, getTaxClasses, getPrinterStations } from '../../api/backoffice.api';

const emptyForm = { name: '', category_id: '', price: '', tax_class_id: '', printer_station_id: '', price_type: 'exclusive', is_active: true };

const inputCls  = 'w-full bg-slate-900/60 border border-slate-800 focus:border-amber-500 rounded-lg text-slate-200 placeholder-slate-500 outline-none px-3 py-2 text-sm transition-all duration-300';
const labelCls  = 'mb-1 block text-xs font-semibold text-slate-400 uppercase tracking-wider';
const errorCls  = 'mt-1 text-xs text-red-400';

export default function MenuItemForm({ onSaved }) {
  const [categories, setCategories] = useState([]);
  const [taxClasses, setTaxClasses] = useState([]);
  const [stations, setStations]     = useState([]);
  const [form, setForm]     = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saved, setSaved]   = useState(false);

  const categoryMap = new Map(categories.map(cat => [cat.id, cat]));
  const getCategoryPath = (category) => {
    if (!category) return '';
    if (!category.parentId) return category.name;
    const parent = categoryMap.get(category.parentId);
    return parent ? `${getCategoryPath(parent)} / ${category.name}` : category.name;
  };
  const familyCategories = categories.filter(cat => Number(cat.level) === 3 && cat.isActive !== false);

  useEffect(() => {
    Promise.all([getMenuCategories(), getTaxClasses(), getPrinterStations()])
      .then(([cats, taxes, stns]) => { setCategories(cats); setTaxClasses(taxes); setStations(stns); })
      .catch(err => console.error('Failed to load menu item dropdowns', err));
  }, []);

  const handleChange = (field) => (e) => {
    const value = field === 'is_active' ? e.target.checked : e.target.value;
    setForm(f => ({ ...f, [field]: value }));
    setErrors(f => ({ ...f, [field]: null }));
    setSaved(false);
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim())                                next.name               = 'Enter an item name';
    if (!form.category_id)                               next.category_id         = 'Select a category';
    if (!form.price || Number(form.price) <= 0)          next.price               = 'Enter a valid price';
    if (!form.tax_class_id)                              next.tax_class_id        = 'Select a tax class';
    if (!form.printer_station_id)                        next.printer_station_id  = 'Select a printer station';
    if (!form.price_type || !['exclusive', 'inclusive'].includes(form.price_type)) {
      next.price_type = 'Select a price type';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      const payload = {
        ...form,
        priceType: form.price_type,
      };
      const item = await createMenuItem(payload);
      setSaved(true);
      onSaved?.(item);
      setForm(emptyForm);
    } catch (err) {
      setErrors(f => ({ ...f, submit: err.response?.data?.error || 'Unable to save menu item' }));
    }
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5">
      <h3 className="mb-4 text-lg font-semibold text-slate-200">Create menu item</h3>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className={labelCls}>Item name</label>
          <input value={form.name} onChange={handleChange('name')} placeholder="Chicken fried rice" className={inputCls} />
          {errors.name && <p className={errorCls}>{errors.name}</p>}
        </div>

        <div>
          <label className={labelCls}>Family group</label>
          <select value={form.category_id} onChange={handleChange('category_id')} className={inputCls}>
            <option value="">Select family group</option>
            {familyCategories.map(c => <option key={c.id} value={c.id}>{getCategoryPath(c)}</option>)}
          </select>
          {familyCategories.length === 0 && <p className="mt-1 text-xs text-amber-400">Create a Level 3 family group before adding items.</p>}
          {errors.category_id && <p className={errorCls}>{errors.category_id}</p>}
        </div>

        <div>
          <label className={labelCls}>Printer station</label>
          <select value={form.printer_station_id} onChange={handleChange('printer_station_id')} className={inputCls}>
            <option value="">Select printer station</option>
            {stations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          {errors.printer_station_id && <p className={errorCls}>{errors.printer_station_id}</p>}
        </div>

        <div>
          <label className={labelCls}>Selling Price</label>
          <input type="number" min="0" step="0.01" value={form.price} onChange={handleChange('price')} placeholder="1500" className={inputCls} />
          {errors.price && <p className={errorCls}>{errors.price}</p>}
        </div>

        <div>
          <label className={labelCls}>Tax</label>
          <select value={form.tax_class_id} onChange={handleChange('tax_class_id')} className={inputCls}>
            <option value="">Select tax class</option>
            {taxClasses.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          {errors.tax_class_id && <p className={errorCls}>{errors.tax_class_id}</p>}
        </div>

        <div className="md:col-span-2">
          <label className={labelCls}>Price Type</label>
          <select value={form.price_type} onChange={handleChange('price_type')} className={inputCls}>
            <option value="exclusive">Tax Exclusive</option>
            <option value="inclusive">Tax Inclusive</option>
          </select>
          {errors.price_type && <p className={errorCls}>{errors.price_type}</p>}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-4">
        <label className="inline-flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
          <input type="checkbox" checked={form.is_active} onChange={handleChange('is_active')} className="accent-amber-500" />
          Active — show on order screen
        </label>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setForm(emptyForm)}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 transition-all duration-200">
            Cancel
          </button>
          <button type="button" onClick={handleSubmit}
            className="rounded-lg bg-amber-500 hover:bg-amber-600 px-4 py-2 text-sm font-semibold text-slate-950 transition-all duration-200 shadow-lg shadow-amber-500/10">
            Save item
          </button>
        </div>
      </div>

      {errors.submit && <p className="mt-3 text-sm text-red-400">{errors.submit}</p>}
      {saved && <p className="mt-3 text-sm font-medium text-green-400">Item saved ✓</p>}
    </div>
  );
}
