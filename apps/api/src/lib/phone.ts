export const normalizePhone = (value?: string | null) => {
  if (!value) {
    return null;
  }
  const digits = value.replace(/\D+/g, "");
  return digits.length ? digits : null;
};

