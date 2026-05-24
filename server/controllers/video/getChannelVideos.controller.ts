import { Request, Response } from "express";
import { PRISMA_CLIENT } from "../../database/prismaClient";

export const getChannelVideos = async (req: Request, res: Response) => {
    try {
        const { channelId } = req.params;
        const { filter, page, limit } = req.query;

        const currentPage = parseInt(page as string) || 0;
        const pageSize = parseInt(limit as string) || 8;
        console.log('me',filter);
    
        

        // Determine sorting order based on filter
        let orderBy = {};
        if (filter === "newest") {
            orderBy = { createdAt: "desc" }; // Sort by newest first
        } else if (filter === "oldest") {
            orderBy = { createdAt: "asc" }; // Sort by oldest first
        } else if (filter === "popular") {
            orderBy = { views: "desc" }; // Sort by most views
        } else {
            orderBy = { createdAt: "desc" }; // Default to newest
        }

        const channelVideos = await PRISMA_CLIENT.video.findMany({
            where: {
                uploadedBy: parseInt(channelId),
            },
            orderBy, // Apply the dynamic orderBy
            skip: currentPage * pageSize, // Calculate the number of records to skip
            take: pageSize, // Number of records to fetch
        });

        const totalVideos = await PRISMA_CLIENT.video.count({
            where: {
                uploadedBy: parseInt(channelId),
            },
        });

        const hasMore = (currentPage + 1) * pageSize < totalVideos;

        res.status(200).json({
            videos: channelVideos,
            hasMore,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Something went wrong" });
    }
};
