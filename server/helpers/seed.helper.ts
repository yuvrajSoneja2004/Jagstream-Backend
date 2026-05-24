import { PRISMA_CLIENT } from "../database/prismaClient";

async function main() {
  for (let i = 0; i < 50; i++) {
    await PRISMA_CLIENT.video.create({
      data: {
        title: `Title ${i + 1}`,
        type: `Category ${i + 1}`,
        description: `Dummy lol`,
        thumbnailUrl:
          "http://localhost:3000/api/v1/video/tempThumbnails/thumbnail-1.png",
        previewGif: "https://i.ibb.co/9pszQQT/1730963685588-output.gif",
        videoUrl: "4",
        uploadedBy: 5,
      },
    });
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await PRISMA_CLIENT.$disconnect();
  });
