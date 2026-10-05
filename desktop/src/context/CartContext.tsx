import { createContext, useContext, useMemo, useState } from 'react';
import type { CartItem, Patient, Prescription, SalePaymentMethod } from '@/types/app';

interface CartContextValue {
  items: CartItem[];
  patient: Patient | null;
  prescription: Prescription | null;
  discount: number;
  paymentMethod: SalePaymentMethod;
  note: string;

  addItem: (item: CartItem) => void;
  updateQty: (drugId: string, batchId: string, qty: number) => void;
  removeItem: (drugId: string, batchId: string) => void;
  clear: () => void;

  setPatient: (p: Patient | null) => void;
  setPrescription: (p: Prescription | null) => void;
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
      next[idx] = { ...next[idx], qty: next[idx].qty + item.qty };
      return next;
    });
  }

  function updateQty(drugId: string, batchId: string, qty: number) {
    setItems((prev) =>
      prev.map((i) =>
        i.drugId === drugId && i.batchId === batchId ? { ...i, qty } : i
      )
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
    setDiscount(0);
    setPaymentMethod('cash');
    setNote('');
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
  const discountAmount = discount;
  const grandTotal = subtotal + taxTotal - discountAmount;
  const itemCount = items.reduce((sum, i) => sum + i.qty, 0);
  const isEmpty = items.length === 0;

  const value: CartContextValue = {
    items,
    patient,
    prescription,
    discount,
    paymentMethod,
    note,
    addItem,
    updateQty,
    removeItem,
    clear,
    setPatient,
    setPrescription,
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