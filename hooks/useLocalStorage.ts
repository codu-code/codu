import { useSyncExternalStore, useCallback, useEffect, useRef } from "react";

const useLocalStorage = <T>(
  key: string,
  initialValue: T,
  // eslint-disable-next-line no-unused-vars
): [T, (value: T) => void] => {
  // Use ref to track the key for the subscribe function
  const keyRef = useRef(key);

  // Update the ref in an effect instead of during render
  useEffect(() => {
    keyRef.current = key;
  }, [key]);

  // Subscribe to storage events
  const subscribe = useCallback((callback: () => void) => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === keyRef.current) {
        callback();
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // Get snapshot from localStorage
  const getSnapshot = useCallback(() => {
    const item = window.localStorage.getItem(key);
    return item;
  }, [key]);

  // Server snapshot always returns null
  const getServerSnapshot = useCallback(() => null, []);

  const storedItem = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  // Parse the stored value, falling back to initial value
  const storedValue: T = storedItem ? JSON.parse(storedItem) : initialValue;

  const setValue = useCallback(
    (value: T) => {
      window.localStorage.setItem(key, JSON.stringify(value));
      // Dispatch a storage event to trigger re-render
      window.dispatchEvent(
        new StorageEvent("storage", { key, newValue: JSON.stringify(value) }),
      );
    },
    [key],
  );

  return [storedValue, setValue];
};

export default useLocalStorage;
