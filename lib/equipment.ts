import { Shield, Sofa, Car as CarIcon, MonitorSmartphone } from 'lucide-react';

export interface EquipmentCategory {
  id: string;
  label: string;
  icon: typeof Shield;
  items: EquipmentItem[];
}

export interface EquipmentItem {
  id: string;
  label: string;
}

export const EQUIPMENT_CATEGORIES: EquipmentCategory[] = [
  {
    id: 'safety',
    label: 'Bezbednost',
    icon: Shield,
    items: [
      { id: 'abs', label: 'ABS' },
      { id: 'esp', label: 'ESP' },
      { id: 'airbags', label: 'Vazdušni jastuci' },
      { id: 'alarm', label: 'Alarm' },
      { id: 'central_lock', label: 'Centralna brava' },
      { id: 'zeder', label: 'Zeder / Igla' },
      { id: 'isofix', label: 'ISOFIX' },
    ],
  },
  {
    id: 'interior',
    label: 'Enterijer i udobnost',
    icon: Sofa,
    items: [
      { id: 'leather_seats', label: 'Kožna sedišta' },
      { id: 'heated_seats', label: 'Grejanje sedišta' },
      { id: 'auto_climate', label: 'Automatska klima' },
      { id: 'manual_climate', label: 'Manuelna klima' },
      { id: 'cruise_control', label: 'Tempomat' },
      { id: 'multi_wheel', label: 'Multifunkcionalni volan' },
      { id: 'electric_windows', label: 'Električni podizači' },
    ],
  },
  {
    id: 'exterior',
    label: 'Eksterijer',
    icon: CarIcon,
    items: [
      { id: 'alloy_wheels', label: 'Alu felne' },
      { id: 'led_xenon', label: 'LED / Xenon farovi' },
      { id: 'panorama', label: 'Panorama / Šiber' },
      { id: 'tow_hook', label: 'Kuka za vuču' },
      { id: 'fog_lights', label: 'Maglenke' },
    ],
  },
  {
    id: 'multimedia',
    label: 'Multimedija i tehnologija',
    icon: MonitorSmartphone,
    items: [
      { id: 'navigation', label: 'Navigacija' },
      { id: 'bluetooth', label: 'Bluetooth' },
      { id: 'reverse_camera', label: 'Rikverc kamera' },
      { id: 'parking_sensors', label: 'Parking senzori' },
      { id: 'trip_computer', label: 'Bord računar' },
    ],
  },
];

export const ALL_EQUIPMENT_IDS: string[] = EQUIPMENT_CATEGORIES.flatMap(
  (cat) => cat.items.map((item) => item.id),
);

export const EQUIPMENT_LABELS: Record<string, string> = Object.fromEntries(
  EQUIPMENT_CATEGORIES.flatMap((cat) =>
    cat.items.map((item) => [item.id, item.label]),
  ),
);

export function getEquipmentLabels(ids: string[]): string[] {
  return ids.map((id) => EQUIPMENT_LABELS[id]).filter(Boolean);
}
