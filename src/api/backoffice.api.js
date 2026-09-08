import api from './pos.js';

export const createMenuItem = (data) => api.post('/pos/backoffice/menu-items', data).then((r) => r.data);
export const deleteMenuItem = (id) => api.delete(`/pos/backoffice/menu-items/${id}`).then((r) => r.data);
export const getMenuCategories = () => api.get('/pos/backoffice/menu-categories').then((r) => r.data);
export const deleteMenuCategory = (id) => api.delete(`/pos/backoffice/categories/${id}`).then((r) => r.data);
export const getTaxClasses = () => api.get('/pos/backoffice/tax-classes').then((r) => r.data);
export const getPrinterStations = () => api.get('/pos/backoffice/printer-stations').then((r) => r.data);

export const createPrinterStation = (data) => api.post('/pos/backoffice/printer-stations', data).then((r) => r.data);
export const getOutlets = () => api.get('/pos/backoffice/outlets').then((r) => r.data);
export const createOutlet = (data) => api.post('/pos/backoffice/outlets', data).then((r) => r.data);
export const updateOutlet = (id, data) => api.put(`/pos/backoffice/outlets/${id}`, data).then((r) => r.data);
export const deleteOutlet = (id) => api.delete(`/pos/backoffice/outlets/${id}`).then((r) => r.data);

// Tax classes & rates
export const getTaxes      = ()       => api.get('/pos/backoffice/taxes').then((r) => r.data);
export const createTax     = (data)   => api.post('/pos/backoffice/taxes', data).then((r) => r.data);

export const createTaxClass = (data)  => api.post('/pos/backoffice/tax-classes', data).then((r) => r.data);
export const createTaxRate  = (data)  => api.post('/pos/backoffice/tax-rates', data).then((r) => r.data);
export const deleteTaxRate  = (id)    => api.delete(`/pos/backoffice/tax-rates/${id}`).then((r) => r.data);
