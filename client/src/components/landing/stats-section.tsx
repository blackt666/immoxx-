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
    },
    {
      icon: TrendingUp,
      value: `${counters.properties}+`,
      label: "Verkaufte Immobilien",
    },
    {
      icon: Users,
      value: `${counters.satisfaction}%`,
      label: "Kundenzufriedenheit",
    },
    {
      icon: Clock,
      value: `${counters.response}h`,
      label: "Antwortzeit",
    },
  ];

  return (
    <section className="wf-section is-secondary" ref={sectionRef}>
      <div className="wf-container">
        {/* Logo Showcase - Webflow Style */}
        <div className="mb-16">
          <div className="wf-eyebrow text-center mb-8">Vertrauensvolle Partnerschaften</div>
          <div className="wf-logo-showcase flex-wrap">
            {/* Placeholder logos - in Webflow these are partner logos */}
            {['LOGO 1', 'LOGO 2', 'LOGO 3', 'LOGO 4', 'LOGO 5', 'LOGO 6'].map((logo, i) => (
              <div
                key={i}
                className="wf-logo flex items-center justify-center font-bold"
                style={{ color: 'rgba(0, 0, 31, 0.3)' }}
              >
                {logo}
              </div>
            ))}
          </div>
        </div>

        {/* Stats Grid - Webflow Style */}
        <div className="wf-grid-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className={`text-center transform transition-all duration-700 ${
                  isVisible
                    ? "translate-y-0 opacity-100"
                    : "translate-y-10 opacity-0"
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ backgroundColor: 'var(--wf-accent-primary)', color: 'var(--wf-text-on-accent)' }}>
                  <Icon className="w-8 h-8" />
                </div>
                <div className="text-4xl font-bold mb-2" style={{ color: 'var(--wf-accent-primary)' }}>
                  {stat.value}
                </div>
                <div className="text-base font-medium" style={{ color: 'rgba(0, 0, 31, 0.6)' }}>{stat.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
