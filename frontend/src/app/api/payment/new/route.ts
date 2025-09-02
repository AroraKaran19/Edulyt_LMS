import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { userId, courseId, planType } = await request.json();
    if (!userId || !courseId || !planType) {
      console.error("Missing required fields");
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }
    const payment = await axios.post(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/payment/create-order`,
      { userId, courseId, planType }
    );

    if (!payment.data.success) {
      console.error(payment.data.message);
      return NextResponse.json(
        { message: payment.data.message },
        { status: 400 }
      );
    }

    if (payment.data.token) {
      const res = NextResponse.json({
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

    return NextResponse.json({ status: 400, message: "Payment failed" });
  } catch (error) {
    console.error("Error creating payment", error);
    return NextResponse.json(
      { message: "Error creating payment", error: error },
      { status: 500 }
    );
  }
}
