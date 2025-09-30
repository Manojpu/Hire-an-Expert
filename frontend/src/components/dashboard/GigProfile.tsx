import React, { useState } from 'react';
import { ExpertGig, gigServiceAPI } from '@/services/gigService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Save, Edit, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface GigProfileProps {
  gig: ExpertGig;
  onUpdate: (gig: ExpertGig) => void;
}

const GigProfile: React.FC<GigProfileProps> = ({ gig, onUpdate }) => {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: gig.title,
    bio: gig.bio || '',
    service_description: gig.service_description || '',
    hourly_rate: gig.hourly_rate,
    availability_preferences: gig.availability_preferences || '',
    category: gig.category,
    languages: gig.languages.join(', '),
    education: gig.education || '',
    experience: gig.experience || ''
  });

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const updateData = {
        ...formData,
        languages: formData.languages.split(',').map(lang => lang.trim()).filter(Boolean)
      };
      
      const updatedGig = await gigServiceAPI.updateGig(gig.id, updateData);
      onUpdate(updatedGig);
      setEditing(false);
    } catch (error) {
      console.error('Error updating gig:', error);
      alert('Failed to update gig profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      title: gig.title,
      bio: gig.bio || '',
      service_description: gig.service_description || '',
      hourly_rate: gig.hourly_rate,
      availability_preferences: gig.availability_preferences || '',
      category: gig.category,
      languages: gig.languages.join(', '),
      education: gig.education || '',
      experience: gig.experience || ''
    });
    setEditing(false);
  };

  const getStatusColor = (status: ExpertGig['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'draft': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Gig Profile</h1>
            <p className="text-muted-foreground">Manage your gig information and settings</p>
          </div>
          <div className="flex items-center gap-2">
            {gig.status === 'active' ? (
              <Button variant="outline" size="sm">
                <EyeOff className="h-4 w-4 mr-2" />
                Make Inactive
              </Button>
            ) : (
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Make Active
              </Button>
            )}
            {!editing ? (
              <Button onClick={() => setEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCancel} disabled={saving}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Status Info */}
        <div className="flex items-center gap-4">
          <Badge className={getStatusColor(gig.status)}>
            {gig.status}
          </Badge>
          <span className="text-sm text-muted-foreground">
            Created: {new Date(gig.created_at).toLocaleDateString()}
          </span>
          {gig.approved_at && (
            <span className="text-sm text-muted-foreground">
              Approved: {new Date(gig.approved_at).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {/* Status Alerts */}
      {gig.status !== 'active' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-800">Gig Status: {gig.status}</h3>
              <p className="text-sm text-yellow-700 mt-1">
                {gig.status === 'pending' && 'Your gig is under review. You\'ll be notified once it\'s approved.'}
                {gig.status === 'draft' && 'Complete your gig setup and submit it for review.'}
                {gig.status === 'inactive' && 'Your gig is not visible to clients. Activate it to start receiving bookings.'}
                {gig.status === 'rejected' && 'Your gig was rejected. Please review the feedback and resubmit.'}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Gig Title</label>
              {editing ? (
                <Input
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="Professional title for your gig"
                />
              ) : (
                <div className="mt-1 p-2 bg-gray-50 rounded border">{gig.title}</div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">Category</label>
              {editing ? (
                <Select value={formData.category} onValueChange={(value) => handleChange('category', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="automobile-advice">Automobile Advice</SelectItem>
                    <SelectItem value="electronic-device-advice">Electronic Device Advice</SelectItem>
                    <SelectItem value="home-appliance-guidance">Home Appliance Guidance</SelectItem>
                    <SelectItem value="education-career-guidance">Education & Career Guidance</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="mt-1 p-2 bg-gray-50 rounded border capitalize">
                  {gig.category.replace('-', ' ')}
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">Bio</label>
              {editing ? (
                <Textarea
                  value={formData.bio}
                  onChange={(e) => handleChange('bio', e.target.value)}
                  placeholder="Brief introduction about yourself"
                  rows={3}
                />
              ) : (
                <div className="mt-1 p-2 bg-gray-50 rounded border min-h-[80px]">
                  {gig.bio || 'No bio provided'}
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">Languages</label>
              {editing ? (
                <Input
                  value={formData.languages}
                  onChange={(e) => handleChange('languages', e.target.value)}
                  placeholder="English, Sinhala, Tamil (comma separated)"
                />
              ) : (
                <div className="mt-1 p-2 bg-gray-50 rounded border">
                  {gig.languages.join(', ')}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Service Details */}
        <Card>
          <CardHeader>
            <CardTitle>Service Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Service Description</label>
              {editing ? (
                <Textarea
                  value={formData.service_description}
                  onChange={(e) => handleChange('service_description', e.target.value)}
                  placeholder="Detailed description of your service"
                  rows={4}
                />
              ) : (
                <div className="mt-1 p-2 bg-gray-50 rounded border min-h-[100px]">
                  {gig.service_description || 'No description provided'}
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">Hourly Rate (Rs.)</label>
              {editing ? (
                <Input
                  type="number"
                  value={formData.hourly_rate}
                  onChange={(e) => handleChange('hourly_rate', Number(e.target.value))}
                  min="0"
                />
              ) : (
                <div className="mt-1 p-2 bg-gray-50 rounded border">
                  Rs. {gig.hourly_rate.toLocaleString()}/hour
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">Availability Preferences</label>
              {editing ? (
                <Textarea
                  value={formData.availability_preferences}
                  onChange={(e) => handleChange('availability_preferences', e.target.value)}
                  placeholder="Your preferred working hours and availability"
                  rows={3}
                />
              ) : (
                <div className="mt-1 p-2 bg-gray-50 rounded border min-h-[80px]">
                  {gig.availability_preferences || 'No preferences specified'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Qualifications */}
        <Card>
          <CardHeader>
            <CardTitle>Qualifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Education</label>
              {editing ? (
                <Textarea
                  value={formData.education}
                  onChange={(e) => handleChange('education', e.target.value)}
                  placeholder="Your educational background"
                  rows={3}
                />
              ) : (
                <div className="mt-1 p-2 bg-gray-50 rounded border min-h-[80px]">
                  {gig.education || 'No education details provided'}
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">Experience</label>
              {editing ? (
                <Textarea
                  value={formData.experience}
                  onChange={(e) => handleChange('experience', e.target.value)}
                  placeholder="Your relevant work experience"
                  rows={3}
                />
              ) : (
                <div className="mt-1 p-2 bg-gray-50 rounded border min-h-[80px]">
                  {gig.experience || 'No experience details provided'}
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">Certifications</label>
              <div className="mt-1 p-2 bg-gray-50 rounded border">
                {gig.certifications && gig.certifications.length > 0 
                  ? gig.certifications.join(', ')
                  : 'No certifications uploaded'
                }
              </div>
              {editing && (
                <Button variant="outline" size="sm" className="mt-2">
                  Upload Certificates
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-2xl font-bold">{gig.rating.toFixed(1)}</div>
                <div className="text-sm text-muted-foreground">Average Rating</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{gig.total_reviews}</div>
                <div className="text-sm text-muted-foreground">Total Reviews</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{gig.total_consultations}</div>
                <div className="text-sm text-muted-foreground">Consultations</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{gig.response_time}</div>
                <div className="text-sm text-muted-foreground">Response Time</div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Verification Status</span>
                <Badge variant={gig.is_verified ? "default" : "secondary"}>
                  {gig.is_verified ? "Verified" : "Unverified"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GigProfile;
