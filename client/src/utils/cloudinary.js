const CLOUDINARY_CLOUD_NAME = "dpbdmjvxg";
const CLOUDINARY_UPLOAD_PRESET = "ShopFlow";

export const uploadToCloudinary = async (file, folderName, id) => {
  const data = new FormData();
  data.append("file", file);
  data.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  data.append("folder", folderName);
  data.append("public_id", `${folderName}/${id}`);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: data,
    }
  );
  return res.json();
};
