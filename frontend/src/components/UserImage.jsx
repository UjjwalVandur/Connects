import { Box } from "@mui/material";
import API_BASE_URL from "config";

const UserImage = ({ image, size = "60px" }) => {
  return (
    <Box
      width={size}
      height={size}
      sx={{ flexShrink: 0, borderRadius: "50%", overflow: "hidden" }}
    >
      <img
        style={{
          objectFit: "cover",
          borderRadius: "50%",
          width: "100%",
          height: "100%",
          display: "block",
        }}
        alt="user"
        src={image?.startsWith("http") ? image : `${API_BASE_URL}/assets/${image}`}
      />
    </Box>
  );
};

export default UserImage;