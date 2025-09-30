import React, { useState } from "react";
import { useAuth } from "@/context/auth/AuthContext";
import ProgressStepper from "@/components/expert/ProgressStepper";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ExpertApplicationForm } from "@/types/expert";
import AvailabilityCalendar from "@/components/expert/AvailabilityCalendar";
import {
  convertApplicationToExpert,
  syncExpertData,
} from "@/utils/expertUtils";
import { convertFormToGigData, gigServiceAPI } from "@/services/gigService";
import { userServiceAPI } from "@/services/userService";
import { steps } from "@/components/expert/ProgressStepper";

const ApplyGig: React.FC = () => {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Partial<ExpertApplicationForm>>({
    availabilityRules: [],
  });
  const [categories, setCategories] = useState<{ id: number; name: string }[]>(
    []
  );

  // Fetch categories from backend on mount
  const [catLoading, setCatLoading] = useState(true);
  const [catError, setCatError] = useState<string | null>(null);
  React.useEffect(() => {
    async function fetchCategories() {
      setCatLoading(true);
      setCatError(null);
      try {
        // Use correct backend port for gig-service (likely 8002 or as per your docker-compose)
        const res = await fetch("http://localhost:8002/categories/categories/");
        if (!res.ok) throw new Error("Failed to fetch categories");
        const data = await res.json();
        setCategories(data);
      } catch (e) {
        setCatError("Could not load categories");
        setCategories([]);
        console.error("Error fetching categories:", e);
      } finally {
        setCatLoading(false);
      }
    }
    fetchCategories();
  }, []);

  const next = () => setStep((s) => Math.min(steps.length - 1, s + 1));
  const prev = () => setStep((s) => Math.max(0, s - 1));

  const handleChange = (
    key: keyof ExpertApplicationForm,
    value: string | number | boolean | File | FileList | null | Array<any>
  ) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async () => {
    // Only validate and send the required fields for gig application
    const requiredFields = [
      "category_id",
      "serviceDesc",
      "rate",
      "availabilityNotes",
      "expertise_areas",
      "qualificationDocs",
      "experience_years",
      "experience",
      "govId",
      "license",
      "references",
      "bgConsent",
      "tos",
    ];
    const filteredForm: Partial<ExpertApplicationForm> = {};
    requiredFields.forEach((key) => {
      // @ts-ignore
      filteredForm[key] = form[key];
    });

    // Custom minimal validation for only required fields
    const errors: string[] = [];
    if (!filteredForm.category_id)
      errors.push("Category selection is required");
    if (!filteredForm.rate || Number(filteredForm.rate) <= 0)
      errors.push("Valid hourly rate is required");
    if (!filteredForm.bgConsent)
      errors.push("Background check consent is required");
    if (!filteredForm.tos)
      errors.push("Terms of service acceptance is required");
    if (errors.length > 0) {
      alert("Please fix the following errors:\n" + errors.join("\n"));
      return;
    }

    try {
      // 1. Upload verification documents to user service
      let governmentIdUrl = "";
      let licenseUrl = "";

      if (!user) {
        alert("You must be logged in to submit an application.");
        return;
      }
      const token = await user.getIdToken();

      if (filteredForm.govId) {
        const govRes = await userServiceAPI.uploadVerificationDocument(
          filteredForm.govId as File,
          "government_id",
          token
        );
        governmentIdUrl = govRes.url || govRes.file_url || "";
      }
      if (filteredForm.license) {
        const licRes = await userServiceAPI.uploadVerificationDocument(
          filteredForm.license as File,
          "professional_license",
          token
        );
        licenseUrl = licRes.url || licRes.file_url || "";
      }

      // 2. Prepare gig data for gig service
      const gigData = convertFormToGigData({
        ...filteredForm,
      });

      // 3. Submit to Gig Service
      const createdGig = await gigServiceAPI.create(gigData);

      // 5. Sync data across frontend components
      const expertData = convertApplicationToExpert(
        filteredForm,
        "current_user_id"
      );
      syncExpertData(expertData);

      alert(
        `Application submitted successfully! \n\nYour expert profile has been created and is pending approval.\nGig ID: ${createdGig.id}\nStatus: ${createdGig.status}`
      );
    } catch (error) {
      console.error("Error submitting application:", error);
      let errorMessage = "Failed to submit application. Please try again.";
      if (error instanceof Error) {
        errorMessage = `Failed to submit application: ${error.message}`;
      }
      alert(errorMessage);
      console.log("Form data:", filteredForm);
      console.log("Converted gig data:", convertFormToGigData(filteredForm));
    }
  };

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
                <h2 className="text-xl font-semibold mb-4">
                  Expertise & Services
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm">Category</label>
                    {catLoading ? (
                      <div className="text-sm text-muted-foreground">
                        Loading categories...
                      </div>
                    ) : catError ? (
                      <div className="text-sm text-red-500">{catError}</div>
                    ) : (
                      <select
                        value={form.category_id || ""}
                        onChange={(e) =>
                          handleChange("category_id", e.target.value)
                        }
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">Select a category</option>
                        {categories.length === 0 ? (
                          <option value="" disabled>
                            No categories found
                          </option>
                        ) : (
                          categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))
                        )}
                      </select>
                    )}
                  </div>
                  <div>
                    <label className="text-sm">Service Description</label>
                    <Textarea
                      value={form.serviceDesc || ""}
                      onChange={(e) =>
                        handleChange("serviceDesc", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm">Hourly Rate (Rs.)</label>
                    <Input
                      type="number"
                      value={form.rate || ""}
                      onChange={(e) => handleChange("rate", e.target.value)}
                    />
                  </div>
                  <div className="col-span-2 mt-4">
                    <label className="text-sm mb-2 block">
                      General Availability Notes
                    </label>
                    <Input
                      placeholder="E.g., Prefer evenings and weekends"
                      value={form.availabilityNotes || ""}
                      onChange={(e) =>
                        handleChange("availabilityNotes", e.target.value)
                      }
                    />
                  </div>
                  <div className="col-span-2 mt-4">
                    <AvailabilityCalendar
                      value={form.availabilityRules || []}
                      onChange={(rules) =>
                        handleChange("availabilityRules", rules)
                      }
                      submitImmediately={true}
                    />
                    <p className="text-sm text-muted-foreground mt-2">
                      Your availability is automatically saved as you add or
                      remove time slots.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Qualifications</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm">Expertise Areas</label>
                    <Textarea
                      value={form.expertise_areas || ""}
                      onChange={(e) =>
                        handleChange("expertise_areas", e.target.value)
                      }
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium">
                      Qualification Documents
                    </label>
                    <Input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png" // restrict to docs/images
                      multiple
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleChange(
                          "qualificationDocs",
                          e.target.files || null
                        )
                      }
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Upload certificates, diplomas, or relevant images (PDF,
                      JPG, PNG). You can select multiple files.
                    </p>
                  </div>
                  <div>
                    <label className="text-sm">Experience (in years)</label>
                    <Input
                      type="number"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleChange("experience_years", e.target.value)
                      }
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm">Work Experience</label>
                    <Textarea
                      value={form.experience || ""}
                      onChange={(e) =>
                        handleChange("experience", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">
                  Verification Documents
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm">Government ID</label>
                    <Input
                      type="file"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleChange("govId", e.target.files?.[0] || null)
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm">
                      Professional License (if applicable)
                    </label>
                    <Input
                      type="file"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleChange("license", e.target.files?.[0] || null)
                      }
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm">Reference Contacts</label>
                    <Input
                      value={form.references || ""}
                      onChange={(e) =>
                        handleChange("references", e.target.value)
                      }
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm">Background Check Consent</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!!form.bgConsent}
                        onChange={(e) =>
                          handleChange("bgConsent", e.target.checked)
                        }
                      />
                      <span className="text-sm text-muted-foreground">
                        I consent to a background check
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Review & Submit</h2>
                <div className="space-y-3">
                  <div className="bg-gray-50 p-3 rounded">
                    Summary: {JSON.stringify(form, null, 2)}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!!form.tos}
                      onChange={(e) => handleChange("tos", e.target.checked)}
                    />
                    <span className="text-sm">
                      I agree to the terms of service
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-between">
              <div>
                {step > 0 && (
                  <Button variant="ghost" onClick={prev}>
                    Back
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                {step < 3 && <Button onClick={next}>Next</Button>}
                {step === 3 && (
                  <Button onClick={handleSubmit}>Submit Application</Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="hidden lg:block">
          <div className="sticky top-20 bg-white border border-border rounded-lg p-6 shadow-sm">
            <h3 className="font-semibold mb-2">Application Status</h3>
            <p className="text-sm text-muted-foreground">Not submitted</p>
            <div className="mt-4 text-sm">
              <div className="mb-2">
                Estimated review time: 2-3 business days
              </div>
              <div className="mb-2">Progress: {step + 1}/4</div>
              <div className="mb-2">Admin feedback: None</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyGig;
