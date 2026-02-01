export const formatCurrency = (cents: number) => {
  const value = Number.isFinite(cents) ? cents / 100 : 0;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value);
};

export const formatPeriod = (year: number, month: number) => {
  const label = `${String(month).padStart(2, "0")}/${year}`;
  return label;
};

export const formatMonthLabel = (year: number, month: number) => {
  const date = new Date(year, month - 1, 1);
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric"
  }).format(date);
};
