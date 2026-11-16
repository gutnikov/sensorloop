// The judge's tests of the actual-9477 experiment, copied into packages/desktop-client/src/hooks/ after the session and
// run with the project's own vitest (jsdom). The mobile transaction screen shows "Request Location" while
// useLocationPermission says `isPending`, and uses location while it says `isGranted` (TransactionEdit.tsx at the base
// commit). The apps' web views may not let the page query the permission status: no Permissions API, or a query that
// fails. Each `it` is one check of the judge.
import { act, renderHook, waitFor } from '@testing-library/react';

import { locationService } from '#payees/location';

import { useLocationPermission } from './useLocationPermission';

vi.mock('@actual-app/components/hooks/useResponsive', async importOriginal => ({
  ...(await importOriginal<object>()),
  useResponsive: () => ({ isNarrowWidth: true, isWideWidth: false }),
}));

const position = { latitude: 52.37, longitude: 4.9 };
const refused = Object.assign(new Error('User denied Geolocation'), { code: 1 });

function setPermissions(value: unknown) {
  Object.defineProperty(navigator, 'permissions', { value, configurable: true, writable: true });
}

function statusOf(state: PermissionState) {
  return {
    query: vi.fn().mockResolvedValue({
      state,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  };
}

const settle = () => act(() => new Promise(resolve => setTimeout(resolve, 50)));

// The screen offers "Request Location" while the hook says `isPending` (at the base commit). A version may rename that
// flag along with the screen that reads it (one run named it `canRequestPermission`); then it is the one other boolean
// the hook returns whose name speaks of a request, a prompt or a pending state. No such flag reads as undefined.
function offered(current: object) {
  const fields = current as Record<string, unknown>;
  if ('isPending' in fields) return fields.isPending;
  const flags = Object.entries(fields).filter(
    ([name, value]) => name !== 'isGranted' && typeof value === 'boolean' && /pending|request|prompt|ask/i.test(name),
  );
  return flags.length === 1 ? flags[0][1] : undefined;
}

let getCurrentPosition: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  localStorage.clear();
  getCurrentPosition = vi.spyOn(locationService, 'getCurrentPosition');
  getCurrentPosition.mockResolvedValue(position as never);
});

afterEach(() => {
  vi.restoreAllMocks();
  delete (navigator as { permissions?: unknown }).permissions;
  localStorage.clear();
});

describe('judge: the permission status cannot be queried', () => {
  it('no Permissions API: Request Location is offered', async () => {
    setPermissions(undefined);
    const { result } = renderHook(() => useLocationPermission());
    await waitFor(() => expect(offered(result.current)).toBe(true), { timeout: 2000 });
    expect(result.current.isGranted).toBe(false);
  });

  it('the status query fails: Request Location is offered', async () => {
    setPermissions({ query: vi.fn().mockRejectedValue(new TypeError('geolocation is not a valid permission name')) });
    const { result } = renderHook(() => useLocationPermission());
    await waitFor(() => expect(offered(result.current)).toBe(true), { timeout: 2000 });
    expect(result.current.isGranted).toBe(false);
  });

  it('a request that succeeds grants location', async () => {
    setPermissions(undefined);
    const { result } = renderHook(() => useLocationPermission());
    await settle();
    await act(() => result.current.requestPermission());
    await waitFor(() => expect(result.current.isGranted).toBe(true), { timeout: 2000 });
  });

  it('after a request that succeeded, reopening the screen restores location', async () => {
    setPermissions(undefined);
    const first = renderHook(() => useLocationPermission());
    await settle();
    await act(() => first.result.current.requestPermission());
    first.unmount();

    const second = renderHook(() => useLocationPermission());
    await waitFor(() => expect(second.result.current.isGranted).toBe(true), { timeout: 2000 });
  });

  it('a refused request is not offered again', async () => {
    setPermissions(undefined);
    getCurrentPosition.mockRejectedValue(refused as never);
    const { result } = renderHook(() => useLocationPermission());
    await settle();
    await act(() => result.current.requestPermission());
    await settle();
    expect(result.current.isGranted).toBe(false);
    expect(offered(result.current)).toBe(false);
  });
});

describe('judge: the permission status can be queried', () => {
  it('granted: location is used', async () => {
    setPermissions(statusOf('granted'));
    const { result } = renderHook(() => useLocationPermission());
    await waitFor(() => expect(result.current.isGranted).toBe(true), { timeout: 2000 });
    expect(offered(result.current)).toBe(false);
  });

  it('prompt: Request Location is offered', async () => {
    setPermissions(statusOf('prompt'));
    const { result } = renderHook(() => useLocationPermission());
    await waitFor(() => expect(offered(result.current)).toBe(true), { timeout: 2000 });
    expect(result.current.isGranted).toBe(false);
  });

  it('denied: neither', async () => {
    setPermissions(statusOf('denied'));
    const { result } = renderHook(() => useLocationPermission());
    await settle();
    expect(result.current.isGranted).toBe(false);
    expect(offered(result.current)).toBe(false);
  });
});
