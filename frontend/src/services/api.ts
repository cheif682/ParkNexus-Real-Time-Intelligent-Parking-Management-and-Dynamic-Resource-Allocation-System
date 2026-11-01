import {
  User, AuthResponse, Facility, ParkingZone, ParkingSlot,
  AllocationRecommendation, Reservation, ParkingSession,
  Payment, PricingRule, PriceEstimateResponse, Complaint,
  AnalyticsSummary, AuditLogItem, Vehicle
} from '../types';

const API_BASE = '/api/v1';

class ApiService {
  private getToken(): string | null {
    return localStorage.getItem('parknexus_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = 'An unexpected error occurred';
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.error || errorMessage;
      } catch (e) {
        errorMessage = response.statusText;
      }
      throw new Error(errorMessage);
    }

    // Check if response has content
    const text = await response.text();
    return text ? JSON.parse(text) : ({} as T);
  }

  // --- Auth ---
  async login(credentials: { email: string; password: string }): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(data: { email: string; password: string; full_name: string; phone_number?: string }): Promise<User> {
    return this.request<User>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMe(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  async updateMe(data: Partial<User>): Promise<User> {
    return this.request<User>('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async changePassword(data: { current_password: string; new_password: string }): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getNotifications(): Promise<any[]> {
    return this.request<any[]>('/auth/notifications');
  }

  async markNotificationRead(id: string): Promise<void> {
    return this.request<void>(`/auth/notifications/${id}/read`, { method: 'PUT' });
  }

  // --- Facilities ---
  async getFacilities(search?: string, city?: string): Promise<Facility[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (city) params.append('city', city);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request<Facility[]>(`/facilities/${qs}`);
  }

  async getFacility(id: string): Promise<Facility> {
    return this.request<Facility>(`/facilities/${id}`);
  }

  async createFacility(data: Partial<Facility>): Promise<Facility> {
    return this.request<Facility>('/facilities/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateFacility(id: string, data: Partial<Facility>): Promise<Facility> {
    return this.request<Facility>(`/facilities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteFacility(id: string): Promise<void> {
    return this.request<void>(`/facilities/${id}`, { method: 'DELETE' });
  }

  // --- Zones ---
  async getZonesByFacility(facilityId: string): Promise<ParkingZone[]> {
    return this.request<ParkingZone[]>(`/zones/facility/${facilityId}`);
  }

  async createZone(facilityId: string, data: Partial<ParkingZone>): Promise<ParkingZone> {
    return this.request<ParkingZone>(`/zones/?facility_id=${facilityId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateZone(id: string, data: Partial<ParkingZone>): Promise<ParkingZone> {
    return this.request<ParkingZone>(`/zones/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // --- Slots ---
  async getSlotsByFacility(facilityId: string, zoneId?: string): Promise<ParkingSlot[]> {
    const qs = zoneId ? `?zone_id=${zoneId}` : '';
    return this.request<ParkingSlot[]>(`/slots/facility/${facilityId}${qs}`);
  }

  async createSlot(data: Partial<ParkingSlot>): Promise<ParkingSlot> {
    return this.request<ParkingSlot>('/slots/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSlot(id: string, data: Partial<ParkingSlot>): Promise<ParkingSlot> {
    return this.request<ParkingSlot>(`/slots/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async toggleSlotMaintenance(id: string, underMaintenance: boolean): Promise<ParkingSlot> {
    return this.request<ParkingSlot>(`/slots/${id}/maintenance?under_maintenance=${underMaintenance}`, {
      method: 'PUT',
    });
  }

  // --- Vehicles ---
  async getVehicles(): Promise<Vehicle[]> {
    return this.request<Vehicle[]>('/vehicles/');
  }

  async addVehicle(data: Partial<Vehicle>): Promise<Vehicle> {
    return this.request<Vehicle>('/vehicles/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateVehicle(id: string, data: Partial<Vehicle>): Promise<Vehicle> {
    return this.request<Vehicle>(`/vehicles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteVehicle(id: string): Promise<void> {
    return this.request<void>(`/vehicles/${id}`, { method: 'DELETE' });
  }

  // --- Dynamic Allocation Algorithm ---
  async getRecommendedSlot(req: {
    facility_id: string;
    vehicle_id: string;
    start_time: string;
    end_time: string;
    preferred_zone_id?: string;
  }): Promise<AllocationRecommendation> {
    return this.request<AllocationRecommendation>('/allocation/recommend', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  }

  // --- Reservations ---
  async createReservation(data: {
    facility_id: string;
    vehicle_id: string;
    slot_id: string;
    start_time: string;
    end_time: string;
  }): Promise<Reservation> {
    return this.request<Reservation>('/reservations/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getReservations(status?: string, bookingRef?: string): Promise<Reservation[]> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (bookingRef) params.append('booking_reference', bookingRef);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request<Reservation[]>(`/reservations/${qs}`);
  }

  async cancelReservation(id: string, reason?: string): Promise<Reservation> {
    return this.request<Reservation>(`/reservations/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // --- Sessions (Staff) ---
  async checkInVehicle(data: {
    facility_id: string;
    booking_reference?: string;
    license_plate?: string;
  }): Promise<ParkingSession> {
    return this.request<ParkingSession>('/sessions/check-in', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async checkOutVehicle(data: {
    session_id: string;
    payment_method?: string;
    idempotency_key?: string;
  }): Promise<ParkingSession> {
    return this.request<ParkingSession>('/sessions/check-out', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getActiveSessions(facilityId?: string): Promise<ParkingSession[]> {
    const qs = facilityId ? `?facility_id=${facilityId}` : '';
    return this.request<ParkingSession[]>(`/sessions/active${qs}`);
  }

  async getSessions(facilityId?: string, status?: string): Promise<ParkingSession[]> {
    const params = new URLSearchParams();
    if (facilityId) params.append('facility_id', facilityId);
    if (status) params.append('status', status);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request<ParkingSession[]>(`/sessions/${qs}`);
  }

  // --- Payments ---
  async processPayment(data: {
    reservation_id?: string;
    session_id?: string;
    amount: number;
    payment_method: string;
    idempotency_key: string;
  }): Promise<Payment> {
    return this.request<Payment>('/payments/process', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPayments(): Promise<Payment[]> {
    return this.request<Payment[]>('/payments/');
  }

  async getReceipt(paymentId: string): Promise<Payment> {
    return this.request<Payment>(`/payments/${paymentId}`);
  }

  // --- Pricing ---
  async getPricingRules(facilityId?: string): Promise<PricingRule[]> {
    const qs = facilityId ? `?facility_id=${facilityId}` : '';
    return this.request<PricingRule[]>(`/pricing/${qs}`);
  }

  async createPricingRule(data: Partial<PricingRule>): Promise<PricingRule> {
    return this.request<PricingRule>('/pricing/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePricingRule(id: string, data: Partial<PricingRule>): Promise<PricingRule> {
    return this.request<PricingRule>(`/pricing/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async estimatePrice(data: {
    facility_id: string;
    vehicle_type: string;
    start_time: string;
    end_time: string;
  }): Promise<PriceEstimateResponse> {
    return this.request<PriceEstimateResponse>('/pricing/estimate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // --- Complaints ---
  async submitComplaint(data: {
    facility_id?: string;
    category: string;
    title: string;
    description: string;
  }): Promise<Complaint> {
    return this.request<Complaint>('/complaints/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getComplaints(status?: string): Promise<Complaint[]> {
    const qs = status ? `?status=${status}` : '';
    return this.request<Complaint[]>(`/complaints/${qs}`);
  }

  async updateComplaintStatus(id: string, data: {
    status: string;
    note?: string;
    assigned_staff_id?: string;
    resolution_notes?: string;
  }): Promise<Complaint> {
    return this.request<Complaint>(`/complaints/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // --- Users (Admin) ---
  async getUsers(search?: string, role?: string): Promise<User[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (role) params.append('role', role);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request<User[]>(`/users/${qs}`);
  }

  async updateUserStatus(id: string, data: Partial<User>): Promise<User> {
    return this.request<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // --- Reports & Analytics (Admin & Staff) ---
  async getAnalytics(): Promise<AnalyticsSummary> {
    return this.request<AnalyticsSummary>('/reports/analytics');
  }

  async getAuditLogs(limit = 50): Promise<AuditLogItem[]> {
    return this.request<AuditLogItem[]>(`/reports/audit-logs?limit=${limit}`);
  }

  getExportCsvUrl(type: 'reservations' | 'sessions' | 'payments'): string {
    return `${API_BASE}/reports/export-csv?report_type=${type}`;
  }
}

export const api = new ApiService();
