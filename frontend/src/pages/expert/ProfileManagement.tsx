import React from 'react';
import ProfileSettings from '@/components/dashboard/ProfileSettings';
import { mockExpertData } from '@/data/mockExpertData';

const ProfileManagement: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Profile Settings</h1>
      <ProfileSettings initial={mockExpertData.expert} onSave={(data) => console.log('save', data)} />
    </div>
  );
};

export default ProfileManagement;
