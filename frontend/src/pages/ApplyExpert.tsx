
import React, { useState } from 'react';
import ProgressStepper from '@/components/expert/ProgressStepper';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import ProfileSettings from '@/components/dashboard/ProfileSettings';

const ApplyExpert: React.FC = () => {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<any>({});

  const next = () => setStep(s => Math.min(steps.length - 1, s + 1));
  const prev = () => setStep(s => Math.max(0, s - 1));

  const handleChange = (key: string, value: any) => setForm((f: any) => ({ ...f, [key]: value }));

  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-3 mb-4">
          <ProgressStepper current={step} />
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white border border-border rounded-lg p-6 shadow-sm">
            {step === 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm">Full Name</label>
                    <Input value={form.name || ''} onChange={(e) => handleChange('name', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm">Professional Headline</label>
                    <Input value={form.title || ''} onChange={(e) => handleChange('title', e.target.value)} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm">Bio</label>
                    <Textarea value={form.bio || ''} onChange={(e) => handleChange('bio', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm">Profile Photo</label>
                    <Input type="file" onChange={(e: any) => handleChange('photo', e.target.files?.[0])} />
                  </div>
                  <div>
                    <label className="text-sm">Cover Image</label>
                    <Input type="file" onChange={(e: any) => handleChange('cover', e.target.files?.[0])} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm">Languages (comma separated)</label>
                    <Input value={form.languages || ''} onChange={(e) => handleChange('languages', e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Expertise & Services</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm">Categories (comma separated)</label>
                    <Input value={form.categories || ''} onChange={(e) => handleChange('categories', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm">Service Description</label>
                    <Textarea value={form.serviceDesc || ''} onChange={(e) => handleChange('serviceDesc', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm">Hourly Rate (Rs.)</label>
                    <Input type="number" value={form.rate || ''} onChange={(e) => handleChange('rate', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm">Availability Preferences</label>
                    <Input value={form.availabilityNotes || ''} onChange={(e) => handleChange('availabilityNotes', e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Qualifications</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm">Education</label>
                    <Textarea value={form.education || ''} onChange={(e) => handleChange('education', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm">Certifications (upload)</label>
                    <Input type="file" multiple onChange={(e: any) => handleChange('certs', e.target.files)} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm">Work Experience</label>
                    <Textarea value={form.experience || ''} onChange={(e) => handleChange('experience', e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Verification Documents</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm">Government ID</label>
                    <Input type="file" onChange={(e: any) => handleChange('govId', e.target.files?.[0])} />
                  </div>
                  <div>
                    <label className="text-sm">Professional License (if applicable)</label>
                    <Input type="file" onChange={(e: any) => handleChange('license', e.target.files?.[0])} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm">Reference Contacts</label>
                    <Input value={form.references || ''} onChange={(e) => handleChange('references', e.target.value)} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm">Background Check Consent</label>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={!!form.bgConsent} onChange={(e) => handleChange('bgConsent', e.target.checked)} />
                      <span className="text-sm text-muted-foreground">I consent to a background check</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Review & Submit</h2>
                <div className="space-y-3">
                  <div className="bg-gray-50 p-3 rounded">Summary: {JSON.stringify(form, null, 2)}</div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={!!form.tos} onChange={(e) => handleChange('tos', e.target.checked)} />
                    <span className="text-sm">I agree to the terms of service</span>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-between">
              <div>
                {step > 0 && <Button variant="ghost" onClick={prev}>Back</Button>}
              </div>
              <div className="flex gap-2">
                {step < 4 && <Button onClick={next}>Next</Button>}
                {step === 4 && <Button onClick={() => alert('Submitted')}>Submit Application</Button>}
              </div>
            </div>
          </div>
        </div>

        <div className="hidden lg:block">
          <div className="sticky top-20 bg-white border border-border rounded-lg p-6 shadow-sm">
            <h3 className="font-semibold mb-2">Application Status</h3>
            <p className="text-sm text-muted-foreground">Not submitted</p>
            <div className="mt-4 text-sm">
              <div className="mb-2">Estimated review time: 2-3 business days</div>
              <div className="mb-2">Progress: {step}/5</div>
              <div className="mb-2">Admin feedback: None</div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};


const steps = ['Basic Information','Expertise & Services','Qualifications','Verification Documents','Review & Submit'];

export default ApplyExpert;

