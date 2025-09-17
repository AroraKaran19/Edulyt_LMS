import { FlexBox } from "@/components/ui";
import React from "react";
import {
  UserCheck,
  Lock,
  AlertTriangle,
  Scale,
  Mail,
  MapPin,
  Phone,
  Users,
  Copy,
  Gavel,
} from "lucide-react";

const TermsOfUse = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white py-16">
        <div className="container mx-auto px-6">
          <FlexBox direction="col" className="items-center text-center">
            <h1 className="text-4xl md:text-5xl font-bold font-coolvetica mb-4">
              Terms of Use
            </h1>
            <p className="text-xl text-orange-100 max-w-2xl">
              Please read these terms carefully before using our platform.
            </p>
            <div className="mt-6 text-sm text-orange-200">
              Last updated:{" "}
              {new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </FlexBox>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Introduction Section */}
          <section className="mb-12">
            <FlexBox
              direction="col"
              className="bg-white rounded-2xl p-8 shadow-lg border border-orange-100"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-6 font-coolvetica">
                Introduction
              </h2>
              <p className="text-gray-700 leading-relaxed text-lg">
                Welcome to Airkrit, an edtech platform operated by Airkrit India
                Pvt. Ltd. (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;).
                By accessing or using our website and services, you agree to be
                bound by these Terms of Use. If you do not agree to these terms,
                please do not use our platform.
              </p>
            </FlexBox>
          </section>

          {/* Use of Our Services Section */}
          <section className="mb-12">
            <FlexBox
              direction="col"
              className="bg-white rounded-2xl p-8 shadow-lg border border-orange-100"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-6 font-coolvetica">
                Use of Our Services
              </h2>

              {/* Eligibility */}
              <div className="mb-8">
                <FlexBox className="items-center gap-3 mb-4">
                  <div className="bg-green-100 p-2 rounded-full">
                    <UserCheck className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-800">
                    Eligibility
                  </h3>
                </FlexBox>
                <p className="text-gray-700 leading-relaxed">
                  To use Airkrit, you must be at least 18 years old or have the
                  consent of a parent or guardian if you are a minor. By using
                  our services, you represent and warrant that you meet these
                  eligibility requirements.
                </p>
              </div>

              {/* Account Registration */}
              <div className="mb-8">
                <FlexBox className="items-center gap-3 mb-4">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <Lock className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-800">
                    Account Registration
                  </h3>
                </FlexBox>
                <p className="text-gray-700 mb-4">
                  To access certain features of our platform, you may be
                  required to register for an account. You agree to:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>
                    Provide accurate, current, and complete information during
                    the registration process
                  </li>
                  <li>
                    Maintain and promptly update your account information to
                    keep it accurate, current, and complete
                  </li>
                  <li>Keep your password confidential and secure</li>
                  <li>
                    Notify us immediately of any unauthorized use of your
                    account or any other breach of security
                  </li>
                </ul>
                <p className="text-gray-700 mt-4 font-semibold">
                  You are responsible for all activities that occur under your
                  account.
                </p>
              </div>

              {/* Use Restrictions */}
              <div>
                <FlexBox className="items-center gap-3 mb-4">
                  <div className="bg-red-100 p-2 rounded-full">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-800">
                    Use Restrictions
                  </h3>
                </FlexBox>
                <p className="text-gray-700 mb-4">You agree not to:</p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>
                    Use our platform for any illegal or unauthorized purpose
                  </li>
                  <li>
                    Modify, adapt, translate, or reverse engineer any portion of
                    the platform
                  </li>
                  <li>
                    Use any automated system, including &quot;robots,&quot;
                    &quot;spiders,&quot; or &quot;offline readers,&quot; to
                    access the platform in a manner that sends more request
                    messages to our servers than a human can reasonably produce
                    in the same period by using a conventional online web
                    browser
                  </li>
                  <li>
                    Attempt to interfere with or compromise the system integrity
                    or security or decipher any transmissions to or from the
                    servers running the platform
                  </li>
                  <li>
                    Collect or harvest any personally identifiable information,
                    including account names, from the platform
                  </li>
                  <li>
                    Use the platform for any commercial solicitation purposes
                  </li>
                </ul>
              </div>
            </FlexBox>
          </section>

          {/* Content Section */}
          <section className="mb-12">
            <FlexBox
              direction="col"
              className="bg-white rounded-2xl p-8 shadow-lg border border-orange-100"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-6 font-coolvetica">
                Content
              </h2>

              {/* User Content */}
              <div className="mb-8">
                <FlexBox className="items-center gap-3 mb-4">
                  <div className="bg-purple-100 p-2 rounded-full">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-800">
                    User Content
                  </h3>
                </FlexBox>
                <p className="text-gray-700 leading-relaxed">
                  You may have the opportunity to post, upload, or otherwise
                  make available content through our platform (&quot;User
                  Content&quot;). You retain ownership of your User Content, but
                  by making it available on or through the platform, you grant
                  us a worldwide, non-exclusive, royalty-free, transferable,
                  sublicensable license to use, reproduce, modify, distribute,
                  prepare derivative works of, display, and perform your User
                  Content in connection with the operation and promotion of the
                  platform.
                </p>
              </div>

              {/* Our Content */}
              <div>
                <FlexBox className="items-center gap-3 mb-4">
                  <div className="bg-orange-100 p-2 rounded-full">
                    <Copy className="w-6 h-6 text-orange-600" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-800">
                    Our Content
                  </h3>
                </FlexBox>
                <p className="text-gray-700 leading-relaxed">
                  All content provided by us on the platform, including text,
                  graphics, logos, images, and software, is the property of
                  Airkrit or our licensors and is protected by copyright,
                  trademark, and other intellectual property laws. You may not
                  use, reproduce, distribute, or create derivative works based
                  on our content without our express written permission.
                </p>
              </div>
            </FlexBox>
          </section>

          {/* Termination Section */}
          <section className="mb-12">
            <FlexBox
              direction="col"
              className="bg-white rounded-2xl p-8 shadow-lg border border-orange-100"
            >
              <FlexBox className="items-center gap-3 mb-6">
                <div className="bg-red-100 p-2 rounded-full">
                  <Gavel className="w-6 h-6 text-red-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 font-coolvetica">
                  Termination
                </h2>
              </FlexBox>
              <p className="text-gray-700 leading-relaxed text-lg">
                We reserve the right to suspend or terminate your account and
                access to the platform at our sole discretion, without notice
                and liability, for any reason, including if you violate these
                Terms of Use.
              </p>
            </FlexBox>
          </section>

          {/* Disclaimers Section */}
          <section className="mb-12">
            <FlexBox
              direction="col"
              className="bg-white rounded-2xl p-8 shadow-lg border border-orange-100"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-6 font-coolvetica">
                Disclaimers
              </h2>
              <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200">
                <p className="text-gray-700 leading-relaxed text-lg">
                  The platform is provided on an &quot;as is&quot; and &quot;as
                  available&quot; basis. We disclaim all warranties of any kind,
                  whether express or implied, including, but not limited to, the
                  implied warranties of merchantability, fitness for a
                  particular purpose, and non-infringement. We do not warrant
                  that the platform will be uninterrupted, secure, or
                  error-free, or that any defects or errors will be corrected.
                </p>
              </div>
            </FlexBox>
          </section>

          {/* Limitation of Liability Section */}
          <section className="mb-12">
            <FlexBox
              direction="col"
              className="bg-white rounded-2xl p-8 shadow-lg border border-orange-100"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-6 font-coolvetica">
                Limitation of Liability
              </h2>
              <p className="text-gray-700 mb-6">
                To the fullest extent permitted by law, in no event will
                Airkrit, its affiliates, officers, directors, employees, agents,
                or licensors be liable for any indirect, incidental, special,
                consequential, or punitive damages, or any loss of profits or
                revenues, whether incurred directly or indirectly, or any loss
                of data, use, goodwill, or other intangible losses, resulting
                from:
              </p>
              <div className="space-y-4">
                <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>
                      Your access to or use of or inability to access or use the
                      platform
                    </li>
                    <li>
                      Any conduct or content of any third party on the platform
                    </li>
                    <li>Any content obtained from the platform</li>
                    <li>
                      Unauthorized access, use, or alteration of your
                      transmissions or content
                    </li>
                  </ul>
                </div>
              </div>
            </FlexBox>
          </section>

          {/* Governing Law Section */}
          <section className="mb-12">
            <FlexBox
              direction="col"
              className="bg-white rounded-2xl p-8 shadow-lg border border-orange-100"
            >
              <FlexBox className="items-center gap-3 mb-6">
                <div className="bg-blue-100 p-2 rounded-full">
                  <Scale className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 font-coolvetica">
                  Governing Law
                </h2>
              </FlexBox>
              <p className="text-gray-700 leading-relaxed text-lg">
                These Terms of Use and any disputes related to them will be
                governed by and construed in accordance with the laws of India,
                without regard to its conflict of law principles.
              </p>
            </FlexBox>
          </section>

          {/* Changes to Terms Section */}
          <section className="mb-12">
            <FlexBox
              direction="col"
              className="bg-white rounded-2xl p-8 shadow-lg border border-orange-100"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-6 font-coolvetica">
                Changes to Terms of Use
              </h2>
              <p className="text-gray-700 leading-relaxed text-lg">
                We may update these Terms of Use from time to time. Any changes
                will be posted on this page, and we will update the &quot;Last
                updated&quot; date at the top of the terms. Your continued use
                of the platform after the changes constitutes your acceptance of
                the new Terms of Use.
              </p>
            </FlexBox>
          </section>

          {/* Contact Section */}
          <section className="mb-12">
            <FlexBox
              direction="col"
              className="bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-2xl p-8 shadow-lg"
            >
              <h2 className="text-3xl font-bold mb-6 font-coolvetica text-center">
                Contact Us
              </h2>
              <p className="text-orange-100 text-center mb-8">
                If you have any questions about these Terms of Use, please
                contact us at:
              </p>
              <div className="grid md:grid-cols-3 gap-6">
                <FlexBox direction="col" className="items-center text-center">
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
                </FlexBox>
                <FlexBox direction="col" className="items-center text-center">
                  <div className="bg-white/20 p-3 rounded-full mb-3">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold mb-2">Address</h3>
                  <p className="text-orange-100">Dwarka, New Delhi- 110077</p>
                </FlexBox>
                <FlexBox direction="col" className="items-center text-center">
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
                </FlexBox>
              </div>
            </FlexBox>
          </section>

          {/* Footer Message */}
          <section>
            <FlexBox
              direction="col"
              className="bg-white rounded-2xl p-8 shadow-lg border border-orange-100 text-center"
            >
              <div className="bg-orange-100 p-6 rounded-xl">
                <h3 className="text-2xl font-bold text-orange-800 mb-4 font-coolvetica">
                  Thank You for Using Airkrit
                </h3>
                <p className="text-orange-700 text-lg">
                  We hope you have a great experience on our platform.
                </p>
              </div>
            </FlexBox>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfUse;
