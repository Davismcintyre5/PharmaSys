import React, {
  createContext,
  useContext,
  useMemo,
  useState,
} from 'react';
import type { CartItem, Patient, Prescription, SalePaymentMethod } from '@/types';

interface CartContextValue {
  items: CartItem[];
  patient: Patient | null;
  prescription: Prescription | null;
  customerId: string | null;
  customerName: string | null;
  discount: number;
  paymentMethod: SalePaymentMethod;
  note: string;

  addItem: (item: CartItem) => void;
  updateQty: (drugId: string, batchId: string, qty: number) => void;
  updatePrice: (drugId: string, batchId: string, price: number) => void;
  removeItem: (drugId: string, batchId: string) => void;
  clear: () => void;

  setPatient: (p: Patient | null) => void;
  setPrescription: (p: Prescription | null) => void;
  setCustomer: (id: string | null, name: string | null) => void;
  setDiscount: (n: number) => void;
  setPaymentMethod: (m: SalePaymentMethod) => void;
  setNote: (s: string) => void;

  subtotal: number;
  taxTotal: number;
  discountAmount: number;
  grandTotal: number;
  itemCount: number;
  isEmpty: boolean;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState<string | null>(null);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<SalePaymentMethod>('cash');
  const [note, setNote] = useState('');

  function addItem(item: CartItem) {
    setItems((prev) => {
      const idx = prev.findIndex(
        (i) => i.drugId === item.drugId && i.batchId === item.batchId
      );
      if (idx === -1) return [...prev, item];
      const next = [...prev];
      next[idx] = {
        ...next[idx],
        qty: next[idx].qty + item.qty,
        lineTotal: (next[idx].qty + item.qty) * next[idx].unitPrice,
      };
      return next;
    });
  }

  function updateQty(drugId: string, batchId: string, qty: number) {
    setItems((prev) =>
      prev.map((i) => {
        if (i.drugId !== drugId || i.batchId !== batchId) return i;
        const capped = Math.max(1, Math.min(qty, i.availableQty || 999));
        return { ...i, qty: capped, lineTotal: capped * i.unitPrice };
      })
    );
  }

  function updatePrice(drugId: string, batchId: string, price: number) {
    setItems((prev) =>
      prev.map((i) => {
        if (i.drugId !== drugId || i.batchId !== batchId) return i;
        const p = Math.max(0, price);
        return { ...i, unitPrice: p, lineTotal: i.qty * p };
      })
    );
  }

  function removeItem(drugId: string, batchId: string) {
    setItems((prev) =>
      prev.filter((i) => !(i.drugId === drugId && i.batchId === batchId))
    );
  }

  function clear() {
    setItems([]);
    setPatient(null);
    setPrescription(null);
    setCustomerId(null);
    setCustomerName(null);
    setDiscount(0);
    setPaymentMethod('cash');
    setNote('');
  }

  function setCustomer(id: string | null, name: string | null) {
    setCustomerId(id);
    setCustomerName(name);
  }

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.unitPrice * i.qty, 0),
    [items]
  );

  const taxTotal = useMemo(
    () =>
      items.reduce(
        (sum, i) => sum + (i.unitPrice * i.qty * (i.taxRate || 0)) / 100,
        0
      ),
    [items]
  );

  const discountAmount = useMemo(
    () => Math.max(0, Math.min(discount, subtotal + taxTotal)),
    [discount, subtotal, taxTotal]
  );

  const grandTotal = subtotal + taxTotal - discountAmount;

  const itemCount = useMemo(
    () => items.reduce((sum, i) => sum + i.qty, 0),
    [items]
  );

  const isEmpty = items.length === 0;

  const value: CartContextValue = {
    items,
    patient,
    prescription,
    customerId,
    customerName,
    discount,
    paymentMethod,
    note,
    addItem,
    updateQty,
    updatePrice,
    removeItem,
    clear,
    setPatient,
    setPrescription,
    setCustomer,
    setDiscount,
    setPaymentMethod,
    setNote,
    subtotal,
    taxTotal,
    discountAmount,
    grandTotal,
    itemCount,
    isEmpty,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}