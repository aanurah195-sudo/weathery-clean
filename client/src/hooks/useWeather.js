/**
 * useWeather.js
 * ─────────────────────────────────────────────────────────────
 * A collection of custom React hooks that sit on top of the
 * Zustand weatherStore and provide component-level conveniences:
 *  • useWeather        – primary all-in-one hook
 *  • useCurrentWeather – current conditions only
 *  • useForecast       – 7-day + hourly forecast
 *  • useAlerts         – disaster alerts with auto-refresh
 *  • useSearch         – debounced city search
 *  • useSavedCities    – saved city CRUD
 *  • useGeolocation    – browser GPS with permission state
 *  • useWeatherRefresh – periodic background refresh
 *  • useWeatherUnit    – metric/imperial toggle with conversion
 * ─────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import useWeatherStore from '../store/weatherStore';
import { weatherAPI, alertAPI } from '../api/axios';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────
// 1. useWeather  —  primary hook used by most components
// ─────────────────────────────────────────────────────────────
/**
 * One-stop hook that bootstraps data fetching on mount,
 * exposes the full store state, and provides convenience helpers.
 *
 * Usage:
 *   const { current, forecast, alerts, loading, refresh } = useWeather();
 */
export function useWeather() {
  const store = useWeatherStore();
  const initialised = useRef(false);

  // Bootstrap on first mount
  useEffect(() => {
    if (initialised.current) return;
    initialised.current = true;

    if (navigator.geolocation) {
      store.useGeolocation();
    } else {
      store.fetchAll();
    }
  }, []);

  /** Manually refresh all data and show a toast */
  const refresh = useCallback(async () => {
    const toastId = toast.loading('Refreshing weather…');
    await store.fetchAll();
    toast.success('Weather updated!', { id: toastId });
  }, [store]);

  /** Save current city to MongoDB */
  const saveCurrentCity = useCallback(async () => {
    if (!store.current) return;
    try {
      await store.saveCity({
        name: store.current.city,
        country: store.current.country,
        lat: store.current.lat,
        lon: store.current.lon,
      });
      toast.success(`${store.current.city} saved!`);
    } catch {
      toast.error('Could not save city');
    }
  }, [store]);

  return {
    // Raw state
    current: store.current,
    forecast: store.forecast,
    alerts: store.alerts,
    savedCities: store.savedCities,
    searchResults: store.searchResults,
    loading: store.loading,
    alertsLoading: store.alertsLoading,
    error: store.error,
    city: store.city,
    coords: store.coords,
    unit: store.unit,

    // Actions
    refresh,
    saveCurrentCity,
    selectCity: store.selectCity,
    searchCities: store.searchCities,
    fetchSaved: store.fetchSaved,
    deleteCity: store.deleteCity,
    dismissAlert: store.dismissAlert,
    useGeolocation: store.useGeolocation,
  };
}

// ─────────────────────────────────────────────────────────────
// 2. useCurrentWeather  —  focused on the current-conditions card
// ─────────────────────────────────────────────────────────────
/**
 * Usage:
 *   const { data, loading, error, refetch } = useCurrentWeather('Paris');
 *
 * @param {string|null} city  – pass null to use whatever is in the store
 */
export function useCurrentWeather(city = null) {
  const store = useWeatherStore();

  const refetch = useCallback(async () => {
    if (city) store.setCity(city);
    await store.fetchCurrent();
  }, [city, store]);

  // Re-fetch whenever city prop changes
  useEffect(() => {
    if (city && city !== store.city) {
      store.setCity(city);
      store.fetchCurrent();
    }
  }, [city]);

  // Derived comfort-level label
  const comfortLevel = useMemo(() => {
    if (!store.current) return null;
    const { humidity, temp, windSpeed } = store.current;
    if (temp > 35 && humidity > 70) return { label: 'Very Uncomfortable', color: 'var(--red)' };
    if (temp > 28 && humidity > 60) return { label: 'Uncomfortable', color: 'var(--orange)' };
    if (temp >= 18 && temp <= 27 && humidity < 60) return { label: 'Comfortable', color: 'var(--teal)' };
    if (temp < 5 || windSpeed > 15) return { label: 'Cold & Windy', color: 'var(--blue)' };
    return { label: 'Moderate', color: 'var(--yellow)' };
  }, [store.current]);

  // Local time string at the fetched city
  const localTime = useMemo(() => {
    if (!store.current) return null;
    const utcNow = Date.now() / 1000;
    const localUnix = utcNow + store.current.timezone;
    const d = new Date(localUnix * 1000);
    return d.toUTCString().slice(17, 22); // "HH:MM"
  }, [store.current]);

  return {
    data: store.current,
    loading: store.loading,
    error: store.error,
    comfortLevel,
    localTime,
    refetch,
  };
}

