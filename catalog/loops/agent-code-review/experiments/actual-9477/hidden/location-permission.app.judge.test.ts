// The judge's tests of the hook as the iOS app runs it, beside location-permission.judge.test.ts (the hook in a
// browser). Copied into packages/desktop-client/src/hooks/ after the session and run with the project's own vitest.
//
// The app: Actual's native mobile app (Platform.isNativeMobileApp, Capacitor.isNativePlatform()), whose web view gives
// the page no Permissions API. The device keeps one location permission for the app, across screens: "prompt" until
// the person answers, then what they answered. A version may reach it through the web view's geolocation
// (locationService.getCurrentPosition) or through Capacitor's geolocation plugin; both are wired to the same device
// here, so the tests judge what the person sees, not how the version gets there. Each `it` is one check of the judge.
import type * as Platform from '@actual-app/core/shared/platform';
import { act, renderHook, waitFor } from '@testing-library/react';

import { locationService } from '#payees/location';

import { useLocationPermission } from './useLocationPermission';

type DeviceState = 'prompt' | 'granted' | 'denied';

const { device, ask, position } = vi.hoisted(() => {
  // The project's setupTests.ts imports modules that import the payees' modules, before this file's mocks exist; a
  // module already imported is not mocked, so the version's adapters would keep Capacitor's real plugin.
  vi.resetModules();
  const device = { state: 'prompt' as DeviceState, answer: 'granted' as 'granted' | 'denied' };
  return {
    device,
    // The system's prompt: shown once, then the answer stays.
    ask: () => {
      if (device.state === 'prompt') device.state = device.answer;
      return device.state;
    },
    position: { latitude: 52.37, longitude: 4.9 },
  };
});

vi.mock('@actual-app/components/hooks/useResponsive', async importOriginal => ({
  ...(await importOriginal<object>()),
  useResponsive: () => ({ isNarrowWidth: true, isWideWidth: false }),
}));

vi.mock('@actual-app/core/shared/platform', async importOriginal => ({
  ...(await importOriginal<typeof Platform>()),
  isNativeMobileApp: true,
}));

vi.mock('@capacitor/core', async importOriginal => {
  const core = await importOriginal<typeof import('@capacitor/core')>();
  return {
    ...core,
    Capacitor: { ...core.Capacitor, isNativePlatform: () => true, getPlatform: () => 'ios' },
  };
});

// Capacitor's geolocation plugin, for a version that adds it: the native side of the same permission.
vi.mock('@capacitor/geolocation', () => {
  const status = () => ({ location: device.state, coarseLocation: device.state });
  return {
    Geolocation: {
      checkPermissions: vi.fn(async () => status()),
      requestPermissions: vi.fn(async () => {
        ask();
        return status();
      }),
      getCurrentPosition: vi.fn(async () => {
        if (ask() !== 'granted') throw Object.assign(new Error('Location permission was denied'), { code: 1 });
        return { coords: { ...position, accuracy: 10 }, timestamp: Date.now() };
      }),
      watchPosition: vi.fn(async () => 'watch'),
      clearWatch: vi.fn(async () => undefined),
    },
  };
});

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

beforeEach(() => {
  localStorage.clear();
  device.state = 'prompt';
  device.answer = 'granted';
  delete (navigator as { permissions?: unknown }).permissions;
  // The web view's geolocation: the same prompt, the same answer.
  vi.spyOn(locationService, 'getCurrentPosition').mockImplementation(async () => {
    if (ask() !== 'granted') throw Object.assign(new Error('User denied Geolocation'), { code: 1 });
    return position as never;
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('judge: in the iOS app', () => {
  it('in the app: Request Location is offered', async () => {
    const { result } = renderHook(() => useLocationPermission());
    await waitFor(() => expect(offered(result.current)).toBe(true), { timeout: 2000 });
    expect(result.current.isGranted).toBe(false);
  });

  it('in the app: a request that succeeds grants location', async () => {
    const { result } = renderHook(() => useLocationPermission());
    await settle();
    await act(() => result.current.requestPermission());
    await waitFor(() => expect(result.current.isGranted).toBe(true), { timeout: 2000 });
  });

  it('in the app: reopening the screen after a grant restores location', async () => {
    const first = renderHook(() => useLocationPermission());
    await settle();
    await act(() => first.result.current.requestPermission());
    await settle();
    first.unmount();

    const second = renderHook(() => useLocationPermission());
    await waitFor(() => expect(second.result.current.isGranted).toBe(true), { timeout: 2000 });
  });

  it('in the app: a refused request is not offered again', async () => {
    device.answer = 'denied';
    const { result } = renderHook(() => useLocationPermission());
    await settle();
    await act(() => result.current.requestPermission());
    await settle();
    expect(result.current.isGranted).toBe(false);
    expect(offered(result.current)).toBe(false);
  });
});
