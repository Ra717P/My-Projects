export type CheckoutItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
};

export type CheckoutBody = {
  amount: number; // rupiah (integer)
  customer?: { name?: string; email?: string };
  items?: CheckoutItem[];
};
