import { Mail, Phone, MapPin, Calendar, ExternalLink } from "lucide-react";
import { User, Instructor, Student, Partner } from "@/types/user";
import { cn } from "@/lib/utils";

export function getUserTypeBadgeColor(userType: string) {
  switch (userType) {
    case "student":
      return "bg-blue-100 text-blue-800";
    case "instructor":
      return "bg-purple-100 text-purple-800";
    case "admin":
      return "bg-orange-100 text-orange-800";
    case "super-admin":
      return "bg-red-100 text-red-800";
    case "partner":
      return "bg-emerald-100 text-emerald-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function formatUserTypeLabel(userType: string): string {
  if (!userType) return "N/A";
  const map: Record<string, string> = {
    "super-admin": "Super Admin",
    admin: "Admin",
    instructor: "Instructor",
    student: "Student",
    partner: "Partner",
  };
  return map[userType.toLowerCase()] ?? userType.split("-").map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()).join(" ");
}

export function getStatusBadgeColor(status: string) {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800";
    case "inactive":
      return "bg-yellow-100 text-yellow-800";
    case "blocked":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function InfoRow({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon?: React.ElementType;
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-2">
      {Icon && <Icon className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />}
      <div className="min-w-0">
        <span className="text-sm font-medium text-gray-700">{label}: </span>
        <span
          className={cn(
            "text-sm text-gray-600",
            mono && "font-mono text-xs"
          )}
        >
          {value}
        </span>
      </div>
    </div>
  );
}

export function ProfileSection({ user }: { user: User | null }) {
  if (!user) return null;

  const u = user as any;
  const addr = u.address || {};
  // Partners don't have a meaningful address (it's not collected at create
  // time and they can't edit it themselves), so hide the section entirely
  // rather than render an empty "No address information" panel.
  const isPartner = u.userType === "partner";

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Profile Details</h3>

      <div className={cn(
        "grid grid-cols-1 gap-6",
        isPartner ? "md:grid-cols-1" : "md:grid-cols-2",
      )}>
        <section>
          <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">
            Basic Information
          </h4>
          <div className="space-y-3">
            <InfoRow label="User ID" value={u._id || "N/A"} mono />
            <InfoRow icon={Mail} label="Email" value={u.email || "N/A"} />
            <InfoRow icon={Phone} label="Phone" value={u.phone || "N/A"} />
            <InfoRow label="WhatsApp" value={u.whatsappNumber || "N/A"} />
            <InfoRow
              icon={Calendar}
              label="Date of Birth"
              value={u.dob ? new Date(u.dob).toLocaleDateString() : "N/A"}
            />
            <InfoRow label="Provider" value={(u.provider || "N/A").toString()} />
          </div>
        </section>

        {!isPartner && (
          <section>
            <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">
              Address
            </h4>
            {addr?.address || addr?.city ? (
              <div className="space-y-3">
                <InfoRow icon={MapPin} label="Street" value={addr.address || "N/A"} />
                <InfoRow label="City" value={addr.city || "N/A"} />
                <InfoRow label="State" value={addr.state || "N/A"} />
                <InfoRow label="Country" value={addr.country || "N/A"} />
                <InfoRow label="Pin Code" value={addr.pincode || "N/A"} />
              </div>
            ) : (
              <p className="text-sm text-gray-500">No address information</p>
            )}
          </section>
        )}
      </div>

      {u.userType === "instructor" && (u as Instructor) && (
        <InstructorProfileSection user={u as Instructor} />
      )}
      {u.userType === "student" && (u as Student) && (
        <StudentProfileSection user={u as Student} />
      )}
      {u.userType === "partner" && (u as Partner) && (
        <PartnerProfileSection user={u as Partner} />
      )}
    </div>
  );
}

