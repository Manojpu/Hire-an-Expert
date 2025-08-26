import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, Video, FileText, CreditCard, MessageCircle } from 'lucide-react';
import { format, addDays, isSameDay } from 'date-fns';
import Header from '@/components/navigation/Header';
import Footer from '@/components/ui/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { experts } from '@/data/mockData';

const Booking = () => {
  const { expertId } = useParams();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [duration, setDuration] = useState('60');
  const [meetingType, setMeetingType] = useState('online');
  const [description, setDescription] = useState('');
  const [specialRequirements, setSpecialRequirements] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const expert = experts.find(exp => exp.id === expertId);

  if (!expert) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">Expert not found</h1>
            <Button onClick={() => navigate('/')} className="mt-4">
              Back to Home
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Generate next 7 days
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));

  // Mock available time slots
  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30'
  ];

  const durationOptions = [
    { value: '30', label: '30 minutes', multiplier: 0.5 },
    { value: '60', label: '1 hour', multiplier: 1 },
    { value: '90', label: '1.5 hours', multiplier: 1.5 },
    { value: '120', label: '2 hours', multiplier: 2 },
  ];

  const selectedDurationOption = durationOptions.find(d => d.value === duration);
  const totalAmount = selectedDurationOption 
    ? expert.pricing.hourlyRate * selectedDurationOption.multiplier 
    : expert.pricing.hourlyRate;

  const platformFee = Math.round(totalAmount * 0.05); // 5% platform fee
  const finalAmount = totalAmount + platformFee;

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime || !description.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast({
      title: 'Booking Request Sent!',
      description: `Your booking request has been sent to ${expert.name}. You'll receive a confirmation shortly.`,
    });

    navigate('/my-bookings');
  };

  return (
    <div className="min-h-screen bg-background container ">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Breadcrumb */}
          <div className="mb-6 text-sm text-muted-foreground">
            <span>Book Consultation</span>
            <span className="mx-2">•</span>
            <span className="text-foreground">{expert.name}</span>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Booking Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Date Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Select Date & Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Date Grid */}
                  <div className="grid grid-cols-7 gap-2 mb-6">
                    {weekDays.map((day) => {
                      const isSelected = selectedDate && isSameDay(day, selectedDate);
                      const isToday = isSameDay(day, new Date());
                      
                      return (
                        <button
                          key={day.toISOString()}
                          onClick={() => setSelectedDate(day)}
                          className={`p-3 text-center rounded-lg border transition-colors ${
                            isSelected 
                              ? 'border-primary bg-primary text-primary-foreground' 
                              : 'border-border hover:bg-muted'
                          } ${isToday ? 'font-semibold' : ''}`}
                        >
                          <div className="text-xs text-muted-foreground">
                            {format(day, 'EEE')}
                          </div>
                          <div className="text-sm">
                            {format(day, 'dd')}
                          </div>
                          <div className="text-xs">
                            {format(day, 'MMM')}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Time Slots */}
                  {selectedDate && (
                    <div>
                      <h4 className="font-medium mb-3">Available Times</h4>
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                        {timeSlots.map((time) => {
                          const isSelected = selectedTime === time;
                          // Mock some slots as booked
                          const isBooked = Math.random() > 0.7;
                          
                          return (
                            <button
                              key={time}
                              onClick={() => !isBooked && setSelectedTime(time)}
                              disabled={isBooked}
                              className={`p-2 text-sm rounded border transition-colors ${
                                isSelected
                                  ? 'border-primary bg-primary text-primary-foreground'
                                  : isBooked
                                  ? 'border-border bg-muted text-muted-foreground cursor-not-allowed'
                                  : 'border-border hover:bg-muted'
                              }`}
                            >
                              {time}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Consultation Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Consultation Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Duration */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Duration *</Label>
                    <Select value={duration} onValueChange={setDuration}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {durationOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Meeting Type */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Meeting Type *</Label>
                    <RadioGroup value={meetingType} onValueChange={setMeetingType} className="flex gap-6">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="online" id="online" />
                        <Label htmlFor="online" className="flex items-center gap-2 cursor-pointer">
                          <Video className="h-4 w-4" />
                          Online (Video Call)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="physical" id="physical" />
                        <Label htmlFor="physical" className="flex items-center gap-2 cursor-pointer">
                          <MapPin className="h-4 w-4" />
                          In-Person
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Description */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      Consultation Description *
                    </Label>
                    <Textarea
                      placeholder="Please describe what you'd like to discuss, any specific questions, or areas you need help with..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                    />
                  </div>

                  {/* Special Requirements */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      Special Requirements (Optional)
                    </Label>
                    <Textarea
                      placeholder="Any special requirements, accessibility needs, or additional information..."
                      value={specialRequirements}
                      onChange={(e) => setSpecialRequirements(e.target.value)}
                      rows={2}
                    />
                  </div>

                  {/* Language */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Preferred Language</Label>
                    <Select defaultValue={expert.languages[0]}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {expert.languages.map((lang) => (
                          <SelectItem key={lang} value={lang}>
                            {lang}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Submit Button */}
              <div className="flex gap-4">
                <Button
                  onClick={handleSubmit}
                  size="lg"
                  className="flex-1"
                  disabled={isSubmitting || !selectedDate || !selectedTime}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                      Sending Request...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Request Booking
                    </>
                  )}
                </Button>
                <Button variant="outline" size="lg">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Chat First
                </Button>
              </div>

              <div className="text-sm text-muted-foreground">
                ✓ Your booking request will be sent to the expert for approval<br />
                ✓ You'll receive a confirmation email once approved<br />
                ✓ Payment will be processed after expert approval
              </div>
            </div>

            {/* Booking Summary Sidebar */}
            <div className="space-y-6">
              {/* Expert Summary */}
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Booking Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Expert Info */}
                  <div className="flex items-center gap-3">
                    <img
                      src={expert.profileImage}
                      alt={expert.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <h4 className="font-medium">{expert.name}</h4>
                      <p className="text-sm text-muted-foreground">{expert.title}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-sm">⭐ {expert.rating}</span>
                        <span className="text-sm text-muted-foreground">
                          ({expert.totalReviews} reviews)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Booking Details */}
                  <div className="space-y-2 text-sm border-t border-border pt-4">
                    {selectedDate && (
                      <div className="flex justify-between">
                        <span>Date:</span>
                        <span className="font-medium">{format(selectedDate, 'MMM dd, yyyy')}</span>
                      </div>
                    )}
                    {selectedTime && (
                      <div className="flex justify-between">
                        <span>Time:</span>
                        <span className="font-medium">{selectedTime}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span className="font-medium">
                        {durationOptions.find(d => d.value === duration)?.label}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Type:</span>
                      <span className="font-medium capitalize">{meetingType}</span>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="space-y-2 text-sm border-t border-border pt-4">
                    <div className="flex justify-between">
                      <span>Hourly Rate:</span>
                      <span>LKR {expert.pricing.hourlyRate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span>{selectedDurationOption?.label}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>LKR {totalAmount}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Platform Fee (5%):</span>
                      <span>LKR {platformFee}</span>
                    </div>
                    <div className="flex justify-between font-medium text-lg border-t border-border pt-2">
                      <span>Total:</span>
                      <span className="text-primary">LKR {finalAmount}</span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center justify-center">
                    <Badge 
                      variant={expert.status === 'available' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {expert.status === 'available' ? 'Available Now' : 'Will respond soon'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Process Flow */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Booking Process</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                      <span>1. Request sent to expert</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-muted"></div>
                      <span>2. Expert reviews & accepts</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-muted"></div>
                      <span>3. Payment processed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-muted"></div>
                      <span>4. Consultation confirmed</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Booking;