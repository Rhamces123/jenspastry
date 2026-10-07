// ==========================================
// Jen's Pastry Shop - Store Owner / Admin Dashboard
// Section 10: Executive Overview, Sales Analytics, Product CRUD,
// Order Management, Inventory, User & Staff Management, Reports, Store Settings
// ==========================================

import React, { useState, useEffect, useMemo } from 'react';
import { useShop } from '../../hooks/useShop.js';
import { useAuth } from '../../context/useAuth.js';
import { ROLES, ROLE_LABELS } from '../../constants/roles.js';
import DashboardLayout from '../../components/DashboardLayout.jsx';
import ProductFormModal from '../../components/ProductFormModal.jsx';
import QuickRestockModal from '../../components/QuickRestockModal.jsx';
import ReceiptModal from '../../components/ReceiptModal.jsx';
import NotificationToast from '../../components/NotificationToast.jsx';
import { formatCurrency, formatDate, formatDateTime, formatSaleNumber } from '../../utils/formatters.js';
import { useBakeryWorkflow } from '../../hooks/useBakeryWorkflow.js';
import InventoryOverviewSection from '../../components/admin/InventoryOverviewSection.jsx';
import IngredientInventoryTab from '../../components/admin/IngredientInventoryTab.jsx';
import ProductionManagementTab from '../../components/admin/ProductionManagementTab.jsx';
import InventoryHistoryTab from '../../components/admin/InventoryHistoryTab.jsx';
import RecipeModal from '../../components/admin/RecipeModal.jsx';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Package, 
  Users, 
  BarChart3, 
  Settings, 
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  Printer, 
  ShieldCheck, 
  DollarSign, 
  CreditCard, 
  RefreshCw, 
  X, 
  UserPlus,
  Eye,
  Percent,
  MapPin,
  Phone,
  Store,
  Receipt,
  Wheat,
  ChefHat,
  History,
  BookOpen
} from 'lucide-react';

