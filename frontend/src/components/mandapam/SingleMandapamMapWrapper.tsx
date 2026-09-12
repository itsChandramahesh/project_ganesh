import { SingleMandapamMap } from '../map/SingleMandapamMap';

interface SingleMandapamMapWrapperProps {
  latitude: number;
  longitude: number;
  name: string;
  area: string;
}

export function SingleMandapamMapWrapper({
  latitude,
  longitude,
  name,
  area,
}: SingleMandapamMapWrapperProps) {
  return (
    <div className="map-container">
      <SingleMandapamMap
        latitude={latitude}
        longitude={longitude}
        name={name}
        area={area}
      />
    </div>
  );
}
