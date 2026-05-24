import axios from "axios";
import FormData from "form-data";

const IMGBB_API_KEY = "1860dbb564356e69f87167f8d4c2785c";

export const uploadToImgBB = async (image: any): Promise<string> => {
  const formData = new FormData();
  formData.append("key", IMGBB_API_KEY);
  formData.append("image", image.buffer, image.originalname);

  const response = await axios.post(
    "https://api.imgbb.com/1/upload",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data.data.url;
};
