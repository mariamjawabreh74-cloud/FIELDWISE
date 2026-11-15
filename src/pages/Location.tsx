import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LocateFixed, MapPin, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useFarm } from "../hooks/useFarm";
import { useDemoFarm, usePlaceSearch } from "../hooks/useFieldData";
import { useApiStatus } from "../hooks/ApiProvider";
import { FarmGate, WizardPage } from "../components/WizardPage";
import { MapPicker } from "../components/MapPicker";
import { UnknownOption } from "../components/UnknownOption";
import { ErrorState } from "../components/AsyncState";
import { locationSchema } from "../lib/schemas";
import type { Coordinates } from "../lib/api/types";

function LocationForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const context = useFarm();
  const { mockMode } = useApiStatus();
  const demo = useDemoFarm();
  const [point, setPoint] = useState<Coordinates | null>(
    context.farm!.location,
  );
  const [latitudeText, setLatitudeText] = useState(
    String(context.farm!.location?.latitude ?? ""),
  );
  const [longitudeText, setLongitudeText] = useState(
    String(context.farm!.location?.longitude ?? ""),
  );
  const [unknown, setUnknown] = useState(context.farm!.locationUnknown);
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState("");
  const [locationError, setLocationError] = useState(false);
  const [locating, setLocating] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const results = usePlaceSearch(searched);
  function pick(value: Coordinates) {
    setPoint(value);
    setLatitudeText(String(value.latitude));
    setLongitudeText(String(value.longitude));
    setUnknown(false);
    setInvalid(false);
    context.updateDraft({ location: value, locationUnknown: false });
  }
  function editCoordinates(latitude: string, longitude: string) {
    setLatitudeText(latitude);
    setLongitudeText(longitude);
    setUnknown(false);
    const candidate = {
      latitude: Number(latitude),
      longitude: Number(longitude),
    };
    if (
      latitude.trim() &&
      longitude.trim() &&
      locationSchema.safeParse(candidate).success
    ) {
      setPoint(candidate);
      setInvalid(false);
      context.updateDraft({ location: candidate, locationUnknown: false });
    } else {
      setPoint(null);
      context.updateDraft({ location: null, locationUnknown: false });
    }
  }
  function setUnknownValue(value: boolean) {
    setUnknown(value);
    if (value) {
      setPoint(null);
      setLatitudeText("");
      setLongitudeText("");
    }
    context.updateDraft({
      locationUnknown: value,
      ...(value ? { location: null } : {}),
    });
    setInvalid(false);
  }
  async function next() {
    if (!unknown && !locationSchema.safeParse(point).success) {
      setInvalid(true);
      return;
    }
    const response = await context.saveLocation({
      location: unknown ? null : point,
      unknown,
    });
    if (response?.status === "ok") navigate("/farm/boundary");
  }
  function locate() {
    setLocationError(false);
    setLocating(true);
    if (!navigator.geolocation) {
      setLocationError(true);
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        pick({
          longitude: position.coords.longitude,
          latitude: position.coords.latitude,
        });
        setLocating(false);
      },
      () => {
        setLocationError(true);
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 10000 },
    );
  }
  return (
    <WizardPage
      step={1}
      title={t("location.title")}
      subtitle={t("location.subtitle")}
      onNext={next}
    >
      <div className="panel map-panel">
        <form
          className="location-search"
          onSubmit={(event) => {
            event.preventDefault();
            setSearched(query);
          }}
        >
          <div className="search-input-wrap">
            <Search size={20} />
            <input
              className="input"
              aria-label={t("location.searchLabel")}
              placeholder={t("location.searchPlaceholder")}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <button type="submit" className="button button-primary">
            <Search size={18} />
            {t("common.search")}
          </button>
          <button
            type="button"
            className="button button-secondary"
            onClick={locate}
            disabled={locating}
          >
            <LocateFixed size={19} />
            {t(locating ? "location.locating" : "location.useLocation")}
          </button>
        </form>
        {mockMode && (
          <p className="field-hint mb-4">{t("location.stubNote")}</p>
        )}
        {results.loading && (
          <p className="field-hint" role="status">
            {t("common.searching")}
          </p>
        )}
        {results.error && <ErrorState retry={results.reload} compact />}
        {results.data && (
          <div className="place-results">
            {results.data.length ? (
              results.data.map((place) => (
                <button
                  key={place.id}
                  onClick={() => {
                    pick(place.location);
                    setSearched("");
                  }}
                >
                  <MapPin size={18} />
                  {t(place.label, { defaultValue: place.label })}
                  {place.simulated && (
                    <span className="badge">{t("common.demoShort")}</span>
                  )}
                </button>
              ))
            ) : (
              <p className="field-hint">{t("location.noResults")}</p>
            )}
          </div>
        )}
        <MapPicker
          center={point ?? demo.data?.location}
          selected={point}
          onPick={pick}
        />
        <p className="field-hint map-instruction">{t("location.pinHint")}</p>
        <div className="location-below">
          <div className="form-grid coordinate-fields">
            <div className="form-field">
              <label htmlFor="latitude">{t("location.latitude")}</label>
              <input
                id="latitude"
                className="input"
                type="number"
                dir="ltr"
                step="any"
                min="-90"
                max="90"
                value={latitudeText}
                onChange={(event) =>
                  editCoordinates(event.target.value, longitudeText)
                }
              />
            </div>
            <div className="form-field">
              <label htmlFor="longitude">{t("location.longitude")}</label>
              <input
                id="longitude"
                className="input"
                type="number"
                dir="ltr"
                step="any"
                min="-180"
                max="180"
                value={longitudeText}
                onChange={(event) =>
                  editCoordinates(latitudeText, event.target.value)
                }
              />
            </div>
          </div>
          {mockMode && demo.data?.location && (
            <button
              type="button"
              className="button button-secondary"
              onClick={() => pick(demo.data!.location!)}
            >
              <MapPin size={18} />
              {t("location.useDemo")}
            </button>
          )}
          {demo.error && mockMode && <ErrorState retry={demo.reload} compact />}
        </div>
        {invalid && (
          <p className="field-error mt-3" role="alert">
            {t("location.invalid")}
          </p>
        )}
        {locationError && (
          <div className="notice notice-warning section-gap" role="alert">
            {t("location.locationError")}
          </div>
        )}
      </div>
      <div className="unknown-section">
        <UnknownOption checked={unknown} onChange={setUnknownValue} />
        {unknown && <p className="field-hint">{t("location.unknownHint")}</p>}
      </div>
    </WizardPage>
  );
}
export default function Location() {
  return (
    <FarmGate>
      <LocationForm />
    </FarmGate>
  );
}