export default function AdminDashboard() {
  const { 
    products, 
    sales, 
    addProduct, 
    updateProduct, 
    deleteProduct, 
    updateStock, 
    resetToDefaultData 
  } = useShop();

  const { getAllUsers, createStaffAccount, updateUserRole } = useAuth();

  const { 
    ingredients, 
    productionRequests 
  } = useBakeryWorkflow();

  // Active navigation tab
  const [activeTab, setActiveTab] = useState('overview');

  // Timeframe for Analytics: 'daily' | 'weekly' | 'monthly'
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState('daily');

  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [selectedRecipeProduct, setSelectedRecipeProduct] = useState(null);

  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [restockingProduct, setRestockingProduct] = useState(null);

  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [activeReceiptSale, setActiveReceiptSale] = useState(null);

  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [staffForm, setStaffForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: ROLES.CASHIER
  });
  const [staffSubmitting, setStaffSubmitting] = useState(false);
  const [staffSuccessMsg, setStaffSuccessMsg] = useState('');
  const [staffErrorMsg, setStaffErrorMsg] = useState('');

  // Toast feedback
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const showToast = (message, type = 'success') => setToast({ message, type });

  // Orders State (syncs with local storage / sales)
  const [orders, setOrders] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('bakeology_sales') || '[]');
      return stored.length > 0 ? stored : sales;
    } catch {
      return sales;
    }
  });

  // Keep orders in sync when sales change
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('bakeology_sales') || '[]');
      if (stored.length > 0) {
        setOrders(stored);
      } else {
        setOrders(sales);
      }
    } catch {
      setOrders(sales);
    }
  }, [sales]);

  // Order filters
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');

  // Product filters
  const [productSearch, setProductSearch] = useState('');
  const [productCategory, setProductCategory] = useState('ALL');

  // User list state
  const [userList, setUserList] = useState([]);
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userListLoading, setUserListLoading] = useState(false);

  // Fetch users on tab change or mount
  const refreshUsers = async () => {
    setUserListLoading(true);
    try {
      const users = await getAllUsers();
      setUserList(users);
    } catch (e) {
      console.error("Error fetching users:", e);
    } finally {
      setUserListLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users' || activeTab === 'overview') {
      refreshUsers();
    }
  }, [activeTab]);

  // Executive KPI stats
  const totalRevenue = useMemo(() => {
    return orders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);
  }, [orders]);

  const totalOrdersCount = orders.length;
  const activeProductsCount = products.length;
  const lowStockCount = useMemo(() => {
    return products.filter(p => (Number(p.stock) || 0) <= (p.minimumStock !== undefined ? Number(p.minimumStock) : 5)).length;
  }, [products]);
  const outOfStockCount = useMemo(() => {
    return products.filter(p => (Number(p.stock) || 0) === 0).length;
  }, [products]);
  const totalUsersCount = userList.length;

  const lowIngredientsCount = useMemo(() => {
    return (ingredients || []).filter(i => (Number(i.quantity) || 0) <= (Number(i.minimumStock) || 0)).length;
  }, [ingredients]);

  const activeProductionCount = useMemo(() => {
    return (productionRequests || []).filter(r => r.status !== 'Completed' && r.status !== 'Ready for Cashier').length;
  }, [productionRequests]);

  // Average Order Value
  const aov = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;

  // Top Selling Products Calculation
  const topSellingProducts = useMemo(() => {
    const itemMap = {};
    orders.forEach(order => {
      (order.items || []).forEach(item => {
        const id = item.id || item.name;
        if (!itemMap[id]) {
          itemMap[id] = {
            id,
            name: item.name,
            category: item.category || 'Pastry',
            totalQuantity: 0,
            totalRevenue: 0
          };
        }
        itemMap[id].totalQuantity += (item.quantity || 1);
        itemMap[id].totalRevenue += ((item.price || 0) * (item.quantity || 1));
      });
    });
    return Object.values(itemMap)
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 5);
  }, [orders]);

  // Sales Analytics Chart Data: Daily, Weekly, Monthly (strictly aggregated from real orders)
  const chartData = useMemo(() => {
    if (analyticsTimeframe === 'daily') {
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
        
        const dayTotal = orders.filter(o => {
          if (!o.date) return false;
          return o.date.startsWith(dateStr);
        }).reduce((sum, o) => sum + (Number(o.total) || 0), 0);

        days.push({ label: dayLabel, date: dateStr, amount: dayTotal });
      }
      return days;
    } else if (analyticsTimeframe === 'weekly') {
      const weeks = [];
      const now = new Date();
      for (let i = 3; i >= 0; i--) {
        const start = new Date(now);
        start.setDate(now.getDate() - (i * 7 + 6));
        start.setHours(0, 0, 0, 0);

        const end = new Date(now);
        end.setDate(now.getDate() - (i * 7));
        end.setHours(23, 59, 59, 999);

        const label = i === 0 ? 'This Week' : i === 1 ? 'Last Week' : `${i} Wks Ago`;

        const weekTotal = orders.filter(o => {
          if (!o.date) return false;
          const orderDate = new Date(o.date);
          return orderDate >= start && orderDate <= end;
        }).reduce((sum, o) => sum + (Number(o.total) || 0), 0);

        weeks.push({ label, amount: weekTotal });
      }
      return weeks;
    } else {
      const months = [];
      const now = new Date();
      for (let i = 3; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthLabel = d.toLocaleDateString('en-US', { month: 'short' });
        const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

        const monthTotal = orders.filter(o => {
          if (!o.date) return false;
          return o.date.startsWith(yearMonth);
        }).reduce((sum, o) => sum + (Number(o.total) || 0), 0);

        months.push({ label: i === 0 ? `${monthLabel} (Current)` : monthLabel, amount: monthTotal });
      }
      return months;
    }
  }, [analyticsTimeframe, orders]);

  const maxChartAmount = Math.max(...chartData.map(d => d.amount), 100);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesStatus = orderStatusFilter === 'ALL' || 
        (order.orderStatus || 'Completed').toUpperCase() === orderStatusFilter.toUpperCase();
      const matchesSearch = !orderSearchQuery || 
        String(order.saleNumber || '').toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
        String(order.id || '').toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
        String(order.customerName || '').toLowerCase().includes(orderSearchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [orders, orderStatusFilter, orderSearchQuery]);

  // Order status progression
  const handleUpdateOrderStatus = (orderId, newStatus) => {
    const updated = orders.map(ord => {
      if (ord.id === orderId) {
        return { ...ord, orderStatus: newStatus, updatedAt: new Date().toISOString() };
      }
      return ord;
    });
    setOrders(updated);
    try {
      localStorage.setItem('bakeology_sales', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase());
      const matchesCat = productCategory === 'ALL' || p.category === productCategory;
      return matchesSearch && matchesCat;
    });
  }, [products, productSearch, productCategory]);

  // Product categories
  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
    return ['ALL', ...cats];
  }, [products]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return userList.filter(user => {
      const matchesRole = userRoleFilter === 'ALL' || (user.role || ROLES.CUSTOMER) === userRoleFilter;
      const matchesSearch = !userSearchQuery ||
        (user.fullName || '').toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        (user.email || '').toLowerCase().includes(userSearchQuery.toLowerCase());
      return matchesRole && matchesSearch;
    });
  }, [userList, userRoleFilter, userSearchQuery]);

  // Handle Create Staff Account Form Submit
  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setStaffErrorMsg('');
    setStaffSuccessMsg('');
    setStaffSubmitting(true);

    try {
      if (!staffForm.fullName.trim() || !staffForm.email.trim() || !staffForm.password.trim()) {
        throw new Error('Please fill in all required fields.');
      }
      if (staffForm.password.length < 6) {
        throw new Error('Password must be at least 6 characters.');
      }

      await createStaffAccount({
        fullName: staffForm.fullName.trim(),
        email: staffForm.email.trim(),
        password: staffForm.password,
        role: staffForm.role
      });

      setStaffSuccessMsg(`Staff account for ${staffForm.fullName} (${ROLE_LABELS[staffForm.role]}) created successfully!`);
      setStaffForm({ fullName: '', email: '', password: '', role: ROLES.CASHIER });
      await refreshUsers();
      setTimeout(() => {
        setIsStaffModalOpen(false);
        setStaffSuccessMsg('');
      }, 1500);
    } catch (err) {
      setStaffErrorMsg(err.message || 'Failed to create staff account.');
    } finally {
      setStaffSubmitting(false);
    }
  };

  // Handle Role Change for User
  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateUserRole(userId, newRole);
      await refreshUsers();
    } catch (err) {
      alert(err.message || 'Failed to update user role.');
    }
  };

  // Payment Breakdown for Reports
  const paymentBreakdown = useMemo(() => {
    const methods = { Cash: 0, GCash: 0, Card: 0 };
    orders.forEach(o => {
      const m = o.paymentMethod || 'Cash';
      if (methods[m] !== undefined) {
        methods[m] += (Number(o.total) || 0);
      } else {
        methods.Cash += (Number(o.total) || 0);
      }
    });
    return methods;
  }, [orders]);

  const handlePrintReport = () => {
    window.print();
  };

  // Helper for Status Badge class
  const getStatusBadgeClass = (status = 'Completed') => {
    switch (status.toLowerCase()) {
      case 'completed': return 'status-completed';
      case 'confirmed': return 'status-confirmed';
      case 'preparing': return 'status-preparing';
      case 'ready': 
      case 'ready for pickup': return 'status-ready';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-pending';
    }
  };

  // Navigation Items for DashboardLayout
  const navItems = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'orders', label: 'Orders', icon: ShoppingBag, badge: orders.filter(o => (o.orderStatus || 'Pending') === 'Pending').length || null },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'ingredient-inventory', label: 'Ingredient Inventory', icon: Wheat, badge: lowIngredientsCount > 0 ? lowIngredientsCount : null },
    { id: 'production', label: 'Production', icon: ChefHat, badge: activeProductionCount > 0 ? activeProductionCount : null },
    { id: 'inventory-history', label: 'Inventory History', icon: History },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'reports', label: 'Sales & Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <DashboardLayout
      role={ROLES.ADMIN}
      title="Store Owner & Admin Dashboard"
      subtitle="Complete Bakery Operations, Sales Analytics & Team Management"
      navigationItems={navItems}
      activeItem={activeTab}
      onSelectItem={setActiveTab}
      headerActions={
        <>
          <button
            type="button"
            className="btn-admin-secondary"
            onClick={() => {
              setEditingProduct(null);
              setIsProductModalOpen(true);
            }}
          >
            <Plus size={15} />
            <span>Add Pastry</span>
          </button>
          <button
            type="button"
            className="btn-admin-primary"
            onClick={() => setIsStaffModalOpen(true)}
          >
            <UserPlus size={15} />
            <span>New Staff</span>
          </button>
        </>
      }
    >
      {/* TAB 1: EXECUTIVE OVERVIEW */}
      {activeTab === 'overview' && (
        <div>
          {/* Executive KPI Cards */}
          <div className="admin-kpi-grid">
            {/* Card 1: Revenue */}
            <div className="admin-kpi-card kpi-revenue">
              <div className="admin-kpi-top">
                <span className="admin-kpi-label">Total Revenue</span>
                <div className="admin-kpi-icon-wrap icon-revenue">
                  <DollarSign size={18} />
                </div>
              </div>
              <div className="admin-kpi-value">{formatCurrency(totalRevenue)}</div>
              <div className="admin-kpi-subtext">All recorded sales</div>
            </div>

            {/* Card 2: Orders */}
            <div className="admin-kpi-card kpi-orders">
              <div className="admin-kpi-top">
                <span className="admin-kpi-label">Total Orders</span>
                <div className="admin-kpi-icon-wrap icon-orders">
                  <ShoppingBag size={18} />
                </div>
              </div>
              <div className="admin-kpi-value">{totalOrdersCount}</div>
              <div className="admin-kpi-subtext">Avg Ticket: {formatCurrency(aov)}</div>
            </div>

            {/* Card 3: Products */}
            <div className="admin-kpi-card kpi-products">
              <div className="admin-kpi-top">
                <span className="admin-kpi-label">Catalog Items</span>
                <div className="admin-kpi-icon-wrap icon-products">
                  <Package size={18} />
                </div>
              </div>
              <div className="admin-kpi-value">{activeProductsCount}</div>
              <div className="admin-kpi-subtext">Active baked pastries</div>
            </div>

            {/* Card 4: Low Stock */}
            <div className="admin-kpi-card kpi-lowstock">
              <div className="admin-kpi-top">
                <span className="admin-kpi-label">Low Stock</span>
                <div className="admin-kpi-icon-wrap icon-lowstock">
                  <AlertTriangle size={18} />
                </div>
              </div>
              <div className="admin-kpi-value" style={{ color: lowStockCount > 0 ? '#DC2626' : '#10B981' }}>
                {lowStockCount} {outOfStockCount > 0 && <span style={{ fontSize: '14px', color: '#DC2626' }}>({outOfStockCount} out)</span>}
              </div>
              <div className="admin-kpi-subtext">{lowStockCount > 0 ? 'Requires baking queue' : 'Stock is healthy'}</div>
            </div>

            {/* Card 5: Users */}
            <div className="admin-kpi-card kpi-users">
              <div className="admin-kpi-top">
                <span className="admin-kpi-label">Total Accounts</span>
                <div className="admin-kpi-icon-wrap icon-users">
                  <Users size={18} />
                </div>
              </div>
              <div className="admin-kpi-value">{totalUsersCount}</div>
              <div className="admin-kpi-subtext">Staff & customers</div>
            </div>
          </div>

          {/* Real-time Dual Inventory Overview (Raw Ingredients vs Finished Pastries) */}
          <div style={{ marginTop: '24px', marginBottom: '24px' }}>
            <InventoryOverviewSection 
              onNavigateToIngredients={() => setActiveTab('ingredient-inventory')}
              onNavigateToProduction={() => setActiveTab('production')}
            />
          </div>

          {/* Sales Analytics Chart & Top Selling Pastries */}
          <div className="admin-analytics-grid">
            {/* Sales Chart Section */}
            <div className="admin-card">
              <div className="admin-card-header">
                <div>
                  <h3 className="admin-card-title">
                    <TrendingUp size={20} style={{ color: '#BE185D' }} />
                    Sales Revenue Analytics
                  </h3>
                  <p className="admin-card-subtitle">Interactive performance tracking across periods</p>
                </div>
                <div className="admin-timeframe-switch">
                  {['daily', 'weekly', 'monthly'].map(tf => (
                    <button
                      key={tf}
                      type="button"
                      className={`timeframe-btn ${analyticsTimeframe === tf ? 'active' : ''}`}
                      onClick={() => setAnalyticsTimeframe(tf)}
                    >
                      {tf === 'daily' ? '7 Days' : tf === 'weekly' ? '4 Weeks' : 'Monthly'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bar Chart Visualization */}
              <div className="admin-bar-chart-container">
                {chartData.map((bar, i) => {
                  const heightPercent = maxChartAmount > 0 ? Math.max(14, Math.round((bar.amount / maxChartAmount) * 100)) : 14;
                  return (
                    <div key={i} className="admin-bar-col">
                      <div className="admin-bar-tooltip">
                        {formatCurrency(bar.amount)}
                      </div>
                      <div 
                        className="admin-bar-fill"
                        style={{ height: `${heightPercent}%` }}
                      />
                      <span className="admin-bar-label">
                        {bar.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="admin-chart-footer">
                <span>Total Period Sales: <strong style={{ color: '#1F242E' }}>{formatCurrency(totalRevenue)}</strong></span>
                <span>Average per Order: <strong style={{ color: '#1F242E' }}>{formatCurrency(aov)}</strong></span>
              </div>
            </div>

            {/* Top Selling Pastries */}
            <div className="admin-card">
              <div className="admin-card-header">
                <h3 className="admin-card-title">
                  <ShoppingBag size={20} style={{ color: '#9D174D' }} />
                  Top Selling Pastries
                </h3>
              </div>

              {topSellingProducts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: '#8A92A0', fontSize: '13px' }}>
                  No pastry sales recorded yet.
                </div>
              ) : (
                <div className="admin-top-list">
                  {topSellingProducts.map((item, idx) => (
                    <div key={item.id} className="admin-top-item">
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div className="admin-top-rank">
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                        </div>
                        <div className="admin-top-info">
                          <p className="admin-top-name">{item.name}</p>
                          <p className="admin-top-qty">{item.totalQuantity} units sold • {item.category}</p>
                        </div>
                      </div>
                      <span className="admin-top-revenue">
                        {formatCurrency(item.totalRevenue)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Orders Preview */}
          <div className="admin-card">
            <div className="admin-card-header">
              <div>
                <h3 className="admin-card-title">Recent Bakery Orders</h3>
                <p className="admin-card-subtitle">Latest transactions processed at cashier or online</p>
              </div>
              <button
                type="button"
                style={{ background: 'none', border: 'none', color: '#9D174D', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}
                onClick={() => setActiveTab('orders')}
              >
                View All Orders →
              </button>
            </div>

            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Date & Time</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '36px 16px', color: '#8A92A0', fontSize: '13px' }}>
                        No bakery orders recorded yet. As orders are placed via POS or Customer checkout, they will appear here.
                      </td>
                    </tr>
                  ) : (
                    orders.slice(0, 5).map(order => (
                      <tr key={order.id}>
                        <td style={{ fontFamily: 'monospace', fontWeight: 800, color: '#9D174D' }}>
                          {formatSaleNumber(order.saleNumber)}
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          {order.customerName || 'Walk-in Customer'}
                        </td>
                        <td style={{ color: '#717A88' }}>
                          {formatDateTime(order.date)}
                        </td>
                        <td style={{ color: '#555E68' }}>
                          {(order.items || []).length} items
                        </td>
                        <td style={{ fontWeight: 800, color: '#1F242E' }}>
                          {formatCurrency(order.total)}
                        </td>
                        <td>
                          <span className={`admin-status-badge ${getStatusBadgeClass(order.orderStatus)}`}>
                            {order.orderStatus || 'Completed'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="btn-admin-secondary"
                            style={{ padding: '4px 8px', fontSize: '11px' }}
                            onClick={() => {
                              setActiveReceiptSale(order);
                              setIsReceiptModalOpen(true);
                            }}
                            title="View Receipt"
                          >
                            <Eye size={13} />
                            <span>View</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ORDER MANAGEMENT */}
      {activeTab === 'orders' && (
        <div>
          {/* Controls & Filter Bar */}
          <div className="admin-card" style={{ marginBottom: '18px', padding: '16px 20px' }}>
            <div className="admin-filter-bar" style={{ margin: 0 }}>
              <div className="admin-search-wrap">
                <Search size={15} />
                <input
                  type="text"
                  placeholder="Search order #, customer, or ID..."
                  value={orderSearchQuery}
                  onChange={e => setOrderSearchQuery(e.target.value)}
                  className="admin-search-input"
                />
              </div>

              {/* Status pills */}
              <div className="admin-pills-wrap">
                {['ALL', 'Pending', 'Confirmed', 'Preparing', 'Ready', 'Completed', 'Cancelled'].map(st => (
                  <button
                    key={st}
                    type="button"
                    className={`admin-pill ${orderStatusFilter.toUpperCase() === st.toUpperCase() ? 'active' : ''}`}
                    onClick={() => setOrderStatusFilter(st)}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Orders Table */}
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Items Summary</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Current Status</th>
                  <th style={{ textAlign: 'center' }}>Update Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '36px 0', color: '#8A92A0' }}>
                      No orders found matching the filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map(order => (
                    <tr key={order.id}>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#9D174D', display: 'block' }}>
                          {formatSaleNumber(order.saleNumber)}
                        </span>
                        <span style={{ fontSize: '10px', color: '#8A92A0' }}>{formatDateTime(order.date)}</span>
                      </td>
                      <td>
                        <p style={{ fontWeight: 700, color: '#1F242E' }}>{order.customerName || 'Walk-in Customer'}</p>
                        {order.customerEmail && <span style={{ fontSize: '11px', color: '#8A92A0' }}>{order.customerEmail}</span>}
                      </td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{(order.items || []).length} items</span>
                        <span style={{ display: 'block', fontSize: '11px', color: '#717A88', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {(order.items || []).map(i => `${i.quantity}x ${i.name}`).join(', ')}
                        </span>
                      </td>
                      <td style={{ fontWeight: 800, color: '#1F242E', fontSize: '13px' }}>
                        {formatCurrency(order.total)}
                      </td>
                      <td style={{ color: '#555E68' }}>
                        {order.paymentMethod || 'Cash'}
                      </td>
                      <td>
                        <span className={`admin-status-badge ${getStatusBadgeClass(order.orderStatus)}`}>
                          {order.orderStatus || 'Completed'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <select
                          value={order.orderStatus || 'Completed'}
                          onChange={e => handleUpdateOrderStatus(order.id, e.target.value)}
                          className="admin-form-select"
                          style={{ width: 'auto', padding: '5px 10px', fontSize: '11px', fontWeight: 700 }}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Preparing">Preparing</option>
                          <option value="Ready">Ready</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn-admin-secondary"
                          style={{ padding: '6px 12px', fontSize: '11px' }}
                          onClick={() => {
                            setActiveReceiptSale(order);
                            setIsReceiptModalOpen(true);
                          }}
                        >
                          <Receipt size={13} />
                          <span>Receipt</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PRODUCT MANAGEMENT (CRUD) */}
      {activeTab === 'products' && (
        <div>
          {/* Controls */}
          <div className="admin-card" style={{ marginBottom: '18px', padding: '16px 20px' }}>
            <div className="admin-filter-bar" style={{ margin: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <div className="admin-search-wrap">
                  <Search size={15} />
                  <input
                    type="text"
                    placeholder="Search pastries..."
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    className="admin-search-input"
                  />
                </div>

                <select
                  value={productCategory}
                  onChange={e => setProductCategory(e.target.value)}
                  className="admin-form-select"
                  style={{ width: 'auto', padding: '8px 12px', fontSize: '12px' }}
                >
                  {categories.map(c => (
                    <option key={c} value={c}>{c === 'ALL' ? 'All Categories' : c}</option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                className="btn-admin-primary"
                onClick={() => {
                  setEditingProduct(null);
                  setIsProductModalOpen(true);
                }}
              >
                <Plus size={15} />
                <span>Add New Pastry</span>
              </button>
            </div>
          </div>

          {/* Product Table */}
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Pastry Details</th>
                  <th>Category</th>
                  <th>Unit Price</th>
                  <th>Stock Status</th>
                  <th>Available Stock</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px 16px', color: '#8A92A0' }}>
                      <Package size={32} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.4 }} />
                      <p style={{ fontWeight: 700, fontSize: '14px', color: '#374151', margin: '0 0 6px' }}>No pastries in catalog</p>
                      <p style={{ fontSize: '12px', margin: '0 0 16px', color: '#8A92A0' }}>Your catalog is ready for manual entry. Click below to add your first pastry!</p>
                      <button
                        type="button"
                        className="btn-admin-primary"
                        onClick={() => {
                          setEditingProduct(null);
                          setIsProductModalOpen(true);
                        }}
                      >
                        <Plus size={14} />
                        <span>Add New Pastry</span>
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map(prod => (
                  <tr key={prod.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img
                          src={prod.image || 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=120&q=80'}
                          alt={prod.name}
                          style={{ width: '42px', height: '42px', borderRadius: '10px', objectFit: 'cover', border: '1px solid #EDE4DC' }}
                        />
                        <div>
                          <p style={{ fontWeight: 700, color: '#1F242E', fontSize: '13px' }}>{prod.name}</p>
                          <span style={{ fontSize: '10px', color: '#8A92A0', fontFamily: 'monospace' }}>ID: {prod.id}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ padding: '3px 8px', borderRadius: '6px', background: '#F4EFEB', color: '#555E68', fontWeight: 600, fontSize: '11px' }}>
                        {prod.category}
                      </span>
                    </td>
                    <td style={{ fontWeight: 800, color: '#1F242E', fontSize: '13px' }}>
                      {formatCurrency(prod.price)}
                    </td>
                    <td>
                      {prod.stock === 0 ? (
                        <span className="admin-status-badge status-cancelled">Out of Stock</span>
                      ) : prod.stock <= 5 ? (
                        <span className="admin-status-badge status-preparing">Low Stock</span>
                      ) : (
                        <span className="admin-status-badge status-completed">In Stock</span>
                      )}
                    </td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '13px', color: '#1F242E' }}>
                      {prod.stock} units
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                        <button
                          type="button"
                          className="btn-admin-secondary"
                          style={{ padding: '5px 10px', fontSize: '11px', color: '#BE185D', borderColor: '#FBCFE8', background: '#FDF2F8' }}
                          onClick={() => {
                            setSelectedRecipeProduct(prod);
                            setIsRecipeModalOpen(true);
                          }}
                          title="Manage Recipe Ingredients & Ratios"
                        >
                          <BookOpen size={13} />
                          <span>Recipe</span>
                        </button>
                        <button
                          type="button"
                          className="btn-admin-secondary"
                          style={{ padding: '5px 10px', fontSize: '11px' }}
                          onClick={() => {
                            setEditingProduct(prod);
                            setIsProductModalOpen(true);
                          }}
                          title="Edit Pastry"
                        >
                          <Edit3 size={13} />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          style={{
                            padding: '5px 10px',
                            fontSize: '11px',
                            background: '#FFF1F2',
                            color: '#BE123C',
                            border: '1px solid #FECDD3',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontWeight: 700
                          }}
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete '${prod.name}'?`)) {
                              deleteProduct(prod.id);
                            }
                          }}
                          title="Delete Pastry"
                        >
                          <Trash2 size={13} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: INGREDIENT INVENTORY */}
      {(activeTab === 'ingredient-inventory' || activeTab === 'inventory') && (
        <IngredientInventoryTab />
      )}

      {/* TAB: PRODUCTION MANAGEMENT */}
      {activeTab === 'production' && (
        <ProductionManagementTab onNavigateToRecipes={() => setActiveTab('products')} />
      )}

      {/* TAB: INVENTORY HISTORY & AUDIT LOG */}
      {activeTab === 'inventory-history' && (
        <InventoryHistoryTab />
      )}

      {/* TAB 5: USER & STAFF MANAGEMENT */}
      {activeTab === 'users' && (
        <div>
          {/* Header Controls */}
          <div className="admin-card" style={{ marginBottom: '18px', padding: '16px 20px' }}>
            <div className="admin-filter-bar" style={{ margin: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <div className="admin-search-wrap">
                  <Search size={15} />
                  <input
                    type="text"
                    placeholder="Search name or email..."
                    value={userSearchQuery}
                    onChange={e => setUserSearchQuery(e.target.value)}
                    className="admin-search-input"
                  />
                </div>

                <div className="admin-pills-wrap">
                  {['ALL', ROLES.CUSTOMER, ROLES.CASHIER, ROLES.BAKER, ROLES.ADMIN].map(r => (
                    <button
                      key={r}
                      type="button"
                      className={`admin-pill ${userRoleFilter === r ? 'active' : ''}`}
                      onClick={() => setUserRoleFilter(r)}
                    >
                      {r === 'ALL' ? 'All Roles' : ROLE_LABELS[r] || r}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                className="btn-admin-primary"
                onClick={() => setIsStaffModalOpen(true)}
              >
                <UserPlus size={15} />
                <span>Create Staff Account</span>
              </button>
            </div>
          </div>

          {/* User Table */}
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User Profile</th>
                  <th>Email Address</th>
                  <th>Current Role</th>
                  <th>Auth Provider</th>
                  <th>Registration Date</th>
                  <th style={{ textAlign: 'right' }}>Reassign Role</th>
                </tr>
              </thead>
              <tbody>
                {userListLoading ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '36px 0', color: '#8A92A0' }}>
                      Loading bakery accounts...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '36px 0', color: '#8A92A0' }}>
                      No accounts found matching filter.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(user => {
                    const userRole = user.role || ROLES.CUSTOMER;
                    return (
                      <tr key={user.uid || user.id || user.email}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div className="dashboard-user-avatar" style={{ width: '32px', height: '32px' }}>
                              {(user.fullName || user.email || 'U')[0].toUpperCase()}
                            </div>
                            <div>
                              <p style={{ fontWeight: 700, color: '#1F242E', fontSize: '13px' }}>{user.fullName || 'Registered User'}</p>
                              <span style={{ fontSize: '10px', color: '#8A92A0', fontFamily: 'monospace' }}>{user.uid || user.id}</span>
                            </div>
                          </div>
                        </td>
                        <td style={{ fontFamily: 'monospace', color: '#555E68', fontSize: '12px' }}>
                          {user.email}
                        </td>
                        <td>
                          <span className={`dashboard-role-pill ${
                            userRole === ROLES.ADMIN ? 'role-admin' :
                            userRole === ROLES.CASHIER ? 'role-cashier' :
                            userRole === ROLES.BAKER ? 'role-baker' : 'role-customer'
                          }`}>
                            {ROLE_LABELS[userRole] || userRole}
                          </span>
                        </td>
                        <td style={{ textTransform: 'capitalize', color: '#717A88' }}>
                          {user.provider || 'email'}
                        </td>
                        <td style={{ color: '#717A88' }}>
                          {formatDate(user.createdAt)}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <select
                            value={userRole}
                            onChange={e => handleRoleChange(user.uid || user.id, e.target.value)}
                            className="admin-form-select"
                            style={{ width: 'auto', padding: '5px 10px', fontSize: '11px', fontWeight: 700 }}
                          >
                            <option value={ROLES.CUSTOMER}>Customer</option>
                            <option value={ROLES.CASHIER}>Cashier</option>
                            <option value={ROLES.BAKER}>Baker</option>
                            <option value={ROLES.ADMIN}>Store Owner / Admin</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: SALES REPORTS & ANALYTICS */}
      {activeTab === 'reports' && (
        <div>
          <div className="admin-card" style={{ marginBottom: '20px' }}>
            <div className="admin-card-header" style={{ margin: 0 }}>
              <div>
                <h3 className="admin-card-title">Bakery Sales & Revenue Audits</h3>
                <p className="admin-card-subtitle">Comprehensive breakdown by payment channels and audited totals</p>
              </div>
              <button
                type="button"
                className="btn-admin-primary"
                onClick={handlePrintReport}
              >
                <Printer size={15} />
                <span>Print Audit Report</span>
              </button>
            </div>
          </div>

          {/* Payment Methods Breakdown Grid */}
          <div className="admin-kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="admin-kpi-card kpi-revenue">
              <div className="admin-kpi-top">
                <span className="admin-kpi-label">Cash Register</span>
                <div className="admin-kpi-icon-wrap icon-revenue">
                  <DollarSign size={18} />
                </div>
              </div>
              <div className="admin-kpi-value">{formatCurrency(paymentBreakdown.Cash)}</div>
              <div className="admin-kpi-subtext">Direct counter payments</div>
            </div>

            <div className="admin-kpi-card kpi-orders">
              <div className="admin-kpi-top">
                <span className="admin-kpi-label">GCash / QR</span>
                <div className="admin-kpi-icon-wrap icon-orders">
                  <CreditCard size={18} />
                </div>
              </div>
              <div className="admin-kpi-value">{formatCurrency(paymentBreakdown.GCash)}</div>
              <div className="admin-kpi-subtext">Digital mobile wallets</div>
            </div>

            <div className="admin-kpi-card kpi-users">
              <div className="admin-kpi-top">
                <span className="admin-kpi-label">Card Terminal</span>
                <div className="admin-kpi-icon-wrap icon-users">
                  <CreditCard size={18} />
                </div>
              </div>
              <div className="admin-kpi-value">{formatCurrency(paymentBreakdown.Card)}</div>
              <div className="admin-kpi-subtext">Debit & credit cards</div>
            </div>
          </div>

          {/* Detailed Summary Table */}
          <div className="admin-card">
            <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '16px', fontWeight: 800, color: '#1F242E', marginBottom: '16px' }}>
              Audited Financial Summary
            </h4>
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Financial Metric</th>
                    <th>Recorded Value</th>
                    <th>Auditing Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 700, color: '#1F242E' }}>Gross Sales Revenue</td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '14px', color: '#9D174D' }}>
                      {formatCurrency(totalRevenue)}
                    </td>
                    <td style={{ color: '#717A88' }}>Total gross receipts across all confirmed bakery orders</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700, color: '#1F242E' }}>Total Completed Transactions</td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '14px', color: '#1F242E' }}>
                      {totalOrdersCount} orders
                    </td>
                    <td style={{ color: '#717A88' }}>Combined online orders and counter POS sales</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700, color: '#1F242E' }}>Average Order Value (AOV)</td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '14px', color: '#1F242E' }}>
                      {formatCurrency(aov)}
                    </td>
                    <td style={{ color: '#717A88' }}>Average customer spend per bakery ticket</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700, color: '#1F242E' }}>12% VAT Included Portion</td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#717A88' }}>
                      {formatCurrency(totalRevenue * (0.12 / 1.12))}
                    </td>
                    <td style={{ color: '#717A88' }}>Statutory Value Added Tax portion included in pricing</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: STORE SETTINGS */}
      {activeTab === 'settings' && (
        <div style={{ maxWidth: '800px' }}>
          <div className="admin-card" style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #EDE4DC', paddingBottom: '14px', marginBottom: '18px' }}>
              <Store size={22} style={{ color: '#9D174D' }} />
              <h3 className="admin-card-title">Jen's Pastry Shop Official Details</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <div className="admin-form-group">
                <label className="admin-form-label">Bakery Brand Name</label>
                <input
                  type="text"
                  readOnly
                  value="Jen's Pastry Shop (BAKEOLOGY)"
                  className="admin-form-input"
                  style={{ background: '#FAF5F2', fontWeight: 700 }}
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Currency Standard</label>
                <input
                  type="text"
                  readOnly
                  value="PHP (₱ Philippine Peso)"
                  className="admin-form-input"
                  style={{ background: '#FAF5F2', fontWeight: 700 }}
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Bakery Address</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 12px', background: '#FAF5F2', border: '1px solid #D8CFCA', borderRadius: '8px', fontSize: '12px' }}>
                  <MapPin size={15} style={{ color: '#9D174D', flexShrink: 0 }} />
                  <span>123 Baker Street, Sweet City, Metro Manila</span>
                </div>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Customer Hotline</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 12px', background: '#FAF5F2', border: '1px solid #D8CFCA', borderRadius: '8px', fontSize: '12px' }}>
                  <Phone size={15} style={{ color: '#059669', flexShrink: 0 }} />
                  <span>+63 (917) 555-BAKE (2253)</span>
                </div>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Daily Operating Hours</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 12px', background: '#FAF5F2', border: '1px solid #D8CFCA', borderRadius: '8px', fontSize: '12px' }}>
                  <Clock size={15} style={{ color: '#D97706', flexShrink: 0 }} />
                  <span>7:00 AM – 9:00 PM (Monday - Sunday)</span>
                </div>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Tax Configuration</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 12px', background: '#FAF5F2', border: '1px solid #D8CFCA', borderRadius: '8px', fontSize: '12px' }}>
                  <Percent size={15} style={{ color: '#7E22CE', flexShrink: 0 }} />
                  <span>12% Philippine VAT (Prices Inclusive)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Clear Store Data Card */}
          <div className="admin-card" style={{ borderColor: '#FECDD3', background: '#FFF9FA' }}>
            <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '15px', fontWeight: 800, color: '#BE123C', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <RefreshCw size={17} style={{ color: '#E11D48' }} />
              Clear All Bakery Products & Sales
            </h4>
            <p style={{ fontSize: '12px', color: '#717A88', marginBottom: '14px' }}>
              Clears all local products, inventory levels, and order transactions to start with a fresh clean slate.
            </p>
            <button
              type="button"
              style={{
                background: '#FFF1F2',
                color: '#BE123C',
                border: '1px solid #FECDD3',
                padding: '9px 16px',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
              onClick={() => {
                if (window.confirm("Are you sure you want to clear all product items and sales history? This will reset your shop to a clean slate.")) {
                  resetToDefaultData();
                  setOrders([]);
                  alert("Bakery catalog and sales history cleared successfully!");
                }
              }}
            >
              Clear Products & Orders
            </button>
          </div>
        </div>
      )}

      {/* CREATE STAFF MODAL */}
      {isStaffModalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setIsStaffModalOpen(false)}>
          <div 
            className="admin-modal-card"
            onClick={e => e.stopPropagation()}
            role="dialog"
          >
            <div className="admin-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={20} style={{ color: '#7E22CE' }} />
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#1F242E' }}>Create Staff Account</h3>
              </div>
              <button 
                type="button" 
                className="close-btn"
                onClick={() => setIsStaffModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="admin-modal-body">
              {staffErrorMsg && (
                <div style={{ padding: '10px 14px', background: '#FFF1F2', color: '#BE123C', fontSize: '12px', borderRadius: '8px', border: '1px solid #FECDD3', marginBottom: '12px' }}>
                  {staffErrorMsg}
                </div>
              )}

              {staffSuccessMsg && (
                <div style={{ padding: '10px 14px', background: '#ECFDF5', color: '#047857', fontSize: '12px', borderRadius: '8px', border: '1px solid #A7F3D0', marginBottom: '12px' }}>
                  {staffSuccessMsg}
                </div>
              )}

              <div className="admin-form-group">
                <label className="admin-form-label">Staff Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maria Santos"
                  value={staffForm.fullName}
                  onChange={e => setStaffForm(prev => ({ ...prev, fullName: e.target.value }))}
                  className="admin-form-input"
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Staff Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. cashier2@jenspastry.com"
                  value={staffForm.email}
                  onChange={e => setStaffForm(prev => ({ ...prev, email: e.target.value }))}
                  className="admin-form-input"
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Initial Password</label>
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={staffForm.password}
                  onChange={e => setStaffForm(prev => ({ ...prev, password: e.target.value }))}
                  className="admin-form-input"
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Designated Staff Role</label>
                <select
                  value={staffForm.role}
                  onChange={e => setStaffForm(prev => ({ ...prev, role: e.target.value }))}
                  className="admin-form-select"
                >
                  <option value={ROLES.CASHIER}>Cashier (POS & Orders)</option>
                  <option value={ROLES.BAKER}>Baker (Kitchen & Production Queue)</option>
                  <option value={ROLES.ADMIN}>Store Owner / Admin (Full Access)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '18px' }}>
                <button
                  type="button"
                  className="btn-admin-secondary"
                  onClick={() => setIsStaffModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={staffSubmitting}
                  className="btn-admin-primary"
                >
                  {staffSubmitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRODUCT FORM MODAL (Add / Edit) */}
      {isProductModalOpen && (
        <ProductFormModal
          key={editingProduct ? `edit-${editingProduct.id}` : 'new-product'}
          isOpen={isProductModalOpen}
          onClose={() => {
            setIsProductModalOpen(false);
            setEditingProduct(null);
          }}
          onSubmit={(formData) => {
            if (editingProduct) {
              updateProduct(editingProduct.id, formData);
            } else {
              addProduct(formData);
            }
            setIsProductModalOpen(false);
            setEditingProduct(null);
          }}
          initialProduct={editingProduct}
        />
      )}

      {/* QUICK RESTOCK MODAL */}
      {isRestockModalOpen && (
        <QuickRestockModal
          isOpen={isRestockModalOpen}
          onClose={() => {
            setIsRestockModalOpen(false);
            setRestockingProduct(null);
          }}
          product={restockingProduct}
          onConfirm={(productId, newStock, addedBatchQty) => {
            try {
              const updated = updateStock(productId, newStock);
              const batchAdded = addedBatchQty || (newStock - (restockingProduct?.stock || 0));
              showToast(`✓ Restocked "${updated?.name || restockingProduct?.name}"! Added +${batchAdded} units (Total: ${newStock} units).`, 'success');
            } catch (err) {
              showToast(`Restock failed: ${err.message || err}`, 'error');
            }
            setIsRestockModalOpen(false);
            setRestockingProduct(null);
          }}
        />
      )}

      {/* RECEIPT MODAL */}
      {isReceiptModalOpen && (
        <ReceiptModal
          isOpen={isReceiptModalOpen}
          onClose={() => {
            setIsReceiptModalOpen(false);
            setActiveReceiptSale(null);
          }}
          sale={activeReceiptSale}
        />
      )}

      {/* RECIPE MANAGEMENT MODAL */}
      {isRecipeModalOpen && (
        <RecipeModal
          isOpen={isRecipeModalOpen}
          onClose={() => {
            setIsRecipeModalOpen(false);
            setSelectedRecipeProduct(null);
          }}
          product={selectedRecipeProduct}
        />
      )}

      {/* NOTIFICATION TOAST */}
      {toast.message && (
        <NotificationToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: '', type: 'success' })}
        />
      )}
    </DashboardLayout>
  );
}
