// ==========================================
// BAKEOLOGY - Customer Orders Page
// Fetches and displays real customer orders from Cloud Firestore
// ==========================================

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth.js';
import { db } from '../firebase.js';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { formatCurrency, formatDateTime } from '../utils/formatters.js';
import { 
  ShoppingBag, 
  Clock, 
  CheckCircle, 
  Package, 
  Truck, 
  XCircle, 
  ArrowLeft,
  Croissant,
  RefreshCw,
  Receipt
} from 'lucide-react';

export default function MyOrders() {
  const { currentUser, isLiveFirebase } = useAuth();
  const [orders, setOrders] = useState(() => {
    if (!currentUser) return [];
    try {
      const key = `bakeology_customer_orders_${currentUser.uid}`;
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(() => Boolean(currentUser && isLiveFirebase && db));

  useEffect(() => {
    let isCancelled = false;
    if (!currentUser || !isLiveFirebase || !db) {
      return;
    }

    const loadOrders = async () => {
      try {
        const ordersRef = collection(db, 'orders');
        let q;
        try {
          q = query(
            ordersRef,
            where('userId', '==', currentUser.uid),
            orderBy('date', 'desc')
          );
        } catch {
          // Fallback if composite index is pending
          q = query(ordersRef, where('userId', '==', currentUser.uid));
        }

        const snapshot = await getDocs(q);
        if (!isCancelled) {
          const fetched = snapshot.docs.map(doc => ({
            firestoreId: doc.id,
            ...doc.data()
          }));
          fetched.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
          setOrders(fetched);
        }
      } catch (err) {
        console.warn("Could not query Firestore orders:", err);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    loadOrders();

    return () => {
      isCancelled = true;
    };
  }, [currentUser, isLiveFirebase]);

  const handleRefresh = async () => {
    if (!currentUser) return;
    if (isLiveFirebase && db) {
      setLoading(true);
      try {
        const ordersRef = collection(db, 'orders');
        let q;
        try {
          q = query(ordersRef, where('userId', '==', currentUser.uid), orderBy('date', 'desc'));
        } catch {
          q = query(ordersRef, where('userId', '==', currentUser.uid));
        }
        const snapshot = await getDocs(q);
        const fetched = snapshot.docs.map(doc => ({ firestoreId: doc.id, ...doc.data() }));
        fetched.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
        setOrders(fetched);
      } catch (err) {
        console.warn("Could not query Firestore orders:", err);
      } finally {
        setLoading(false);
      }
    } else {
      try {
        const key = `bakeology_customer_orders_${currentUser.uid}`;
        const saved = localStorage.getItem(key);
        setOrders(saved ? JSON.parse(saved) : []);
      } catch {
        setOrders([]);
      }
    }
  };

  // Helper to render status badge with appropriate styling
  const getStatusBadge = (status = 'Confirmed') => {
    const norm = status.toLowerCase();
    switch (norm) {
      case 'completed':
        return (
          <span className="badge badge-success flex items-center gap-1 text-2xs">
            <CheckCircle size={11} /> Completed
          </span>
        );
      case 'ready for pickup':
        return (
          <span className="badge badge-warning flex items-center gap-1 text-2xs">
            <Package size={11} /> Ready for Pickup
          </span>
        );
      case 'out for delivery':
        return (
          <span className="badge badge-warning flex items-center gap-1 text-2xs">
            <Truck size={11} /> Out for Delivery
          </span>
        );
      case 'preparing':
        return (
          <span className="badge badge-warning flex items-center gap-1 text-2xs">
            <Clock size={11} /> Preparing
          </span>
        );
      case 'cancelled':
        return (
          <span className="badge badge-danger flex items-center gap-1 text-2xs">
            <XCircle size={11} /> Cancelled
          </span>
        );
      case 'pending':
        return (
          <span className="badge badge-warning flex items-center gap-1 text-2xs">
            <Clock size={11} /> Pending
          </span>
        );
      case 'confirmed':
      default:
        return (
          <span className="badge badge-success flex items-center gap-1 text-2xs">
            <CheckCircle size={11} /> Confirmed
          </span>
        );
    }
  };

  return (
    <div className="orders-page-container space-y-4">
      {/* Back Link */}
      <div className="flex justify-between items-center mb-1">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
          <ArrowLeft size={16} /> Back to Store
        </Link>
        <button
          type="button"
          onClick={handleRefresh}
          className="text-xs text-primary font-semibold flex items-center gap-1 hover:underline"
          title="Refresh orders list"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Page Header */}
      <div className="mobile-card flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="auth-icon-badge">
            <ShoppingBag size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold font-serif text-primary">My Orders</h2>
            <p className="text-2xs text-muted">Track your pastry orders and order history</p>
          </div>
        </div>
        <span className="badge badge-primary text-2xs font-bold px-2 py-0.5">
          {orders.length} {orders.length === 1 ? 'Order' : 'Orders'}
        </span>
      </div>

      {/* Orders List / Empty State */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-8 mobile-card">
          <div className="w-8 h-8 border-3 border-primary-light border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-3 text-xs text-muted font-medium">Loading your orders...</p>
        </div>
      ) : orders.length === 0 ? (
        /* Clean Empty State - No fake orders */
        <div className="mobile-card text-center py-10 px-4 space-y-3">
          <div className="w-14 h-14 bg-pink-100 text-primary rounded-full flex items-center justify-center mx-auto mb-1">
            <Receipt size={28} />
          </div>
          <h3 className="font-bold text-sm text-primary">No Orders Placed Yet</h3>
          <p className="text-xs text-muted max-w-xs mx-auto">
            You haven't placed any pastry orders yet. Fresh bread, cakes, and pastries are waiting for you!
          </p>
          <Link
            to="/?tab=products"
            className="btn-primary inline-flex items-center gap-2 py-2 px-4 text-xs font-bold shadow-md mt-2"
          >
            <Croissant size={14} /> Browse Pastries & Order
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order, idx) => (
            <div key={order.firestoreId || order.id || idx} className="mobile-card order-card space-y-2.5">
              {/* Order Card Header */}
              <div className="flex justify-between items-start border-b border-border-light pb-2">
                <div>
                  <span className="text-2xs font-bold text-muted uppercase tracking-wider">
                    {order.id || `ORDER-#${idx + 1}`}
                  </span>
                  <div className="text-xs font-semibold text-primary">
                    {order.date ? formatDateTime(order.date) : 'Recently Placed'}
                  </div>
                </div>
                <div>
                  {getStatusBadge(order.orderStatus || 'Confirmed')}
                </div>
              </div>

              {/* Order Items */}
              <div className="space-y-1.5 py-1">
                {order.items?.map((item, itemIdx) => (
                  <div key={itemIdx} className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-pink-50 text-primary flex items-center justify-center text-2xs font-bold">
                        {item.quantity}x
                      </span>
                      <span className="font-medium text-primary">{item.name}</span>
                    </div>
                    <span className="text-muted font-medium">
                      {formatCurrency(item.lineTotal || (item.price * item.quantity))}
                    </span>
                  </div>
                ))}
              </div>

              {/* Order Footer */}
              <div className="border-t border-border-light pt-2 flex justify-between items-center">
                <span className="text-xs text-muted">
                  {order.discount > 0 && (
                    <span className="text-2xs text-success mr-2">
                      Discount: -{formatCurrency(order.discount)}
                    </span>
                  )}
                  Total Amount
                </span>
                <span className="text-sm font-bold text-primary font-mono">
                  {formatCurrency(order.total)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
