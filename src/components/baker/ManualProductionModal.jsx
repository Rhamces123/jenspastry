import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  ChefHat, 
  Wheat, 
  AlertTriangle, 
  CheckCircle2, 
  Flame, 
  Layers,
  ArrowRight
} from 'lucide-react';
import { useBakeryWorkflow } from '../../hooks/useBakeryWorkflow.js';

export default function ManualProductionModal({ isOpen, onClose, products = [], onProductionStarted }) {
  const { 
    getRecipeForProduct, 
    checkIngredientsSufficiency, 
    calculateRequiredIngredients,
    completeProduction,
    createProductionRequest,
    startProduction
  } = useBakeryWorkflow();

  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const selectedProduct = useMemo(() => {
    return products.find(p => p.id === selectedProductId) || products[0] || null;
  }, [products, selectedProductId]);

  const defaultBatch = selectedProduct?.productionBatchSize || 30;
  const [productionQty, setProductionQty] = useState(defaultBatch);

  useEffect(() => {
    if (selectedProduct?.productionBatchSize) {
      setProductionQty(selectedProduct.productionBatchSize);
    }
  }, [selectedProduct]);
  const [bakerNotes, setBakerNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch recipe for chosen product
  const recipe = useMemo(() => {
    if (!selectedProduct) return null;
    return getRecipeForProduct(selectedProduct);
  }, [selectedProduct, getRecipeForProduct]);

  // Check ingredient sufficiency
  const sufficiency = useMemo(() => {
    if (!recipe) return { sufficient: true, shortages: [], breakdown: [] };
    return checkIngredientsSufficiency(recipe, Number(productionQty) || 0);
  }, [recipe, productionQty, checkIngredientsSufficiency]);

  if (!isOpen) return null;

  const handleStartBatch = async () => {
    if (!selectedProduct) return;
    const qty = Number(productionQty);
    if (isNaN(qty) || qty <= 0) {
      setErrorMessage("Please enter a valid production quantity.");
      return;
    }

    if (!sufficiency.sufficient) {
      setErrorMessage("Cannot start production: insufficient ingredients in pantry.");
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      // 1. Create a request or directly start
      const req = createProductionRequest({
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        requestedQuantity: qty,
        priority: 'Normal',
        currentStock: selectedProduct.stock || 0,
        minimumStock: selectedProduct.minimumStock || 20,
        triggeredBy: 'Baker Manual Dispatch',
        notes: bakerNotes || 'Manual production batch initiated by Baker'
      });

      // 2. Mark as preparing
      startProduction(req.id, 'Baker Staff');

      if (onProductionStarted) {
        onProductionStarted(req, qty);
      }
      onClose();
    } catch (err) {
      setErrorMessage(err.message || "Failed to start production.");
    } finally {
      setLoading(false);
    }
  };

  const handleDirectComplete = async () => {
    if (!selectedProduct) return;
    const qty = Number(productionQty);
    if (isNaN(qty) || qty <= 0) {
      setErrorMessage("Please enter a valid production quantity.");
      return;
    }

    if (!sufficiency.sufficient) {
      setErrorMessage("Cannot complete production: insufficient ingredients in pantry.");
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const batch = completeProduction({
        productName: selectedProduct.name,
        productId: selectedProduct.id,
        quantity: qty,
        bakerName: 'Baker Staff'
      });

      if (onProductionStarted) {
        onProductionStarted(null, qty, batch);
      }
      onClose();
    } catch (err) {
      setErrorMessage(err.message || "Failed to complete production.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#D81B60] to-[#AD1457] p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChefHat className="w-6 h-6" />
            <div>
              <h3 className="font-bold text-lg leading-tight">Manual Pastry Production</h3>
              <p className="text-xs text-pink-100">Bake fresh batches without an automated low-stock request</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Product Selector */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Select Pastry to Produce
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => {
                setSelectedProductId(e.target.value);
                const p = products.find(prod => prod.id === e.target.value);
                if (p) setProductionQty(p.productionBatchSize || 30);
              }}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#D81B60]/20 focus:border-[#D81B60] outline-none"
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.stock || 0} left in cashier stock)
                </option>
              ))}
            </select>
          </div>

          {/* Quantity Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Production Quantity (pcs)
              </label>
              <div className="flex items-center gap-1.5">
                {[10, 20, 30, 50].map(q => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setProductionQty(q)}
                    className={`px-2 py-0.5 rounded text-xs font-bold border transition-colors ${
                      productionQty === q 
                        ? 'bg-[#D81B60] text-white border-[#D81B60]' 
                        : 'border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
            <input 
              type="number"
              min="1"
              value={productionQty}
              onChange={(e) => setProductionQty(Math.max(1, Number(e.target.value) || 1))}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-mono font-bold focus:ring-2 focus:ring-[#D81B60]/20 focus:border-[#D81B60] outline-none"
            />
          </div>

          {/* Recipe Check Breakdown */}
          {recipe ? (
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-gray-700 flex items-center gap-1.5">
                  <Wheat className="w-4 h-4 text-amber-600" />
                  Recipe Requirements ({recipe.baseQuantity} base pcs)
                </span>
                <span className={`font-semibold px-2 py-0.5 rounded-full text-[11px] ${
                  sufficiency.sufficient ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {sufficiency.sufficient ? '✓ All Ingredients Available' : '⚠ Missing Ingredients'}
                </span>
              </div>

              <div className="space-y-1.5 pt-1">
                {sufficiency.breakdown.map((item) => (
                  <div key={item.ingredientId} className="flex items-center justify-between text-xs py-1 border-b border-gray-100/75 last:border-0">
                    <span className="text-gray-700 font-medium">{item.ingredientName}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-gray-600">
                        Req: <strong>{item.required} {item.unit}</strong>
                      </span>
                      <span className={`font-mono text-xs ${item.isSufficient ? 'text-gray-400' : 'text-rose-600 font-bold'}`}>
                        (Avail: {item.available} {item.unit})
                      </span>
                      {item.isSufficient ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded font-bold">
                          -{item.shortage} {item.unit}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {!sufficiency.sufficient && (
                <div className="mt-2 text-[11px] text-rose-700 bg-rose-100/50 p-2 rounded-lg font-medium leading-relaxed">
                  <strong>Shortages: </strong>
                  {sufficiency.shortages.map(s => `${s.ingredientName}: needs ${s.required} ${s.unit}, have ${s.available} ${s.unit}`).join('; ')}
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>No recipe found for this pastry. Ingredients will not be tracked or deducted.</span>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Production Notes (Optional)
            </label>
            <input 
              type="text"
              placeholder="e.g. Extra morning batch, catering order..."
              value={bakerNotes}
              onChange={(e) => setBakerNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#D81B60]/20 focus:border-[#D81B60] outline-none"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={loading || !sufficiency.sufficient}
            onClick={handleStartBatch}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Send to Oven (Queue)</span>
          </button>

          <button
            type="button"
            disabled={loading || !sufficiency.sufficient}
            onClick={handleDirectComplete}
            className="px-4 py-2 bg-[#D81B60] hover:bg-[#C2185B] disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <ChefHat className="w-3.5 h-3.5" />
            <span>Bake & Complete (PR Output)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
