import { useEffect, useState, useRef } from "react";
import { TrendingUp, Users, Clock, Award } from "lucide-react";

export default function StatsSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [counters, setCounters] = useState({
    years: 0,
    properties: 0,
    satisfaction: 0,
    response: 0,
  });
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 },
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isVisible) {
      // Animate counters
      const animateCounter = (
        key: keyof typeof counters,
        target: number,
        duration: number,
      ) => {
        let start = 0;
        const increment = target / (duration / 16);
        const timer = setInterval(() => {
          start += increment;
          if (start >= target) {
            start = target;
            clearInterval(timer);
          }
          setCounters((prev) => ({ ...prev, [key]: Math.floor(start) }));
        }, 16);
      };

      animateCounter("years", 20, 2000);
      animateCounter("properties", 200, 2500);
      animateCounter("satisfaction", 98, 2000);
      animateCounter("response", 24, 1500);
    }
  }, [isVisible]);

  const stats = [
    {
      icon: Award,
      value: `${counters.years}+`,
      label: "Jahre Erfahrung",
      color: "text-[var(--bodensee-water)]",
      bg: "bg-[var(--bodensee-water)]/10",
    },
    {
      icon: TrendingUp,
      value: `${counters.properties}+`,
      label: "Verkaufte Immobilien",
      color: "text-[var(--bodensee-stone)]",
      bg: "bg-[var(--bodensee-stone)]/10",
    },
    {
      icon: Users,
      value: `${counters.satisfaction}%`,
      label: "Kundenzufriedenheit",
      color: "text-[var(--bodensee-sand)]",
      bg: "bg-[var(--bodensee-sand)]/10",
    },
    {
      icon: Clock,
      value: `${counters.response}h`,
      label: "Antwortzeit",
      color: "text-[var(--bodensee-shore)]",
      bg: "bg-[var(--bodensee-shore)]/10",
    },
  ];

  return (
    <section className="py-20 bg-gray-50" ref={sectionRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className={`text-center transform transition-all duration-700 delay-${index * 100} ${
                  isVisible
                    ? "translate-y-0 opacity-100"
                    : "translate-y-10 opacity-0"
                }`}
              >
                <div
                  className={`inline-flex items-center justify-center w-16 h-16 ${stat.bg} rounded-2xl mb-4`}
                >
                  <Icon className={`w-8 h-8 ${stat.color}`} />
                </div>
                <div className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
