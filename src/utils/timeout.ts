export async function executeWithTimeout<T, E extends Error>(
  promise: Promise<T>,
  timeoutMs: number,
  error: E = new Error("timeout") as E,
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => {
        console.log('Timeout hit!');
        reject(error)
      }, timeoutMs),
    ),
  ]);
}
