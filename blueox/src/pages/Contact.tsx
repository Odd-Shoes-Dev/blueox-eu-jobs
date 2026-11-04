import React from 'react';
import { Phone, MapPin, Mail, MessageCircle } from 'lucide-react';
import { WHATSAPP_LINK } from '../components/chatbot/conversationFlow';

const Contact: React.FC = () => {
  return (
    <div className="font-inter pt-20">
      {/* Hero */}
      <section className="bg-navy py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-orbitron text-4xl md:text-5xl font-bold text-white mb-4">
            Contact <span className="text-coral">Us</span>
          </h1>
          <p className="font-space text-xl text-gray-300 max-w-2xl mx-auto">
            Get in touch with our team. We're here to help you every step of the way.
          </p>
        </div>
      </section>

      {/* Contact Info */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12">
            {/* Contact Details */}
            <div>
              <h2 className="font-orbitron text-2xl font-bold text-navy mb-8">Our Offices</h2>
              
              <div className="space-y-8">
                {/* Netherlands */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <h3 className="font-space font-bold text-lg text-navy mb-3">Netherlands</h3>
                  <div className="space-y-2 text-gray-600">
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 mr-3 text-coral" />
                      +31 97010209759
                    </div>
                    <div className="flex items-start">
                      <MapPin className="w-4 h-4 mr-3 mt-1 text-coral" />
                      Johan Huizingalaan 763a, 1066 VH Amsterdam, Netherlands
                    </div>
                  </div>
                </div>

                {/* Poland */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <h3 className="font-space font-bold text-lg text-navy mb-3">Poland</h3>
                  <div className="space-y-2 text-gray-600">
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 mr-3 text-coral" />
                      +48 666 250 547
                    </div>
                    <div className="flex items-start">
                      <MapPin className="w-4 h-4 mr-3 mt-1 text-coral" />
                      Solec 24, Warsaw Poland, 00-456
                    </div>
                  </div>
                </div>

                {/* Uganda */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <h3 className="font-space font-bold text-lg text-navy mb-3">Uganda</h3>
                  <div className="space-y-2 text-gray-600">
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 mr-3 text-coral" />
                      +256 200 91 34 32
                    </div>
                    <div className="flex items-start">
                      <MapPin className="w-4 h-4 mr-3 mt-1 text-coral" />
                      The Blue OX, P.O.Box 144011 Kampala, Uganda<br />
                      Plot 14, Eagen House, Kampala Road, Bussel Street
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Contact */}
            <div>
              <h2 className="font-orbitron text-2xl font-bold text-navy mb-8">Quick Contact</h2>
              
              <div className="bg-coral/5 rounded-2xl p-8 mb-8">
                <MessageCircle className="w-12 h-12 text-coral mb-4" />
                <h3 className="font-space font-bold text-xl text-navy mb-3">WhatsApp Us</h3>
                <p className="text-gray-600 mb-6">
                  The fastest way to reach us is through WhatsApp. Click below to start a conversation.
                </p>
                <a
                  href={WHATSAPP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-coral text-white px-8 py-3 rounded-lg font-space font-semibold hover:bg-coral-dark transition inline-block"
                >
                  Chat on WhatsApp
                </a>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-space font-bold text-lg text-navy mb-4">Business Hours</h3>
                <div className="space-y-2 text-gray-600">
                  <div className="flex justify-between">
                    <span>Monday - Friday</span>
                    <span className="font-semibold">9:00 AM - 6:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Saturday</span>
                    <span className="font-semibold">10:00 AM - 2:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sunday</span>
                    <span className="font-semibold">Closed</span>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-4">
                  * Hours shown in Central European Time (CET)
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