function PartnerProfileSection({ user }: { user: Partner }) {
  // `partnerCollege` is populated by the admin getUserById service so we get
  // the College document, not the raw ObjectId string. We still tolerate the
  // string form so a stale list-payload that bypassed populate doesn't crash.
  const linked = user.partnerCollege as unknown;
  const college =
    linked && typeof linked === "object"
      ? (linked as { _id?: string; name?: string; location?: string; website?: string })
      : null;
  const collegeId = college?._id ?? (typeof linked === "string" ? linked : null);

  return (
    <section className="pt-6 border-t border-gray-200">
      <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">
        Partner Information
      </h4>
      {college ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoRow label="College" value={college.name || "N/A"} />
          <InfoRow label="Location" value={college.location || "N/A"} />
          {college.website && (
            <InfoRow
              label="Website"
              value={
                <a
                  href={college.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {college.website}{" "}
                  <ExternalLink className="w-3 h-3 inline" />
                </a>
              }
            />
          )}
          {collegeId && (
            <InfoRow label="College ID" value={collegeId} mono />
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-500">
          No college link found
          {collegeId ? ` (orphan id: ${collegeId})` : ""}.
        </p>
      )}
    </section>
  );
}

function InstructorProfileSection({ user }: { user: Instructor }) {
  return (
    <section className="pt-6 border-t border-gray-200">
      <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">
        Professional Information
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoRow label="Position" value={user.currentPosition || "N/A"} />
        <InfoRow label="Company" value={user.currentCompany || "N/A"} />
        <InfoRow label="Industry" value={user.industry || "N/A"} />
        <InfoRow label="Field" value={user.field || "N/A"} />
        <InfoRow label="LinkedIn" value={user.linkedinUrl || "N/A"} />
        {user.companyImages && user.companyImages.length > 0 ? (
          <div className="md:col-span-2">
            <p className="text-xs font-medium text-gray-500 uppercase mb-2">
              Company images
            </p>
            <div className="flex flex-wrap gap-2">
              {user.companyImages.map((url, i) => (
                <a
                  key={`${url}-${i}`}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-16 h-16 rounded-lg border border-gray-200 overflow-hidden bg-gray-50 shrink-0"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt=""
                    className="w-full h-full object-contain"
                  />
                </a>
              ))}
            </div>
          </div>
        ) : null}
        <InfoRow label="Rating" value={user.rating ?? "N/A"} />
      </div>
      {user.bio && (
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-700">Bio</p>
          <p className="mt-1 text-sm text-gray-600">{user.bio}</p>
        </div>
      )}
      {user.previousExperience?.length ? (
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">
            Previous Experience
          </p>
          <div className="space-y-2">
            {user.previousExperience.map((exp, i) => (
              <div
                key={i}
                className="p-3 bg-gray-50 rounded-lg border border-gray-100"
              >
                <div className="font-medium text-gray-900">
                  {exp.position} at {exp.companyName}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {exp.duration?.from &&
                    new Date(exp.duration.from).toLocaleDateString()}{" "}
                  –{" "}
                  {exp.duration?.to &&
                    new Date(exp.duration.to).toLocaleDateString()}
                </div>
                {exp.description && (
                  <p className="text-sm text-gray-600 mt-1">{exp.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function StudentProfileSection({ user }: { user: Student }) {
  return (
    <section className="pt-6 border-t border-gray-200">
      <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">
        Student Information
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoRow label="College" value={user.collegeName || "N/A"} />
        <InfoRow label="Degree" value={user.degreeName || "N/A"} />
        <InfoRow label="Position" value={user.currentPosition || "N/A"} />
        <InfoRow label="Domain" value={user.domain || "N/A"} />
      </div>
      {user.portfolio && (
        <div className="mt-4">
          <InfoRow
            label="Portfolio"
            value={
              <a
                href={user.portfolio}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {user.portfolio} <ExternalLink className="w-3 h-3 inline" />
              </a>
            }
          />
        </div>
      )}
    </section>
  );
}

export function AccountSection({ user }: { user: User | null }) {
  if (!user) return null;
  const u = user as any;

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Account Info</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InfoRow
          label="Joined"
          value={
            u.createdAt ? new Date(u.createdAt).toLocaleString() : "N/A"
          }
        />
        <InfoRow
          label="Last Updated"
          value={
            u.updatedAt ? new Date(u.updatedAt).toLocaleString() : "N/A"
          }
        />
      </div>
    </div>
  );
}
