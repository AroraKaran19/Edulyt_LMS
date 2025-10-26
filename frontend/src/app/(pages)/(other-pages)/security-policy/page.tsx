import {
  Shield,
  Lock,
  Users,
  AlertTriangle,
  Mail,
  MapPin,
  Phone,
  Key,
  Search,
  Bell,
  CheckCircle,
} from "lucide-react";

const SecurityPolicy = () => {
  return (
    <div className="min-h-screen bg-linear-to-br from-orange-50 to-white">
      {/* Hero Section */}
      <div className="bg-linear-to-r from-orange-600 to-orange-700 text-white py-16">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center text-center">
            <h1 className="text-4xl md:text-5xl font-bold font-coolvetica mb-4">
              Security Policy
            </h1>
            <p className="text-xl text-orange-100 max-w-2xl">
              Your security is our priority. Learn about the measures we take to
              protect your data.
            </p>
            <div className="mt-6 text-sm text-orange-200">
              Last updated: 24th October 2025
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Introduction Section */}
          <section className="mb-12">
            <div className="flex flex-col bg-white rounded-2xl p-8 shadow-lg border border-orange-100">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 font-coolvetica">
                Introduction
              </h2>
              <p className="text-gray-700 leading-relaxed text-lg">
                At Airkrit, operated by Airkrit India Pvt. Ltd., we take the
                security of your personal information very seriously. This
                Security Policy outlines the measures we have implemented to
                protect your data and ensure the integrity of our platform.
              </p>
            </div>
          </section>

          {/* Data Protection Measures Section */}
          <section className="mb-12">
            <div className="flex flex-col bg-white rounded-2xl p-8 shadow-lg border border-orange-100">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 font-coolvetica">
                Data Protection Measures
              </h2>

              {/* Encryption */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-green-100 p-2 rounded-full">
                    <Lock className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-800">
                    Encryption
                  </h3>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  We use industry-standard encryption protocols to protect your
                  data during transmission and storage. All sensitive
                  information, including personal and payment details, is
                  encrypted using Secure Socket Layer (SSL) technology.
                </p>
              </div>

              {/* Regular Audits */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <Search className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-800">
                    Regular Audits
                  </h3>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  We conduct regular security audits and assessments to identify
                  and address potential vulnerabilities. Our security team
                  continuously monitors our systems to ensure they meet the
                  highest security standards.
                </p>
              </div>
            </div>
          </section>

          {/* User Responsibilities Section */}
          <section className="mb-12">
            <div className="flex flex-col bg-white rounded-2xl p-8 shadow-lg border border-orange-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-orange-100 p-2 rounded-full">
                  <Users className="w-6 h-6 text-orange-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 font-coolvetica">
                  User Responsibilities
                </h2>
              </div>
              <p className="text-gray-700 mb-6 leading-relaxed">
                While we take extensive measures to protect your information, it
                is also important for users to take steps to safeguard their
                accounts. We recommend the following:
              </p>
              <div className="space-y-4">
                <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                  <div className="flex items-center gap-3 mb-3">
                    <Key className="w-5 h-5 text-green-600" />
                    <h4 className="font-semibold text-green-800">
                      Use a strong password:
                    </h4>
                  </div>
                  <p className="text-gray-700">
                    Create a password that is difficult to guess and contains a
                    mix of letters, numbers, and special characters.
                  </p>
                </div>
                <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-3 mb-3">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-blue-800">
                      Keep your password confidential:
                    </h4>
                  </div>
                  <p className="text-gray-700">
                    Do not share your password with others, and avoid using the
                    same password across multiple sites.
                  </p>
                </div>
                <div className="bg-purple-50 p-6 rounded-xl border border-purple-200">
                  <div className="flex items-center gap-3 mb-3">
                    <CheckCircle className="w-5 h-5 text-purple-600" />
                    <h4 className="font-semibold text-purple-800">
                      Update your password regularly:
                    </h4>
                  </div>
                  <p className="text-gray-700">
                    Change your password periodically to enhance security.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Incident Response Section */}
          <section className="mb-12">
            <div className="flex flex-col bg-white rounded-2xl p-8 shadow-lg border border-orange-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-red-100 p-2 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 font-coolvetica">
                  Incident Response
                </h2>
              </div>
              <p className="text-gray-700 mb-6 leading-relaxed">
                In the event of a data breach or security incident, we have a
                comprehensive incident response plan in place. This plan
                includes:
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                    <h4 className="font-semibold text-red-800 mb-2">
                      Immediate action:
                    </h4>
                    <p className="text-gray-700 text-sm">
                      Identifying and isolating the affected systems to prevent
                      further damage.
                    </p>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                    <h4 className="font-semibold text-yellow-800 mb-2">
                      Investigation:
                    </h4>
                    <p className="text-gray-700 text-sm">
                      Conducting a thorough investigation to determine the cause
                      and extent of the breach.
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-2">
                      Notification:
                    </h4>
                    <p className="text-gray-700 text-sm">
                      Informing affected users and regulatory authorities, as
                      required, about the incident and the steps being taken to
                      mitigate its impact.
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                    <h4 className="font-semibold text-green-800 mb-2">
                      Remediation:
                    </h4>
                    <p className="text-gray-700 text-sm">
                      Implementing measures to rectify the breach and prevent
                      future occurrences.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Third-Party Security Section */}
          <section className="mb-12">
            <div className="flex flex-col bg-white rounded-2xl p-8 shadow-lg border border-orange-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-indigo-100 p-2 rounded-full">
                  <Shield className="w-6 h-6 text-indigo-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 font-coolvetica">
                  Third-Party Security
                </h2>
              </div>
              <p className="text-gray-700 leading-relaxed text-lg">
                We work with reputable third-party service providers to deliver
                our services. These providers are carefully selected based on
                their security practices and must comply with our security
                standards. We also regularly review their security measures to
                ensure they continue to meet our requirements.
              </p>
            </div>
          </section>

          {/* Updates to Policy Section */}
          <section className="mb-12">
            <div className="flex flex-col bg-white rounded-2xl p-8 shadow-lg border border-orange-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-orange-100 p-2 rounded-full">
                  <Bell className="w-6 h-6 text-orange-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 font-coolvetica">
                  Updates to This Policy
                </h2>
              </div>
              <p className="text-gray-700 leading-relaxed text-lg">
                We may update our Security Policy from time to time to reflect
                changes in technology, legal requirements, or our security
                practices. Any updates will be posted on this page, and we will
                update the &quot;Last updated&quot; date at the top of the
                policy. We encourage you to review this policy periodically to
                stay informed about how we are protecting your data.
              </p>
            </div>
          </section>

          {/* Contact Section */}
          <section className="mb-12">
            <div className="flex flex-col bg-white rounded-2xl p-8 shadow-lg border border-orange-100">
              <h2 className="text-3xl font-bold mb-6 font-coolvetica text-center">
                Contact Us
              </h2>
              <p className="text-orange-100 text-center mb-8">
                If you have any questions about our Security Policy or if you
                suspect a security breach, please contact us immediately at:
              </p>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="flex flex-col items-center text-center">
                  <div className="bg-white/20 p-3 rounded-full mb-3">
                    <Mail className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold mb-2">Email</h3>
                  <a
                    href="mailto:info@airkrit.com"
                    className="text-orange-100 hover:text-white transition-colors"
                  >
                    info@airkrit.com
                  </a>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="bg-white/20 p-3 rounded-full mb-3">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold mb-2">Address</h3>
                  <p className="text-orange-100">Dwarka, New Delhi- 110077</p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="bg-white/20 p-3 rounded-full mb-3">
                    <Phone className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold mb-2">Phone</h3>
                  <a
                    href="tel:+918929252575"
                    className="text-orange-100 hover:text-white transition-colors"
                  >
                    +91-8929252575
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* Footer Message */}
          <section>
            <div className="flex flex-col bg-white rounded-2xl p-8 shadow-lg border border-orange-100">
              <div className="bg-orange-100 p-6 rounded-xl">
                <h3 className="text-2xl font-bold text-orange-800 mb-4 font-coolvetica">
                  Your Security is Our Priority
                </h3>
                <p className="text-orange-700 text-lg">
                  Thank you for trusting Airkrit with your personal information.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default SecurityPolicy;
