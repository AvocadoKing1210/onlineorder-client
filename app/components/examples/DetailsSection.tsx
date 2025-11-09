import DetailsSection from '../DetailsSection';
import { Calendar, Clock, MapPin, Users } from "lucide-react";

export default function DetailsSectionExample() {
  const schedule = [
    {
      icon: <Calendar className="w-5 h-5" />,
      label: "Dates",
      value: "December 15–31, 2025"
    },
    {
      icon: <Clock className="w-5 h-5" />,
      label: "Hours",
      value: "Tuesday–Sunday, 6:00 PM – 10:30 PM"
    },
    {
      icon: <Users className="w-5 h-5" />,
      label: "Capacity",
      value: "Limited to 40 guests per evening"
    }
  ];

  const location = [
    {
      icon: <MapPin className="w-5 h-5" />,
      label: "Address",
      value: "1847 Warehouse Lane, Historic District"
    },
    {
      icon: <MapPin className="w-5 h-5" />,
      label: "Parking",
      value: "Complimentary valet service available"
    },
    {
      icon: <MapPin className="w-5 h-5" />,
      label: "Access",
      value: "Entrance on north side of building"
    }
  ];

  return <DetailsSection title="Visit Details" schedule={schedule} location={location} />;
}
