import { Lock, Eye, Users, Cookie, Mail, MapPin, Phone } from "lucide-react";

const PrivacyPolicyPage = () => {
  return (
    <div className="min-h-screen bg-linear-to-br from-orange-50 to-white">
      {/* Hero Section */}
      <div className="bg-linear-to-r from-orange-600 to-orange-700 text-white py-16">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center text-center">
            <h1 className="text-4xl md:text-5xl font-bold font-coolvetica mb-4">
              Privacy Policy
            </h1>
            <p className="text-xl text-orange-100 max-w-2xl">
              Your privacy is our priority. Learn how we protect and handle your
              information.
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
                Welcome to Airkrit, an edtech platform operated by Airkrit India
                Pvt. Ltd. (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;).
                We are committed to protecting your privacy and ensuring the
                security of your personal information. This Privacy Policy
                outlines how we collect, use, share, and protect your
                information when you use our website and services.
              </p>
            </div>
          </section>

          {/* Information We Collect Section */}
          <section className="mb-12">
            <div className="flex flex-col bg-white rounded-2xl p-8 shadow-lg border border-orange-100">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 font-coolvetica">
                Information We Collect
              </h2>

              {/* Personal Information */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-orange-100 p-2 rounded-full">
                    <Users className="w-6 h-6 text-orange-600" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-800">
                    Personal Information
                  </h3>
                </div>
                <p className="text-gray-700 mb-4">
                  When you use our platform, we may collect personal information
                  that you provide to us, including but not limited to:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Name</li>
                  <li>Email address</li>
                  <li>Phone number</li>
                  <li>Address</li>
                  <li>Payment information</li>
                </ul>
              </div>

              {/* Non-Personal Information */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <Eye className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-800">
                    Non-Personal Information
                  </h3>
                </div>
                <p className="text-gray-700 mb-4">
                  We also collect non-personal information automatically when
                  you visit our site, such as:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Browser type</li>
                  <li>Operating system</li>
                  <li>Pages visited</li>
                  <li>Time spent on our site</li>
                  <li>Referring URLs</li>
                </ul>
              </div>
            </div>
          </section>

          {/* How We Use Your Information Section */}
          <section className="mb-12">
            <div className="flex flex-col bg-white rounded-2xl p-8 shadow-lg border border-orange-100">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 font-coolvetica">
                How We Use Your Information
              </h2>
              <p className="text-gray-700 mb-6">We use your information to:</p>
              <div className="grid md:grid-cols-2 gap-4">
                <ul className="list-disc list-inside space-y-3 text-gray-700">
                  <li>Provide and improve our services</li>
                  <li>Process transactions and send related information</li>
                  <li>
                    Communicate with you, including responding to your comments,
                    questions, and requests
                  </li>
                  <li>
                    Send you technical notices, updates, security alerts, and
                    support and administrative messages
                  </li>
                </ul>
                <ul className="list-disc list-inside space-y-3 text-gray-700">
                  <li>
                    Analyze and monitor usage trends to improve our platform
                  </li>
                  <li>
                    Personalize your experience and deliver content and product
                    offerings relevant to your interests
                  </li>
                  <li>Detect, prevent, and address technical issues</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Sharing Your Information Section */}
          <section className="mb-12">
            <div className="flex flex-col bg-white rounded-2xl p-8 shadow-lg border border-orange-100">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 font-coolvetica">
                Sharing Your Information
              </h2>
              <p className="text-gray-700 mb-6">
                We do not sell or rent your personal information to third
                parties. We may share your information in the following
                circumstances:
              </p>
              <div className="space-y-6">
                <div className="bg-orange-50 p-6 rounded-xl">
                  <h4 className="font-semibold text-orange-800 mb-2">
                    With service providers:
                  </h4>
                  <p className="text-gray-700">
                    We may share your information with third-party service
                    providers who perform services on our behalf, such as
                    payment processing, data analysis, email delivery, hosting
                    services, and customer service.
                  </p>
                </div>
                <div className="bg-blue-50 p-6 rounded-xl">
                  <h4 className="font-semibold text-blue-800 mb-2">
                    For legal reasons:
                  </h4>
                  <p className="text-gray-700">
                    We may disclose your information if required to do so by law
                    or in response to a valid request from a law enforcement
                    agency or other governmental bodies.
                  </p>
                </div>
                <div className="bg-green-50 p-6 rounded-xl">
                  <h4 className="font-semibold text-green-800 mb-2">
                    Business transfers:
                  </h4>
                  <p className="text-gray-700">
                    In the event of a merger, acquisition, reorganization, or
                    sale of assets, your information may be transferred as part
                    of the transaction.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Security Section */}
          <section className="mb-12">
            <div className="flex flex-col bg-white rounded-2xl p-8 shadow-lg border border-orange-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-green-100 p-2 rounded-full">
                  <Lock className="w-6 h-6 text-green-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 font-coolvetica">
                  Security of Your Information
                </h2>
              </div>
              <p className="text-gray-700 leading-relaxed text-lg">
                We implement appropriate technical and organizational measures
                to protect your personal information from unauthorized access,
                use, or disclosure. However, no internet or email transmission
                is ever fully secure or error-free. Please keep this in mind
                when disclosing any personal information to us online.
              </p>
            </div>
          </section>

          {/* Your Choices and Rights Section */}
          <section className="mb-12">
            <div className="flex flex-col bg-white rounded-2xl p-8 shadow-lg border border-orange-100">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 font-coolvetica">
                Your Choices and Rights
              </h2>
              <p className="text-gray-700 mb-6">You have the right to:</p>
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Access and update your personal information</li>
                  <li>Request the deletion of your personal information</li>
                  <li>Object to the processing of your personal information</li>
                </ul>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>
                    Request the restriction of processing your personal
                    information
                  </li>
                  <li>
                    Request the transfer of your personal information to another
                    party
                  </li>
                </ul>
              </div>
              <div className="bg-orange-50 p-6 rounded-xl">
                <p className="text-gray-700">
                  To exercise these rights, please contact us at{" "}
                  <a
                    href="mailto:info@airkrit.com"
                    className="text-orange-600 font-semibold hover:underline"
                  >
                    info@airkrit.com
                  </a>
                </p>
              </div>
            </div>
          </section>

          {/* Cookies Section */}
          <section className="mb-12">
            <div className="flex flex-col bg-white rounded-2xl p-8 shadow-lg border border-orange-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-purple-100 p-2 rounded-full">
                  <Cookie className="w-6 h-6 text-purple-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 font-coolvetica">
                  Cookies and Tracking Technologies
                </h2>
              </div>
              <p className="text-gray-700 leading-relaxed text-lg">
                We use cookies and similar tracking technologies to track the
                activity on our service and hold certain information. You can
                instruct your browser to refuse all cookies or to indicate when
                a cookie is being sent. However, if you do not accept cookies,
                you may not be able to use some portions of our service.
              </p>
            </div>
          </section>

          {/* Changes to Policy Section */}
          <section className="mb-12">
            <div className="flex flex-col bg-white rounded-2xl p-8 shadow-lg border border-orange-100">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 font-coolvetica">
                Changes to This Privacy Policy
              </h2>
              <p className="text-gray-700 leading-relaxed text-lg">
                We may update our Privacy Policy from time to time. We will
                notify you of any changes by posting the new Privacy Policy on
                this page and updating the &quot;Last updated&quot; date at the
                top of this Privacy Policy. You are advised to review this
                Privacy Policy periodically for any changes.
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
                If you have any questions about this Privacy Policy, please
                contact us at:
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
                  Thank You for Using Airkrit
                </h3>
                <p className="text-orange-700 text-lg">
                  Your privacy is important to us. We&apos;re committed to
                  protecting your information and providing you with a secure
                  learning experience.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
