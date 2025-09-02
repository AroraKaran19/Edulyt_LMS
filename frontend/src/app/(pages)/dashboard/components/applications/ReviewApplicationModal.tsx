import { Download, X } from "lucide-react";
import React from "react";

const ReviewApplicationModal = ({
  application,
  onClose,
}: {
  application: any;
  onClose: () => void;
}) => {
  if (!application) return null;

  return (
    <div className="fixed inset-0 bg-[#201E1E99] bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-3xl p-4 w-full max-w-2xl gap-5 flex flex-col">
        <div className="flex-1">
          <h4 className="font-normal text-lg sm:text-xl text-black font-coolvetica flex justify-between items-center">
            {application.title}
            <X
              size={20}
              onClick={onClose}
              className="cursor-pointer"
              color="#000000"
            />
          </h4>
          <p className="text-[#575757] font-plus-jakarta font-normal text-xs">
            {application.company}
          </p>
        </div>

        <div className="bg-[#F7712436] border-2 border-dashed border-[#F77124] py-5 px-3 rounded-xl flex justify-center items-center gap-2">
          <Download size={20} className="cursor-pointer" color="#F77124" />
          <span className="text-[#F77124] font-plus-jakarta font-medium text-base">
            PDF_Myresume.PDF
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-base font-bold text-[#2B1508] font-plus-jakarta">
              Your Full Name
            </label>
            <input
              type="text"
              value="John Doe"
              className="bg-[#F5F5F5] p-4 mt-3 block w-full rounded-xl  border-[#00000026] text-[#2B1508] font-plus-jakarta font-medium text-base shadow-[0px_4px_10.7px_0px_#00000012_inset]"
              readOnly
              title="Your Full Name"
              placeholder="Your Full Name"
            />
          </div>
          <div>
            <label className="block text-base font-bold text-[#2B1508] font-plus-jakarta">
              Date Of Birth
            </label>
            <input
              type="text"
              value="15 - 10 - 2003"
              className="bg-[#F5F5F5] p-4 mt-3 block w-full rounded-xl  border-[#00000026] text-[#2B1508] font-plus-jakarta font-medium text-base shadow-[0px_4px_10.7px_0px_#00000012_inset]"
              readOnly
              title="Date Of Birth"
              placeholder="Date Of Birth"
            />
          </div>
        </div>

        <h3 className="text-2xl font-normal text-[#2B1508] font-coolvetica">
          Additional Questions
        </h3>
        <div className="space-y-4 mb-4">
          <div>
            <label className="block text-base font-bold text-black font-plus-jakarta">
              The curriculum, designed by the faculty of Texas McCombs, Great
              Learning?
            </label>
            <textarea
              className="bg-[#F5F5F5] p-4 mt-3 block w-full rounded-xl  border-[#00000026] text-[#2B1508] font-plus-jakarta font-medium text-base shadow-[0px_4px_10.7px_0px_#00000012_inset] resize-none"
              readOnly
              title="The curriculum, designed by the faculty of Texas McCombs, Great Learning?"
              placeholder="The curriculum, designed by the faculty of Texas McCombs, Great Learning?"
            >
              The curriculum, designed by the faculty of Texas McCombs, Great
              Learning?
            </textarea>
          </div>
          <div>
            <label className="block text-base font-bold text-black font-plus-jakarta">
              The curriculum, designed by the faculty of Texas McCombs, Great
              Learning?
            </label>
            <textarea
              className="bg-[#F5F5F5] p-4 mt-3 block w-full rounded-xl  border-[#00000026] text-[#2B1508] font-plus-jakarta font-medium text-base shadow-[0px_4px_10.7px_0px_#00000012_inset] resize-none"
              readOnly
              title="The curriculum, designed by the faculty of Texas McCombs, Great Learning?"
              placeholder="The curriculum, designed by the faculty of Texas McCombs, Great Learning?"
            >
              The curriculum, designed by the faculty of Texas McCombs, Great
              Learning?
            </textarea>
          </div>
        </div>
        <div className="w-full text-right">
          <button
            type="button"
            title="Edit"
            className="bg-[#F5691D] border-2 border-[#E9750000] text-white px-4 py-2 rounded-2xl w-1/3
                         shadow-[0px_0px_0px_4px_#F68C2238,0px_0px_0px_2px_#F68C2238,0px_4px_13px_0px_#FFFFFF69_inset] cursor-pointer"
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewApplicationModal;
