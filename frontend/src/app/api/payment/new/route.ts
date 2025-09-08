import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { userId, courseId, planType } = await request.json();
    if (!userId || !courseId || !planType) {
      console.error("Missing required fields");
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }
    const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(
      /\/+$/,
      ""
    );
    const endpoint = /\/api$/i.test(baseUrl)
      ? `${baseUrl}/payment/create-order`
      : `${baseUrl}/api/payment/create-order`;

    const payment = await axios.post(endpoint, { userId, courseId, planType });

    if (!payment.data.success) {
      console.error(payment.data.message);
      return NextResponse.json(
        { success: false, message: payment.data.message },
        { status: 400 }
      );
    }

    if (payment.data.token) {
      const res = NextResponse.json({
        success: true,
        status: 200,
        redirectUrl: "/paytm-redirect?orderId=" + payment.data.orderId,
        orderId: payment.data.orderId,
      });
      res.cookies.set("paymentToken", payment.data.token, {
        httpOnly: process.env.NODE_ENV === "production",
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
      });
      return res;
    }

    return NextResponse.json({
      success: false,
      status: 203,
      message: "Payment failed",
    });
  } catch (error: any) {
    const status = error?.response?.status || 500;
    const message =
      error?.response?.data?.message || error?.message || "Error creating payment";
    console.error("Error creating payment", message);
    return NextResponse.json(
      { success: false, message },
      { status }
    );
  }
}
