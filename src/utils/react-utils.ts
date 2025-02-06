import {
  DependencyList,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

export interface Loader<T> {
  (abort: AbortSignal): Promise<T>;
}

export interface LoadState<T> {
  error?: any;
  pending: boolean;
  value?: T;
}

export function useLoad<T>(fn: Loader<T>, deps: DependencyList): LoadState<T> {
  const [state, setState] = useState<LoadState<T>>({ pending: false });

  useEffect(() => {
    const abortController = new AbortController();
    setState((state) => ({ ...state, pending: true }));
    fn(abortController.signal).then(
      (value) => setState({ pending: false, value }),
      (error) => {
        if (
          !(
            error.message.includes("Request aborted for RPC method") ||
            error.code === "ERR_CANCELED" ||
            error.message === "Another request is in flight"
          )
        ) {
          setState({ pending: false, error });
        }
      },
    );
    return () => {
      abortController.abort();
      setState((state) => ({ ...state, pending: false }));
    };
    // The way useLoad() is designed, we have no choice but to trust that the user gave us the correct deps for fn().
    // We could fix this by marking useLoad() as a custom hook, and then exhaustive-deps would enforce that for us.
    // https://www.npmjs.com/package/eslint-plugin-react-hooks#advanced-configuration
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}