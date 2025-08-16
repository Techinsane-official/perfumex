"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, 
  ShoppingCart, 
  CreditCard, 
  Cash, 
  Receipt, 
  X,
  Plus,
  Minus,
  Trash2,
  Barcode,
  User,
  Settings
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  brand: string;
  ean: string;
  retailPrice: number;
  stockQuantity: number;
  barcode?: string;
}

interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface POSSession {
  id: string;
  sessionId: string;
  status: string;
  startTime: string;
  totalAmount: number;
  totalItems: number;
}

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

interface POSClientProps {
  session: {
    user?: {
      username?: string;
    };
  };
}

export default function POSClient({ session }: POSClientProps) {
  const router = useRouter();
  const [activeSession, setActiveSession] = useState<POSSession | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "BANK_TRANSFER" | "MOBILE_PAYMENT" | "GIFT_CARD" | "OTHER">("CASH");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCustomerSelect, setShowCustomerSelect] = useState(false);

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  const tax = subtotal * 0.21; // 21% VAT
  const total = subtotal + tax;

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
    startNewSession();
  }, []);

  useEffect(() => {
    // Filter products based on search query
    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.ean.includes(searchQuery)
    );
    setFilteredProducts(filtered);
  }, [searchQuery, products]);

  useEffect(() => {
    // Filter customers based on search query
    const filtered = customers.filter(customer =>
      customer.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
      customer.email?.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
      customer.phone?.includes(customerSearchQuery)
    );
    setFilteredCustomers(filtered);
  }, [customerSearchQuery, customers]);

  const fetchProducts = async () => {
    try {
      // Fetch a large page of active products for POS
      const response = await fetch('/api/products?limit=2000&page=1');
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/admin/customers');
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.customers || []);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  const startNewSession = async () => {
    try {
      const response = await fetch('/api/admin/pos/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location: 'Main Terminal' }),
      });
      if (response.ok) {
        const data = await response.json();
        setActiveSession(data.session);
      }
    } catch (error) {
      console.error("Error starting POS session:", error);
    }
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product.id === product.id);
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * item.unitPrice }
          : item
      ));
    } else {
      setCart([...cart, {
        product,
        quantity: 1,
        unitPrice: product.retailPrice,
        totalPrice: product.retailPrice,
      }]);
    }
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(cart.filter(item => item.product.id !== productId));
    } else {
      setCart(cart.map(item =>
        item.product.id === productId
          ? { ...item, quantity, totalPrice: quantity * item.unitPrice }
          : item
      ));
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const buildReceiptHtml = (cartSnapshot: CartItem[], totals: { subtotal: number; tax: number; total: number }, meta: { sessionId?: string; operator?: string; customer?: string | null }) => {
    const itemsRows = cartSnapshot.map(item => `
      <tr>
        <td style="padding:4px 0">${item.product.brand} ${item.product.name}</td>
        <td style="padding:4px 0; text-align:center">${item.quantity}×</td>
        <td style="padding:4px 0; text-align:right">€${item.unitPrice.toFixed(2)}</td>
      </tr>
    `).join("");

    return `
      <html>
        <head>
          <meta charSet="utf-8" />
          <title>Receipt</title>
          <style>
            @page { size: 80mm auto; margin: 5mm; }
            body { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
            .center { text-align: center; }
            .bold { font-weight: 700; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            hr { border: none; border-top: 1px dashed #000; margin: 8px 0; }
          </style>
        </head>
        <body>
          <div class="center bold">Project X POS</div>
          <div class="center">Session: ${meta.sessionId || '-'} | Operator: ${meta.operator || '-'}</div>
          ${meta.customer ? `<div class="center">Customer: ${meta.customer}</div>` : ''}
          <hr />
          <table>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>
          <hr />
          <table>
            <tr><td class="bold">Subtotal</td><td style="text-align:right">€${totals.subtotal.toFixed(2)}</td></tr>
            <tr><td class="bold">VAT (21%)</td><td style="text-align:right">€${totals.tax.toFixed(2)}</td></tr>
            <tr><td class="bold">Total</td><td style="text-align:right">€${totals.total.toFixed(2)}</td></tr>
          </table>
          <hr />
          <div class="center">Thank you!</div>
          <script>window.onload = () => { window.print(); setTimeout(() => window.close(), 300); };</script>
        </body>
      </html>
    `;
  };

  const triggerPrint = (cartSnapshot: CartItem[]) => {
    const receipt = buildReceiptHtml(
      cartSnapshot,
      { subtotal, tax, total },
      { sessionId: activeSession?.sessionId, operator: session.user?.username, customer: selectedCustomer?.name || null }
    );
    const printWindow = window.open("", "PRINT", "height=600,width=400");
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(receipt);
      printWindow.document.close();
    }
  };

  const processTransaction = async () => {
    if (!activeSession || cart.length === 0) return;

    setIsProcessing(true);
    try {
      // Snapshot cart for printing before clearing
      const cartSnapshot = [...cart];

      const response = await fetch('/api/admin/pos/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: activeSession.id,
          customerId: selectedCustomer?.id,
          subtotal,
          tax,
          discount: 0,
          total,
          paymentMethod,
          paymentStatus: 'PAID',
          items: cart.map(item => ({
            productId: item.product.id,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            discount: 0,
          })),
        }),
      });

      if (response.ok) {
        // Auto print receipt (relies on OS printer default; set thermal printer as default or choose on dialog)
        triggerPrint(cartSnapshot);

        // Clear cart and show success
        setCart([]);
        setSelectedCustomer(null);
        setPaymentMethod("CASH");
        alert("Transaction completed successfully!");
      }
    } catch (error) {
      console.error("Error processing transaction:", error);
      alert("Error processing transaction");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBarcodeScan = (barcode: string) => {
    const product = products.find(p => p.barcode === barcode || p.ean === barcode);
    if (product) {
      addToCart(product);
    }
  };

  return (
    <div className="h-screen bg-gray-100 flex">
      {/* Left Panel - Product Search and Selection */}
      <div className="w-2/3 p-6">
        <div className="bg-white rounded-lg shadow-sm h-full">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Point of Sale</h1>
            <p className="text-gray-600">Session: {activeSession?.sessionId}</p>
          </div>

          {/* Search Bar */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search products by name, brand, or EAN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
            </div>
          </div>

          {/* Product Grid */}
          <div className="p-4 overflow-y-auto h-96">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => addToCart(product)}
                >
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {product.brand}
                  </div>
                  <div className="text-xs text-gray-600 truncate mb-2">
                    {product.name}
                  </div>
                  <div className="text-lg font-bold text-green-600">
                    €{product.retailPrice.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500">
                    Stock: {product.stockQuantity}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Cart and Payment */}
      <div className="w-1/3 p-6">
        <div className="bg-white rounded-lg shadow-sm h-full flex flex-col">
          {/* Cart Header */}
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <ShoppingCart className="w-5 h-5 mr-2" />
              Cart ({cart.length} items)
            </h2>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4">
            {cart.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No items in cart</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.product.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{item.product.brand}</div>
                      <div className="text-xs text-gray-600">{item.product.name}</div>
                      <div className="text-sm font-bold text-green-600">
                        €{item.unitPrice.toFixed(2)}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center hover:bg-red-200"
                      >
                        <Trash2 className="w-3 h-3 text-red-600" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Customer Selection */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => setShowCustomerSelect(!showCustomerSelect)}
              className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center">
                <User className="w-4 h-4 mr-2" />
                <span className="text-sm text-gray-900">
                  {selectedCustomer ? selectedCustomer.name : "Select Customer (Optional)"}
                </span>
              </div>
            </button>
            
            {/* Customer Selection Modal */}
            {showCustomerSelect && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-96 max-h-96 overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Select Customer</h3>
                    <button
                      onClick={() => setShowCustomerSelect(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  {/* Customer Search */}
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search customers..."
                        value={customerSearchQuery}
                        onChange={(e) => setCustomerSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      />
                    </div>
                  </div>
                  
                  {/* Customer List */}
                  <div className="max-h-64 overflow-y-auto">
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          setSelectedCustomer(null);
                          setShowCustomerSelect(false);
                        }}
                        className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-900"
                      >
                        <div className="font-medium">No Customer</div>
                        <div className="text-sm text-gray-500">Anonymous sale</div>
                      </button>
                      
                      {filteredCustomers.map((customer) => (
                        <button
                          key={customer.id}
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setShowCustomerSelect(false);
                          }}
                          className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-900"
                        >
                          <div className="font-medium">{customer.name}</div>
                          {customer.email && (
                            <div className="text-sm text-gray-500">{customer.email}</div>
                          )}
                          {customer.phone && (
                            <div className="text-sm text-gray-500">{customer.phone}</div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Payment Method */}
          <div className="p-4 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as any)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            >
              <option value="CASH">Cash</option>
              <option value="CARD">Card</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="MOBILE_PAYMENT">Mobile Payment</option>
              <option value="GIFT_CARD">Gift Card</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          {/* Totals */}
          <div className="p-4 border-t border-gray-200">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-900">Subtotal:</span>
                <span className="text-gray-900">€{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-900">Tax (21%):</span>
                <span className="text-gray-900">€{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span className="text-gray-900">Total:</span>
                <span className="text-gray-900">€{total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-4 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setCart([])}
                className="px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Clear Cart
              </button>
              <button
                onClick={processTransaction}
                disabled={cart.length === 0 || isProcessing}
                className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? "Processing..." : "Complete Sale"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 