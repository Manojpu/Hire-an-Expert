export const mockExpertData = {
  expert: {
    id: 'expert_001',
    name: 'Dr. Sarah Johnson',
    title: 'Senior Automotive Engineer',
    email: 'sarah.johnson@example.com',
    phone: '+94771234567',
    profileImage: '/assets/hero-technology.jpg',
    bannerImage: '/assets/hero-success.jpg',
    bio: 'With over 15 years of experience in automotive engineering...',
    location: 'Colombo, Sri Lanka',
    languages: ['English', 'Sinhala', 'Tamil'],
    rating: 4.8,
    totalReviews: 127,
    totalConsultations: 456,
    joinDate: '2022-03-15',
    verified: true,
    categories: ['automobile-advice']
  },
  earnings: {
    today: 12500,
    week: 45200,
    month: 186750,
    total: 745620,
    growth: { daily: 15.2, weekly: 8.7, monthly: 23.1 },
    chartData: [
      { date: '2024-07-25', revenue: 8500, bookings: 3 },
      { date: '2024-07-26', revenue: 12000, bookings: 4 },
      { date: '2024-07-27', revenue: 6000, bookings: 2 },
      { date: '2024-07-28', revenue: 18000, bookings: 6 }
    ]
  },
  bookingRequests: [
    {
      id: 'booking_001',
      client: { id: 'client_001', name: 'John Smith', avatar: '/assets/placeholder.svg', rating: 4.6 },
      service: 'Vehicle Purchase Consultation',
      dateTime: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
      duration: 60,
      type: 'online',
      amount: 2500,
      description: 'Need advice on buying a hybrid car under 8 million budget',
      status: 'pending',
      createdAt: new Date().toISOString()
    }
  ],
  upcomingBookings: [
    {
      id: 'booking_002',
      client: { id: 'client_002', name: 'Mary Fernando', avatar: '/assets/placeholder.svg' },
      service: 'Car Repair Diagnosis',
      dateTime: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(),
      duration: 45,
      type: 'physical',
      amount: 1875,
      status: 'confirmed',
      meetingLink: null,
      location: 'Colombo 03',
      notes: 'Engine making unusual noise'
    }
  ],
  completed: [] ,
  services: [],
  metrics: {
    responseTime: '< 2 hours',
    completionRate: 94.5,
    clientRetention: 78.2
  }
};
