import React, { useState, useEffect } from 'react';
import Header from '@/components/navigation/Header';
import Footer from '@/components/ui/footer';
import { useAuth } from '@/context/AuthContext';
import { getBookings, capturePayment, Booking } from '@/lib/bookings';
import { MOCK_EXPERTS } from '@/data/mockExperts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

const ClientDashboard = () => {
  const { state } = useAuth();
  const userId = state.user?.id;

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [favorites, setFavorites] = useState<Array<{
    id: string;
    name: string;
    title?: string;
    profileImage?: string;
  }>>([]);

  // load bookings for current user and refresh on storage events
  useEffect(() => {
    if (!userId) {
      setBookings([]);
      return;
    }

    const load = () => {
      const all = getBookings();
      setBookings(all.filter((b) => b.clientId === userId));
    };

    load();
    const handler = () => load();
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [userId]);

  // load favorites from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('consultify_wishlist_v1');
      if (!raw) {
        setFavorites([]);
        return;
      }
      const list = JSON.parse(raw) as Array<{ expertId: string }>;

      type FavoriteType = { id: string; name: string; title?: string; profileImage?: string };
      const mapped = list.reduce<FavoriteType[]>((acc, i) => {
        const ex = MOCK_EXPERTS.find((e) => e.id === i.expertId || e.slug === i.expertId);
        if (!ex) return acc;
        const title = (ex as unknown as { title?: string }).title;
        const profileImage = (ex as unknown as { profileImage?: string }).profileImage;
        acc.push({ id: ex.id, name: ex.name, title, profileImage });
        return acc;
      }, []);
      setFavorites(mapped);
    } catch (e) {
      setFavorites([]);
    }
  }, [userId]);

  const upcoming = bookings.filter((b) => b.status === 'pending' || b.status === 'approved' || b.status === 'confirmed');
  const history = bookings.filter((b) => b.status === 'completed' || b.status === 'cancelled');

  const handlePay = (bookingId: string, amount: number) => {
    capturePayment(bookingId, amount);
    window.dispatchEvent(new Event('storage'));
  };

  if (!state.user) {
    return (
      <div className="min-h-screen bg-background">
        {/* <Header /> */}
        <main className="container mx-auto px-4 py-12">Please sign in to view your dashboard.</main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* <Header /> */}

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {state.user.name.split(' ')[0]}</h1>
            <p className="text-sm text-muted-foreground">Here's your personalized dashboard</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Consultations</CardTitle>
              </CardHeader>
              <CardContent>
                {upcoming.length === 0 ? (
                  <div className="text-muted-foreground">No upcoming consultations</div>
                ) : (
                  <div className="space-y-3">
                    {upcoming.map((b) => {
                      const expert = MOCK_EXPERTS.find((e) => e.id === b.expertId) || MOCK_EXPERTS.find((e) => e.userId === b.expertId);
                      return (
                        <div key={b.id} className="flex items-center justify-between border rounded p-3">
                          <div>
                            <div className="font-medium">{b.service} {expert ? `— ${expert.name}` : ''}</div>
                            <div className="text-sm text-muted-foreground">{format(new Date(b.dateTime), 'PPP p')}</div>
                            <div className="text-sm text-muted-foreground">Status: {b.status}</div>
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            <div className="text-sm">Rs. {b.amount}</div>
                            {b.status === 'approved' && (
                              <Button size="sm" onClick={() => handlePay(b.id, b.amount)}>Pay & Confirm</Button>
                            )}
                            {b.status === 'confirmed' && b.meetingLink && (
                              <a href={b.meetingLink} target="_blank" rel="noreferrer"><Button size="sm">Join Meeting</Button></a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Consultation History</CardTitle>
              </CardHeader>
              <CardContent>
                {history.length === 0 ? (
                  <div className="text-muted-foreground">No past consultations</div>
                ) : (
                  <div className="space-y-3">
                    {history.map((b) => {
                      const expert = MOCK_EXPERTS.find((e) => e.id === b.expertId) || MOCK_EXPERTS.find((e) => e.userId === b.expertId);
                      return (
                        <div key={b.id} className="flex items-center justify-between border rounded p-3">
                          <div>
                            <div className="font-medium">{b.service} {expert ? `— ${expert.name}` : ''}</div>
                            <div className="text-sm text-muted-foreground">{format(new Date(b.dateTime), 'PPP p')}</div>
                            <div className="text-sm text-muted-foreground">Status: {b.status}</div>
                          </div>
                          <div className="text-sm">Rs. {b.amount}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Favorites</CardTitle>
              </CardHeader>
              <CardContent>
                {favorites.length === 0 ? (
                  <div className="text-muted-foreground">You have no favorite experts yet.</div>
                ) : (
                  <div className="space-y-3">
                    {favorites.map((e) => (
                      <div key={e.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100">
                            <img src={e.profileImage} alt={e.name} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <div className="font-medium">{e.name}</div>
                            <div className="text-xs text-muted-foreground">{e.title}</div>
                          </div>
                        </div>
                        <div>
                          <LinkToExpertButton expertId={e.id} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recommended for you</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {MOCK_EXPERTS.slice(0, 4).map((e) => (
                    <div key={e.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100">
                          <img src={e.profileImage} alt={e.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <div className="font-medium">{e.name}</div>
                          <div className="text-xs text-muted-foreground">{e.title}</div>
                        </div>
                      </div>
                      <LinkToExpertButton expertId={e.id} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
};

const LinkToExpertButton = ({ expertId }: { expertId: string }) => {
  return (
    <a href={`/expert/${expertId}`} className="text-sm">
      <Button variant="outline" size="sm">View</Button>
    </a>
  );
};

export default ClientDashboard;
