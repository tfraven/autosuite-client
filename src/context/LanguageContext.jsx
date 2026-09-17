import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext(null);

export const TRANSLATIONS = {
  en: {
    // Navigation
    nav_dashboard: 'Dashboard',
    nav_inventory: 'Motorcycle stock',
    nav_sales: 'Sales and billing',
    nav_customers: 'Customers',
    nav_documents: 'Letters and documents',
    nav_parts: 'Spare parts',
    nav_reports: 'Reports and exports',
    nav_users: 'Staff and access',
    nav_calendar: 'Calendar & Schedule',
    nav_analytics: 'Business Analytics',
    nav_settings: 'Dealership Settings',
    nav_legal: 'Terms & Policies',

    // Headers & Common
    system_online: 'Online',
    main_campus: 'Main campus branch',
    search_placeholder: 'Search by model, chassis, customer or invoice…',
    btn_new_sale: 'New sale',
    btn_add_stock: 'Add stock',
    btn_export: 'Export Excel',
    btn_save: 'Save changes',
    btn_cancel: 'Cancel',
    btn_delete: 'Delete record',
    btn_restore: 'Restore record',
    btn_close: 'Close',
    btn_filter: 'Filter',

    // Dashboard
    dash_welcome: 'Welcome back',
    dash_subtitle: 'Stock, receivables, parts levels and registration paperwork as they stand right now.',
    dash_revenue: 'Total Revenue',
    dash_in_stock: 'Bikes in Stock',
    dash_outstanding: 'Outstanding Installments',
    dash_attention: 'Needs Attention',
    dash_best_sellers: 'Best Selling Models',
    dash_recent_sales: 'Recent Sales Transactions',

    // Sales & Customers
    sales_invoice: 'Invoice',
    sales_customer: 'Customer',
    sales_phone: 'Phone',
    sales_cnic: 'CNIC / National ID',
    sales_address: 'Address',
    sales_bike: 'Motorcycle',
    sales_chassis: 'Chassis No.',
    sales_engine: 'Engine No.',
    sales_price: 'Sale Price',
    sales_deposit: 'Initial Deposit',
    sales_balance: 'Remaining Balance',
    sales_status: 'Payment Status',
    sales_type: 'Sale Channel',

    // Statuses
    status_in_stock: 'In Stock',
    status_sold: 'Sold',
    status_reserved: 'Reserved',
    status_completed: 'Completed',
    status_pending: 'Pending',
    status_overdue: 'Overdue',
    status_paid: 'Paid In Full',

    // Delete
    delete_warning_title: 'Are you absolutely sure?',
    delete_warning_desc: 'This record will be soft deleted and hidden from active operations. To confirm deletion, type the exact identifier below:',
    delete_type_prompt: 'Type to confirm:',
    delete_confirm_btn: 'I understand the consequences, delete this record'
  },
  ru: {
    // Navigation (Roman Urdu)
    nav_dashboard: 'Khulasa / Dashboard',
    nav_inventory: 'Motorcycle Stock',
    nav_sales: 'Farokht aur Billing',
    nav_customers: 'Kharidar / Grahak',
    nav_documents: 'Dastawaizat / Paperwork',
    nav_parts: 'Spare Parts / Saman',
    nav_reports: 'Reports aur Hisaab',
    nav_users: 'Staff aur Permissions',
    nav_calendar: 'Roznamcha / Calendar',
    nav_analytics: 'Karobari Jaiza / Analytics',
    nav_settings: 'Dealership Settings',
    nav_legal: 'Qanooni Sharait & Policies',

    // Headers & Common
    system_online: 'Online / Rabta Qaim',
    main_campus: 'Markazi Showroom Branch',
    search_placeholder: 'Chassis, Engine, Customer ya Invoice talash karein…',
    btn_new_sale: 'Nayi Sale Karein',
    btn_add_stock: 'Nayi Bike Shamil Karein',
    btn_export: 'Excel Download Karein',
    btn_save: 'Mehfooz Karein',
    btn_cancel: 'Mansookh Karein',
    btn_delete: 'Record Hazaf Karein',
    btn_restore: 'Wapis Bahal Karein',
    btn_close: 'Band Karein',
    btn_filter: 'Chaant Lein (Filter)',

    // Dashboard
    dash_welcome: 'Khushamdeed',
    dash_subtitle: 'Stock, baqaya rakam, spare parts aur registration papers ka taaza tareen jaiza.',
    dash_revenue: 'Kul Aamdani (Revenue)',
    dash_in_stock: 'Dastiyab Bikes Stock Mein',
    dash_outstanding: 'Wajib-ul-Ada Qistain (Dues)',
    dash_attention: 'Fawri Tawajah Ki Zaroorat',
    dash_best_sellers: 'Sab Se Zyada Bikne Wale Models',
    dash_recent_sales: 'Haliya Farokht (Sales)',

    // Sales & Customers
    sales_invoice: 'Invoice Number',
    sales_customer: 'Kharidar Ka Naam',
    sales_phone: 'Rabta Number / Phone',
    sales_cnic: 'Shanakhti Card (CNIC)',
    sales_address: 'Pata / Address',
    sales_bike: 'Gaari / Motorcycle',
    sales_chassis: 'Chassis Number',
    sales_engine: 'Engine Number',
    sales_price: 'Qeemat-e-Farokht',
    sales_deposit: 'Peshgi Rakam (Down Payment)',
    sales_balance: 'Baqaya Rakam (Balance)',
    sales_status: 'Adaigi Ki Soorat-e-Haal',
    sales_type: 'Farokht Ki Qisam (B2C/B2B)',

    // Statuses
    status_in_stock: 'Stock Mein Dastiyab',
    status_sold: 'Bik Chuki (Sold)',
    status_reserved: 'Mehfooz Shuda (Reserved)',
    status_completed: 'Mukammal Ada Shuda',
    status_pending: 'Baqaya Adaigi',
    status_overdue: 'Takheer Shuda (Overdue)',
    status_paid: 'Mukammal Ada',

    // Delete
    delete_warning_title: 'Kya aap waqai is record ko delete karna chahte hain?',
    delete_warning_desc: 'Yeh record soft-delete ho jaye ga aur aam list se chup jaye ga. Tasdeeq ke liye darj zail value type karein:',
    delete_type_prompt: 'Tasdeeq ke liye likhein:',
    delete_confirm_btn: 'Main nataij se waqif hoon, yeh record delete karein'
  }
};

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('autosuite_lang') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('autosuite_lang', lang);
  }, [lang]);

  const toggleLanguage = () => {
    setLang((prev) => (prev === 'en' ? 'ru' : 'en'));
  };

  const t = (key, fallback = '') => {
    return TRANSLATIONS[lang]?.[key] || TRANSLATIONS.en?.[key] || fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, toggleLanguage, t, isRomanUrdu: lang === 'ru' }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
