import swaggerJsDoc from "swagger-jsdoc";

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "JagStream API",
      version: "1.0.0",
      description: "API documentation for a sample application",
    },
    servers: [
      {
        url: "http://localhost:3000",
      },
    ],
  },
  apis: ["./routes/*.ts"], // Path to your API files
};

export const swaggerDocs = swaggerJsDoc(swaggerOptions);
