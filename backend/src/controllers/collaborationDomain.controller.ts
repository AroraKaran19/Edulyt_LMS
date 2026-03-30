import { Request, Response } from "express";
import {
  AppError,
  asyncHandler,
  sendSuccessResponse,
} from "../middlewares/error.middleware";
import {
  createCollaborationDomainService,
  deleteCollaborationDomainService,
  getCollaborationDomainByIdService,
  listCollaborationDomainsService,
  resolveCollaborationForCheckoutService,
  updateCollaborationDomainService,
} from "../services/collaborationDomain.services";

export const listCollaborationDomains = asyncHandler(
  async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || "";
    const isActive =
      req.query.isActive === "true"
        ? true
        : req.query.isActive === "false"
          ? false
          : undefined;

    const result = await listCollaborationDomainsService(
      page,
      limit,
      search,
      isActive
    );

    sendSuccessResponse(
      res,
      result,
      "Collaboration Domains fetched successfully",
      200
    );
    return;
  }
);

export const getCollaborationDomainById = asyncHandler(
  async (req: Request, res: Response) => {
    const { collaborationDomainId } = req.params;

    if (!collaborationDomainId) {
      throw new AppError("Collaboration Domain ID is required", 400);
    }

    const collaborationDomain = await getCollaborationDomainByIdService(
      collaborationDomainId
    );

    if (!collaborationDomain) {
      throw new AppError("Collaboration domain not found", 404);
    }

    sendSuccessResponse(
      res,
      collaborationDomain,
      "Collaboration domain fetched successfully",
      200
    );
    return;
  }
);

export const createCollaborationDomain = asyncHandler(
  async (req: Request, res: Response) => {
    const collaborationData = req.body;
    const createdBy = req.user?._id;

    if (!createdBy) {
      throw new AppError("User not authenticated", 401);
    }

    if (!collaborationData.title) {
      throw new AppError("Title is required", 400);
    }

    if (!collaborationData.domain) {
      throw new AppError("Domain is required", 400);
    }

    if (!collaborationData.collaborationKind) {
      throw new AppError(
        "collaborationKind is required: course_allot or discount",
        400
      );
    }

    if (collaborationData.collaborationKind === "discount") {
      collaborationData.courses = collaborationData.courses ?? [];
      if (!collaborationData.benefit) {
        throw new AppError(
          "Discount partnerships require a benefit (percentage or fixed amount)",
          400
        );
      }
    } else {
      if (
        collaborationData.courses === undefined ||
        collaborationData.courses === null ||
        !Array.isArray(collaborationData.courses) ||
        collaborationData.courses.length === 0
      ) {
        throw new AppError("Course allot requires at least one linked course", 400);
      }
      if (!collaborationData.enrollmentAccess) {
        throw new AppError(
          "Course allot requires enrollment access (full, partial, or top-N)",
          400
        );
      }
    }

    const collaborationDomain = await createCollaborationDomainService(
      collaborationData,
      createdBy
    );

    sendSuccessResponse(
      res,
      collaborationDomain,
      "Collaboration domain created successfully",
      201
    );
    return;
  }
);

export const updateCollaborationDomain = asyncHandler(
  async (req: Request, res: Response) => {
    const { collaborationDomainId } = req.params;
    const collaborationData = req.body;

    if (!collaborationDomainId) {
      throw new AppError("Collaboration domain ID is required", 400);
    }

    const collaborationDomain = await updateCollaborationDomainService(
      collaborationDomainId,
      collaborationData
    );

    if (!collaborationDomain) {
      throw new AppError("Collaboration domain not found", 404);
    }

    sendSuccessResponse(
      res,
      collaborationDomain,
      "Collaboration domain updated successfully",
      200
    );
    return;
  }
);

export const deleteCollaborationDomain = asyncHandler(
  async (req: Request, res: Response) => {
    const { collaborationDomainId } = req.params;

    if (!collaborationDomainId) {
      throw new AppError("Collaboration domain ID is required", 400);
    }

    const result = await deleteCollaborationDomainService(collaborationDomainId);

    if (!result) {
      throw new AppError("Collaboration domain not found", 404);
    }

    sendSuccessResponse(
      res,
      null,
      "Collaboration domain deleted successfully",
      200
    );
    return;
  }
);

export const resolveCollaborationForCheckout = asyncHandler(
  async (req: Request, res: Response) => {
    const { courseIds } = req.body;
    const email = req.user?.email;

    if (!email || !email.trim()) {
      throw new AppError(
        "Your account must have an email address to check collaboration pricing",
        400
      );
    }

    if (!courseIds) {
      throw new AppError("Course IDs are required", 400);
    }

    if (!Array.isArray(courseIds)) {
      throw new AppError("courseIds must be an array of course IDs", 400);
    }

    const result = await resolveCollaborationForCheckoutService(
      email,
      courseIds.map((c: unknown) => String(c))
    );

    sendSuccessResponse(res, result, "Collaboration resolve completed", 200);
    return;
  }
);
