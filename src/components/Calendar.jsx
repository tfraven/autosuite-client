import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertCircle,
  CreditCard,
  Bike,
  FileCheck2,
  Package,
  CheckCircle2,
  User,
  Phone,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

export default function Calendar({ onNavigateToSale }) {
  const { t, isRomanUrdu } = useLanguage();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL'); // ALL, INSTALLMENTS, DELIVERIES, DOCS, POS
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [selectedEvent, setSelectedEvent] = useState(null);

  const fetchCalendarEvents = async () => {
    try {
      setLoading(true);
      const [salesData, docsData, posData] = await Promise.all([
        api.getSales({ limit: 100 }),
        api.getDocuments({ limit: 100 }),
        api.getVendorPOs()
      ]);

      const salesList = Array.isArray(salesData) ? salesData : salesData?.data || salesData?.sales || [];
      const docsList = Array.isArray(docsData) ? docsData : docsData?.data || docsData?.documents || [];
      const posList = Array.isArray(posData) ? posData : posData?.data || [];

      const parsedEvents = [];

      // 1. Installments
      for (const sale of salesList) {
        if (sale.installments) {
          for (const inst of sale.installments) {
            const dueDate = new Date(inst.dueDate);
            const isOverdue = inst.status !== 'PAID' && dueDate < new Date();
            parsedEvents.push({
              id: `inst-${inst.id}`,
              type: 'INSTALLMENT',
              date: dueDate,
              title: `Installment #${inst.installmentNumber}: ${sale.customerName}`,
              amount: inst.amount,
              status: isOverdue ? 'OVERDUE' : inst.status,
              invoiceNumber: sale.invoiceNumber,
              customerName: sale.customerName,
              customerPhone: sale.customerPhone,
              bikeModel: sale.bike?.modelName,
              saleId: sale.id
            });
          }
        }

        // 2. Sales Deliveries
        if (sale.saleDate) {
          parsedEvents.push({
            id: `sale-${sale.id}`,
            type: 'DELIVERY',
            date: new Date(sale.saleDate),
            title: `Delivered: ${sale.bike?.modelName || 'Motorcycle'}`,
            amount: sale.finalAmount,
            status: sale.status,
            invoiceNumber: sale.invoiceNumber,
            customerName: sale.customerName,
            customerPhone: sale.customerPhone,
            bikeModel: sale.bike?.modelName,
            saleId: sale.id
          });
        }
      }

      // 3. Documents
      for (const doc of docsList) {
        if (doc.issuedAt) {
          parsedEvents.push({
            id: `doc-${doc.id}`,
            type: 'DOCUMENT',
            date: new Date(doc.updatedAt || doc.issuedAt),
            title: `${doc.docType}: ${doc.sale?.customerName || 'Customer'}`,
            status: doc.paperworkStatus,
            customerName: doc.sale?.customerName,
            bikeModel: doc.sale?.bike?.modelName
          });
        }
      }

      // 4. Vendor POs
      for (const po of posList) {
        if (po.createdAt) {
          parsedEvents.push({
            id: `po-${po.id}`,
            type: 'PO',
            date: new Date(po.orderedAt || po.createdAt),
            title: `PO ${po.poNumber}: ${po.vendorName}`,
            amount: po.totalAmount,
            status: po.status,
            vendorName: po.vendorName
          });
        }
      }

      setEvents(parsedEvents);
    } catch (err) {
      console.error('Error fetching calendar events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarEvents();
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDay(today.getDate());
  };

  // Month stats
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
  const adjustedFirstDay = (firstDayIndex + 6) % 7; // 0 = Mon
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const monthNamesRu = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Filter events for the month
  const currentMonthEvents = events.filter((e) => {
    const d = new Date(e.date);
    const matchesMonth = d.getFullYear() === year && d.getMonth() === month;
    if (!matchesMonth) return false;
    if (activeFilter === 'INSTALLMENTS') return e.type === 'INSTALLMENT';
    if (activeFilter === 'DELIVERIES') return e.type === 'DELIVERY';
    if (activeFilter === 'DOCS') return e.type === 'DOCUMENT';
    if (activeFilter === 'POS') return e.type === 'PO';
    return true;
  });

  const getEventsForDay = (dayNumber) => {
    return currentMonthEvents.filter((e) => new Date(e.date).getDate() === dayNumber);
  };

  const selectedDayEvents = getEventsForDay(selectedDay);

  const getBadgeClass = (type, status) => {
    if (type === 'INSTALLMENT') {
      return status === 'OVERDUE' ? 'badge-rose' : 'badge-amber';
    }
    if (type === 'DELIVERY') return 'badge-emerald';
    if (type === 'DOCUMENT') return 'badge-cyan';
    return 'badge-purple';
  };

  return (
    <div className="calendar-view">
      {/* Top Controls */}
      <div className="calendar-header-bar glass-panel mb-4">
        <div className="calendar-nav-group">
          <div className="calendar-title-wrap">
            <CalendarIcon size={20} className="text-cyan" />
            <h2>
              {isRomanUrdu ? monthNamesRu[month] : monthNames[month]} {year}
            </h2>
          </div>
          <div className="calendar-month-arrows">
            <button className="btn btn-outline btn-sm" onClick={prevMonth} aria-label="Previous month">
              <ChevronLeft size={16} />
            </button>
            <button className="btn btn-outline btn-sm" onClick={goToToday}>
              {isRomanUrdu ? 'Aaj' : 'Today'}
            </button>
            <button className="btn btn-outline btn-sm" onClick={nextMonth} aria-label="Next month">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="calendar-filter-pills">
          <button
            className={`pill-btn ${activeFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setActiveFilter('ALL')}
          >
            {isRomanUrdu ? 'Sab' : 'All Events'}
          </button>
          <button
            className={`pill-btn pill-amber ${activeFilter === 'INSTALLMENTS' ? 'active' : ''}`}
            onClick={() => setActiveFilter('INSTALLMENTS')}
          >
            <CreditCard size={13} /> {isRomanUrdu ? 'Qistain (Installments)' : 'Installments'}
          </button>
          <button
            className={`pill-btn pill-emerald ${activeFilter === 'DELIVERIES' ? 'active' : ''}`}
            onClick={() => setActiveFilter('DELIVERIES')}
          >
            <Bike size={13} /> {isRomanUrdu ? 'Deliveries' : 'Deliveries'}
          </button>
          <button
            className={`pill-btn pill-cyan ${activeFilter === 'DOCS' ? 'active' : ''}`}
            onClick={() => setActiveFilter('DOCS')}
          >
            <FileCheck2 size={13} /> {isRomanUrdu ? 'Dastawaizat' : 'Paperwork'}
          </button>
          <button
            className={`pill-btn pill-purple ${activeFilter === 'POS' ? 'active' : ''}`}
            onClick={() => setActiveFilter('POS')}
          >
            <Package size={13} /> {isRomanUrdu ? 'Vendor Orders' : 'Vendor POs'}
          </button>
        </div>
      </div>

      {/* Main Calendar Layout */}
      <div className="calendar-layout-grid">
        {/* Month Grid */}
        <div className="calendar-grid-card glass-panel">
          <div className="calendar-weekdays-row">
            {dayNames.map((day) => (
              <div key={day} className="calendar-weekday-header">
                {day}
              </div>
            ))}
          </div>

          <div className="calendar-days-grid">
            {/* Prev month fill days */}
            {Array.from({ length: adjustedFirstDay }).map((_, i) => (
              <div key={`prev-${i}`} className="calendar-day-cell other-month">
                <span className="day-number">
                  {daysInPrevMonth - adjustedFirstDay + i + 1}
                </span>
              </div>
            ))}

            {/* Current month days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNumber = i + 1;
              const dayEvents = getEventsForDay(dayNumber);
              const isToday =
                new Date().getDate() === dayNumber &&
                new Date().getMonth() === month &&
                new Date().getFullYear() === year;
              const isSelected = selectedDay === dayNumber;

              return (
                <div
                  key={`day-${dayNumber}`}
                  className={`calendar-day-cell ${isToday ? 'is-today' : ''} ${
                    isSelected ? 'is-selected' : ''
                  } ${dayEvents.length > 0 ? 'has-events' : ''}`}
                  onClick={() => setSelectedDay(dayNumber)}
                >
                  <div className="day-cell-header">
                    <span className="day-number">{dayNumber}</span>
                    {dayEvents.length > 0 && (
                      <span className="day-event-count">{dayEvents.length}</span>
                    )}
                  </div>

                  <div className="day-events-preview">
                    {dayEvents.slice(0, 3).map((ev) => (
                      <div
                        key={ev.id}
                        className={`day-event-chip glass-badge text-xs ${getBadgeClass(
                          ev.type,
                          ev.status
                        )}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDay(dayNumber);
                          setSelectedEvent(ev);
                        }}
                      >
                        {ev.type === 'INSTALLMENT' && <CreditCard size={10} />}
                        {ev.type === 'DELIVERY' && <Bike size={10} />}
                        {ev.type === 'DOCUMENT' && <FileCheck2 size={10} />}
                        {ev.type === 'PO' && <Package size={10} />}
                        <span className="truncate">{ev.title}</span>
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="more-events-text text-xs text-muted">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Day Events Inspector Side-Panel */}
        <div className="calendar-day-sidebar glass-panel">
          <div className="day-sidebar-header">
            <div>
              <h3>
                {isRomanUrdu ? `${selectedDay} Tareekh ke Waqiat` : `Schedule for Day ${selectedDay}`}
              </h3>
              <span className="text-xs text-muted">
                {isRomanUrdu ? monthNamesRu[month] : monthNames[month]} {selectedDay}, {year}
              </span>
            </div>
            <span className="glass-badge badge-cyan text-xs">
              {selectedDayEvents.length} {isRomanUrdu ? 'record' : 'events'}
            </span>
          </div>

          <div className="day-events-list mt-3">
            {selectedDayEvents.length === 0 ? (
              <div className="empty-day-state">
                <Clock size={32} className="text-muted mb-2" />
                <p className="text-sm text-muted">
                  {isRomanUrdu
                    ? 'Is din koi baqaya qist ya delivery scheduled nahi hai.'
                    : 'No installment dues or scheduled events for this date.'}
                </p>
              </div>
            ) : (
              selectedDayEvents.map((ev) => (
                <div
                  key={ev.id}
                  className={`day-event-card glass-panel ${
                    selectedEvent?.id === ev.id ? 'highlighted' : ''
                  }`}
                  onClick={() => setSelectedEvent(ev)}
                >
                  <div className="flex items-center justify-between">
                    <span className={`glass-badge text-xs ${getBadgeClass(ev.type, ev.status)}`}>
                      {ev.type} · {ev.status}
                    </span>
                    {ev.amount !== undefined && (
                      <strong className="text-sm font-mono">
                        PKR {Number(ev.amount).toLocaleString('en-PK')}
                      </strong>
                    )}
                  </div>

                  <h4 className="mt-2 text-sm">{ev.title}</h4>

                  {ev.customerName && (
                    <div className="text-xs text-muted flex items-center gap-1 mt-1">
                      <User size={12} /> {ev.customerName}
                    </div>
                  )}

                  {ev.customerPhone && (
                    <div className="text-xs text-muted flex items-center gap-1">
                      <Phone size={12} /> {ev.customerPhone}
                    </div>
                  )}

                  {ev.invoiceNumber && (
                    <div className="text-xs text-cyan font-mono mt-1">
                      Invoice: {ev.invoiceNumber}
                    </div>
                  )}

                  {ev.saleId && onNavigateToSale && (
                    <button
                      className="btn btn-outline btn-xs mt-2 w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigateToSale(ev.saleId);
                      }}
                    >
                      <span>{isRomanUrdu ? 'Sauda / Invoice Dekhein' : 'View Sale Details'}</span>
                      <ArrowRight size={12} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
