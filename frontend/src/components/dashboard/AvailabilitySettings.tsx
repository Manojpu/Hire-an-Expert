import React, { useState, useEffect } from "react";
import {
  AvailabilityRule,
  DateOverride,
  dayOfWeekNames,
  formatTimeSlot,
} from "@/types/availability";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  AlertCircle,
  CalendarClock,
  Clock,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/context/auth/AuthContext";
import { format } from "date-fns";

// Import the API service we created
import {
  submitAvailabilityRules,
  getAvailabilityRules,
} from "@/services/availabilityService";

interface AvailabilitySettingsProps {
  userId?: string;
}

const AvailabilitySettings: React.FC<AvailabilitySettingsProps> = ({
  userId,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availabilityRules, setAvailabilityRules] = useState<
    AvailabilityRule[]
  >([]);
  const [dateOverrides, setDateOverrides] = useState<DateOverride[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );

  // For creating new weekly rule
  const [newRule, setNewRule] = useState<Partial<AvailabilityRule>>({
    day_of_week: 0,
    start_time_utc: "09:00",
    end_time_utc: "17:00",
  });

  // For creating new date override
  const [newOverrideDate, setNewOverrideDate] = useState<Date | undefined>(
    new Date()
  );

  // Load availability rules on component mount
  useEffect(() => {
    loadAvailabilityRules();
  }, []);

  const loadAvailabilityRules = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get token from auth context
      const token = await user?.getIdToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      // Call API to get availability rules
      const data = await getAvailabilityRules(userId || "me", token);

      // Set availability rules and date overrides
      setAvailabilityRules(data.availabilityRules || []);
      setDateOverrides(data.dateOverrides || []);
    } catch (err) {
      console.error("Failed to load availability:", err);
      setError("Failed to load availability settings. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddRule = () => {
    if (
      !newRule.day_of_week ||
      !newRule.start_time_utc ||
      !newRule.end_time_utc
    ) {
      setError("Please fill in all fields for the weekly availability");
      return;
    }

    const updatedRules = [...availabilityRules, newRule as AvailabilityRule];
    setAvailabilityRules(updatedRules);

    // Reset form
    setNewRule({
      day_of_week: 0,
      start_time_utc: "09:00",
      end_time_utc: "17:00",
    });
  };

  const handleRemoveRule = (index: number) => {
    const updatedRules = [...availabilityRules];
    updatedRules.splice(index, 1);
    setAvailabilityRules(updatedRules);
  };

  const handleAddOverride = () => {
    if (!newOverrideDate) {
      setError("Please select a date for unavailability");
      return;
    }

    const dateString = format(newOverrideDate, "yyyy-MM-dd");

    // Check if the date already exists
    if (dateOverrides.some((o) => o.unavailable_date === dateString)) {
      setError("This date is already marked as unavailable");
      return;
    }

    const newOverride: DateOverride = {
      unavailable_date: dateString,
    };

    setDateOverrides([...dateOverrides, newOverride]);
    setNewOverrideDate(undefined);
  };

  const handleRemoveOverride = (index: number) => {
    const updatedOverrides = [...dateOverrides];
    updatedOverrides.splice(index, 1);
    setDateOverrides(updatedOverrides);
  };

  const handleSaveChanges = async () => {
    try {
      setSaving(true);
      setError(null);

      // Get token from auth context
      const token = await user?.getIdToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      // Submit data to API
      await submitAvailabilityRules(
        {
          availabilityRules,
          dateOverrides,
        },
        token
      );

      // Show success message or notification
      alert("Availability settings saved successfully!");
    } catch (err) {
      console.error("Failed to save availability:", err);
      setError("Failed to save availability settings. Please try again later.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2">Loading availability settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Availability Settings</h1>
          <p className="text-muted-foreground">
            Manage when you're available for bookings
          </p>
        </div>
        <Button onClick={handleSaveChanges} disabled={saving}>
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="weekly">
        <TabsList>
          <TabsTrigger value="weekly">Weekly Schedule</TabsTrigger>
          <TabsTrigger value="dates">Date Overrides</TabsTrigger>
        </TabsList>

        <TabsContent value="weekly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Availability</CardTitle>
              <CardDescription>
                Set your recurring weekly availability for clients to book
                appointments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Add new weekly rule form */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-md bg-muted/20">
                  <div>
                    <Label>Day of Week</Label>
                    <Select
                      value={newRule.day_of_week?.toString()}
                      onValueChange={(value) =>
                        setNewRule({ ...newRule, day_of_week: parseInt(value) })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select day" />
                      </SelectTrigger>
                      <SelectContent>
                        {dayOfWeekNames.map((day, index) => (
                          <SelectItem key={index} value={index.toString()}>
                            {day}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Start Time</Label>
                    <Input
                      type="time"
                      value={newRule.start_time_utc}
                      onChange={(e) =>
                        setNewRule({
                          ...newRule,
                          start_time_utc: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>End Time</Label>
                    <Input
                      type="time"
                      value={newRule.end_time_utc}
                      onChange={(e) =>
                        setNewRule({ ...newRule, end_time_utc: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={handleAddRule} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Time Slot
                    </Button>
                  </div>
                </div>

                {/* Display current weekly rules */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">
                    Current Weekly Schedule
                  </h3>

                  {availabilityRules.length === 0 ? (
                    <div className="text-sm text-muted-foreground py-3 px-4 border rounded-md bg-muted/10">
                      No weekly availability set. Add time slots above.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {availabilityRules.map((rule, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 border rounded-md bg-card"
                        >
                          <div className="flex items-center">
                            <CalendarClock className="h-4 w-4 mr-3 text-muted-foreground" />
                            <span>
                              {dayOfWeekNames[rule.day_of_week]}:{" "}
                              {rule.start_time_utc} - {rule.end_time_utc}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveRule(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Date Overrides</CardTitle>
              <CardDescription>
                Mark specific dates as unavailable regardless of your weekly
                schedule
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="p-4 border rounded-md bg-muted/20 space-y-4">
                    <Label>Select Unavailable Date</Label>
                    <Calendar
                      mode="single"
                      selected={newOverrideDate}
                      onSelect={setNewOverrideDate}
                      className="border rounded-md p-3"
                    />
                    <Button onClick={handleAddOverride} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Mark Date as Unavailable
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Unavailable Dates</h3>

                  {dateOverrides.length === 0 ? (
                    <div className="text-sm text-muted-foreground py-3 px-4 border rounded-md bg-muted/10">
                      No date overrides set. Mark dates as unavailable using the
                      calendar.
                    </div>
                  ) : (
                    <div className="h-[350px] overflow-y-auto border rounded-md p-2">
                      <div className="space-y-2">
                        {dateOverrides.map((override, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 border rounded-md bg-card"
                          >
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-3 text-muted-foreground" />
                              <span>{override.unavailable_date}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveOverride(index)}
                            >
                              <X className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AvailabilitySettings;