// ─────────────────────────────────────────────────────────────
// 3. useForecast  —  7-day & hourly forecast data
// ─────────────────────────────────────────────────────────────
/**
 * Usage:
 *   const { daily, hourly, activeDay, setActiveDay } = useForecast();
 */
export function useForecast() {
  const store = useWeatherStore();
  const [activeDay, setActiveDay] = useState(0); // index into daily array

  const refetch = useCallback(() => store.fetchForecast(), [store]);

  // Temperature range across the 7-day period
  const tempRange = useMemo(() => {
    if (!store.forecast?.daily) return null;
    const maxes = store.forecast.daily.map(d => d.tempMax);
    const mins = store.forecast.daily.map(d => d.tempMin);
    return {
      overallMax: Math.max(...maxes),
      overallMin: Math.min(...mins),
    };
  }, [store.forecast]);

  // Bar widths for the temperature range bar
  const getDayBarStyle = useCallback((day) => {
    if (!tempRange) return {};
    const span = tempRange.overallMax - tempRange.overallMin || 1;
    const left = ((day.tempMin - tempRange.overallMin) / span) * 100;
    const width = ((day.tempMax - day.tempMin) / span) * 100;
    return { left: `${left}%`, width: `${Math.max(width, 10)}%` };
  }, [tempRange]);

  return {
    daily: store.forecast?.daily ?? [],
    hourly: store.forecast?.hourly ?? [],
    forecastAlerts: store.forecast?.alerts ?? [],
    loading: !store.forecast && store.loading,
    activeDay,
    setActiveDay,
    tempRange,
    getDayBarStyle,
    refetch,
  };
}

// ─────────────────────────────────────────────────────────────
// 4. useAlerts  —  disaster alerts with auto-refresh
// ─────────────────────────────────────────────────────────────
/**
 * Usage:
 *   const { allAlerts, extremeAlerts, dismiss, refresh } = useAlerts();
 *
 * @param {number} refreshInterval  – ms between auto-refreshes (default: 5 min)
 */
export function useAlerts(refreshInterval = 5 * 60 * 1000) {
  const store = useWeatherStore();
  const intervalRef = useRef(null);

  // Initial fetch
  useEffect(() => {
    store.fetchAlerts();
  }, []);

  // Auto-refresh
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      store.fetchAlerts();
    }, refreshInterval);
    return () => clearInterval(intervalRef.current);
  }, [refreshInterval]);

  const allAlerts = useMemo(() => {
    return [...(store.alerts.live || []), ...(store.alerts.stored || [])];
  }, [store.alerts]);

  const extremeAlerts = useMemo(
    () => allAlerts.filter(a => a.severity === 'extreme' || a.severity === 'severe'),
    [allAlerts]
  );

  const groupedBySeverity = useMemo(() => ({
    extreme: allAlerts.filter(a => a.severity === 'extreme'),
    severe:  allAlerts.filter(a => a.severity === 'severe'),
    moderate: allAlerts.filter(a => a.severity === 'moderate'),
    minor:   allAlerts.filter(a => a.severity === 'minor'),
  }), [allAlerts]);

  const dismiss = useCallback(async (id) => {
    await store.dismissAlert(id);
    toast.success('Alert dismissed');
  }, [store]);

  const manualRefresh = useCallback(async () => {
    await store.fetchAlerts();
    toast.success('Alerts refreshed');
  }, [store]);

  return {
    allAlerts,
    liveAlerts: store.alerts.live || [],
    storedAlerts: store.alerts.stored || [],
    extremeAlerts,
    groupedBySeverity,
    totalCount: allAlerts.length,
    loading: store.alertsLoading,
    dismiss,
    refresh: manualRefresh,
  };
}

// ─────────────────────────────────────────────────────────────
// 5. useSearch  —  debounced city autocomplete search
// ─────────────────────────────────────────────────────────────
/**
 * Usage:
 *   const { query, setQuery, results, isSearching, select, clear } = useSearch();
 */
