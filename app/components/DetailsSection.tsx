import { Calendar, Clock, MapPin, Users, Navigation } from "lucide-react";

interface Detail {
  icon: React.ReactNode;
  label: string;
  value: string;
}

interface ScheduleDay {
  day: string;
  hours: string;
}

interface DetailsSectionProps {
  title: string;
  schedule?: Detail[];
  scheduleDays?: ScheduleDay[];
  location: Detail[];
  address?: string;
  googleMapsLink?: string;
  googleMapsEmbed?: string;
  otherDetails?: Detail[];
}

export default function DetailsSection({ title, schedule, scheduleDays, location, address, googleMapsLink, googleMapsEmbed, otherDetails }: DetailsSectionProps) {
  // Get today's day name based on user's local timezone
  // Using the user's browser timezone automatically via new Date()
  const getTodayDayName = () => {
    const now = new Date();
    // Get day name in user's local timezone (new Date() automatically uses local time)
    const dayIndex = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayIndex];
  };

  const todayDayName = getTodayDayName();

  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 bg-card z-10 py-12" style={{ paddingTop: '80px' }}>
      <div className="max-w-6xl mx-auto w-full">
        <h2 
          className="font-display text-3xl md:text-4xl text-center mb-8 text-card-foreground"
          data-testid="text-details-title"
        >
          {title}
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
          {/* Schedule Column */}
          <div>
            <h3 className="font-display text-xl mb-6 text-card-foreground">Schedule</h3>
            {scheduleDays ? (
              <div className="space-y-2">
                {scheduleDays.map((item, index) => {
                  // Normalize day names for comparison (handle case differences)
                  const normalizedItemDay = item.day.trim();
                  const normalizedTodayDay = todayDayName.trim();
                  const isToday = normalizedItemDay.toLowerCase() === normalizedTodayDay.toLowerCase();
                  
                  return (
                    <div 
                      key={index} 
                      className={`flex justify-between items-center px-3 py-2 rounded-lg transition-all duration-200 ${
                        isToday 
                          ? 'bg-black text-white border-2 border-black shadow-sm' 
                          : 'border border-transparent hover:bg-card-border/30'
                      }`}
                      data-testid={`detail-schedule-${index}`}
                    >
                      <div className="flex items-center gap-2">
                        {isToday && (
                          <span className="w-2 h-2 rounded-full bg-white animate-pulse" aria-label="Today" />
                        )}
                        <p className={`text-base font-medium ${
                          isToday 
                            ? 'text-white font-semibold' 
                            : 'text-card-foreground'
                        }`}>
                          {item.day}
                        </p>
                      </div>
                      <p className={`text-base text-right min-w-[140px] ${
                        isToday 
                          ? 'text-white font-semibold' 
                          : 'text-card-foreground'
                      }`}>
                        {item.hours}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : schedule ? (
            <div className="space-y-6">
              {schedule.map((detail, index) => (
                <div 
                  key={index} 
                  className="flex items-start gap-4"
                  data-testid={`detail-schedule-${index}`}
                >
                  <div className="text-primary mt-1">{detail.icon}</div>
                  <div>
                    <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">
                      {detail.label}
                    </p>
                    <p className="text-card-foreground text-lg">{detail.value}</p>
                  </div>
                </div>
              ))}
            </div>
            ) : null}
            
            {otherDetails && otherDetails.length > 0 && (
              <div className="space-y-6 mt-8 pt-8 border-t border-card-border">
                {otherDetails.map((detail, index) => (
                  <div 
                    key={index} 
                    className="flex items-start gap-4"
                    data-testid={`detail-other-${index}`}
                  >
                    <div className="text-primary mt-1">{detail.icon}</div>
                    <div>
                      <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">
                        {detail.label}
                      </p>
                      <p className="text-card-foreground text-lg">{detail.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Location and Map Column */}
          <div className="flex flex-col gap-6">
          <div>
              <h3 className="font-display text-xl mb-6 text-card-foreground">Location</h3>
              <div className="space-y-4">
              {location.map((detail, index) => (
                <div 
                  key={index} 
                  className="flex items-start gap-4"
                  data-testid={`detail-location-${index}`}
                >
                  <div className="text-primary mt-1">{detail.icon}</div>
                  <div>
                    <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">
                      {detail.label}
                    </p>
                      <p className="text-card-foreground text-base">{detail.value}</p>
                  </div>
                </div>
              ))}
              
              {address && (
                  <div className="flex items-start gap-4 pt-3 border-t border-card-border">
                  <div className="text-black mt-1">
                      <Navigation className="w-4 h-4" />
                  </div>
                    <div className="flex-1">
                    <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">
                      Full Address
                    </p>
                      {googleMapsLink ? (
                        <a
                          href={googleMapsLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-card-foreground text-base hover:text-primary transition-colors underline underline-offset-4"
                        >
                          {address}
                        </a>
                      ) : (
                        <p className="text-card-foreground text-base">{address}</p>
                      )}
                    </div>
                  </div>
                )}
                </div>
            </div>

            {/* Google Maps Embed */}
            {googleMapsEmbed && (
              <div className="hidden md:block rounded-lg overflow-hidden shadow-lg border border-card-border">
                <iframe
                  src={googleMapsEmbed}
                  width="100%"
                  height="250"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
