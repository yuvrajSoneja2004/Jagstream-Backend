import { Request, Response } from "express";
import { PRISMA_CLIENT } from "../../database/prismaClient";

// Define the expected request body type
interface CreateUserRequest {
  name: string;
  email: string;
  avatarUrl: string;
  userId: string;
}

// Define custom error for email already exists
class EmailAlreadyExistsError extends Error {
  constructor() {
    super("Email already exists");
    this.name = "EmailAlreadyExistsError";
  }
}

export const createUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { name, email, avatarUrl, userId } = req.body as CreateUserRequest;

  try {
    // Validate required fields

    if (!name || !email || !avatarUrl || !userId) {
      res.status(400).json({
        message: "Name, avatarUrl and email are required",
      });
      return;
    }

    console.log("haha", name, email, avatarUrl, userId);

    // Check if email already exists
    const existingUser = await PRISMA_CLIENT.user.findFirst({
      where: {
        email: email,
      },
    });

    if (existingUser) {
      throw new EmailAlreadyExistsError();
    }

    // Create new user
    const user = await PRISMA_CLIENT.user.create({
      data: {
        userId,
        name,
        email,
        avatarUrl,
        createdAt: new Date(),
      },
    });

    // Return success response without sensitive data
    res.status(201).json({
      message: "User created successfully",
      user: {
        userId: user.userId,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    console.error("Error creating user:", error);

    if (error instanceof EmailAlreadyExistsError) {
      res.status(409).json({
        message: "Email already exists",
      });
      return;
    }

    // Handle Prisma-specific errors
    if (error.code === "P2002") {
      res.status(409).json({
        message: "Email already exists",
      });
      return;
    }

    res.status(500).json({
      message: "An error occurred while creating the user",
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};
