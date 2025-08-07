'use client';
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Shield, User, AlertTriangle, ArrowRight, BadgeInfo, MapPin, Bell, Lock, Smartphone
} from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const featuresRef = useRef<HTMLDivElement>(null);

  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <motion.div
      className="min-h-screen flex flex-col"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.6 }}
    >
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-background to-secondary/10 py-20">
        <div className="container mx-auto text-center space-y-6 px-4">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-primary p-4 rounded-full inline-flex items-center justify-center"
          >
            <Shield className="h-12 w-12 text-primary-foreground" />
          </motion.div>
          <motion.h1
            className="text-5xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600"
          >
            CIVIGUARD
          </motion.h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
            Bridging technology and law enforcement to ensure community safety through innovation and accountability.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Button size="lg" className="text-lg px-8" onClick={() => navigate('/login')}>
              Get Started <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-6" onClick={scrollToFeatures}>
              Learn More
            </Button>
            <Button 
              size="lg" 
              variant="secondary" 
              className="text-lg px-6 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
              onClick={() => window.open('https://civiguard-7xpjvpy.gamma.site/', '_blank', 'noopener,noreferrer')}
            >
              View Presentation
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How CiviGuard Works</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Our secure and scalable system allows citizens, officers, and admins to interact seamlessly through dedicated portals.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-5xl mx-auto">
            {[
              {
                Icon: User,
                title: 'For Citizens',
                desc: 'Voice-based reporting, live map previews, and SOS alerts to ensure your safety at your fingertips.'
              },
              {
                Icon: Shield,
                title: 'For Officers',
                desc: 'Dashboards for crime mapping, officer performance analytics, and patrol route optimization.'
              },
              {
                Icon: AlertTriangle,
                title: 'For Emergencies',
                desc: 'Real-time response coordination and automated escalation protocols for critical incidents.'
              }
            ].map(({ Icon, title, desc }, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <div className="p-4 bg-primary/10 rounded-full mb-6">
                  <Icon className="h-12 w-12 text-primary" />
                </div>
                <h3 className="font-bold text-xl mb-2">{title}</h3>
                <p className="text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Expanded Key Features */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Key Features</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Built with precision, powered by data, and centered on community impact.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: MapPin,
                title: 'Interactive Crime Map',
                desc: 'Visualize crime trends using Leaflet with real-time heatmaps and category-based filters.'
              },
              {
                icon: Bell,
                title: 'Real-Time Alerts',
                desc: 'Push notifications, emergency broadcasts, and AI-analyzed video triggers.'
              },
              {
                icon: BadgeInfo,
                title: 'Report Management',
                desc: 'Photo, voice, and location-supported reporting with anonymity options.'
              },
              {
                icon: Lock,
                title: 'Privacy & Security',
                desc: 'End-to-end encrypted reports, Aadhaar-verified access, and role-based control.'
              },
              {
                icon: Smartphone,
                title: 'Mobile Access',
                desc: 'Optimized mobile UI with progressive web app support for offline submission.'
              }
            ].map(({ icon: Icon, title, desc }, i) => (
              <div key={i} className="bg-card border rounded-xl p-6 shadow-sm">
                <div className="bg-primary/10 p-3 rounded-full w-fit mb-4">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold text-xl mb-2">{title}</h3>
                <p className="text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-10">Voices of Trust</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                name: 'Ritika Sharma',
                quote: 'Using CiviGuard, I reported a street theft instantly. Within minutes, the authorities responded.'
              },
              {
                name: 'Officer Rajiv Singh',
                quote: 'The platform has transformed how we track and respond to incidents — fast, efficient, and precise.'
              },
              {
                name: 'Aarav Malhotra',
                quote: 'As a parent, I appreciate the safety alerts. It’s reassuring to stay informed about the locality.'
              }
            ].map(({ name, quote }, i) => (
              <div key={i} className="border p-6 rounded-xl shadow-sm bg-muted/20">
                <p className="italic text-muted-foreground mb-4">"{quote}"</p>
                <span className="font-semibold text-primary">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-primary text-primary-foreground py-24">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Be Part of a Safer Tomorrow</h2>
          <p className="text-xl max-w-2xl mx-auto opacity-90 mb-8">
            Join CiviGuard and contribute to a community-driven safety revolution.
          </p>
          <Button
            size="lg"
            className="text-lg px-8 bg-white text-primary hover:bg-white/90"
            onClick={() => navigate('/login')}
          >
            Get Started
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background py-10 border-t">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <Shield className="h-6 w-6 inline text-primary mr-2" />
          <span className="font-semibold">CiviGuard</span> © 2025. All rights reserved.
        </div>
      </footer>
    </motion.div>
  );
};

export default Index;
