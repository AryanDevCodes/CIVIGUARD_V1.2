import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { PhoneOutgoing } from "lucide-react";
import {
  Train,
  Plane,
  Zap,
  Droplet,
  TrafficCone,
  Car,
  AlertCircle,
  Wrench,
} from "lucide-react";

type Contact = {
  title: string;
  number: string;
  icon: JSX.Element;
};

const contacts: Contact[] = [
  {
    title: "Police",
    number: "100",
    icon: <AlertCircle className="h-5 w-5 text-red-600" />,
  },
  {
    title: "Ambulance",
    number: "102",
    icon: <Droplet className="h-5 w-5 text-emerald-600" />,
  },
  {
    title: "Fire",
    number: "101",
    icon: <Zap className="h-5 w-5 text-yellow-500" />,
  },
  {
    title: "Women Helpline",
    number: "1091",
    icon: <Wrench className="h-5 w-5 text-pink-600" />,
  },
  {
    title: "Child Helpline",
    number: "1098",
    icon: <Wrench className="h-5 w-5 text-orange-600" />,
  },
  {
    title: "Cyber Crime",
    number: "1930",
    icon: <AlertCircle className="h-5 w-5 text-blue-600" />,
  },
  {
    title: "Disaster Management",
    number: "108",
    icon: <TrafficCone className="h-5 w-5 text-orange-500" />,
  },
  {
    title: "Road Accident",
    number: "1073",
    icon: <Car className="h-5 w-5 text-gray-700" />,
  },
  {
    title: "Railway Enquiry",
    number: "139",
    icon: <Train className="h-5 w-5 text-green-700" />,
  },
  {
    title: "Air Ambulance",
    number: "9540161344",
    icon: <Plane className="h-5 w-5 text-purple-700" />,
  },
  {
    title: "Electricity Complaint",
    number: "1912",
    icon: <Zap className="h-5 w-5 text-yellow-600" />,
  },
  {
    title: "Water Supply",
    number: "1916",
    icon: <Droplet className="h-5 w-5 text-blue-500" />,
  },
];

const EmergencyContactList = () => {
  return (
    <section className="px-4 py-8 md:px-8 lg:px-20">
      <h2 className="text-2xl font-bold mb-6 text-center text-primary">
        🇮🇳 Indian Emergency & Utility Contacts
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {contacts.map(({ title, number, icon }) => (
          <Card key={title} className="shadow-md hover:shadow-lg transition-all duration-300">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center space-x-3">
                {icon}
                <span className="font-semibold text-sm sm:text-base">{title}</span>
              </div>
              <a
                href={`tel:${number}`}
                aria-label={`Call ${title}`}
                rel="noopener noreferrer"
                className="font-medium hover:underline flex items-center gap-1 text-sm"
              >
                {number}
                <PhoneOutgoing className="h-4 w-4 ml-1" />
              </a>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default EmergencyContactList;
