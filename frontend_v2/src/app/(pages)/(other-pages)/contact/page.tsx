import {
  Mail,
  MapPin,
  Phone,
  Clock,
  MessageSquare,
  Send,
  Users,
  Globe,
  Award,
} from "lucide-react";

const ContactPage = () => {
  return (
    <div className="min-h-screen bg-linear-to-br from-orange-50 to-white">
      {/* Hero Section */}
      <div className="bg-linear-to-r from-orange-600 to-orange-700 text-white py-16">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center text-center">
            <h1 className="text-4xl md:text-5xl font-bold font-coolvetica mb-4">
              Contact Us
            </h1>
            <p className="text-xl text-orange-100 max-w-2xl">
              Get in touch with our team. We&apos;re here to help and answer any
              questions you may have.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Contact Information Section */}
          <section className="mb-12">
            <div className="flex flex-col bg-white rounded-2xl p-8 shadow-lg border border-orange-100">
              <h2 className="text-3xl font-bold text-gray-900 mb-8 font-coolvetica text-center">
                Get In Touch
              </h2>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="flex flex-col items-center text-center">
                  <div className="bg-orange-100 p-4 rounded-full mb-4">
                    <Mail className="w-8 h-8 text-orange-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    Email Us
                  </h3>
                  <p className="text-gray-600 mb-3">Send us an email anytime</p>
                  <a
                    href="mailto:info@airkrit.com"
                    className="text-orange-600 font-semibold hover:text-orange-700 transition-colors"
                  >
                    info@airkrit.com
                  </a>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="bg-blue-100 p-4 rounded-full mb-4">
                    <Phone className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    Call Us
                  </h3>
                  <p className="text-gray-600 mb-3">Speak with our team</p>
                  <a
                    href="tel:+918929252575"
                    className="text-blue-600 font-semibold hover:text-blue-700 transition-colors"
                  >
                    +91-8929252575
                  </a>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="bg-green-100 p-4 rounded-full mb-4">
                    <MapPin className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    Visit Us
                  </h3>
                  <p className="text-gray-600 mb-3">Our office location</p>
                  <p className="text-green-600 font-semibold">
                    Dwarka, New Delhi- 110077
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Contact Form Section */}
          <section className="mb-12">
            <div className="flex flex-col bg-white rounded-2xl p-8 shadow-lg border border-orange-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-purple-100 p-2 rounded-full">
                  <MessageSquare className="w-6 h-6 text-purple-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 font-coolvetica">
                  Send Us a Message
                </h2>
              </div>
              <p className="text-gray-700 mb-8 text-lg">
                Have a question or need assistance? Fill out the form below and
                we&apos;ll get back to you as soon as possible.
              </p>
              <form className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="firstName"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      First Name *
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="lastName"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Last Name *
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                    placeholder="Enter your email address"
                  />
                </div>
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                    placeholder="Enter your phone number"
                  />
                </div>
                <div>
                  <label
                    htmlFor="subject"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Subject *
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                  >
                    <option value="">Select a subject</option>
                    <option value="general">General Inquiry</option>
                    <option value="technical">Technical Support</option>
                    <option value="billing">Billing & Payments</option>
                    <option value="course">Course Information</option>
                    <option value="partnership">Partnership</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={6}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors resize-none"
                    placeholder="Tell us how we can help you..."
                  ></textarea>
                </div>
                <div className="flex justify-center">
                  <button
                    type="submit"
                    className="bg-linear-to-r from-orange-600 to-orange-700 text-white px-8 py-3 rounded-lg font-semibold hover:from-orange-700 hover:to-orange-800 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl"
                  >
                    <Send className="w-5 h-5" />
                    Send Message
                  </button>
                </div>
              </form>
            </div>
          </section>

          {/* Business Hours Section */}
          <section className="mb-12">
            <div className="flex flex-col bg-white rounded-2xl p-8 shadow-lg border border-orange-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-yellow-100 p-2 rounded-full">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 font-coolvetica">
                  Business Hours
                </h2>
              </div>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">
                    Customer Support
                  </h3>
                  <div className="space-y-2 text-gray-700">
                    <div className="flex justify-between">
                      <span>Monday - Friday:</span>
                      <span className="font-semibold">
                        9:00 AM - 6:00 PM IST
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Saturday:</span>
                      <span className="font-semibold">
                        10:00 AM - 4:00 PM IST
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sunday:</span>
                      <span className="font-semibold">Closed</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">
                    Response Time
                  </h3>
                  <div className="space-y-3">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <p className="text-green-800 font-semibold">
                        Email Support
                      </p>
                      <p className="text-green-700">Within 24 hours</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <p className="text-blue-800 font-semibold">
                        Phone Support
                      </p>
                      <p className="text-blue-700">
                        Immediate during business hours
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Why Choose Us Section */}
          <section className="mb-12">
            <div className="flex flex-col bg-white rounded-2xl p-8 shadow-lg border border-orange-100">
              <h2 className="text-3xl font-bold mb-8 font-coolvetica text-center">
                Why Choose Airkrit?
              </h2>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="flex flex-col items-center text-center">
                  <div className="bg-white/20 p-4 rounded-full mb-4">
                    <Users className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">
                    Expert Instructors
                  </h3>
                  <p className="text-orange-100">
                    Learn from industry professionals with years of experience
                    in their fields.
                  </p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="bg-white/20 p-4 rounded-full mb-4">
                    <Globe className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">
                    Flexible Learning
                  </h3>
                  <p className="text-orange-100">
                    Access your courses anytime, anywhere with our online
                    learning platform.
                  </p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="bg-white/20 p-4 rounded-full mb-4">
                    <Award className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">
                    Certified Courses
                  </h3>
                  <p className="text-orange-100">
                    Earn recognized certificates upon completion of our
                    professional courses.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="mb-12">
            <div className="flex flex-col bg-white rounded-2xl p-8 shadow-lg border border-orange-100">
              <h2 className="text-3xl font-bold text-gray-900 mb-8 font-coolvetica">
                Frequently Asked Questions
              </h2>
              <div className="space-y-6">
                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    How do I enroll in a course?
                  </h3>
                  <p className="text-gray-700">
                    You can enroll in any course by visiting our course catalog,
                    selecting your desired course, and following the enrollment
                    process. Payment can be made securely through our platform.
                  </p>
                </div>
                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    What payment methods do you accept?
                  </h3>
                  <p className="text-gray-700">
                    We accept various payment methods including credit/debit
                    cards, net banking, UPI, and digital wallets. All payments
                    are processed securely.
                  </p>
                </div>
                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    Can I get a refund if I&apos;m not satisfied?
                  </h3>
                  <p className="text-gray-700">
                    Please refer to our Cancellation & Refund Policy for
                    detailed information about our refund process and terms.
                  </p>
                </div>
                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    How long do I have access to my courses?
                  </h3>
                  <p className="text-gray-700">
                    Course access duration varies by course. Most courses
                    provide lifetime access, while some may have specific time
                    limits. Check individual course details for specific
                    information.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Footer Message */}
          <section>
            <div className="flex flex-col bg-white rounded-2xl p-8 shadow-lg border border-orange-100">
              <div className="bg-orange-100 p-6 rounded-xl">
                <h3 className="text-2xl font-bold text-orange-800 mb-4 font-coolvetica">
                  We&apos;re Here to Help
                </h3>
                <p className="text-orange-700 text-lg">
                  Our dedicated team is committed to providing you with the best
                  learning experience. Don&apos;t hesitate to reach out!
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
