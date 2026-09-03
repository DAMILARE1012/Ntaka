import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useState } from 'react';

export const useAppDispatch = () => useDispatch();
export const useAppSelector = useSelector;

/** Debounce fast-changing values (search boxes, price sliders) before they hit the API. */
export function useDebounced(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