export function useSearch(debounceMs = 350) {
  const store = useWeatherStore();
  const [query, setQueryState] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const timerRef = useRef(null);
  const controllerRef = useRef(null);

  const setQuery = useCallback((val) => {
    setQueryState(val);

    clearTimeout(timerRef.current);
    controllerRef.current?.abort();

    if (!val || val.trim().length < 2) {
      store.searchCities(''); // clears results
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    timerRef.current = setTimeout(async () => {
      controllerRef.current = new AbortController();
      await store.searchCities(val.trim());
      setIsSearching(false);
    }, debounceMs);
  }, [store, debounceMs]);

  const select = useCallback(async (cityObj) => {
    setQueryState('');
    store.searchCities('');
    await store.selectCity(cityObj);
    toast.success(`Showing weather for ${cityObj.name}`);
  }, [store]);

  const clear = useCallback(() => {
    setQueryState('');
    store.searchCities('');
  }, [store]);

  // Cleanup on unmount
  useEffect(() => () => {
    clearTimeout(timerRef.current);
    controllerRef.current?.abort();
  }, []);

  return {
    query,
    setQuery,
    results: store.searchResults,
    isSearching,
    select,
    clear,
  };
}

// ─────────────────────────────────────────────────────────────
// 6. useSavedCities  —  manage favourite cities in MongoDB
// ─────────────────────────────────────────────────────────────
/**
 * Usage:
 *   const { cities, save, remove, isSaved, loadCity } = useSavedCities();
 */
export function useSavedCities() {
  const store = useWeatherStore();

  // Fetch saved cities on mount
  useEffect(() => {
    store.fetchSaved();
  }, []);

  const isSaved = useCallback((cityName) => {
    return store.savedCities.some(
      c => c.name.toLowerCase() === cityName?.toLowerCase()
    );
  }, [store.savedCities]);

  const save = useCallback(async (cityData) => {
    if (!cityData?.name) return;
    if (isSaved(cityData.name)) {
      toast('Already in your saved list', { icon: '📌' });
      return;
    }
    try {
      await store.saveCity(cityData);
      toast.success(`📌 ${cityData.name} saved`);
    } catch {
      toast.error('Failed to save city');
    }
  }, [store, isSaved]);

  const remove = useCallback(async (id, name = '') => {
    try {
      await store.deleteCity(id);
      toast.success(`Removed ${name}`);
    } catch {
      toast.error('Failed to remove city');
    }
  }, [store]);

  /** Jump to a saved city's weather */
  const loadCity = useCallback(async (city) => {
    await store.selectCity({ name: city.name, lat: city.lat, lon: city.lon });
  }, [store]);

  return {
    cities: store.savedCities,
    count: store.savedCities.length,
    save,
    remove,
    isSaved,
    loadCity,
    refresh: store.fetchSaved,
  };
}

// ─────────────────────────────────────────────────────────────
// 7. useGeolocation  —  browser GPS with explicit permission UI
// ─────────────────────────────────────────────────────────────
/**
 * Usage:
 *   const { request, status, coords, error } = useGeolocation();
 */
export function useGeolocation() {
  const store = useWeatherStore();
  const [status, setStatus] = useState('idle'); // idle | pending | success | denied | unsupported
  const [geoError, setGeoError] = useState(null);
  const [localCoords, setLocalCoords] = useState(null);

  const request = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus('unsupported');
      toast.error('Geolocation not supported in this browser');
      return;
    }

    setStatus('pending');
    toast.loading('Getting your location…', { id: 'geo' });

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        setLocalCoords(coords);
        setStatus('success');
        store.setCoords(coords);
        store.fetchAll().then(() =>
          toast.success('Location found!', { id: 'geo' })
        );
      },
      (err) => {
        setGeoError(err.message);
        setStatus('denied');
        toast.error('Location access denied', { id: 'geo' });
        // Fall back to default city
        store.fetchAll();
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  }, [store]);

  return {
    request,
    status,
    coords: localCoords || store.coords,
    error: geoError,
    isLoading: status === 'pending',
    isDenied: status === 'denied',
    isSuccess: status === 'success',
  };
}

// ─────────────────────────────────────────────────────────────
// 8. useWeatherRefresh  —  periodic background auto-refresh
// ─────────────────────────────────────────────────────────────
/**
 * Silently re-fetches weather in the background on an interval.
 * Also re-fetches when the browser tab becomes visible again.
 *
 * Usage:
 *   useWeatherRefresh(10 * 60 * 1000); // every 10 minutes
 */
export function useWeatherRefresh(intervalMs = 10 * 60 * 1000) {
  const store = useWeatherStore();
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const timerRef = useRef(null);

  const silentRefresh = useCallback(async () => {
    await store.fetchAll();
    setLastRefreshed(new Date());
  }, [store]);

  // Interval-based refresh
  useEffect(() => {
    timerRef.current = setInterval(silentRefresh, intervalMs);
    return () => clearInterval(timerRef.current);
  }, [silentRefresh, intervalMs]);

  // Visibility-based refresh (tab focus)
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === 'visible') silentRefresh();
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [silentRefresh]);

  return { lastRefreshed, silentRefresh };
}

