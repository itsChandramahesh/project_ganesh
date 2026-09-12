export type MandapamStatus = 'pending' | 'approved' | 'rejected';

export interface Mandapam {
  id: string;
  name: string;
  area: string;
  address: string | null;
  description: string | null;
  latitude: number;
  longitude: number;
  image_url: string | null;
  status: MandapamStatus;
  is_featured: boolean;
  is_verified: boolean;
  submitted_by: string | null;
  created_at: string;
  updated_at: string;
}

export type CreateMandapamPayload = Pick<
  Mandapam,
  'name' | 'area' | 'latitude' | 'longitude'
> &
  Partial<Pick<Mandapam, 'address' | 'description' | 'image_url' | 'submitted_by'>>;
