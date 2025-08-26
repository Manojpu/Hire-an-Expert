import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Upload } from 'lucide-react';

interface ExpertProfile {
  id?: string;
  userId?: string;
  name: string;
  title: string;
  slug: string;
  categories: string[];
  subcategories: string[];
  profileImage: string;
  bannerImage: string;
  bio: string;
  pricing: {
    hourlyRate: number;
    currency: string;
  };
  languages: string[];
  responseTime?: string;
}

const ProfileSettings: React.FC<{ initial?: ExpertProfile; onSave?: (data: ExpertProfile) => void }> = ({ initial, onSave }) => {
  const defaultData: ExpertProfile = {
    name: '',
    title: '',
    slug: '',
    categories: [],
    subcategories: [],
    profileImage: '',
    bannerImage: '',
    bio: '',
    pricing: {
      hourlyRate: 0,
      currency: 'LKR'
    },
    languages: []
  };

  const [data, setData] = useState<ExpertProfile>({
    ...defaultData,
    ...initial
  });
  const [editing, setEditing] = useState(false);
  const [newLanguage, setNewLanguage] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newSubcategory, setNewSubcategory] = useState('');

  const handleSave = () => {
    if (editing) {
      // Generate slug if not present
      const updatedData = {
        ...data,
        slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-')
      };
      onSave?.(updatedData);
    }
    setEditing(e => !e);
  };

  const handleImageUpload = (type: 'profile' | 'banner') => {
    // Implement image upload logic here
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          setData(d => ({
            ...d,
            [type === 'profile' ? 'profileImage' : 'bannerImage']: reader.result as string
          }));
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="bg-background/60 backdrop-blur-sm border border-border/50 rounded-xl p-6 shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
            Basic Information
          </h3>
          <Button
            variant={editing ? 'default' : 'outline'}
            onClick={handleSave}
            className={editing ? 'bg-primary hover:bg-primary/90' : 'hover:border-primary/50'}
          >
            {editing ? 'Save Changes' : 'Edit Profile'}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Images */}
          <div className="md:col-span-2 flex gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium">Profile Image</label>
              <div className="relative w-32 h-32 rounded-xl overflow-hidden bg-background/80 border border-border/50">
                {data.profileImage ? (
                  <img src={data.profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">No image</div>
                )}
                {editing && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute bottom-2 right-2 bg-background/80 backdrop-blur-sm hover:bg-background/90"
                    onClick={() => handleImageUpload('profile')}
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <div className="space-y-2 flex-1">
              <label className="block text-sm font-medium">Banner Image</label>
              <div className="relative h-32 rounded-xl overflow-hidden bg-background/80 border border-border/50">
                {data.bannerImage ? (
                  <img src={data.bannerImage} alt="Banner" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">No banner</div>
                )}
                {editing && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute bottom-2 right-2 bg-background/80 backdrop-blur-sm hover:bg-background/90"
                    onClick={() => handleImageUpload('banner')}
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Full Name</label>
            <Input
              value={data.name}
              onChange={(e) => setData(d => ({ ...d, name: e.target.value }))}
              disabled={!editing}
              className="bg-background/80 backdrop-blur-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Professional Title</label>
            <Input
              value={data.title}
              onChange={(e) => setData(d => ({ ...d, title: e.target.value }))}
              disabled={!editing}
              className="bg-background/80 backdrop-blur-sm"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1.5">Bio</label>
            <Textarea
              value={data.bio}
              onChange={(e) => setData(d => ({ ...d, bio: e.target.value }))}
              disabled={!editing}
              className="bg-background/80 backdrop-blur-sm h-32"
              placeholder="Tell us about your expertise and experience..."
            />
          </div>
        </div>
      </div>

      {/* Expertise */}
      <div className="bg-background/60 backdrop-blur-sm border border-border/50 rounded-xl p-6 shadow-lg">
        <h3 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70 mb-6">
          Expertise & Categories
        </h3>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Main Categories</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {(data.categories || []).map((category, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="px-3 py-1.5 text-sm bg-primary/10 text-primary"
                >
                  {category}
                  {editing && (
                    <button
                      className="ml-2 hover:text-primary/80"
                      onClick={() => setData(d => ({
                        ...d,
                        categories: d.categories.filter((_, i) => i !== index)
                      }))}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))}
            </div>
            {editing && (
              <div className="flex gap-2">
                <Input
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Add a category"
                  className="bg-background/80 backdrop-blur-sm"
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    if (newCategory) {
                      setData(d => ({
                        ...d,
                        categories: [...(d.categories || []), newCategory]
                      }));
                      setNewCategory('');
                    }
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Subcategories</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {(data.subcategories || []).map((subcategory, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="px-3 py-1.5 text-sm border-primary/20"
                >
                  {subcategory}
                  {editing && (
                    <button
                      className="ml-2 hover:text-primary/80"
                      onClick={() => setData(d => ({
                        ...d,
                        subcategories: d.subcategories.filter((_, i) => i !== index)
                      }))}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))}
            </div>
            {editing && (
              <div className="flex gap-2">
                <Input
                  value={newSubcategory}
                  onChange={(e) => setNewSubcategory(e.target.value)}
                  placeholder="Add a subcategory"
                  className="bg-background/80 backdrop-blur-sm"
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    if (newSubcategory) {
                      setData(d => ({
                        ...d,
                        subcategories: [...(d.subcategories || []), newSubcategory]
                      }));
                      setNewSubcategory('');
                    }
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pricing & Languages */}
      <div className="bg-background/60 backdrop-blur-sm border border-border/50 rounded-xl p-6 shadow-lg">
        <h3 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70 mb-6">
          Pricing & Languages
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-1.5">Hourly Rate (LKR)</label>
            <Input
              type="number"
              value={data.pricing?.hourlyRate || 0}
              onChange={(e) => setData(d => ({
                ...d,
                pricing: { ...d.pricing, hourlyRate: Number(e.target.value) }
              }))}
              disabled={!editing}
              className="bg-background/80 backdrop-blur-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Response Time</label>
            <Input
              value={data.responseTime}
              onChange={(e) => setData(d => ({ ...d, responseTime: e.target.value }))}
              disabled={!editing}
              placeholder="e.g., < 8 hours"
              className="bg-background/80 backdrop-blur-sm"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Languages</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {(data.languages || []).map((language, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="px-3 py-1.5 text-sm bg-primary/10 text-primary"
                >
                  {language}
                  {editing && (
                    <button
                      className="ml-2 hover:text-primary/80"
                      onClick={() => setData(d => ({
                        ...d,
                        languages: d.languages.filter((_, i) => i !== index)
                      }))}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))}
            </div>
            {editing && (
              <div className="flex gap-2">
                <Input
                  value={newLanguage}
                  onChange={(e) => setNewLanguage(e.target.value)}
                  placeholder="Add a language"
                  className="bg-background/80 backdrop-blur-sm"
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    if (newLanguage) {
                      setData(d => ({
                        ...d,
                        languages: [...(d.languages || []), newLanguage]
                      }));
                      setNewLanguage('');
                    }
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
export default ProfileSettings;
