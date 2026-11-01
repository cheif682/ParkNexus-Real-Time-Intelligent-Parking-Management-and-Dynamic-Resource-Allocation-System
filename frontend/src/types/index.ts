export type UserRole = 'CUSTOMER' | 'PARKING_STAFF' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone_number?: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export type VehicleType = 'TWO_WHEELER' | 'FOUR_WHEELER' | 'ELECTRIC_VEHICLE' | 'OTHER';

export interface Vehicle {
  id: string;
  user_id: string;
  license_plate: string;
  vehicle_type: VehicleType;
  make_model: string;
  color?: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export type SlotCategory = 'TWO_WHEELER' | 'FOUR_WHEELER' | 'ELECTRIC_VEHICLE' | 'ACCESSIBLE';
export type SlotStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE';

export interface ParkingSlot {
  id: string;
  facility_id: string;
  zone_id: string;
  slot_number: string;
  category: SlotCategory;
  status: SlotStatus;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  zone_name?: string;
  facility_name?: string;
}

export interface ParkingZone {
  id: string;
  facility_id: string;
  name: string;
  floor_level: string;
  supported_types: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  total_slots?: number;
  available_slots?: number;
}

export interface Facility {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  latitude?: number;
  longitude?: number;
  operating_hours: string;
  total_capacity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  zones?: ParkingZone[];
  available_slots?: number;
  occupied_slots?: number;
  reserved_slots?: number;
  maintenance_slots?: number;
  occupancy_percentage?: number;
}

export interface PricingRule {
  id: string;
  facility_id?: string;
  vehicle_type: VehicleType;
  hourly_rate: number;
  max_daily_rate: number;
  grace_period_minutes: number;
  cancellation_penalty_pct: number;
  is_active: boolean;
  facility_name?: string;
  created_at: string;
  updated_at: string;
}

export interface PriceEstimateResponse {
  duration_hours: number;
  hourly_rate: number;
  estimated_amount: number;
  max_daily_cap_applied: boolean;
  currency: string;
  grace_period_minutes: number;
}

export interface AllocationRecommendation {
  is_available: boolean;
  recommended_slot?: ParkingSlot;
  explanation: string;
  score: number;
  estimated_amount: number;
  currency: string;
  alternative_slots: ParkingSlot[];
}

export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface Reservation {
  id: string;
  booking_reference: string;
  user_id: string;
  vehicle_id: string;
  facility_id: string;
  slot_id: string;
  start_time: string;
  end_time: string;
  estimated_amount: number;
  status: ReservationStatus;
  allocation_reason?: string;
  created_at: string;
  updated_at: string;
  slot_number?: string;
  slot_category?: string;
  zone_name?: string;
  facility_name?: string;
  facility_address?: string;
  license_plate?: string;
  vehicle_make_model?: string;
  vehicle_type?: string;
  user_name?: string;
  user_email?: string;
}

export type SessionStatus = 'ACTIVE' | 'COMPLETED';

export interface ParkingSession {
  id: string;
  reservation_id?: string;
  facility_id: string;
  slot_id: string;
  vehicle_id: string;
  user_id?: string;
  entry_time: string;
  exit_time?: string;
  duration_minutes?: number;
  final_amount?: number;
  status: SessionStatus;
  created_at: string;
  updated_at: string;
  facility_name?: string;
  slot_number?: string;
  license_plate?: string;
  vehicle_make_model?: string;
  vehicle_type?: string;
  user_name?: string;
  booking_reference?: string;
}

export type PaymentMethod = 'CARD' | 'UPI' | 'NET_BANKING' | 'WALLET' | 'SIMULATED';
export type PaymentStatus = 'PENDING' | 'SUCCESSFUL' | 'FAILED' | 'REFUNDED';

export interface Payment {
  id: string;
  transaction_reference: string;
  user_id: string;
  reservation_id?: string;
  session_id?: string;
  amount: number;
  currency: string;
  payment_method: PaymentMethod;
  status: PaymentStatus;
  idempotency_key: string;
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_email?: string;
  booking_reference?: string;
  license_plate?: string;
  facility_name?: string;
}

export type ComplaintCategory = 'SLOT_ALLOCATION' | 'PAYMENT' | 'VEHICLE_ENTRY_EXIT' | 'FACILITY' | 'OTHER';
export type ComplaintStatus = 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export interface ComplaintUpdateItem {
  id: string;
  complaint_id: string;
  user_id: string;
  author_name?: string;
  status_update?: string;
  note: string;
  created_at: string;
}

export interface Complaint {
  id: string;
  ticket_number: string;
  user_id: string;
  facility_id?: string;
  category: ComplaintCategory;
  title: string;
  description: string;
  status: ComplaintStatus;
  assigned_staff_id?: string;
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_email?: string;
  assigned_staff_name?: string;
  facility_name?: string;
  updates?: ComplaintUpdateItem[];
}

export interface FacilityOccupancyStat {
  facility_id: string;
  facility_name: string;
  total_slots: number;
  available_slots: number;
  occupied_slots: number;
  reserved_slots: number;
  occupancy_rate: number;
}

export interface ZoneOccupancyStat {
  zone_id: string;
  zone_name: string;
  facility_name: string;
  total_slots: number;
  occupied_slots: number;
  occupancy_rate: number;
}

export interface DailyRevenueStat {
  date: string;
  revenue: number;
  bookings: number;
}

export interface VehicleDistributionStat {
  category: string;
  count: number;
  percentage: number;
}

export interface AuditLogItem {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details?: string;
  user_name?: string;
  created_at: string;
}

export interface AnalyticsSummary {
  total_facilities: number;
  total_slots: number;
  available_slots: number;
  occupied_slots: number;
  reserved_slots: number;
  maintenance_slots: number;
  active_sessions_count: number;
  today_reservations_count: number;
  today_revenue: number;
  occupancy_by_facility: FacilityOccupancyStat[];
  occupancy_by_zone: ZoneOccupancyStat[];
  revenue_trends: DailyRevenueStat[];
  vehicle_distribution: VehicleDistributionStat[];
  recent_transactions: Payment[];
  recent_activity: AuditLogItem[];
}
