import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CalendarClock, Clock } from "lucide-react";
import { getAvailabilityRules } from "@/services/availabilityService";
import {
  AvailabilityRule,
  DateOverride,
  dayOfWeekNames,
} from "@/types/availability";

interface ExpertAvailabilityDisplayProps {
  userId: string;
  token?: string | (() => Promise<string>);
}

const ExpertAvailabilityDisplay: React.FC<ExpertAvailabilityDisplayProps> = ({
  userId,
  token,
}) => {
  const [availabilityRules, setAvailabilityRules] = useState<
    AvailabilityRule[]
  >([]);
  const [dateOverrides, setDateOverrides] = useState<DateOverride[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAvailability = async () => {
      if (!token) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Get the actual token string
        let tokenString: string;
        if (typeof token === "function") {
          tokenString = await token();
        } else {
          tokenString = token;
        }

        const data = await getAvailabilityRules(userId, tokenString);

        setAvailabilityRules(data.availabilityRules || []);
        setDateOverrides(data.dateOverrides || []);
      } catch (err) {
        console.error("Failed to load availability:", err);
        setError("Could not load availability information");
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, [userId, token]);

  if (loading) {
    return (
      <div className="p-4 border rounded-md">
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <p className="mt-2 text-sm text-muted-foreground">
            Loading availability...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border rounded-md bg-red-50 text-red-800">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expert Availability</CardTitle>
        <CardDescription>
          When this expert is available for bookings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Weekly Availability */}
        <div>
          <h3 className="text-sm font-medium mb-2">Weekly Schedule</h3>

          {availabilityRules.length === 0 ? (
            <div className="text-sm text-muted-foreground py-2">
              No weekly availability set.
            </div>
          ) : (
            <div className="grid gap-2">
              {availabilityRules.map((rule, index) => (
                <div
                  key={index}
                  className="flex items-center p-2 border rounded-md bg-muted/10"
                >
                  <CalendarClock className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>
                    {dayOfWeekNames[rule.day_of_week]}: {rule.start_time_utc} -{" "}
                    {rule.end_time_utc}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Unavailable Dates */}
        {dateOverrides.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-2">Unavailable Dates</h3>
            <div className="grid gap-2">
              {dateOverrides.map((override, index) => (
                <div
                  key={index}
                  className="flex items-center p-2 border rounded-md bg-red-50"
                >
                  <Clock className="h-4 w-4 mr-2 text-red-500" />
                  <span className="text-red-700">
                    {override.unavailable_date}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ExpertAvailabilityDisplay;