// ─────────────────────────────────────────────────────────────
// 9. useWeatherUnit  —  metric ↔ imperial toggle with conversion
// ─────────────────────────────────────────────────────────────
/**
 * Usage:
 *   const { unit, toggle, convert } = useWeatherUnit();
 *   convert.temp(28)        → "82°F"  or  "28°C"
 *   convert.wind(5.5)       → "12.3 mph"  or  "19.8 km/h"
 *   convert.pressure(1013)  → "29.9 inHg" or  "1013 hPa"
 */
export function useWeatherUnit() {
  const store = useWeatherStore();

  const toggle = useCallback(() => {
    // Zustand store handles unit; we extend it here for components
    // that need local unit state without rewriting the whole store
    store.setUnit?.(store.unit === 'metric' ? 'imperial' : 'metric');
  }, [store]);

  const isMetric = store.unit !== 'imperial';

  const convert = useMemo(() => ({
    /** Returns formatted temperature string */
    temp: (celsius) => {
      if (celsius == null) return '—';
      if (isMetric) return `${Math.round(celsius)}°C`;
      return `${Math.round(celsius * 9 / 5 + 32)}°F`;
    },

    /** Returns formatted wind speed string (input: m/s) */
    wind: (ms) => {
      if (ms == null) return '—';
      if (isMetric) return `${(ms * 3.6).toFixed(1)} km/h`;
      return `${(ms * 2.237).toFixed(1)} mph`;
    },

    /** Returns formatted wind speed string (input: km/h) */
    windKph: (kph) => {
      if (kph == null) return '—';
      if (isMetric) return `${kph.toFixed(1)} km/h`;
      return `${(kph * 0.621).toFixed(1)} mph`;
    },

    /** Returns formatted pressure string (input: hPa) */
    pressure: (hpa) => {
      if (hpa == null) return '—';
      if (isMetric) return `${hpa} hPa`;
      return `${(hpa * 0.02953).toFixed(2)} inHg`;
    },

    /** Returns formatted distance string (input: km) */
    distance: (km) => {
      if (km == null) return '—';
      if (isMetric) return `${km} km`;
      return `${(km * 0.621).toFixed(1)} mi`;
    },

    /** Raw number helpers */
    rawTemp: (c) => isMetric ? c : Math.round(c * 9 / 5 + 32),
    rawWind: (ms) => isMetric ? +(ms * 3.6).toFixed(1) : +(ms * 2.237).toFixed(1),
  }), [isMetric]);

  return {
    unit: store.unit,
    isMetric,
    toggle,
    convert,
  };
}

// ─────────────────────────────────────────────────────────────
// 10. useWeatherComparison  —  compare two cities side-by-side
// ─────────────────────────────────────────────────────────────
/**
 * Usage:
 *   const { cityA, cityB, fetchComparison, loading } = useWeatherComparison();
 *   fetchComparison('Tokyo', 'London');
 */
export function useWeatherComparison() {
  const [cityA, setCityA] = useState(null);
  const [cityB, setCityB] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchComparison = useCallback(async (nameA, nameB) => {
    setLoading(true);
    setError(null);
    try {
      const [resA, resB] = await Promise.all([
        weatherAPI.getCurrent({ city: nameA }),
        weatherAPI.getCurrent({ city: nameB }),
      ]);
      setCityA(resA.data.data);
      setCityB(resB.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Comparison failed');
      toast.error('Could not compare cities');
    } finally {
      setLoading(false);
    }
  }, []);

  /** Returns which city is "better" for a given metric */
  const winner = useMemo(() => {
    if (!cityA || !cityB) return {};
    return {
      temp: cityA.temp > cityB.temp ? 'A' : 'B',
      humidity: cityA.humidity < cityB.humidity ? 'A' : 'B',  // lower = better
      visibility: cityA.visibility > cityB.visibility ? 'A' : 'B',
      wind: cityA.windSpeed < cityB.windSpeed ? 'A' : 'B',    // calmer = better
    };
  }, [cityA, cityB]);

  return { cityA, cityB, loading, error, fetchComparison, winner };
}

// ─────────────────────────────────────────────────────────────
// Default export — convenience re-export of primary hook
// ─────────────────────────────────────────────────────────────
export default useWeather;